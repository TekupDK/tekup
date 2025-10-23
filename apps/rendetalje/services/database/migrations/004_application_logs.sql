-- ================================================
-- APPLICATION LOGS TABLE
-- ================================================
-- Centralized logging table for all RendetaljeOS services
-- Supports Winston logging with Supabase transport
--
-- Services: Backend, Frontend, Calendar MCP, Billy, TekupVault
-- Created: 2025-10-23
-- ================================================

-- Create application logs table
CREATE TABLE IF NOT EXISTS application_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  service VARCHAR(50),
  user_id UUID,
  request_id VARCHAR(100),
  
  -- Metadata for filtering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_level CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical'))
);

-- ================================================
-- INDEXES FOR FAST QUERIES
-- ================================================

-- Most common: Get recent logs
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON application_logs(timestamp DESC);

-- Filter by severity
CREATE INDEX IF NOT EXISTS idx_logs_level ON application_logs(level);

-- Filter by service
CREATE INDEX IF NOT EXISTS idx_logs_service ON application_logs(service);

-- Filter by user
CREATE INDEX IF NOT EXISTS idx_logs_user ON application_logs(user_id) WHERE user_id IS NOT NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_logs_service_level_timestamp 
  ON application_logs(service, level, timestamp DESC);

-- Full-text search on message
CREATE INDEX IF NOT EXISTS idx_logs_message_search 
  ON application_logs USING gin(to_tsvector('danish', message));

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can insert logs
CREATE POLICY IF NOT EXISTS "Service role can insert logs" 
  ON application_logs 
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Policy: Authenticated users can read logs
CREATE POLICY IF NOT EXISTS "Authenticated users can read logs" 
  ON application_logs 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Policy: Admin users can delete old logs
CREATE POLICY IF NOT EXISTS "Admin users can delete logs" 
  ON application_logs 
  FOR DELETE 
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- ================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================

-- View: Recent errors (last 24 hours)
CREATE OR REPLACE VIEW recent_errors AS
SELECT 
  id,
  timestamp,
  level,
  message,
  service,
  metadata,
  user_id
FROM application_logs
WHERE level IN ('error', 'critical')
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 100;

-- View: Error summary by service
CREATE OR REPLACE VIEW error_summary_by_service AS
SELECT 
  service,
  COUNT(*) as error_count,
  MAX(timestamp) as last_error,
  JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'timestamp', timestamp,
      'message', message,
      'level', level
    ) ORDER BY timestamp DESC
  ) FILTER (WHERE level IN ('error', 'critical')) as recent_errors
FROM application_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
  AND level IN ('error', 'critical')
GROUP BY service
ORDER BY error_count DESC;

-- View: Logs by hour (for charts)
CREATE OR REPLACE VIEW logs_by_hour AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  service,
  level,
  COUNT(*) as count
FROM application_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY hour, service, level
ORDER BY hour DESC;

-- ================================================
-- FUNCTIONS FOR LOG MANAGEMENT
-- ================================================

-- Function: Clean up old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM application_logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get error count for last N minutes
CREATE OR REPLACE FUNCTION get_error_count(minutes INTEGER DEFAULT 60)
RETURNS TABLE (
  level VARCHAR(10),
  service VARCHAR(50),
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.level,
    l.service,
    COUNT(*) as count
  FROM application_logs l
  WHERE l.timestamp > NOW() - (minutes || ' minutes')::INTERVAL
    AND l.level IN ('error', 'critical')
  GROUP BY l.level, l.service
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- SCHEDULED CLEANUP (pg_cron extension required)
-- ================================================

-- Uncomment if pg_cron is installed:
-- SELECT cron.schedule(
--   'cleanup-old-logs',
--   '0 2 * * *', -- Every day at 2 AM
--   $$SELECT cleanup_old_logs();$$
-- );

-- ================================================
-- GRANTS
-- ================================================

-- Grant permissions
GRANT SELECT ON application_logs TO authenticated;
GRANT INSERT ON application_logs TO service_role;
GRANT SELECT ON recent_errors TO authenticated;
GRANT SELECT ON error_summary_by_service TO authenticated;
GRANT SELECT ON logs_by_hour TO authenticated;

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE application_logs IS 'Centralized application logs from all RendetaljeOS services';
COMMENT ON COLUMN application_logs.level IS 'Log severity: debug, info, warn, error, critical';
COMMENT ON COLUMN application_logs.metadata IS 'Additional context (JSON)';
COMMENT ON COLUMN application_logs.service IS 'Source service name (e.g., rendetalje-backend)';
COMMENT ON VIEW recent_errors IS 'Last 100 errors in the past 24 hours';
COMMENT ON FUNCTION cleanup_old_logs IS 'Deletes logs older than 30 days';

-- ================================================
-- SAMPLE QUERIES
-- ================================================

-- Get recent errors:
-- SELECT * FROM recent_errors LIMIT 10;

-- Count errors per service today:
-- SELECT service, COUNT(*) as errors
-- FROM application_logs
-- WHERE level = 'error' AND timestamp > CURRENT_DATE
-- GROUP BY service;

-- Search logs by message:
-- SELECT * FROM application_logs
-- WHERE to_tsvector('danish', message) @@ to_tsquery('danish', 'login')
-- ORDER BY timestamp DESC LIMIT 50;

-- Get error summary:
-- SELECT * FROM error_summary_by_service;

-- ================================================
-- SUCCESS MESSAGE
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Application logs table created successfully!';
  RAISE NOTICE '📊 Views created: recent_errors, error_summary_by_service, logs_by_hour';
  RAISE NOTICE '🔧 Functions created: cleanup_old_logs(), get_error_count()';
  RAISE NOTICE '🔒 RLS enabled with policies for authenticated and service_role';
END $$;
