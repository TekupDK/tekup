-- RenOS Calendar Intelligence MCP - Supabase Schema
-- Minimal MVP schema for FASE 1
-- Created: 2025-10-21

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== CUSTOMER INTELLIGENCE ====================

CREATE TABLE IF NOT EXISTS customer_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  
  -- Access & Logistics
  access_notes TEXT,
  parking_instructions TEXT,
  special_instructions TEXT,
  
  -- Preferences (JSONB for flexibility)
  preferences JSONB DEFAULT '{}'::jsonb,
  -- Example structure:
  -- {
  --   "communicationStyle": "formal",
  --   "confirmationRequired": true,
  --   "preferredDays": [1, 3], 
  --   "preferredTimes": ["08:30", "09:00"],
  --   "avoidWeekends": true
  -- }
  
  -- Fixed Schedule Pattern (JSONB)
  fixed_schedule JSONB,
  -- Example structure:
  -- {
  --   "dayOfWeek": 1,
  --   "time": "08:30",
  --   "frequency": "weekly",
  --   "confidence": 95
  -- }
  
  -- History & Patterns
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  canceled_bookings INTEGER DEFAULT 0,
  average_job_duration DECIMAL(5,2) DEFAULT 0,
  last_booking_date TIMESTAMPTZ,
  
  -- Risk Assessment
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_factors TEXT[] DEFAULT '{}',
  
  -- Financial
  total_revenue DECIMAL(10,2) DEFAULT 0,
  average_booking_value DECIMAL(10,2) DEFAULT 0,
  outstanding_invoices INTEGER DEFAULT 0,
  payment_history TEXT CHECK (payment_history IN ('excellent', 'good', 'fair', 'poor')),
  
  -- Quality
  satisfaction_score DECIMAL(2,1) CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  complaints INTEGER DEFAULT 0,
  praises INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for customer_intelligence
CREATE INDEX idx_customer_intelligence_customer_id ON customer_intelligence(customer_id);
CREATE INDEX idx_customer_intelligence_customer_name ON customer_intelligence(customer_name);
CREATE INDEX idx_customer_intelligence_risk_score ON customer_intelligence(risk_score DESC);
CREATE INDEX idx_customer_intelligence_last_booking ON customer_intelligence(last_booking_date DESC);

-- ==================== BOOKING VALIDATIONS ====================

CREATE TABLE IF NOT EXISTS booking_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT,
  
  -- Validation details
  validation_type TEXT NOT NULL CHECK (validation_type IN ('date', 'conflict', 'pattern', 'team', 'full')),
  passed BOOLEAN NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  
  -- Input data (JSONB)
  input JSONB NOT NULL,
  
  -- Results (JSONB arrays)
  warnings JSONB DEFAULT '[]'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  
  -- Action taken
  action TEXT CHECK (action IN ('approved', 'rejected', 'manual_review')),
  reviewed_by TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for booking_validations
CREATE INDEX idx_booking_validations_booking_id ON booking_validations(booking_id);
CREATE INDEX idx_booking_validations_validation_type ON booking_validations(validation_type);
CREATE INDEX idx_booking_validations_passed ON booking_validations(passed);
CREATE INDEX idx_booking_validations_created_at ON booking_validations(created_at DESC);

-- ==================== OVERTIME LOGS ====================

CREATE TABLE IF NOT EXISTS overtime_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  
  -- Time tracking
  estimated_hours DECIMAL(4,2) NOT NULL,
  actual_hours DECIMAL(4,2),
  overtime_hours DECIMAL(4,2),
  
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  
  -- Alert tracking
  alert_sent_at TIMESTAMPTZ,
  alert_method TEXT CHECK (alert_method IN ('voice', 'sms', 'email')),
  
  -- Communication log (JSONB array)
  communication_log JSONB DEFAULT '[]'::jsonb,
  -- Example structure:
  -- [{
  --   "timestamp": "2025-10-21T10:30:00Z",
  --   "type": "call",
  --   "direction": "outgoing",
  --   "content": "Called customer about overtime",
  --   "outcome": "Customer OK with extra hour"
  -- }]
  
  -- Customer response
  customer_notified BOOLEAN DEFAULT FALSE,
  customer_response TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for overtime_logs
CREATE INDEX idx_overtime_logs_booking_id ON overtime_logs(booking_id);
CREATE INDEX idx_overtime_logs_customer_id ON overtime_logs(customer_id);
CREATE INDEX idx_overtime_logs_alert_sent ON overtime_logs(alert_sent_at DESC NULLS LAST);
CREATE INDEX idx_overtime_logs_created_at ON overtime_logs(created_at DESC);

-- ==================== LEARNED PATTERNS ====================

