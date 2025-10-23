-- =====================================================
-- Tekup-Billy MCP - Initial Database Schema
-- =====================================================
-- Purpose: Create tables for Billy.dk API caching, multi-tenant support, 
--          audit logging, and analytics
-- Prefix: "billy_" to avoid conflicts with RenOS tables
-- Version: 1.0.0
-- Date: 2025-10-11
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MULTI-TENANT: Organizations & Users
-- =====================================================

-- Billy.dk Organizations (separate from RenOS organizations)
CREATE TABLE billy_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  billy_api_key TEXT NOT NULL, -- Encrypted Billy.dk API key
  billy_organization_id TEXT NOT NULL UNIQUE, -- Billy.dk org ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}', -- Org-specific settings
  is_active BOOLEAN DEFAULT TRUE,
  api_key_rotated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_billy_orgs_active ON billy_organizations(is_active);
CREATE INDEX idx_billy_orgs_created ON billy_organizations(created_at DESC);

COMMENT ON TABLE billy_organizations IS 'Billy.dk organizations for multi-tenant MCP access';
COMMENT ON COLUMN billy_organizations.billy_api_key IS 'Encrypted using AES-256-GCM';

-- Billy.dk Users (can be linked to RenOS users if needed)
CREATE TABLE billy_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'user', 'readonly')) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_billy_users_org ON billy_users(organization_id);
CREATE INDEX idx_billy_users_email ON billy_users(email);
CREATE INDEX idx_billy_users_active ON billy_users(is_active);

COMMENT ON TABLE billy_users IS 'Users with access to Billy.dk MCP tools per organization';

-- =====================================================
-- 2. DATA CACHING: Cached Billy.dk Resources
-- =====================================================

-- Cached Invoices
CREATE TABLE billy_cached_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  billy_id TEXT NOT NULL, -- Original Billy.dk invoice ID
  data JSONB NOT NULL, -- Full invoice object from Billy.dk API
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(organization_id, billy_id)
);

CREATE INDEX idx_cached_invoices_org ON billy_cached_invoices(organization_id);
CREATE INDEX idx_cached_invoices_expires ON billy_cached_invoices(expires_at);
CREATE INDEX idx_cached_invoices_billy_id ON billy_cached_invoices(billy_id);

COMMENT ON TABLE billy_cached_invoices IS 'Cached invoices from Billy.dk API with TTL';

-- Cached Customers
CREATE TABLE billy_cached_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  billy_id TEXT NOT NULL, -- Original Billy.dk customer ID
  data JSONB NOT NULL, -- Full customer object
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(organization_id, billy_id)
);

CREATE INDEX idx_cached_customers_org ON billy_cached_customers(organization_id);
CREATE INDEX idx_cached_customers_expires ON billy_cached_customers(expires_at);
CREATE INDEX idx_cached_customers_billy_id ON billy_cached_customers(billy_id);

COMMENT ON TABLE billy_cached_customers IS 'Cached customers from Billy.dk API with TTL';

-- Cached Products
CREATE TABLE billy_cached_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  billy_id TEXT NOT NULL, -- Original Billy.dk product ID
  data JSONB NOT NULL, -- Full product object
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(organization_id, billy_id)
);

CREATE INDEX idx_cached_products_org ON billy_cached_products(organization_id);
CREATE INDEX idx_cached_products_expires ON billy_cached_products(expires_at);
CREATE INDEX idx_cached_products_billy_id ON billy_cached_products(billy_id);

COMMENT ON TABLE billy_cached_products IS 'Cached products from Billy.dk API with TTL';

-- =====================================================
-- 3. AUDIT LOGGING: Track all operations
-- =====================================================

CREATE TABLE billy_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES billy_organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES billy_users(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL, -- MCP tool name (e.g., 'list_invoices')
  action TEXT NOT NULL, -- 'read', 'create', 'update', 'delete'
  resource_type TEXT, -- 'invoice', 'customer', 'product', etc.
  resource_id TEXT, -- Billy.dk resource ID
  input_params JSONB, -- Tool input parameters
  output_data JSONB, -- Tool output (summary, not full data)
  success BOOLEAN NOT NULL,
  error_message TEXT,
  duration_ms INTEGER, -- Execution time in milliseconds
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON billy_audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON billy_audit_logs(user_id);
CREATE INDEX idx_audit_logs_date ON billy_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_tool ON billy_audit_logs(tool_name);
CREATE INDEX idx_audit_logs_resource ON billy_audit_logs(resource_type, resource_id);

COMMENT ON TABLE billy_audit_logs IS 'Audit trail for all Billy.dk MCP tool invocations';

-- =====================================================
-- 4. ANALYTICS: Usage metrics and performance tracking
-- =====================================================

CREATE TABLE billy_usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES billy_organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour < 24),
  tool_name TEXT NOT NULL,
  call_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_duration_ms INTEGER,
  cache_hit_rate DECIMAL(5,2), -- Percentage (0-100)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, date, hour, tool_name)
);

CREATE INDEX idx_usage_metrics_org ON billy_usage_metrics(organization_id);
CREATE INDEX idx_usage_metrics_date ON billy_usage_metrics(date DESC);
CREATE INDEX idx_usage_metrics_tool ON billy_usage_metrics(tool_name);

COMMENT ON TABLE billy_usage_metrics IS 'Hourly aggregated metrics for analytics dashboard';

-- =====================================================
-- 5. RATE LIMITING: Distributed rate limiting
-- =====================================================

CREATE TABLE billy_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES billy_organizations(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL, -- MCP tool name or API endpoint
  window_start TIMESTAMP NOT NULL, -- Rate limit window start
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, endpoint, window_start)
);

