-- =====================================================
-- Tekup-Billy MCP - v1.3.0 Schema Additions
-- =====================================================
-- Purpose: Add tables for webhooks, bulk operations, and smart caching
-- Prefix: "billy_" to maintain consistency
-- Version: 1.3.0
-- Date: 2025-10-14
-- Dependencies: Requires 001_initial_schema.sql to be applied first
-- =====================================================

-- =====================================================
-- 1. WEBHOOK SYSTEM TABLES
-- =====================================================

-- Webhook event log (all incoming webhook events)
CREATE TABLE billy_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL, -- e.g., 'invoice.created', 'customer.updated'
  resource_type VARCHAR(20) NOT NULL, -- 'invoice', 'customer', 'product', 'contact'
  resource_id VARCHAR(50) NOT NULL, -- Billy.dk resource ID
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  payload JSONB NOT NULL, -- Full webhook payload
  signature VARCHAR(255), -- Webhook signature for verification
  status VARCHAR(20) DEFAULT 'received', -- 'received', 'processing', 'completed', 'failed'
  error_message TEXT,
  received_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_org ON billy_webhook_events(organization_id);
CREATE INDEX idx_webhook_events_status ON billy_webhook_events(status);
CREATE INDEX idx_webhook_events_type ON billy_webhook_events(event_type);
CREATE INDEX idx_webhook_events_resource ON billy_webhook_events(resource_type, resource_id);
CREATE INDEX idx_webhook_events_created ON billy_webhook_events(created_at DESC);

COMMENT ON TABLE billy_webhook_events IS 'Log of all webhook events received from Billy.dk';
COMMENT ON COLUMN billy_webhook_events.status IS 'received=new, processing=in queue, completed=success, failed=error';

-- Live events feed for real-time dashboard
CREATE TABLE billy_live_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(20) NOT NULL,
  resource_id VARCHAR(50) NOT NULL,
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_live_events_org ON billy_live_events(organization_id);
CREATE INDEX idx_live_events_type ON billy_live_events(event_type);
CREATE INDEX idx_live_events_created ON billy_live_events(created_at DESC);

COMMENT ON TABLE billy_live_events IS 'Real-time event feed for dashboard subscriptions (auto-deleted after 24h)';

-- Webhook metrics aggregation (hourly stats)
CREATE TABLE billy_webhook_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hour_bucket TIMESTAMP NOT NULL, -- Truncated to hour
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  total_events INTEGER DEFAULT 0,
  successful_events INTEGER DEFAULT 0,
  failed_events INTEGER DEFAULT 0,
  avg_processing_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(hour_bucket, organization_id, event_type)
);

CREATE INDEX idx_webhook_metrics_hour ON billy_webhook_metrics(hour_bucket DESC);
CREATE INDEX idx_webhook_metrics_org ON billy_webhook_metrics(organization_id);

COMMENT ON TABLE billy_webhook_metrics IS 'Hourly aggregated webhook statistics for monitoring';

-- =====================================================
-- 2. BULK OPERATIONS TABLES
-- =====================================================

-- Bulk job tracking (imports, exports, updates)
CREATE TABLE billy_bulk_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(100) UNIQUE NOT NULL, -- Human-readable job ID
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL, -- 'customer', 'product', 'invoice'
  operation VARCHAR(20) NOT NULL, -- 'import', 'export', 'update', 'delete'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  progress DECIMAL(5,2) DEFAULT 0, -- 0-100%
  total_items INTEGER NOT NULL,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]', -- Array of error objects
  options JSONB DEFAULT '{}', -- Job configuration (batchSize, continueOnError, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bulk_jobs_org ON billy_bulk_jobs(organization_id);
CREATE INDEX idx_bulk_jobs_status ON billy_bulk_jobs(status);
CREATE INDEX idx_bulk_jobs_created ON billy_bulk_jobs(created_at DESC);
CREATE INDEX idx_bulk_jobs_job_id ON billy_bulk_jobs(job_id);

COMMENT ON TABLE billy_bulk_jobs IS 'Tracking for bulk import/export/update jobs';
COMMENT ON COLUMN billy_bulk_jobs.progress IS 'Percentage completion (0-100)';

-- Bulk job item tracking (detailed progress per item)
CREATE TABLE billy_bulk_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(100) NOT NULL,
  item_index INTEGER NOT NULL, -- Position in batch (0-based)
  item_data JSONB NOT NULL, -- Original item data
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  result JSONB, -- Success result or error details
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(job_id, item_index),
  FOREIGN KEY (job_id) REFERENCES billy_bulk_jobs(job_id) ON DELETE CASCADE
);

CREATE INDEX idx_bulk_job_items_job ON billy_bulk_job_items(job_id);
CREATE INDEX idx_bulk_job_items_status ON billy_bulk_job_items(status);

