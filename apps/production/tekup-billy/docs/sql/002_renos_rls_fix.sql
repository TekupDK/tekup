-- =====================================================
-- RenOS Security Fix: Enable RLS on All Tables
-- =====================================================
-- Purpose: Fix 20 security warnings in Supabase
-- Issue: All RenOS tables are public without RLS enabled
-- Impact: CRITICAL - Data is currently exposed to unauthorized access
-- =====================================================

-- Enable RLS on all RenOS tables
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_ingest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Label" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_plan_bookings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TEMPORARY PERMISSIVE POLICIES (CHANGE IN PRODUCTION!)
-- =====================================================
-- WARNING: These policies allow ALL access for service_role
-- This is temporary to not break existing RenOS backend functionality
-- TODO: Implement proper organization-based RLS policies
-- =====================================================

-- Service role bypass (allows RenOS backend to access all data)
CREATE POLICY service_role_all ON public.quotes
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.conversations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.analytics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.task_executions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.chat_sessions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.email_ingest_runs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.email_messages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.email_responses
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.escalations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.cleaning_plans
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public."Service"
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public."Label"
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.cleaning_tasks
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.email_threads
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.invoice_line_items
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.competitor_pricing
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.breaks
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.invoices
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.chat_messages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_all ON public.cleaning_plan_bookings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- Verification Query
-- =====================================================

-- Check that RLS is now enabled on all tables
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END AS rls_status,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) AS policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'quotes', 'conversations', 'analytics', 'task_executions',
    'chat_sessions', 'email_ingest_runs', 'email_messages', 'email_responses',
    'escalations', 'cleaning_plans', 'Service', 'Label',
    'cleaning_tasks', 'email_threads', 'invoice_line_items', 'competitor_pricing',
    'breaks', 'invoices', 'chat_messages', 'cleaning_plan_bookings'
  )
ORDER BY tablename;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS enabled on 20 RenOS tables';
  RAISE NOTICE '⚠️  WARNING: Using permissive service_role policies';
  RAISE NOTICE '📝 TODO: Implement proper organization-based RLS in RenOS backend';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Next Steps:';
  RAISE NOTICE '   1. Update RenOS backend to use service_role key';
  RAISE NOTICE '   2. Implement proper RLS policies based on organization_id';
  RAISE NOTICE '   3. Test that RenOS frontend/backend still works';
  RAISE NOTICE '   4. Remove permissive policies once proper policies are in place';
END $$;
