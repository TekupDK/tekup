-- Supabase Configuration for RendetaljeOS
-- Storage buckets, real-time subscriptions, and additional configurations

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('job-photos', 'job-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('customer-documents', 'customer-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('quality-photos', 'quality-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('signatures', 'signatures', false, 1048576, ARRAY['image/png', 'image/svg+xml']);

-- Storage policies for job photos (public bucket)
CREATE POLICY "Job photos are viewable by organization members"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'job-photos' 
  AND EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.organization_id = get_user_organization_id()
    AND storage.filename(name) LIKE j.id::text || '%'
  )
);

CREATE POLICY "Authenticated users can upload job photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'job-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their uploaded job photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'job-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their uploaded job photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'job-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for customer documents (private bucket)
CREATE POLICY "Customer documents are viewable by organization members"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'customer-documents' 
  AND EXISTS (
    SELECT 1 FROM customers c
    WHERE c.organization_id = get_user_organization_id()
    AND storage.filename(name) LIKE c.id::text || '%'
  )
);

CREATE POLICY "Organization members can upload customer documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'customer-documents' 
  AND get_user_role() IN ('owner', 'admin', 'employee')
);

-- Storage policies for avatars (public bucket)
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for quality photos (private bucket)
CREATE POLICY "Quality photos are viewable by organization members"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'quality-photos' 
  AND EXISTS (
    SELECT 1 FROM job_quality_assessments jqa
    JOIN jobs j ON jqa.job_id = j.id
    WHERE j.organization_id = get_user_organization_id()
    AND storage.filename(name) LIKE jqa.id::text || '%'
  )
);

CREATE POLICY "Team members can upload quality photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'quality-photos' 
  AND get_user_role() IN ('owner', 'admin', 'employee')
);

-- Storage policies for signatures (private bucket)
CREATE POLICY "Signatures are viewable by organization members"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'signatures' 
  AND EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.organization_id = get_user_organization_id()
    AND storage.filename(name) LIKE j.id::text || '%'
  )
);

CREATE POLICY "Team members can upload signatures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'signatures' 
  AND get_user_role() IN ('owner', 'admin', 'employee')
);

