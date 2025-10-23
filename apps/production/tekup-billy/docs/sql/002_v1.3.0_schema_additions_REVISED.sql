-- =====================================================
-- Tekup-Billy MCP - v1.3.0 Schema Additions (REVISED)
-- =====================================================
-- Purpose: Add tables for polling sync, bank payments, bills, 
--          organization settings, bulk operations, and smart caching
-- Prefix: "billy_" to maintain consistency
-- Version: 1.3.0 (Revised after API validation)
-- Date: 2025-10-14
-- Dependencies: Requires 001_initial_schema.sql to be applied first
-- Changes: Removed webhook tables (not supported by Billy.dk API)
-- =====================================================

-- =====================================================
-- 1. POLLING SYNC SYSTEM
-- =====================================================

-- Sync status tracking (replaces webhook system)
CREATE TABLE billy_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL, -- 'invoice', 'customer', 'product', 'bank_payment', 'bill'
  last_sync_started_at TIMESTAMP,
  last_sync_completed_at TIMESTAMP,
  last_sync_error TEXT,
  sync_count INTEGER DEFAULT 0, -- Total successful syncs
  error_count INTEGER DEFAULT 0, -- Total failed syncs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, resource_type)
);

CREATE INDEX idx_sync_status_org ON billy_sync_status(organization_id);
CREATE INDEX idx_sync_status_type ON billy_sync_status(resource_type);
CREATE INDEX idx_sync_status_last_sync ON billy_sync_status(last_sync_completed_at DESC);

COMMENT ON TABLE billy_sync_status IS 'Tracks last sync time per resource type for polling mechanism';

-- Sync events log (for monitoring)
CREATE TABLE billy_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
  items_synced INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sync_events_org ON billy_sync_events(organization_id);
CREATE INDEX idx_sync_events_created ON billy_sync_events(created_at DESC);

COMMENT ON TABLE billy_sync_events IS 'Log of sync operations for monitoring and troubleshooting';

-- =====================================================
-- 2. NEW RESOURCE CACHING TABLES
-- =====================================================

-- Cached Bank Payments
CREATE TABLE billy_cached_bank_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  billy_id VARCHAR(50) NOT NULL UNIQUE,
  data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, billy_id)
);

CREATE INDEX idx_cached_bank_payments_org ON billy_cached_bank_payments(organization_id);
CREATE INDEX idx_cached_bank_payments_expires ON billy_cached_bank_payments(expires_at);
CREATE INDEX idx_cached_bank_payments_access ON billy_cached_bank_payments(access_count DESC);

COMMENT ON TABLE billy_cached_bank_payments IS 'Cached bank payments from Billy.dk /v2/bankPayments endpoint';

-- Cached Bills (Supplier invoices)
CREATE TABLE billy_cached_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  billy_id VARCHAR(50) NOT NULL UNIQUE,
  data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, billy_id)
);

CREATE INDEX idx_cached_bills_org ON billy_cached_bills(organization_id);
CREATE INDEX idx_cached_bills_expires ON billy_cached_bills(expires_at);
CREATE INDEX idx_cached_bills_access ON billy_cached_bills(access_count DESC);

COMMENT ON TABLE billy_cached_bills IS 'Cached supplier bills from Billy.dk /v2/bills endpoint';

-- Cached Organization Settings
CREATE TABLE billy_cached_organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  
  UNIQUE(organization_id)
);

CREATE INDEX idx_cached_org_settings_org ON billy_cached_organization_settings(organization_id);
CREATE INDEX idx_cached_org_settings_expires ON billy_cached_organization_settings(expires_at);

COMMENT ON TABLE billy_cached_organization_settings IS 'Cached org settings from Billy.dk /v2/organizations endpoint';

-- =====================================================
-- 3. BULK OPERATIONS TABLES
-- =====================================================

-- Bulk job tracking (CSV imports, exports)
CREATE TABLE billy_bulk_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(100) UNIQUE NOT NULL, -- Human-readable job ID
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL, -- 'customer', 'product', 'invoice'
  operation VARCHAR(20) NOT NULL, -- 'import_csv', 'export_csv'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  progress DECIMAL(5,2) DEFAULT 0, -- 0-100%
  total_items INTEGER NOT NULL,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]', -- Array of error objects
  options JSONB DEFAULT '{}', -- Job configuration (continueOnError, etc.)
  result_url TEXT, -- URL to download export file (for exports)
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bulk_jobs_org ON billy_bulk_jobs(organization_id);
CREATE INDEX idx_bulk_jobs_status ON billy_bulk_jobs(status);
CREATE INDEX idx_bulk_jobs_created ON billy_bulk_jobs(created_at DESC);

COMMENT ON TABLE billy_bulk_jobs IS 'Tracks CSV import/export jobs';

