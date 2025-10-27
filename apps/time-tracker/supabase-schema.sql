-- RenOS Time & Revenue Tracker Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_event_id TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  team TEXT NOT NULL CHECK (team IN ('Jonas+Rawan', 'FB', 'Mixed')),
  hours_worked DECIMAL(5,2) NOT NULL CHECK (hours_worked > 0),
  revenue DECIMAL(10,2) NOT NULL CHECK (revenue >= 0),
  cost DECIMAL(10,2) DEFAULT 0 CHECK (cost >= 0),
  profit DECIMAL(10,2) GENERATED ALWAYS AS (revenue - cost) STORED,
  job_type TEXT NOT NULL CHECK (job_type IN ('Fast', 'Flyt', 'Hoved', 'Post-reno')),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'invoiced', 'paid')),
  invoice_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FB Settlements table
CREATE TABLE IF NOT EXISTS fb_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month DATE NOT NULL,
  total_hours DECIMAL(5,2) NOT NULL CHECK (total_hours > 0),
  hourly_rate DECIMAL(5,2) DEFAULT 90 CHECK (hourly_rate > 0),
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_hours * hourly_rate) STORED,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_date ON jobs(date);
CREATE INDEX IF NOT EXISTS idx_jobs_team ON jobs(team);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_name ON jobs(customer_name);
CREATE INDEX IF NOT EXISTS idx_jobs_calendar_event_id ON jobs(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_fb_settlements_month ON fb_settlements(month);
CREATE INDEX IF NOT EXISTS idx_fb_settlements_paid ON fb_settlements(paid);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_settlements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated users to read jobs" ON jobs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read settlements" ON fb_settlements
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert jobs
CREATE POLICY "Allow authenticated users to insert jobs" ON jobs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert settlements" ON fb_settlements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update jobs
CREATE POLICY "Allow authenticated users to update jobs" ON jobs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update settlements" ON fb_settlements
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete jobs
CREATE POLICY "Allow authenticated users to delete jobs" ON jobs
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete settlements" ON fb_settlements
  FOR DELETE USING (auth.role() = 'authenticated');

-- Functions for analytics
CREATE OR REPLACE FUNCTION get_monthly_stats(target_month DATE)
RETURNS TABLE (
  month DATE,
  total_jobs BIGINT,
  total_hours DECIMAL(10,2),
  fb_hours DECIMAL(10,2),
  own_hours DECIMAL(10,2),
  total_revenue DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  total_profit DECIMAL(10,2),
  avg_hourly_rate DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    target_month,
    COUNT(*) as total_jobs,
    COALESCE(SUM(j.hours_worked), 0) as total_hours,
    COALESCE(SUM(CASE WHEN j.team = 'FB' THEN j.hours_worked ELSE 0 END), 0) as fb_hours,
    COALESCE(SUM(CASE WHEN j.team != 'FB' THEN j.hours_worked ELSE 0 END), 0) as own_hours,
    COALESCE(SUM(j.revenue), 0) as total_revenue,
    COALESCE(SUM(j.cost), 0) as total_cost,
    COALESCE(SUM(j.profit), 0) as total_profit,
    CASE
      WHEN SUM(j.hours_worked) > 0 THEN SUM(j.revenue) / SUM(j.hours_worked)
      ELSE 0
    END as avg_hourly_rate
  FROM jobs j
  WHERE DATE_TRUNC('month', j.date) = DATE_TRUNC('month', target_month)
  GROUP BY target_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get FB settlement for a month
CREATE OR REPLACE FUNCTION get_fb_settlement(target_month DATE)
RETURNS TABLE (
  month DATE,
  total_hours DECIMAL(10,2),
  hourly_rate DECIMAL(5,2),
  total_amount DECIMAL(10,2),
  job_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    target_month,
    COALESCE(SUM(j.hours_worked), 0) as total_hours,
    90 as hourly_rate,
    COALESCE(SUM(j.hours_worked) * 90, 0) as total_amount,
    COUNT(*) as job_count
  FROM jobs j
  WHERE DATE_TRUNC('month', j.date) = DATE_TRUNC('month', target_month)
    AND j.team = 'FB';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync calendar events (placeholder for Google Calendar integration)
CREATE OR REPLACE FUNCTION sync_calendar_events()
RETURNS TEXT AS $$
BEGIN
  -- This function will be called by the API to sync Google Calendar events
  -- Implementation will be in the API routes
  RETURN 'Calendar sync completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;