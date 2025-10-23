-- Row Level Security (RLS) Policies for RendetaljeOS
-- Multi-tenant data isolation and role-based access control

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_quality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can only access their own organization"
ON organizations FOR ALL
USING (id = get_user_organization_id());

-- Users policies
CREATE POLICY "Users can access users in their organization"
ON users FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Owners and admins can manage users in their organization"
ON users FOR ALL
USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('owner', 'admin')
);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (id = auth.uid());

-- Customers policies
CREATE POLICY "Organization members can access customers"
ON customers FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Owners and admins can manage customers"
ON customers FOR ALL
USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('owner', 'admin')
);

CREATE POLICY "Customers can access their own data"
ON customers FOR SELECT
USING (
    user_id = auth.uid() 
    OR organization_id = get_user_organization_id()
);

-- Team members policies
CREATE POLICY "Organization members can view team members"
ON team_members FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Owners and admins can manage team members"
ON team_members FOR ALL
USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('owner', 'admin')
);

CREATE POLICY "Team members can update their own data"
ON team_members FOR UPDATE
USING (user_id = auth.uid());

-- Jobs policies
CREATE POLICY "Organization members can view jobs"
ON jobs FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Owners and admins can manage all jobs"
ON jobs FOR ALL
USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('owner', 'admin')
);

CREATE POLICY "Employees can view and update assigned jobs"
ON jobs FOR SELECT
USING (
    organization_id = get_user_organization_id() 
    AND (
        get_user_role() IN ('owner', 'admin') 
        OR EXISTS (
            SELECT 1 FROM job_assignments ja
            JOIN team_members tm ON ja.team_member_id = tm.id
            WHERE ja.job_id = jobs.id AND tm.user_id = auth.uid()
        )
    )
);

CREATE POLICY "Employees can update assigned jobs"
ON jobs FOR UPDATE
USING (
    organization_id = get_user_organization_id() 
    AND (
        get_user_role() IN ('owner', 'admin') 
        OR EXISTS (
            SELECT 1 FROM job_assignments ja
            JOIN team_members tm ON ja.team_member_id = tm.id
            WHERE ja.job_id = jobs.id AND tm.user_id = auth.uid()
        )
    )
);

CREATE POLICY "Customers can view their own jobs"
ON jobs FOR SELECT
USING (
    customer_id IN (
        SELECT id FROM customers 
        WHERE user_id = auth.uid() 
        OR organization_id = get_user_organization_id()
    )
);

-- Job assignments policies
CREATE POLICY "Organization members can view job assignments"
ON job_assignments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs 
        WHERE id = job_assignments.job_id 
        AND organization_id = get_user_organization_id()
    )
);

CREATE POLICY "Owners and admins can manage job assignments"
ON job_assignments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM jobs 
        WHERE id = job_assignments.job_id 
        AND organization_id = get_user_organization_id()
        AND get_user_role() IN ('owner', 'admin')
    )
);

-- Time entries policies
CREATE POLICY "Organization members can view time entries"
ON time_entries FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs 
        WHERE id = time_entries.job_id 
        AND organization_id = get_user_organization_id()
    )
);

CREATE POLICY "Team members can manage their own time entries"
ON time_entries FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        JOIN jobs j ON time_entries.job_id = j.id
        WHERE tm.id = time_entries.team_member_id 
        AND tm.user_id = auth.uid()
        AND j.organization_id = get_user_organization_id()
    )
);

CREATE POLICY "Owners and admins can manage all time entries"
ON time_entries FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM jobs 
        WHERE id = time_entries.job_id 
        AND organization_id = get_user_organization_id()
        AND get_user_role() IN ('owner', 'admin')
    )
);

-- Recurring jobs policies
CREATE POLICY "Organization members can access recurring jobs"
ON recurring_jobs FOR ALL
USING (organization_id = get_user_organization_id());

-- Customer messages policies
CREATE POLICY "Organization members can access customer messages"
ON customer_messages FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Customers can access their own messages"
ON customer_messages FOR SELECT
USING (
    customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Organization members can send messages"
ON customer_messages FOR INSERT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Customers can send messages"
ON customer_messages FOR INSERT
USING (
    customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
    )
);

-- Chat sessions policies
CREATE POLICY "Users can access their own chat sessions"
ON chat_sessions FOR ALL
USING (user_id = auth.uid());

-- Chat messages policies
CREATE POLICY "Users can access messages from their sessions"
ON chat_messages FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM chat_sessions 
        WHERE id = chat_messages.session_id 
        AND user_id = auth.uid()
    )
);

-- Quality checklists policies
CREATE POLICY "Organization members can access quality checklists"
ON quality_checklists FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Owners and admins can manage quality checklists"
ON quality_checklists FOR ALL
USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() IN ('owner', 'admin')
);

-- Job quality assessments policies
CREATE POLICY "Organization members can view quality assessments"
ON job_quality_assessments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs 
        WHERE id = job_quality_assessments.job_id 
        AND organization_id = get_user_organization_id()
    )
);

CREATE POLICY "Team members can create assessments for their jobs"
ON job_quality_assessments FOR INSERT
USING (
    EXISTS (
        SELECT 1 FROM job_assignments ja
        JOIN team_members tm ON ja.team_member_id = tm.id
        JOIN jobs j ON ja.job_id = j.id
        WHERE j.id = job_quality_assessments.job_id 
        AND tm.user_id = auth.uid()
        AND j.organization_id = get_user_organization_id()
    )
);

-- Customer reviews policies
CREATE POLICY "Organization members can view customer reviews"
ON customer_reviews FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs 
        WHERE id = customer_reviews.job_id 
        AND organization_id = get_user_organization_id()
    )
);

CREATE POLICY "Customers can create reviews for their jobs"
ON customer_reviews FOR INSERT
USING (
    customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
    )
);

-- Notifications policies
CREATE POLICY "Users can access their own notifications"
ON notifications FOR ALL
USING (user_id = auth.uid());

-- Audit logs policies
CREATE POLICY "Owners can access audit logs for their organization"
ON audit_logs FOR SELECT
USING (
    organization_id = get_user_organization_id() 
    AND get_user_role() = 'owner'
);

-- Create audit log trigger function
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log for important tables and operations
    IF TG_TABLE_NAME IN ('jobs', 'customers', 'users', 'team_members') THEN
        INSERT INTO audit_logs (
            organization_id,
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values
        ) VALUES (
            COALESCE(NEW.organization_id, OLD.organization_id),
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_jobs_trigger
    AFTER INSERT OR UPDATE OR DELETE ON jobs
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_customers_trigger
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_team_members_trigger
    AFTER INSERT OR UPDATE OR DELETE ON team_members
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();