-- Bulk job item-level tracking
CREATE TABLE billy_bulk_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES billy_bulk_jobs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  billy_id VARCHAR(50), -- Billy.dk ID (for successful items)
  data JSONB NOT NULL, -- Original row data
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX idx_bulk_job_items_job ON billy_bulk_job_items(job_id);
CREATE INDEX idx_bulk_job_items_status ON billy_bulk_job_items(status);

COMMENT ON TABLE billy_bulk_job_items IS 'Item-level tracking for bulk operations';

-- =====================================================
-- 4. SMART CACHING TABLES
-- =====================================================

-- Cache access log (for rule-based optimization)
CREATE TABLE billy_cache_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL,
  resource_id VARCHAR(50) NOT NULL,
  accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cache_access_org ON billy_cache_access_log(organization_id);
CREATE INDEX idx_cache_access_type ON billy_cache_access_log(resource_type);
CREATE INDEX idx_cache_access_time ON billy_cache_access_log(accessed_at DESC);

COMMENT ON TABLE billy_cache_access_log IS 'Log of cache access patterns for optimization';

-- Cache performance predictions (rule-based)
CREATE TABLE billy_cache_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL,
  resource_id VARCHAR(50) NOT NULL,
  predicted_ttl_minutes INTEGER NOT NULL, -- Calculated optimal TTL
  access_frequency DECIMAL(5,2), -- Accesses per hour
  last_updated TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(organization_id, resource_type, resource_id)
);

CREATE INDEX idx_cache_predictions_org ON billy_cache_predictions(organization_id);
CREATE INDEX idx_cache_predictions_type ON billy_cache_predictions(resource_type);

COMMENT ON TABLE billy_cache_predictions IS 'Rule-based TTL predictions for frequently accessed resources';

-- =====================================================
-- 5. UPDATE EXISTING CACHE TABLES
-- =====================================================

-- Add smart caching columns to existing cache tables
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

-- Add indexes for smart caching queries
CREATE INDEX IF NOT EXISTS idx_cached_invoices_access ON billy_cached_invoices(access_count DESC);
CREATE INDEX IF NOT EXISTS idx_cached_customers_access ON billy_cached_customers(access_count DESC);
CREATE INDEX IF NOT EXISTS idx_cached_products_access ON billy_cached_products(access_count DESC);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to cleanup old sync events (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_billy_sync_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM billy_sync_events WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_billy_sync_events IS 'Delete sync events older than 30 days';

-- Function to cleanup cache access log (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_billy_cache_access_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM billy_cache_access_log WHERE accessed_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_billy_cache_access_logs IS 'Delete cache access logs older than 7 days';

-- Function to increment cache access count
CREATE OR REPLACE FUNCTION increment_cache_access_count(
  table_name TEXT,
  resource_id TEXT
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE %I SET access_count = access_count + 1, last_accessed_at = NOW() WHERE billy_id = $1', table_name)
  USING resource_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_cache_access_count IS 'Increment access count for cached resource';

-- Function to update sync status
CREATE OR REPLACE FUNCTION update_sync_status(
  org_id UUID,
  res_type VARCHAR(20),
  success BOOLEAN,
  error_msg TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO billy_sync_status (organization_id, resource_type, last_sync_started_at, last_sync_completed_at, last_sync_error, sync_count, error_count)
  VALUES (
    org_id, 
    res_type, 
    NOW(), 
    CASE WHEN success THEN NOW() ELSE NULL END,
    error_msg,
    CASE WHEN success THEN 1 ELSE 0 END,
    CASE WHEN NOT success THEN 1 ELSE 0 END
  )
  ON CONFLICT (organization_id, resource_type) DO UPDATE SET
    last_sync_started_at = NOW(),
    last_sync_completed_at = CASE WHEN success THEN NOW() ELSE billy_sync_status.last_sync_completed_at END,
    last_sync_error = error_msg,
    sync_count = CASE WHEN success THEN billy_sync_status.sync_count + 1 ELSE billy_sync_status.sync_count END,
    error_count = CASE WHEN NOT success THEN billy_sync_status.error_count + 1 ELSE billy_sync_status.error_count END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_sync_status IS 'Update sync status after sync operation';

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE billy_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_cached_bank_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_cached_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_cached_organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_bulk_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_bulk_job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_cache_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_cache_predictions ENABLE ROW LEVEL SECURITY;

-- Organization isolation policies
CREATE POLICY org_isolation_sync_status ON billy_sync_status
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM billy_users WHERE id = auth.uid())
  );

CREATE POLICY org_isolation_bank_payments ON billy_cached_bank_payments
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM billy_users WHERE id = auth.uid())
  );

CREATE POLICY org_isolation_bills ON billy_cached_bills
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM billy_users WHERE id = auth.uid())
  );

