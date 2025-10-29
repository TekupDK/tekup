-- =============================================
-- RenOS Subcontractor Management System
-- Database Schema Migration
-- Version: 1.0.0
-- Created: 2025-10-28
-- =============================================
-- 
-- Purpose: Creates all tables, indexes, and RLS policies needed
--          for the RenOS subcontractor management system
--
-- Deployment: Run this script in Supabase SQL Editor
--             Database: oaevagdgrasfppbrxbey.supabase.co
--
-- Prerequisites:
--   - Existing 'bookings' table (should already exist in RenOS)
--   - UUID extension enabled (should already be enabled)
--
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. SUBCONTRACTORS - Main contractor information
-- =============================================

CREATE TABLE IF NOT EXISTS subcontractors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  city text,
  zip_code text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  rating decimal(3,2) CHECK (rating >= 0 AND rating <= 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add helpful comment
COMMENT ON TABLE subcontractors IS 'Stores information about subcontractors like Bassimas Clean';
COMMENT ON COLUMN subcontractors.status IS 'active, inactive, or suspended';
COMMENT ON COLUMN subcontractors.rating IS 'Average rating from 0.00 to 5.00';

-- =============================================
-- 2. SERVICES - Service types catalog
-- =============================================

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  category text,
  description text,
  default_price_dkk numeric(10, 2),
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE services IS 'Catalog of cleaning and maintenance services';
COMMENT ON COLUMN services.category IS 'E.g., cleaning, maintenance, specialized';

-- Insert default services
INSERT INTO services (name, category, default_price_dkk) VALUES
  ('Standard Cleaning', 'cleaning', 349.00),
  ('Deep Cleaning', 'cleaning', 449.00),
  ('Move-in/Move-out Cleaning', 'cleaning', 549.00),
  ('Office Cleaning', 'cleaning', 299.00),
  ('Window Cleaning', 'cleaning', 399.00),
  ('Carpet Cleaning', 'specialized', 499.00),
  ('Post-Construction Cleaning', 'specialized', 599.00),
  ('Emergency Cleaning', 'specialized', 699.00)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 3. SUBCONTRACTOR_SERVICES - Many-to-many relationship
-- =============================================

CREATE TABLE IF NOT EXISTS subcontractor_services (
  subcontractor_id uuid REFERENCES subcontractors(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  experience_years integer,
  certified boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (subcontractor_id, service_id)
);

COMMENT ON TABLE subcontractor_services IS 'Links subcontractors to services they can perform';
COMMENT ON COLUMN subcontractor_services.experience_years IS 'Years of experience with this service';

-- =============================================
-- 4. SUBCONTRACTOR_DOCUMENTS - Insurance, licenses, certifications
-- =============================================

CREATE TABLE IF NOT EXISTS subcontractor_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcontractor_id uuid REFERENCES subcontractors(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('insurance', 'license', 'certification', 'contract', 'other')),
  document_name text NOT NULL,
  policy_number text,
  expiration_date date,
  file_url text,
  file_size_bytes bigint,
  mime_type text,
  status text DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'pending', 'rejected')),
  uploaded_by uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE subcontractor_documents IS 'Stores insurance, licenses, and other contractor documents';
COMMENT ON COLUMN subcontractor_documents.document_type IS 'insurance, license, certification, contract, or other';
COMMENT ON COLUMN subcontractor_documents.status IS 'valid, expired, pending, or rejected';

-- =============================================
-- 5. SUBCONTRACTOR_AVAILABILITY - Schedule tracking
-- =============================================

CREATE TABLE IF NOT EXISTS subcontractor_availability (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcontractor_id uuid REFERENCES subcontractors(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,
  end_time time,
  is_available boolean DEFAULT true,
  recurring boolean DEFAULT false,
  recurring_pattern text, -- 'weekly', 'monthly', etc.
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (subcontractor_id, date, start_time)
);

COMMENT ON TABLE subcontractor_availability IS 'Tracks when subcontractors are available for work';
COMMENT ON COLUMN subcontractor_availability.recurring IS 'If true, this availability repeats according to pattern';

-- =============================================
-- 6. TASK_ASSIGNMENTS - Assignment of bookings to contractors
-- =============================================

CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- NOTE: bookings.id is text in current RenOS schema; use text here to match.
  -- Foreign key omitted intentionally due to cross-system type mismatch.
  booking_id text,
  subcontractor_id uuid REFERENCES subcontractors(id) ON DELETE SET NULL,
  assigned_by uuid,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  actual_hours numeric(5, 2),
  notes text,
  calendar_event_id text, -- Google Calendar event ID
  invoice_id text, -- Billy.dk invoice ID
  invoice_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE task_assignments IS 'Links bookings to assigned subcontractors';
COMMENT ON COLUMN task_assignments.status IS 'assigned, accepted, rejected, in_progress, completed, or cancelled';
COMMENT ON COLUMN task_assignments.actual_hours IS 'Actual hours worked (for billing)';

-- =============================================
-- 7. SUBCONTRACTOR_REVIEWS - Performance ratings
-- =============================================

CREATE TABLE IF NOT EXISTS subcontractor_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_assignment_id uuid REFERENCES task_assignments(id) ON DELETE CASCADE,
  subcontractor_id uuid REFERENCES subcontractors(id) ON DELETE CASCADE,
  reviewed_by uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quality_score integer CHECK (quality_score >= 1 AND quality_score <= 5),
  timeliness_score integer CHECK (timeliness_score >= 1 AND timeliness_score <= 5),
  communication_score integer CHECK (communication_score >= 1 AND communication_score <= 5),
  professionalism_score integer CHECK (professionalism_score >= 1 AND professionalism_score <= 5),
  would_recommend boolean,
  comments text,
  photos jsonb, -- Array of photo URLs
  created_at timestamptz DEFAULT now(),
  UNIQUE (task_assignment_id) -- One review per assignment
);