COMMENT ON TABLE billy_bulk_job_items IS 'Item-level tracking for bulk job progress';

-- =====================================================
-- 3. SMART CACHING TABLES
-- =====================================================

-- Cache access logging for pattern analysis
CREATE TABLE billy_cache_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  accessed_at TIMESTAMP DEFAULT NOW(),
  cache_hit BOOLEAN DEFAULT TRUE, -- TRUE if served from cache
  response_time_ms INTEGER
);

CREATE INDEX idx_cache_access_org ON billy_cache_access_log(organization_id);
CREATE INDEX idx_cache_access_resource ON billy_cache_access_log(resource_type, resource_id);
CREATE INDEX idx_cache_access_time ON billy_cache_access_log(accessed_at DESC);

COMMENT ON TABLE billy_cache_access_log IS 'Access log for ML-based cache optimization (retention: 7 days)';

-- Cache predictions (for proactive warming)
CREATE TABLE billy_cache_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  pattern_type VARCHAR(20), -- 'hourly', 'daily', 'weekly', 'irregular'
  predicted_next_access TIMESTAMP,
  confidence DECIMAL(3,2), -- 0.0 - 1.0
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, resource_type, resource_id)
);

CREATE INDEX idx_cache_predictions_next_access ON billy_cache_predictions(predicted_next_access);
CREATE INDEX idx_cache_predictions_confidence ON billy_cache_predictions(confidence DESC);
CREATE INDEX idx_cache_predictions_org ON billy_cache_predictions(organization_id);

COMMENT ON TABLE billy_cache_predictions IS 'ML predictions for proactive cache warming';

-- =====================================================
-- 4. UPDATE EXISTING CACHE TABLES (Dynamic TTL)
-- =====================================================

-- Add dynamic TTL columns to existing cache tables
ALTER TABLE billy_cached_invoices 
  ADD COLUMN IF NOT EXISTS ttl_minutes INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP DEFAULT NOW();

ALTER TABLE billy_cached_customers 
  ADD COLUMN IF NOT EXISTS ttl_minutes INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP DEFAULT NOW();

ALTER TABLE billy_cached_products 
  ADD COLUMN IF NOT EXISTS ttl_minutes INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP DEFAULT NOW();

COMMENT ON COLUMN billy_cached_invoices.ttl_minutes IS 'Dynamic TTL calculated based on access patterns';
COMMENT ON COLUMN billy_cached_invoices.access_count IS 'Number of times this cached item was accessed';

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE billy_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_live_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_webhook_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_bulk_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_bulk_job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_cache_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_cache_predictions ENABLE ROW LEVEL SECURITY;

-- Organization isolation policies
CREATE POLICY webhook_events_org_isolation ON billy_webhook_events
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM billy_users WHERE id = auth.uid()
    )
  );

CREATE POLICY live_events_org_isolation ON billy_live_events
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM billy_users WHERE id = auth.uid()
    )
  );

CREATE POLICY webhook_metrics_read ON billy_webhook_metrics
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM billy_users WHERE id = auth.uid()
    )
  );

CREATE POLICY bulk_jobs_org_isolation ON billy_bulk_jobs
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM billy_users WHERE id = auth.uid()
    )
  );

CREATE POLICY cache_access_read ON billy_cache_access_log
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM billy_users WHERE id = auth.uid()
    )
  );