CREATE POLICY org_isolation_org_settings ON billy_cached_organization_settings
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM billy_users WHERE id = auth.uid())
  );

CREATE POLICY org_isolation_bulk_jobs ON billy_bulk_jobs
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM billy_users WHERE id = auth.uid())
  );

-- Read-only policies for logs
CREATE POLICY sync_events_read ON billy_sync_events
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM billy_users WHERE id = auth.uid())
  );

CREATE POLICY cache_access_read ON billy_cache_access_log
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM billy_users WHERE id = auth.uid())
  );

-- =====================================================
-- 8. MONITORING VIEWS
-- =====================================================

-- Sync health monitoring view
CREATE OR REPLACE VIEW billy_sync_health AS
SELECT 
  s.organization_id,
  s.resource_type,
  s.last_sync_completed_at,
  EXTRACT(EPOCH FROM (NOW() - s.last_sync_completed_at)) / 60 AS minutes_since_last_sync,
  s.sync_count,
  s.error_count,
  CASE 
    WHEN s.last_sync_completed_at IS NULL THEN 'never_synced'
    WHEN s.last_sync_completed_at < NOW() - INTERVAL '1 hour' THEN 'stale'
    WHEN s.error_count > s.sync_count * 0.1 THEN 'high_error_rate'
    ELSE 'healthy'
  END AS health_status
FROM billy_sync_status s;

COMMENT ON VIEW billy_sync_health IS 'Monitor sync health per resource type';

-- Bulk job summary view
CREATE OR REPLACE VIEW billy_bulk_job_summary AS
SELECT 
  j.id,
  j.job_id,
  j.organization_id,
  j.resource_type,
  j.operation,
  j.status,
  j.progress,
  j.total_items,
  j.successful_items,
  j.failed_items,
  EXTRACT(EPOCH FROM (j.completed_at - j.started_at)) AS duration_seconds,
  j.created_at
FROM billy_bulk_jobs j
ORDER BY j.created_at DESC;

COMMENT ON VIEW billy_bulk_job_summary IS 'Summary of all bulk jobs with calculated durations';

-- Cache performance view
CREATE OR REPLACE VIEW billy_cache_performance AS
SELECT 
  'invoices' AS resource_type,
  COUNT(*) AS total_cached,
  SUM(access_count) AS total_accesses,
  AVG(access_count) AS avg_accesses,
  COUNT(*) FILTER (WHERE access_count > 10) AS hot_resources,
  COUNT(*) FILTER (WHERE access_count = 0) AS cold_resources
FROM billy_cached_invoices
UNION ALL
SELECT 
  'customers' AS resource_type,
  COUNT(*) AS total_cached,
  SUM(access_count) AS total_accesses,
  AVG(access_count) AS avg_accesses,
  COUNT(*) FILTER (WHERE access_count > 10) AS hot_resources,
  COUNT(*) FILTER (WHERE access_count = 0) AS cold_resources
FROM billy_cached_customers
UNION ALL
SELECT 
  'products' AS resource_type,
  COUNT(*) AS total_cached,
  SUM(access_count) AS total_accesses,
  AVG(access_count) AS avg_accesses,
  COUNT(*) FILTER (WHERE access_count > 10) AS hot_resources,
  COUNT(*) FILTER (WHERE access_count = 0) AS cold_resources
FROM billy_cached_products;

COMMENT ON VIEW billy_cache_performance IS 'Performance metrics for cache optimization';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify new tables were created
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'billy_%'
ORDER BY table_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: Tekup-Billy v1.3.0 schema migration complete!';
  RAISE NOTICE 'Added 9 new tables:';
  RAISE NOTICE '  - billy_sync_status (polling sync tracking)';
  RAISE NOTICE '  - billy_sync_events (sync event log)';
  RAISE NOTICE '  - billy_cached_bank_payments (bank payments cache)';
  RAISE NOTICE '  - billy_cached_bills (supplier bills cache)';
  RAISE NOTICE '  - billy_cached_organization_settings (org settings cache)';
  RAISE NOTICE '  - billy_bulk_jobs (CSV import/export jobs)';
  RAISE NOTICE '  - billy_bulk_job_items (bulk job item tracking)';
  RAISE NOTICE '  - billy_cache_access_log (access pattern tracking)';
  RAISE NOTICE '  - billy_cache_predictions (TTL optimization)';
  RAISE NOTICE '';
  RAISE NOTICE 'Updated 3 existing cache tables with smart caching columns';
  RAISE NOTICE 'Total tables: 17 (8 original + 9 new)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Verify tables: SELECT * FROM billy_sync_health;';
  RAISE NOTICE '  2. Test sync mechanism with sync_billy_data tool';
  RAISE NOTICE '  3. Implement polling sync (Week 1 Day 1)';
END $$;