COMMENT ON TABLE subcontractor_reviews IS 'Performance reviews after completed tasks';
COMMENT ON COLUMN subcontractor_reviews.rating IS 'Overall rating 1-5';

-- =============================================
-- 8. SUBCONTRACTOR_AGREEMENTS - Contracts and terms
-- =============================================

CREATE TABLE IF NOT EXISTS subcontractor_agreements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcontractor_id uuid REFERENCES subcontractors(id) ON DELETE CASCADE,
  agreement_type text NOT NULL,
  terms text NOT NULL,
  signed_date date,
  expiration_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'terminated')),
  document_url text,
  payment_terms text,
  hourly_rate_dkk numeric(10, 2),
  created_by uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE subcontractor_agreements IS 'Contracts and agreements with subcontractors';
COMMENT ON COLUMN subcontractor_agreements.status IS 'pending, active, expired, or terminated';

-- =============================================
-- 9. PUSH_SUBSCRIPTIONS - Web push notification subscriptions
-- =============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcontractor_id uuid REFERENCES subcontractors(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL, -- Web Push API subscription object
  user_agent text,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now()
);

COMMENT ON TABLE push_subscriptions IS 'Web push notification subscriptions for PWA';
COMMENT ON COLUMN push_subscriptions.subscription IS 'Full subscription object from browser Push API';

-- =============================================
-- INDEXES for performance
-- =============================================

-- Subcontractors
CREATE INDEX IF NOT EXISTS idx_subcontractors_status ON subcontractors(status);
CREATE INDEX IF NOT EXISTS idx_subcontractors_rating ON subcontractors(rating DESC);
CREATE INDEX IF NOT EXISTS idx_subcontractors_email ON subcontractors(email);