CREATE POLICY cache_predictions_read ON billy_cache_predictions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM billy_users WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY webhook_events_org_isolation ON billy_webhook_events IS 'Users can only access webhook events for their organization';
COMMENT ON POLICY bulk_jobs_org_isolation ON billy_bulk_jobs IS 'Users can only access bulk jobs for their organization';

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to clean up old live events (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_billy_live_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM billy_live_events 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_billy_live_events IS 'Clean up live events older than 24 hours';

-- Function to clean up old cache access logs (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_billy_cache_access_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM billy_cache_access_log 
  WHERE accessed_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_billy_cache_access_logs IS 'Clean up cache access logs older than 7 days';

-- Function to increment cache access count
CREATE OR REPLACE FUNCTION increment_cache_access_count(
  p_organization_id UUID,
  p_resource_type VARCHAR(20),
  p_billy_id TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update the appropriate cache table based on resource type
  CASE p_resource_type
    WHEN 'invoice' THEN
      UPDATE billy_cached_invoices 
      SET access_count = access_count + 1,
          last_accessed_at = NOW()
      WHERE organization_id = p_organization_id AND billy_id = p_billy_id;
      
    WHEN 'customer' THEN
      UPDATE billy_cached_customers 
      SET access_count = access_count + 1,
          last_accessed_at = NOW()
      WHERE organization_id = p_organization_id AND billy_id = p_billy_id;
      
    WHEN 'product' THEN
      UPDATE billy_cached_products 
      SET access_count = access_count + 1,
          last_accessed_at = NOW()
      WHERE organization_id = p_organization_id AND billy_id = p_billy_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_cache_access_count IS 'Atomically increment access count for cached resource';

-- =====================================================
-- 7. VIEWS FOR MONITORING
-- =====================================================

-- View for webhook system health
CREATE OR REPLACE VIEW billy_webhook_health AS
SELECT 
  organization_id,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_events,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_events,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_events,
  AVG(EXTRACT(EPOCH FROM (processed_at - received_at)) * 1000)::INTEGER as avg_processing_time_ms,
  MAX(received_at) as last_event_at
FROM billy_webhook_events
WHERE received_at > NOW() - INTERVAL '24 hours'
GROUP BY organization_id;

COMMENT ON VIEW billy_webhook_health IS 'Webhook system health metrics for last 24 hours';

-- View for bulk job summary
CREATE OR REPLACE VIEW billy_bulk_job_summary AS
SELECT 
  organization_id,
  resource_type,
  operation,
  status,
  COUNT(*) as job_count,
  SUM(total_items) as total_items,
  SUM(successful_items) as successful_items,
  SUM(failed_items) as failed_items,
  AVG(progress) as avg_progress
FROM billy_bulk_jobs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY organization_id, resource_type, operation, status;

COMMENT ON VIEW billy_bulk_job_summary IS 'Bulk job statistics for last 7 days';

-- View for cache performance
CREATE OR REPLACE VIEW billy_cache_performance AS
SELECT 
  organization_id,
  resource_type,
  COUNT(*) as total_accesses,
  COUNT(*) FILTER (WHERE cache_hit = TRUE) as cache_hits,
  (COUNT(*) FILTER (WHERE cache_hit = TRUE)::DECIMAL / COUNT(*) * 100)::DECIMAL(5,2) as hit_rate,
  AVG(response_time_ms)::INTEGER as avg_response_time_ms
FROM billy_cache_access_log
WHERE accessed_at > NOW() - INTERVAL '24 hours'
GROUP BY organization_id, resource_type;

COMMENT ON VIEW billy_cache_performance IS 'Cache hit rates and performance for last 24 hours';

-- =====================================================
-- 8. SCHEDULED CLEANUP (Optional - for cron extension)
-- =====================================================

-- If using pg_cron extension, you can schedule automatic cleanup:
/*
-- Cleanup live events daily at 2 AM
SELECT cron.schedule('cleanup-live-events', '0 2 * * *', 'SELECT cleanup_billy_live_events()');

-- Cleanup cache access logs daily at 3 AM
SELECT cron.schedule('cleanup-cache-logs', '0 3 * * *', 'SELECT cleanup_billy_cache_access_logs()');

-- Cleanup expired cache entries every hour
SELECT cron.schedule('cleanup-expired-cache', '0 * * * *', 'SELECT cleanup_billy_expired_cache()');
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify new tables were created
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'billy_%'
ORDER BY tablename;

-- Count total tables
SELECT COUNT(*) as total_billy_tables
FROM pg_tables
WHERE tablename LIKE 'billy_%';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: v1.3.0 schema additions applied successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'New tables created:';
  RAISE NOTICE '  • billy_webhook_events (webhook event log)';
  RAISE NOTICE '  • billy_live_events (real-time feed)';
  RAISE NOTICE '  • billy_webhook_metrics (webhook stats)';
  RAISE NOTICE '  • billy_bulk_jobs (bulk operation tracking)';
  RAISE NOTICE '  • billy_bulk_job_items (item-level progress)';
  RAISE NOTICE '  • billy_cache_access_log (ML data collection)';
  RAISE NOTICE '  • billy_cache_predictions (cache warming)';
  RAISE NOTICE '';
  RAISE NOTICE 'Existing tables updated:';
  RAISE NOTICE '  • billy_cached_invoices (added ttl_minutes, access_count)';
  RAISE NOTICE '  • billy_cached_customers (added ttl_minutes, access_count)';
  RAISE NOTICE '  • billy_cached_products (added ttl_minutes, access_count)';
  RAISE NOTICE '';
  RAISE NOTICE 'Total tables: Should be 15 (8 from v1.2.0 + 7 new)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Verify table count: SELECT COUNT(*) FROM pg_tables WHERE tablename LIKE ''billy_%'';';
  RAISE NOTICE '  2. Check new views: SELECT * FROM billy_webhook_health;';
  RAISE NOTICE '  3. Test RLS policies with regular user account';
  RAISE NOTICE '  4. Configure cleanup schedules if using pg_cron';
END $$;
