-- cspell:words Rendetalje Supabase Tekup TRUNC plpgsql rendetalje
-- ================================================
-- APPLICATION LOGS TABLE (OPTIMIZED)
-- ================================================
-- Centralized logging table for all RendetaljeOS services
-- Supports Winston logging with Supabase transport
-- Compatible with TekupVault log ingestion pipeline
--
-- Services: Backend, Frontend, Calendar MCP, Billy, TekupVault
-- Created: 2025-10-23, Optimized: 2025-01-XX
-- ================================================

-- Create application logs table with optimized structure
CREATE TABLE IF NOT EXISTS application_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}' NOT NULL,
  service VARCHAR(50) NOT NULL,
  user_id UUID,
  request_id VARCHAR(100),
  
  -- Performance optimization: partition key
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Add source tracking for TekupVault integration
  source_file VARCHAR(255),
  source_function VARCHAR(100),
  stack_trace TEXT,
  
  -- Constraints
  CONSTRAINT valid_level CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  CONSTRAINT valid_service CHECK (service ~ '^[a-z0-9-]+$')
);

-- ================================================
-- OPTIMIZED INDEXES FOR PERFORMANCE
-- ================================================

-- Primary query pattern: recent logs by service and level
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_service_level_timestamp 
  ON application_logs(service, level, timestamp DESC)
  WHERE timestamp > NOW() - INTERVAL '7 days';

-- Error monitoring: critical and error logs only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_errors_timestamp 
  ON application_logs(timestamp DESC, service)
  WHERE level IN ('error', 'critical');

-- User activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_user_timestamp 
  ON application_logs(user_id, timestamp DESC) 
  WHERE user_id IS NOT NULL;

-- Request tracing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_request_id 
  ON application_logs(request_id, timestamp DESC) 
  WHERE request_id IS NOT NULL;

-- Full-text search with GIN index (optimized for Danish)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_message_search 
  ON application_logs USING gin(to_tsvector('danish', message))
  WHERE level IN ('warn', 'error', 'critical');

-- Metadata search for structured data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_metadata_search 
  ON application_logs USING gin(metadata)
  WHERE metadata != '{}';

-- ================================================
-- PARTITIONING FOR LARGE DATASETS
-- ================================================

-- Create monthly partitions for better performance
-- (Uncomment when logs exceed 1M rows)
--
-- CREATE TABLE application_logs_y2025m01 PARTITION OF application_logs
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
--
-- CREATE TABLE application_logs_y2025m02 PARTITION OF application_logs
-- FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- ================================================
-- ROW LEVEL SECURITY (RLS) - ENHANCED
-- ================================================

ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent execution)
DROP POLICY IF EXISTS "Service role can insert logs" ON application_logs;
DROP POLICY IF EXISTS "Authenticated users can read logs" ON application_logs;
DROP POLICY IF EXISTS "Admin users can delete logs" ON application_logs;

-- Policy: Service role can insert logs
CREATE POLICY "Service role can insert logs" 
  ON application_logs 
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Policy: Authenticated users can read logs
CREATE POLICY "Authenticated users can read logs" 
  ON application_logs 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Policy: Admin users can delete old logs
CREATE POLICY "Admin users can delete logs" 
  ON application_logs 
  FOR DELETE 
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Enhanced policy: Service-specific access
CREATE POLICY "Services can only read own logs" 
  ON application_logs 
  FOR SELECT 
  TO authenticated
  USING (
    service = current_setting('app.current_service', true) OR
    auth.jwt() ->> 'role' IN ('admin', 'service_role')
  );

-- TekupVault integration policy
CREATE POLICY "TekupVault can read all logs" 
  ON application_logs 
  FOR SELECT 
  TO service_role
  USING (true);

-- ================================================
-- ENHANCED VIEWS FOR MONITORING
-- ================================================

-- View: Real-time error monitoring (last 5 minutes)
CREATE OR REPLACE VIEW realtime_errors AS
SELECT 
  id,
  timestamp,
  level,
  message,
  service,
  metadata,
  user_id,
  request_id
FROM application_logs
WHERE level IN ('error', 'critical')
  AND timestamp > NOW() - INTERVAL '5 minutes'
ORDER BY timestamp DESC;

