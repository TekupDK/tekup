-- ============================================================================
-- RenOS Supabase Migration Script
-- Converts Prisma schema to Supabase SQL with Row Level Security
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Core Chat System
-- ============================================================================

CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT,
  locale TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Customer Management
-- ============================================================================

CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  company_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  tags TEXT[] DEFAULT '{}',
  total_leads INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  last_contact_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Lead Management with AI Scoring
-- ============================================================================

CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  customer_id UUID REFERENCES customers(id),
  source TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  square_meters DECIMAL(8,2),
  rooms INTEGER,
  task_type TEXT,
  preferred_dates TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'new',
  email_thread_id TEXT,
  follow_up_attempts INTEGER DEFAULT 0,
  last_follow_up_date TIMESTAMP WITH TIME ZONE,
  idempotency_key TEXT UNIQUE,
  
  -- Firecrawl Enrichment Fields
  company_name TEXT,
  industry TEXT,
  estimated_size TEXT,
  estimated_value DECIMAL(10,2),
  enrichment_data JSONB,
  last_enriched TIMESTAMP WITH TIME ZONE,
  
  -- Lead Scoring Fields
  score INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  last_scored TIMESTAMP WITH TIME ZONE,
  score_metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(8,2) NOT NULL,
  estimated_hours DECIMAL(6,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  notes TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Booking System with Time Tracking
-- ============================================================================

CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  quote_id TEXT,
  service_type TEXT,
  address TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_duration INTEGER DEFAULT 120,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'scheduled',
  calendar_event_id TEXT,
  calendar_link TEXT,
  notes TEXT,
  
  -- Time Tracking Fields
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  actual_duration INTEGER,
  time_variance INTEGER,
  efficiency_score DECIMAL(4,2),
  time_notes TEXT,
  timer_status TEXT DEFAULT 'not_started',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE breaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Cleaning Plans System
-- ============================================================================

CREATE TABLE cleaning_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL,
  frequency TEXT DEFAULT 'once',
  is_template BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  estimated_duration INTEGER DEFAULT 120,
  estimated_price DECIMAL(10,2),
  square_meters DECIMAL(8,2),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cleaning_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES cleaning_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  estimated_time INTEGER DEFAULT 15,
  is_required BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  price_per_task DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cleaning_plan_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES cleaning_plans(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  completed_tasks TEXT[] DEFAULT '{}',
  actual_duration INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Email System
-- ============================================================================

CREATE TABLE email_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gmail_thread_id TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  subject TEXT NOT NULL,
  snippet TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL,
  participants TEXT[] DEFAULT '{}',
  message_count INTEGER DEFAULT 0,
  labels TEXT[] DEFAULT '{}',
  is_matched BOOLEAN DEFAULT FALSE,
  matched_at TIMESTAMP WITH TIME ZONE,
  matched_by TEXT,
  confidence DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE email_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gmail_message_id TEXT UNIQUE,
  gmail_thread_id TEXT NOT NULL,
  thread_id UUID REFERENCES email_threads(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  to_emails TEXT[] DEFAULT '{}',
  subject TEXT,
  body TEXT NOT NULL,
  body_preview TEXT,
  direction TEXT DEFAULT 'inbound',
  status TEXT DEFAULT 'delivered',
  is_ai_generated BOOLEAN DEFAULT FALSE,
  ai_model TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  conversation_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id),
  subject TEXT,
  channel TEXT DEFAULT 'email',
  status TEXT DEFAULT 'active',
  gmail_thread_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE email_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  gmail_thread_id TEXT,
  gmail_message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  ai_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE email_ingest_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running',
  total_emails INTEGER DEFAULT 0,
  new_emails INTEGER DEFAULT 0,
  updated_emails INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  error_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Escalation System
-- ============================================================================

CREATE TABLE escalations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  thread_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  conflict_score INTEGER NOT NULL,
  matched_keywords TEXT[] DEFAULT '{}',
  email_snippet TEXT NOT NULL,
  escalated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  escalated_by TEXT NOT NULL,
  jonas_notified BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Invoicing System
-- ============================================================================

CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  
  -- Invoice details
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'draft',
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 25.0,
  vat_amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  
  -- Payment
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_amount DECIMAL(10,2),
  payment_method TEXT,
  payment_ref TEXT,
  
  -- Billy.dk integration
  billy_invoice_id TEXT UNIQUE,
  billy_contact_id TEXT,
  billy_synced_at TIMESTAMP WITH TIME ZONE,
  billy_pdf_url TEXT,
  
  -- Metadata
  notes TEXT,
  internal_notes TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE invoice_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(8,2) DEFAULT 1.0,
  unit_price DECIMAL(8,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Analytics & Task Execution
-- ============================================================================

CREATE TABLE analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  metric TEXT NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, metric)
);

CREATE TABLE task_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_type TEXT NOT NULL,
  task_payload JSONB NOT NULL,
  status TEXT NOT NULL,
  result JSONB,
  error TEXT,
  duration INTEGER,
  trace_id TEXT,
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  intent TEXT,
  confidence DECIMAL(4,2),
  correction_type TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Competitor Analysis
-- ============================================================================

CREATE TABLE competitor_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor TEXT NOT NULL,
  website_url TEXT NOT NULL,
  pricing_data JSONB NOT NULL,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  credits_used INTEGER DEFAULT 1
);