-- Services
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- Task Assignments
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_subcontractor ON task_assignments(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_booking ON task_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_at ON task_assignments(assigned_at DESC);

-- Availability
CREATE INDEX IF NOT EXISTS idx_availability_date ON subcontractor_availability(date, subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_availability_subcontractor ON subcontractor_availability(subcontractor_id, date);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_expiration ON subcontractor_documents(expiration_date, status);
CREATE INDEX IF NOT EXISTS idx_documents_subcontractor ON subcontractor_documents(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON subcontractor_documents(document_type);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_subcontractor ON subcontractor_reviews(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON subcontractor_reviews(rating DESC);

-- Agreements
CREATE INDEX IF NOT EXISTS idx_agreements_subcontractor ON subcontractor_agreements(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON subcontractor_agreements(status);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Services are publicly readable
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  USING (true);

-- Subcontractors can view their own profile
CREATE POLICY "Subcontractors can view own profile"
  ON subcontractors FOR SELECT
  USING (auth.uid() = id);

-- Admin users can view all subcontractors (requires custom claim or role check)
-- This assumes you have a role system in place
CREATE POLICY "Admins can view all subcontractors"
  ON subcontractors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Subcontractors can view their own services
CREATE POLICY "Subcontractors can view own services"
  ON subcontractor_services FOR SELECT
  USING (subcontractor_id = auth.uid());

-- Admins can manage subcontractor services
CREATE POLICY "Admins can manage subcontractor services"
  ON subcontractor_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Similar policies for other tables (subcontractors see own data, admins see all)
CREATE POLICY "Subcontractors can view own documents"
  ON subcontractor_documents FOR SELECT
  USING (subcontractor_id = auth.uid());

CREATE POLICY "Subcontractors can view own availability"
  ON subcontractor_availability FOR ALL
  USING (subcontractor_id = auth.uid());

CREATE POLICY "Subcontractors can view own assignments"
  ON task_assignments FOR SELECT
  USING (subcontractor_id = auth.uid());

CREATE POLICY "Subcontractors can update own assignments"
  ON task_assignments FOR UPDATE
  USING (subcontractor_id = auth.uid())
  WITH CHECK (subcontractor_id = auth.uid());

CREATE POLICY "Subcontractors can view own reviews"
  ON subcontractor_reviews FOR SELECT
  USING (subcontractor_id = auth.uid());

CREATE POLICY "Subcontractors can view own agreements"
  ON subcontractor_agreements FOR SELECT
  USING (subcontractor_id = auth.uid());

CREATE POLICY "Subcontractors can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (subcontractor_id = auth.uid());

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to relevant tables
CREATE TRIGGER update_subcontractors_updated_at
  BEFORE UPDATE ON subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcontractor_documents_updated_at
  BEFORE UPDATE ON subcontractor_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_assignments_updated_at
  BEFORE UPDATE ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcontractor_agreements_updated_at
  BEFORE UPDATE ON subcontractor_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update subcontractor rating when review is added
CREATE OR REPLACE FUNCTION update_subcontractor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE subcontractors
  SET rating = (
    SELECT AVG(rating)::decimal(3,2)
    FROM subcontractor_reviews
    WHERE subcontractor_id = NEW.subcontractor_id
  )
  WHERE id = NEW.subcontractor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review
  AFTER INSERT ON subcontractor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_subcontractor_rating();

-- Function to check document expiration
CREATE OR REPLACE FUNCTION check_document_expiration()
RETURNS void AS $$
BEGIN
  UPDATE subcontractor_documents
  SET status = 'expired'
  WHERE expiration_date < CURRENT_DATE
    AND status = 'valid';
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule this function to run daily using pg_cron or external scheduler

-- =============================================
-- VIEWS for common queries
-- =============================================

-- Active subcontractors with their service count
CREATE OR REPLACE VIEW active_subcontractors_summary AS
SELECT 
  s.id,
  s.company_name,
  s.contact_name,
  s.email,
  s.phone,
  s.rating,
  COUNT(DISTINCT ss.service_id) as services_count,
  COUNT(DISTINCT ta.id) as total_assignments,
  COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN ta.id END) as completed_assignments
FROM subcontractors s
LEFT JOIN subcontractor_services ss ON s.id = ss.subcontractor_id
LEFT JOIN task_assignments ta ON s.id = ta.subcontractor_id
WHERE s.status = 'active'
GROUP BY s.id, s.company_name, s.contact_name, s.email, s.phone, s.rating;

COMMENT ON VIEW active_subcontractors_summary IS 'Summary view of active subcontractors with stats';

-- Expiring documents alert
CREATE OR REPLACE VIEW expiring_documents_alert AS
SELECT 
  sd.id,
  s.company_name,
  s.contact_name,
  s.email,
  sd.document_type,
  sd.document_name,
  sd.expiration_date,
  sd.expiration_date - CURRENT_DATE as days_until_expiration
FROM subcontractor_documents sd
JOIN subcontractors s ON sd.subcontractor_id = s.id
WHERE sd.status = 'valid'
  AND sd.expiration_date IS NOT NULL
  AND sd.expiration_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY sd.expiration_date ASC;

COMMENT ON VIEW expiring_documents_alert IS 'Documents expiring within 30 days';

-- =============================================
-- SUPABASE STORAGE BUCKET (Run in Supabase Dashboard or via API)
-- =============================================

-- Note: Create this bucket via Supabase Dashboard > Storage
-- Bucket name: subcontractor-documents
-- Public: false (private access with RLS)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, image/jpeg, image/png, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- Example RLS policy for storage bucket (apply in Supabase Dashboard):
-- Policy name: "Subcontractors can upload own documents"
-- Allowed operation: INSERT
-- Policy definition: bucket_id = 'subcontractor-documents' AND (storage.foldername(name))[1] = auth.uid()::text

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%subcontractor%' OR table_name IN ('services', 'push_subscriptions')
ORDER BY table_name;

-- Verify indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (tablename LIKE '%subcontractor%' OR tablename IN ('services'))
ORDER BY tablename, indexname;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND (tablename LIKE '%subcontractor%' OR tablename IN ('services', 'push_subscriptions'));

-- Check default services were inserted
SELECT COUNT(*) as service_count FROM services;

-- =============================================
-- ROLLBACK SCRIPT (Use with caution!)
-- =============================================

-- Uncomment to rollback all changes:
/*
DROP VIEW IF EXISTS expiring_documents_alert;
DROP VIEW IF EXISTS active_subcontractors_summary;
DROP TRIGGER IF EXISTS update_rating_on_review ON subcontractor_reviews;
DROP TRIGGER IF EXISTS update_subcontractor_agreements_updated_at ON subcontractor_agreements;
DROP TRIGGER IF EXISTS update_task_assignments_updated_at ON task_assignments;
DROP TRIGGER IF EXISTS update_subcontractor_documents_updated_at ON subcontractor_documents;
DROP TRIGGER IF EXISTS update_subcontractors_updated_at ON subcontractors;
DROP FUNCTION IF EXISTS update_subcontractor_rating();
DROP FUNCTION IF EXISTS check_document_expiration();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS subcontractor_agreements CASCADE;
DROP TABLE IF EXISTS subcontractor_reviews CASCADE;
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS subcontractor_availability CASCADE;
DROP TABLE IF EXISTS subcontractor_documents CASCADE;
DROP TABLE IF EXISTS subcontractor_services CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS subcontractors CASCADE;
*/

-- =============================================
-- END OF MIGRATION
-- =============================================