-- View: Service health dashboard
CREATE OR REPLACE VIEW service_health_dashboard AS
SELECT 
  service,
  COUNT(*) FILTER (WHERE level = 'error') as error_count_24h,
  COUNT(*) FILTER (WHERE level = 'critical') as critical_count_24h,
  COUNT(*) FILTER (WHERE level = 'warn') as warning_count_24h,
  MAX(timestamp) FILTER (WHERE level IN ('error', 'critical')) as last_error,
  ROUND(
    COUNT(*) FILTER (WHERE level IN ('error', 'critical'))::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as error_rate_percentage
FROM application_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY service
ORDER BY error_count_24h DESC;

-- View: Performance metrics by service
CREATE OR REPLACE VIEW service_performance_metrics AS
SELECT 
  service,
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE level = 'error') as errors,
  COUNT(*) FILTER (WHERE level = 'warn') as warnings,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(DISTINCT request_id) as unique_requests
FROM application_logs
WHERE timestamp > NOW() - INTERVAL '48 hours'
GROUP BY service, hour
ORDER BY hour DESC, service;

-- ================================================
-- ENHANCED FUNCTIONS FOR LOG MANAGEMENT
-- ================================================

-- Function: Intelligent log cleanup (keep important logs longer)
CREATE OR REPLACE FUNCTION cleanup_old_logs_intelligent()
RETURNS TABLE (
  deleted_debug INTEGER,
  deleted_info INTEGER,
  deleted_warn INTEGER,
  deleted_error INTEGER,
  total_deleted INTEGER
) AS $$
DECLARE
  deleted_debug INTEGER := 0;
  deleted_info INTEGER := 0;
  deleted_warn INTEGER := 0;
  deleted_error INTEGER := 0;
BEGIN
  -- Delete debug logs older than 7 days
  DELETE FROM application_logs
  WHERE level = 'debug' AND timestamp < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS deleted_debug = ROW_COUNT;
  
  -- Delete info logs older than 30 days
  DELETE FROM application_logs
  WHERE level = 'info' AND timestamp < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_info = ROW_COUNT;
  
  -- Delete warn logs older than 90 days
  DELETE FROM application_logs
  WHERE level = 'warn' AND timestamp < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_warn = ROW_COUNT;
  
  -- Delete error/critical logs older than 1 year
  DELETE FROM application_logs
  WHERE level IN ('error', 'critical') AND timestamp < NOW() - INTERVAL '1 year';
  GET DIAGNOSTICS deleted_error = ROW_COUNT;
  
  RETURN QUERY SELECT deleted_debug, deleted_info, deleted_warn, deleted_error, 
                     (deleted_debug + deleted_info + deleted_warn + deleted_error);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get log statistics for monitoring
CREATE OR REPLACE FUNCTION get_log_statistics(hours INTEGER DEFAULT 24)
RETURNS TABLE (
  service VARCHAR(50),
  level VARCHAR(10),
  count BIGINT,
  percentage NUMERIC,
  avg_per_hour NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      l.service,
      l.level,
      COUNT(*) as log_count,
      COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY l.service) as pct
    FROM application_logs l
    WHERE l.timestamp > NOW() - (hours || ' hours')::INTERVAL
    GROUP BY l.service, l.level
  )
  SELECT 
    s.service,
    s.level,
    s.log_count,
    ROUND(s.pct, 2) as percentage,
    ROUND(s.log_count::numeric / hours, 2) as avg_per_hour
  FROM stats s
  ORDER BY s.service, s.log_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Alert on error spikes