-- Real-time subscriptions setup
-- Enable real-time for important tables
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE job_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE time_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE customer_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Create functions for real-time notifications
CREATE OR REPLACE FUNCTION notify_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify all organization members when job status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM pg_notify(
            'job_status_changed',
            json_build_object(
                'job_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'organization_id', NEW.organization_id
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_status_change_trigger
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION notify_job_status_change();

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify relevant users of new messages
    PERFORM pg_notify(
        'new_customer_message',
        json_build_object(
            'message_id', NEW.id,
            'customer_id', NEW.customer_id,
            'job_id', NEW.job_id,
            'sender_type', NEW.sender_type,
            'organization_id', NEW.organization_id
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_message_trigger
    AFTER INSERT ON customer_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a customer record if the user role is customer
    IF NEW.role = 'customer' THEN
        INSERT INTO customers (
            organization_id,
            user_id,
            name,
            email,
            phone,
            address
        ) VALUES (
            NEW.organization_id,
            NEW.id,
            NEW.name,
            NEW.email,
            NEW.phone,
            '{}'::jsonb
        );
    END IF;
    
    -- Create a team member record if the user role is employee
    IF NEW.role = 'employee' THEN
        INSERT INTO team_members (
            user_id,
            organization_id,
            employee_id
        ) VALUES (
            NEW.id,
            NEW.organization_id,
            'EMP-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(NEXTVAL('employee_id_seq')::TEXT, 4, '0')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sequence for employee IDs
CREATE SEQUENCE employee_id_seq START 1;

-- Apply user registration trigger
CREATE TRIGGER handle_new_user_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Create function to update customer statistics
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
        -- Update customer job count and revenue when job is completed
        IF NEW.status = 'completed' THEN
            UPDATE customers 
            SET 
                total_jobs = (
                    SELECT COUNT(*) 
                    FROM jobs 
                    WHERE customer_id = NEW.customer_id 
                    AND status = 'completed'
                ),
                total_revenue = (
                    SELECT COALESCE(SUM((profitability->>'total_price')::decimal), 0)
                    FROM jobs 
                    WHERE customer_id = NEW.customer_id 
                    AND status = 'completed'
                    AND profitability->>'total_price' IS NOT NULL
                )
            WHERE id = NEW.customer_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats_trigger
    AFTER INSERT OR UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- Create function to generate recurring jobs
CREATE OR REPLACE FUNCTION generate_recurring_jobs()
RETURNS void AS $$
DECLARE
    recurring_job RECORD;
    next_date TIMESTAMPTZ;
BEGIN
    FOR recurring_job IN 
        SELECT * FROM recurring_jobs 
        WHERE is_active = true 
        AND next_scheduled_date <= NOW() + INTERVAL '7 days'
    LOOP
        -- Calculate next occurrence
        CASE recurring_job.frequency
            WHEN 'weekly' THEN
                next_date := recurring_job.next_scheduled_date + INTERVAL '1 week';
            WHEN 'biweekly' THEN
                next_date := recurring_job.next_scheduled_date + INTERVAL '2 weeks';
            WHEN 'monthly' THEN
                next_date := recurring_job.next_scheduled_date + INTERVAL '1 month';
            ELSE
                CONTINUE;
        END CASE;
        
        -- Create new job
        INSERT INTO jobs (
            organization_id,
            customer_id,
            service_type,
            scheduled_date,
            estimated_duration,
            location,
            special_instructions,
            checklist,
            recurring_job_id
        ) VALUES (
            recurring_job.organization_id,
            recurring_job.customer_id,
            recurring_job.service_type,
            recurring_job.next_scheduled_date,
            recurring_job.estimated_duration,
            recurring_job.location,
            recurring_job.special_instructions,
            recurring_job.checklist,
            recurring_job.id
        );
        
        -- Update next scheduled date
        UPDATE recurring_jobs 
        SET next_scheduled_date = next_date
        WHERE id = recurring_job.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled function to run daily (this would be set up in Supabase dashboard)
-- SELECT cron.schedule('generate-recurring-jobs', '0 6 * * *', 'SELECT generate_recurring_jobs();');

-- Create views for common queries
CREATE VIEW job_summary AS
SELECT 
    j.*,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    ARRAY_AGG(DISTINCT u.name) FILTER (WHERE u.name IS NOT NULL) as assigned_team_members,
    COALESCE(AVG(cr.rating), 0) as average_rating,
    COUNT(DISTINCT cr.id) as review_count
FROM jobs j
LEFT JOIN customers c ON j.customer_id = c.id
LEFT JOIN job_assignments ja ON j.id = ja.job_id
LEFT JOIN team_members tm ON ja.team_member_id = tm.id
LEFT JOIN users u ON tm.user_id = u.id
LEFT JOIN customer_reviews cr ON j.id = cr.job_id
GROUP BY j.id, c.name, c.email, c.phone;

CREATE VIEW team_performance AS
SELECT 
    tm.*,
    u.name,
    u.email,
    COUNT(DISTINCT ja.job_id) as total_jobs_assigned,
    COUNT(DISTINCT CASE WHEN j.status = 'completed' THEN ja.job_id END) as completed_jobs,
    AVG(CASE WHEN j.status = 'completed' THEN j.actual_duration END) as avg_job_duration,
    AVG(CASE WHEN j.status = 'completed' THEN j.quality_score END) as avg_quality_score,
    SUM(CASE WHEN te.end_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (te.end_time - te.start_time))/3600 - te.break_duration/60.0 
        ELSE 0 END) as total_hours_worked
FROM team_members tm
LEFT JOIN users u ON tm.user_id = u.id
LEFT JOIN job_assignments ja ON tm.id = ja.team_member_id
LEFT JOIN jobs j ON ja.job_id = j.id
LEFT JOIN time_entries te ON tm.id = te.team_member_id
GROUP BY tm.id, u.name, u.email;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;