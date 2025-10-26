-- AI Usage tracking table
-- Add this to your Prisma schema or SQL migration

CREATE TABLE ai_usage_record (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(100),
    model VARCHAR(100) NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    
    -- Indexes for performance
    INDEX idx_ai_usage_tenant_time (tenant_id, timestamp),
    INDEX idx_ai_usage_model_time (model, timestamp),
    INDEX idx_ai_usage_timestamp (timestamp)
);

-- Retention policy (optional, depending on DB)
-- For PostgreSQL with pg_partman or similar:
-- SELECT partman.create_parent(
--     p_parent_table => 'public.ai_usage_record',
--     p_control => 'timestamp',
--     p_type => 'range',
--     p_interval => 'monthly'
-- );

-- Cleanup procedure for manual retention
-- CREATE OR REPLACE FUNCTION cleanup_ai_usage_records(retention_days INTEGER DEFAULT 90)
-- RETURNS INTEGER AS $$
-- DECLARE
--     deleted_count INTEGER;
-- BEGIN
--     DELETE FROM ai_usage_record 
--     WHERE timestamp < (CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days);
--     
--     GET DIAGNOSTICS deleted_count = ROW_COUNT;
--     RETURN deleted_count;
-- END;
-- $$ LANGUAGE plpgsql;