-- ============================================================================
-- Utility Tables
-- ============================================================================

CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(8,2) NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Chat system indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

-- Customer indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);

-- Lead indexes
CREATE INDEX idx_leads_email_created ON leads(email, created_at);
CREATE INDEX idx_leads_estimated_value ON leads(estimated_value);
CREATE INDEX idx_leads_score_priority ON leads(score, priority);
CREATE INDEX idx_leads_customer_id ON leads(customer_id);

-- Booking indexes
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_timer_status ON bookings(timer_status);

-- Cleaning plan indexes
CREATE INDEX idx_cleaning_plans_customer_id ON cleaning_plans(customer_id);
CREATE INDEX idx_cleaning_plans_service_type ON cleaning_plans(service_type);
CREATE INDEX idx_cleaning_plans_is_active ON cleaning_plans(is_active);
CREATE INDEX idx_cleaning_tasks_plan_id ON cleaning_tasks(plan_id);

-- Email indexes
CREATE INDEX idx_email_threads_customer_id ON email_threads(customer_id);
CREATE INDEX idx_email_threads_gmail_thread_id ON email_threads(gmail_thread_id);
CREATE INDEX idx_email_threads_last_message_at ON email_threads(last_message_at);
CREATE INDEX idx_email_messages_thread_id ON email_messages(thread_id);
CREATE INDEX idx_email_messages_sent_at ON email_messages(sent_at);

-- Invoice indexes
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Analytics indexes
CREATE INDEX idx_analytics_date_metric ON analytics(date, metric);
CREATE INDEX idx_task_executions_task_type_status ON task_executions(task_type, status);
CREATE INDEX idx_task_executions_executed_at ON task_executions(executed_at);

-- Competitor analysis indexes
CREATE INDEX idx_competitor_pricing_competitor_scraped ON competitor_pricing(competitor, scraped_at);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_executions ENABLE ROW LEVEL SECURITY;

-- Chat Sessions - Users can only access their own sessions
CREATE POLICY "Users can manage their own chat sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own chat messages" ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- For now, allow authenticated users to access business data
-- In production, you'd want more granular permissions based on user roles
CREATE POLICY "Authenticated users can manage customers" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage leads" ON leads
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage quotes" ON quotes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage bookings" ON bookings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage cleaning plans" ON cleaning_plans
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage cleaning tasks" ON cleaning_tasks
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage email threads" ON email_threads
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage email messages" ON email_messages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage conversations" ON conversations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage invoices" ON invoices
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own task executions" ON task_executions
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');

-- ============================================================================
-- Functions for automatic timestamp updates
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables with updated_at columns
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cleaning_plans_updated_at BEFORE UPDATE ON cleaning_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cleaning_tasks_updated_at BEFORE UPDATE ON cleaning_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_threads_updated_at BEFORE UPDATE ON email_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_messages_updated_at BEFORE UPDATE ON email_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Insert sample service types
INSERT INTO services (name, description, price, duration) VALUES
('Privatrengøring', 'Standard boligrengøring', 350.00, 120),
('Flytterengøring', 'Grundig rengøring ved flytning', 450.00, 180),
('Hovedrengøring', 'Dyb rengøring af hele boligen', 500.00, 240),
('Erhvervsrengøring', 'Kontorrengøring', 300.00, 90),
('Airbnb Rengøring', 'Hurtig rengøring mellem gæster', 250.00, 60),
('Vinduespolering', 'Professionel vinduesrengøring', 200.00, 45);

-- Insert sample labels
INSERT INTO labels (name) VALUES
('Urgent'),
('High Value'),
('Repeat Customer'),
('New Lead'),
('Follow Up Required');

COMMENT ON TABLE chat_sessions IS 'AI chat sessions with customers';
COMMENT ON TABLE customers IS 'Customer master data with contact information';
COMMENT ON TABLE leads IS 'Sales leads with AI scoring and enrichment';
COMMENT ON TABLE bookings IS 'Service bookings with time tracking';
COMMENT ON TABLE cleaning_plans IS 'Recurring cleaning service plans';
COMMENT ON TABLE invoices IS 'Invoice management with Billy.dk integration';
COMMENT ON TABLE task_executions IS 'AI task execution audit trail';