CREATE TABLE IF NOT EXISTS learned_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('customer_schedule', 'job_duration', 'team_preference', 'communication_style')),
  entity_id TEXT NOT NULL, -- customer ID, job type, etc
  
  -- Pattern data (JSONB - flexible structure)
  pattern_data JSONB NOT NULL,
  
  -- Confidence & validation
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  occurrences INTEGER DEFAULT 1,
  
  -- Timestamps
  last_observed TIMESTAMPTZ DEFAULT NOW(),
  last_validated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for learned_patterns
CREATE INDEX idx_learned_patterns_type_entity ON learned_patterns(pattern_type, entity_id);
CREATE INDEX idx_learned_patterns_confidence ON learned_patterns(confidence DESC);
CREATE INDEX idx_learned_patterns_last_observed ON learned_patterns(last_observed DESC);

-- ==================== UNDO ACTIONS ====================

CREATE TABLE IF NOT EXISTS undo_actions (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('booking_created', 'invoice_created', 'customer_updated', 'validation_override')),
  
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('booking', 'invoice', 'customer', 'validation')),
  
  -- State snapshots (JSONB)
  before JSONB NOT NULL,
  after JSONB NOT NULL,
  
  -- Tracking
  performed_by TEXT NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, -- 5 minutes from performed_at
  
  undone_at TIMESTAMPTZ,
  undone_by TEXT,
  
  -- Index for cleanup
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for undo_actions
CREATE INDEX idx_undo_actions_entity ON undo_actions(entity_type, entity_id);
CREATE INDEX idx_undo_actions_expires_at ON undo_actions(expires_at);
CREATE INDEX idx_undo_actions_undone ON undo_actions(undone_at NULLS FIRST);

-- ==================== ROW LEVEL SECURITY (Optional - for multi-tenant) ====================

-- Enable RLS on all tables
ALTER TABLE customer_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE undo_actions ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow service role full access
-- For MVP, using service role key from backend
-- In production, implement proper tenant-based policies

CREATE POLICY "Service role has full access to customer_intelligence"
  ON customer_intelligence
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to booking_validations"
  ON booking_validations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to overtime_logs"
  ON overtime_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to learned_patterns"
  ON learned_patterns
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to undo_actions"
  ON undo_actions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==================== FUNCTIONS ====================

-- Auto-update last_updated timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for customer_intelligence
CREATE TRIGGER update_customer_intelligence_updated_at
  BEFORE UPDATE ON customer_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-cleanup expired undo actions (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_undo_actions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM undo_actions
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ==================== SAMPLE DATA (for testing) ====================

-- Example customer with fixed schedule pattern
INSERT INTO customer_intelligence (
  customer_id,
  customer_name,
  access_notes,
  preferences,
  fixed_schedule,
  total_bookings,
  completed_bookings,
  average_job_duration,
  risk_score,
  total_revenue,
  average_booking_value,
  satisfaction_score,
  payment_history
) VALUES (
  'jes-vestergaard',
  'Jes Vestergaard',
  'Ekstranøgle under potteplante ved hoveddør',
  '{"confirmationRequired": true, "preferredDays": [1], "avoidWeekends": true}'::jsonb,
  '{"dayOfWeek": 1, "time": "08:30", "frequency": "weekly", "confidence": 95}'::jsonb,
  24,
  24,
  2.5,
  15,
  21000,
  875,
  4.8,
  'excellent'
) ON CONFLICT (customer_id) DO NOTHING;

-- Example customer with weekend preference issue
INSERT INTO customer_intelligence (
  customer_id,
  customer_name,
  preferences,
  total_bookings,
  completed_bookings,
  risk_score,
  risk_factors,
  satisfaction_score,
  payment_history
) VALUES (
  'vibeke-bregnballe',
  'Vibeke Bregnballe',
  '{"avoidWeekends": true}'::jsonb,
  12,
  11,
  25,
  ARRAY['no-show incident (lørdag 08:00)'],
  4.2,
  'good'
) ON CONFLICT (customer_id) DO NOTHING;

-- ==================== GRANTS ====================

-- Grant usage to authenticated users (if needed for direct client access)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

-- For MVP, backend uses service_role key so no additional grants needed

-- ==================== COMPLETION MESSAGE ====================

DO $$
BEGIN
  RAISE NOTICE 'RenOS Calendar Intelligence MCP schema installed successfully!';
  RAISE NOTICE 'Tables created: customer_intelligence, booking_validations, overtime_logs, learned_patterns, undo_actions';
  RAISE NOTICE 'Sample data inserted for Jes Vestergaard and Vibeke Bregnballe';
  RAISE NOTICE 'Ready for MVP deployment!';
END $$;