CREATE INDEX idx_rate_limits_org ON billy_rate_limits(organization_id);
CREATE INDEX idx_rate_limits_window ON billy_rate_limits(window_start);
CREATE INDEX idx_rate_limits_endpoint ON billy_rate_limits(endpoint);

COMMENT ON TABLE billy_rate_limits IS 'Rate limiting counters per organization and endpoint';

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to increment rate limit counter (upsert pattern)
CREATE OR REPLACE FUNCTION increment_billy_rate_limit(
  org_id UUID,
  endpoint_path TEXT,
  window_start_time TIMESTAMP
)
RETURNS TABLE(count INTEGER) AS $$
  INSERT INTO billy_rate_limits (organization_id, endpoint, window_start, request_count)
  VALUES (org_id, endpoint_path, window_start_time, 1)
  ON CONFLICT (organization_id, endpoint, window_start)
  DO UPDATE SET request_count = billy_rate_limits.request_count + 1
  RETURNING billy_rate_limits.request_count;
$$ LANGUAGE SQL;

COMMENT ON FUNCTION increment_billy_rate_limit IS 'Atomically increment rate limit counter for org+endpoint+window';

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_billy_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  affected INTEGER;
BEGIN
  -- Delete expired invoices
  DELETE FROM billy_cached_invoices WHERE expires_at < NOW();
  GET DIAGNOSTICS affected = ROW_COUNT;
  deleted_count := deleted_count + affected;
  
  -- Delete expired customers
  DELETE FROM billy_cached_customers WHERE expires_at < NOW();
  GET DIAGNOSTICS affected = ROW_COUNT;
  deleted_count := deleted_count + affected;
  
  -- Delete expired products
  DELETE FROM billy_cached_products WHERE expires_at < NOW();
  GET DIAGNOSTICS affected = ROW_COUNT;
  deleted_count := deleted_count + affected;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_billy_expired_cache IS 'Clean up expired cache entries across all cache tables';

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE billy_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_cached_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_cached_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_cached_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE billy_rate_limits ENABLE ROW LEVEL SECURITY;

-- Organization isolation policy for cached data
-- Note: This assumes Supabase Auth is configured. Adjust auth.uid() logic as needed.
CREATE POLICY org_isolation_invoices ON billy_cached_invoices
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM billy_users WHERE id = auth.uid()
    )
  );

CREATE POLICY org_isolation_customers ON billy_cached_customers
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM billy_users WHERE id = auth.uid()
    )
  );

CREATE POLICY org_isolation_products ON billy_cached_products
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM billy_users WHERE id = auth.uid()
    )
  );

-- Audit logs: Read-only for users, full access for service role
CREATE POLICY audit_logs_read ON billy_audit_logs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM billy_users WHERE id = auth.uid()
    )
  );

-- Usage metrics: Read-only for users
CREATE POLICY usage_metrics_read ON billy_usage_metrics
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM billy_users WHERE id = auth.uid()
    )
  );

-- Service role bypass (for backend MCP server)
-- The service_role key bypasses RLS automatically, so no additional policies needed

COMMENT ON POLICY org_isolation_invoices ON billy_cached_invoices IS 'Users can only access their own org cached invoices';
COMMENT ON POLICY audit_logs_read ON billy_audit_logs IS 'Users can read audit logs for their organization';

-- =====================================================
-- 8. INITIAL SEED DATA (Optional - for testing)
-- =====================================================

-- Uncomment to create a test organization for development:
/*
INSERT INTO billy_organizations (name, billy_api_key, billy_organization_id, settings)
VALUES (
  'Test Organization',
  'ENCRYPTED_KEY_PLACEHOLDER', -- Replace with actual encrypted key
  'test-billy-org-id',
  '{"cache_ttl_minutes": 5, "enable_audit_logging": true}'
);
*/

-- =====================================================
-- 9. MAINTENANCE & MONITORING
-- =====================================================

-- View to check cache statistics
CREATE OR REPLACE VIEW billy_cache_stats AS
SELECT 
  'invoices' AS resource_type,
  COUNT(*) AS total_cached,
  COUNT(*) FILTER (WHERE expires_at > NOW()) AS active_cached,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) AS expired_cached,
  MAX(cached_at) AS last_cached_at
FROM billy_cached_invoices
UNION ALL
SELECT 
  'customers' AS resource_type,
  COUNT(*) AS total_cached,
  COUNT(*) FILTER (WHERE expires_at > NOW()) AS active_cached,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) AS expired_cached,
  MAX(cached_at) AS last_cached_at
FROM billy_cached_customers
UNION ALL
SELECT 
  'products' AS resource_type,
  COUNT(*) AS total_cached,
  COUNT(*) FILTER (WHERE expires_at > NOW()) AS active_cached,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) AS expired_cached,
  MAX(cached_at) AS last_cached_at
FROM billy_cached_products;

COMMENT ON VIEW billy_cache_stats IS 'Real-time cache statistics for monitoring';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables were created
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'billy_%'
ORDER BY tablename;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: Tekup-Billy MCP schema created successfully!';
  RAISE NOTICE 'Created 8 tables with billy_ prefix';
  RAISE NOTICE 'RLS policies enabled for multi-tenant isolation';
  RAISE NOTICE 'Helper functions created for cache cleanup and rate limiting';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Verify tables: SELECT * FROM billy_cache_stats;';
  RAISE NOTICE '  2. Create your first organization in billy_organizations';
  RAISE NOTICE '  3. Configure encryption keys in .env file';
  RAISE NOTICE '  4. Implement TypeScript code (supabase-client.ts, cache-manager.ts)';
END $$;