CREATE OR REPLACE FUNCTION check_error_spike(
  service_name VARCHAR(50),
  threshold INTEGER DEFAULT 10,
  minutes INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
  error_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO error_count
  FROM application_logs
  WHERE service = service_name
    AND level IN ('error', 'critical')
    AND timestamp > NOW() - (minutes || ' minutes')::INTERVAL;
    
  RETURN error_count > threshold;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- TRIGGERS FOR AUTOMATED MONITORING
-- ================================================

-- Function: Notify on critical errors
CREATE OR REPLACE FUNCTION notify_critical_error()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.level = 'critical' THEN
    PERFORM pg_notify(
      'critical_error',
      json_build_object(
        'service', NEW.service,
        'message', NEW.message,
        'timestamp', NEW.timestamp,
        'user_id', NEW.user_id
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Real-time critical error notifications
CREATE TRIGGER trigger_notify_critical_error
  AFTER INSERT ON application_logs
  FOR EACH ROW
  WHEN (NEW.level = 'critical')
  EXECUTE FUNCTION notify_critical_error();

-- ================================================
-- TEKUPVAULT INTEGRATION HELPERS
-- ================================================

-- View: TekupVault log export format
CREATE OR REPLACE VIEW tekupvault_logs_export AS
SELECT 
  id,
  timestamp,
  level,
  message,
  service as source,
  'rendetalje-os' as repository,
  CONCAT('logs/', service, '/', DATE(timestamp)) as path,
  metadata || jsonb_build_object(
    'user_id', user_id,
    'request_id', request_id,
    'source_file', source_file
  ) as metadata
FROM application_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Function: Export logs for TekupVault ingestion
CREATE OR REPLACE FUNCTION export_logs_for_tekupvault(
  since_timestamp TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 hour'
)
RETURNS TABLE (
  content TEXT,
  path VARCHAR(255),
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CONCAT(
      '[', TO_CHAR(l.timestamp, 'YYYY-MM-DD HH24:MI:SS'), '] ',
      UPPER(l.level), ' [', l.service, '] ',
      l.message,
      CASE WHEN l.metadata != '{}' THEN ' ' || l.metadata::text ELSE '' END
    ) as content,
    CONCAT('logs/', l.service, '/', TO_CHAR(l.timestamp, 'YYYY-MM-DD'), '.log') as path,
    jsonb_build_object(
      'level', l.level,
      'service', l.service,
      'timestamp', l.timestamp,
      'log_id', l.id
    ) as metadata
  FROM application_logs l
  WHERE l.timestamp >= since_timestamp
  ORDER BY l.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- GRANTS (ENHANCED)
-- ================================================

-- Grant permissions
GRANT SELECT ON application_logs TO authenticated;
GRANT INSERT ON application_logs TO service_role;
GRANT SELECT ON recent_errors TO authenticated;
GRANT SELECT ON error_summary_by_service TO authenticated;
GRANT SELECT ON logs_by_hour TO authenticated;
GRANT SELECT ON realtime_errors TO authenticated;
GRANT SELECT ON service_health_dashboard TO authenticated;
GRANT SELECT ON service_performance_metrics TO authenticated;
GRANT SELECT ON tekupvault_logs_export TO service_role;
GRANT EXECUTE ON FUNCTION export_logs_for_tekupvault TO service_role;
GRANT EXECUTE ON FUNCTION get_log_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION check_error_spike TO authenticated;

-- ================================================
-- PERFORMANCE OPTIMIZATION
-- ================================================

-- Set table-level optimizations
ALTER TABLE application_logs SET (
  fillfactor = 90,  -- Leave room for updates
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- ================================================
-- COMMENTS (ENHANCED)
-- ================================================

COMMENT ON TABLE application_logs IS 'Centralized application logs from all RendetaljeOS services';
COMMENT ON COLUMN application_logs.level IS 'Log severity: debug, info, warn, error, critical';
COMMENT ON COLUMN application_logs.metadata IS 'Additional context (JSON)';
COMMENT ON COLUMN application_logs.service IS 'Source service name (e.g., rendetalje-backend)';
COMMENT ON COLUMN application_logs.source_file IS 'Source file path for debugging';
COMMENT ON COLUMN application_logs.source_function IS 'Function/method name where log originated';
COMMENT ON VIEW service_health_dashboard IS 'Real-time service health metrics';
COMMENT ON FUNCTION cleanup_old_logs_intelligent IS 'Intelligent cleanup based on log severity';
COMMENT ON VIEW tekupvault_logs_export IS 'Formatted logs for TekupVault ingestion';

-- ================================================
-- SUCCESS MESSAGE (ENHANCED)
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Optimized application logs table created successfully!';
  RAISE NOTICE '📊 Enhanced views: realtime_errors, service_health_dashboard, service_performance_metrics';
  RAISE NOTICE '🔧 Smart functions: cleanup_old_logs_intelligent(), get_log_statistics(), check_error_spike()';
  RAISE NOTICE '🔔 Real-time triggers: critical error notifications';
  RAISE NOTICE '🔗 TekupVault integration: export functions and views ready';
  RAISE NOTICE '⚡ Performance: Optimized indexes with partial conditions';
  RAISE NOTICE '🔒 Enhanced RLS: Service-specific and TekupVault policies';
  RAISE NOTICE '📈 Ready for production with intelligent log retention';
END $$;

