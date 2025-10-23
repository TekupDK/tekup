-- Database Performance Optimization for RendetaljeOS
-- This file contains optimizations for better query performance and database efficiency

-- ============================================================================
-- INDEXES FOR IMPROVED QUERY PERFORMANCE
-- ============================================================================

-- Jobs table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_status_date 
ON jobs(status, scheduled_date) WHERE status IN ('pending', 'scheduled', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_assigned_to_date 
ON jobs(assigned_to, scheduled_date) WHERE assigned_to IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_customer_id 
ON jobs(customer_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_organization_date 
ON jobs(organization_id, scheduled_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at 
ON jobs(created_at DESC);

-- Customers table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_organization_id 
ON customers(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email 
ON customers(email) WHERE email IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone 
ON customers(phone) WHERE phone IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_name_search 
ON customers USING gin(to_tsvector('english', name));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_address_search 
ON customers USING gin(to_tsvector('english', address));

-- Time entries indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_job_id 
ON time_entries(job_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_user_date 
ON time_entries(user_id, start_time DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_date_range 
ON time_entries(start_time, end_time) WHERE end_time IS NOT NULL;

-- Team members indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_organization 
ON team_members(organization_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_role 
ON team_members(role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_active 
ON team_members(active) WHERE active = true;

-- Photos indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photos_job_id 
ON photos(job_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photos_type 
ON photos(type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photos_created_at 
ON photos(created_at DESC);

-- Customer communications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_communications_customer_id 
ON customer_communications(customer_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_communications_date 
ON customer_communications(created_at DESC);

-- Customer satisfaction indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_satisfaction_customer_id 
ON customer_satisfaction(customer_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_satisfaction_job_id 
ON customer_satisfaction(job_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_satisfaction_rating 
ON customer_satisfaction(rating);

-- ============================================================================
-- MATERIALIZED VIEWS FOR COMPLEX QUERIES
-- ============================================================================

-- Customer statistics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS customer_statistics AS
SELECT 
    c.id as customer_id,
    c.organization_id,
    COUNT(j.id) as total_jobs,
    COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as completed_jobs,
    COUNT(CASE WHEN j.status = 'cancelled' THEN 1 END) as cancelled_jobs,
    COALESCE(AVG(cs.rating), 0) as average_rating,
    COALESCE(SUM(j.price), 0) as total_spent,
    MAX(j.scheduled_date) as last_service_date,
    MIN(j.scheduled_date) as first_service_date,
    COUNT(DISTINCT DATE_TRUNC('month', j.scheduled_date)) as months_active
FROM customers c
LEFT JOIN jobs j ON c.id = j.customer_id
LEFT JOIN customer_satisfaction cs ON j.id = cs.job_id
GROUP BY c.id, c.organization_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_statistics_customer_id 
ON customer_statistics(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_statistics_organization 
ON customer_statistics(organization_id);

-- Team performance materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS team_performance AS
SELECT 
    tm.id as team_member_id,
    tm.organization_id,
    COUNT(j.id) as total_jobs_assigned,
    COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as completed_jobs,
    COUNT(CASE WHEN j.status = 'cancelled' THEN 1 END) as cancelled_jobs,
    COALESCE(AVG(cs.rating), 0) as average_customer_rating,
    COALESCE(SUM(EXTRACT(EPOCH FROM (te.end_time - te.start_time))/3600), 0) as total_hours_worked,
    COALESCE(AVG(EXTRACT(EPOCH FROM (te.end_time - te.start_time))/3600), 0) as average_hours_per_job,
    COUNT(DISTINCT j.customer_id) as unique_customers_served
FROM team_members tm
LEFT JOIN jobs j ON tm.id = j.assigned_to
LEFT JOIN customer_satisfaction cs ON j.id = cs.job_id
LEFT JOIN time_entries te ON j.id = te.job_id AND tm.id = te.user_id
WHERE tm.active = true
GROUP BY tm.id, tm.organization_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_performance_team_member_id 
ON team_performance(team_member_id);

CREATE INDEX IF NOT EXISTS idx_team_performance_organization 
ON team_performance(organization_id);

-- Daily job summary materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_job_summary AS
SELECT 
    organization_id,
    scheduled_date,
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_jobs,
    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_jobs,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_jobs,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_jobs,
    COALESCE(SUM(price), 0) as total_revenue,
    COALESCE(AVG(duration), 0) as average_duration
FROM jobs
GROUP BY organization_id, scheduled_date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_job_summary_org_date 
ON daily_job_summary(organization_id, scheduled_date);

-- ============================================================================
-- FUNCTIONS FOR REFRESHING MATERIALIZED VIEWS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_customer_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY customer_statistics;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_team_performance()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY team_performance;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_daily_job_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_job_summary;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    PERFORM refresh_customer_statistics();
    PERFORM refresh_team_performance();
    PERFORM refresh_daily_job_summary();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- OPTIMIZED QUERIES FOR COMMON OPERATIONS
-- ============================================================================

-- Function to get customer dashboard data efficiently
CREATE OR REPLACE FUNCTION get_customer_dashboard_data(p_customer_id UUID)
RETURNS TABLE (
    customer_info JSONB,
    recent_jobs JSONB,
    statistics JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_jsonb(c.*) as customer_info,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', j.id,
                    'service_type', j.service_type,
                    'scheduled_date', j.scheduled_date,
                    'status', j.status,
                    'price', j.price
                )
            )
            FROM jobs j 
            WHERE j.customer_id = p_customer_id 
            ORDER BY j.scheduled_date DESC 
            LIMIT 10), 
            '[]'::jsonb
        ) as recent_jobs,
        COALESCE(
            (SELECT to_jsonb(cs.*) 
             FROM customer_statistics cs 
             WHERE cs.customer_id = p_customer_id),
            '{}'::jsonb
        ) as statistics
    FROM customers c
    WHERE c.id = p_customer_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get team member performance efficiently
CREATE OR REPLACE FUNCTION get_team_member_performance(p_team_member_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
    member_info JSONB,
    job_stats JSONB,
    time_stats JSONB,
    rating_stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_jsonb(tm.*) as member_info,
        jsonb_build_object(
            'total_jobs', COUNT(j.id),
            'completed_jobs', COUNT(CASE WHEN j.status = 'completed' THEN 1 END),
            'cancelled_jobs', COUNT(CASE WHEN j.status = 'cancelled' THEN 1 END),
            'completion_rate', 
                CASE 
                    WHEN COUNT(j.id) > 0 THEN 
                        ROUND((COUNT(CASE WHEN j.status = 'completed' THEN 1 END)::numeric / COUNT(j.id)::numeric) * 100, 2)
                    ELSE 0 
                END
        ) as job_stats,
        jsonb_build_object(
            'total_hours', COALESCE(SUM(EXTRACT(EPOCH FROM (te.end_time - te.start_time))/3600), 0),
            'average_hours_per_job', COALESCE(AVG(EXTRACT(EPOCH FROM (te.end_time - te.start_time))/3600), 0),
            'total_break_time', COALESCE(SUM(te.break_duration), 0)
        ) as time_stats,
        jsonb_build_object(
            'average_rating', COALESCE(AVG(cs.rating), 0),
            'total_ratings', COUNT(cs.rating),
            'rating_distribution', jsonb_build_object(
                '5_star', COUNT(CASE WHEN cs.rating = 5 THEN 1 END),
                '4_star', COUNT(CASE WHEN cs.rating = 4 THEN 1 END),
                '3_star', COUNT(CASE WHEN cs.rating = 3 THEN 1 END),
                '2_star', COUNT(CASE WHEN cs.rating = 2 THEN 1 END),
                '1_star', COUNT(CASE WHEN cs.rating = 1 THEN 1 END)
            )
        ) as rating_stats
    FROM team_members tm
    LEFT JOIN jobs j ON tm.id = j.assigned_to 
        AND j.scheduled_date BETWEEN p_start_date AND p_end_date
    LEFT JOIN time_entries te ON j.id = te.job_id AND tm.id = te.user_id
    LEFT JOIN customer_satisfaction cs ON j.id = cs.job_id
    WHERE tm.id = p_team_member_id
    GROUP BY tm.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTITIONING FOR LARGE TABLES
-- ============================================================================

-- Partition time_entries by month for better performance on large datasets
-- This would be implemented if the table grows very large

-- CREATE TABLE time_entries_y2025m01 PARTITION OF time_entries
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- CREATE TABLE time_entries_y2025m02 PARTITION OF time_entries
-- FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- ============================================================================
-- QUERY OPTIMIZATION SETTINGS
-- ============================================================================

-- Increase work_mem for complex queries (adjust based on available RAM)
-- SET work_mem = '256MB';

-- Increase shared_buffers for better caching (adjust based on available RAM)
-- SET shared_buffers = '1GB';

-- Enable parallel query execution
-- SET max_parallel_workers_per_gather = 4;

-- ============================================================================
-- MONITORING AND MAINTENANCE
-- ============================================================================

-- Function to analyze table statistics
CREATE OR REPLACE FUNCTION analyze_table_stats()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    table_size TEXT,
    index_size TEXT,
    total_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify slow queries
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
    query TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    rows BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pgs.query,
        pgs.calls,
        pgs.total_exec_time as total_time,
        pgs.mean_exec_time as mean_time,
        pgs.rows
    FROM pg_stat_statements pgs
    WHERE pgs.mean_exec_time > 100 -- queries taking more than 100ms on average
    ORDER BY pgs.mean_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTOMATED MAINTENANCE TASKS
-- ============================================================================

-- Function to perform routine maintenance
CREATE OR REPLACE FUNCTION perform_routine_maintenance()
RETURNS void AS $$
BEGIN
    -- Refresh materialized views
    PERFORM refresh_all_materialized_views();
    
    -- Update table statistics
    ANALYZE customers;
    ANALYZE jobs;
    ANALYZE time_entries;
    ANALYZE team_members;
    ANALYZE photos;
    ANALYZE customer_communications;
    ANALYZE customer_satisfaction;
    
    -- Log maintenance completion
    INSERT INTO system_logs (level, message, created_at)
    VALUES ('INFO', 'Routine database maintenance completed', NOW());
    
EXCEPTION WHEN OTHERS THEN
    -- Log maintenance failure
    INSERT INTO system_logs (level, message, details, created_at)
    VALUES ('ERROR', 'Routine database maintenance failed', SQLERRM, NOW());
END;
$$ LANGUAGE plpgsql;

-- Create system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level_date 
ON system_logs(level, created_at DESC);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON MATERIALIZED VIEW customer_statistics IS 'Pre-computed customer statistics for dashboard performance';
COMMENT ON MATERIALIZED VIEW team_performance IS 'Pre-computed team member performance metrics';
COMMENT ON MATERIALIZED VIEW daily_job_summary IS 'Daily aggregated job statistics by organization';

COMMENT ON FUNCTION refresh_all_materialized_views() IS 'Refreshes all materialized views for updated statistics';
COMMENT ON FUNCTION get_customer_dashboard_data(UUID) IS 'Efficiently retrieves all customer dashboard data in one query';
COMMENT ON FUNCTION get_team_member_performance(UUID, DATE, DATE) IS 'Retrieves comprehensive team member performance data';
COMMENT ON FUNCTION perform_routine_maintenance() IS 'Performs automated database maintenance tasks';