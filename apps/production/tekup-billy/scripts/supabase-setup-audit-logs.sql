-- Supabase Audit Logging Setup for Tekup-Billy MCP
-- Run this in Supabase SQL Editor: https://oaevagdgrasfppbrxbey.supabase.co

-- =====================================================
-- CREATE AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS billy_audit_logs (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Tool identification
    tool_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('read', 'create', 'update', 'delete')),
    
    -- Context
    organization_id TEXT,
    user_id TEXT,
    
    -- Execution details
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    execution_time_ms INTEGER,
    
    -- Data (JSONB for flexible storage)
    params JSONB,
    result JSONB,
    error TEXT,
    
    -- Request metadata
    ip_address TEXT,
    user_agent TEXT
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for time-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON billy_audit_logs(created_at DESC);

-- Index for tool name queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_tool_name 
ON billy_audit_logs(tool_name);

-- Index for organization queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org 
ON billy_audit_logs(organization_id);

-- Index for status queries (find errors)
CREATE INDEX IF NOT EXISTS idx_audit_logs_status 
ON billy_audit_logs(status) 
WHERE status = 'error';

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created 
ON billy_audit_logs(organization_id, created_at DESC);

-- =====================================================
-- CREATE ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE billy_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert/select (for the MCP server)
CREATE POLICY "Service role can manage audit logs"
ON billy_audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read their own org's logs
CREATE POLICY "Users can read own organization logs"
ON billy_audit_logs
FOR SELECT
TO authenticated
USING (organization_id = current_setting('app.current_org_id', true));

-- =====================================================
-- CREATE VIEW FOR ANALYTICS
-- =====================================================

CREATE OR REPLACE VIEW audit_logs_summary AS
SELECT 
    tool_name,
    action,
    DATE(created_at) as date,
    COUNT(*) as total_calls,
    COUNT(*) FILTER (WHERE status = 'success') as success_count,
    COUNT(*) FILTER (WHERE status = 'error') as error_count,
    ROUND(AVG(execution_time_ms)::numeric, 2) as avg_execution_ms,
    MIN(execution_time_ms) as min_execution_ms,
    MAX(execution_time_ms) as max_execution_ms
FROM billy_audit_logs
GROUP BY tool_name, action, DATE(created_at)
ORDER BY date DESC, total_calls DESC;

-- Grant access to the view
GRANT SELECT ON audit_logs_summary TO service_role, authenticated;

-- =====================================================
-- VERIFY SETUP
-- =====================================================

-- Check table exists
SELECT 
    tablename, 
    schemaname 
FROM pg_tables 
WHERE tablename = 'billy_audit_logs';

-- Check indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'billy_audit_logs';

-- Check RLS policies
SELECT 
    policyname, 
    permissive, 
    roles 
FROM pg_policies 
WHERE tablename = 'billy_audit_logs';

-- Test insert (should work)
INSERT INTO billy_audit_logs (
    tool_name, 
    action, 
    organization_id, 
    status, 
    execution_time_ms, 
    params
) VALUES (
    'test_tool',
    'read',
    'test_org',
    'success',
    123,
    '{"test": true}'::jsonb
);

-- Verify insert
SELECT * FROM billy_audit_logs WHERE tool_name = 'test_tool';

-- Clean up test
DELETE FROM billy_audit_logs WHERE tool_name = 'test_tool';

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

SELECT 
    '✅ Audit logging table created successfully!' as status,
    COUNT(*) as existing_logs 
FROM billy_audit_logs;
