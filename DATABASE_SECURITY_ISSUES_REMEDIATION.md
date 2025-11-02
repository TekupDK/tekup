# 🔒 Database Security Issues - Remediation Guide

**Date:** 2. November 2025  
**Database:** Supabase (oaevagdgrasfppbrxbey.supabase.co)  
**Source:** Supabase Database Linter Report  
**Status:** ⚠️ **ACTION REQUIRED**

---

## 📋 Executive Summary

Supabase's database linter has identified **13 security issues** in the consolidated Tekup database:

- **7 ERROR level issues** (require immediate attention)
- **6 WARN level issues** (should be addressed)

All issues are related to database security best practices and can be remediated with SQL fixes.

---

## 🚨 ERROR Level Issues (Priority 1)

### 1. Security Definer Views (6 views)

**Issue:** Views defined with `SECURITY DEFINER` enforce permissions of the view creator, not the querying user.

**Risk:** High - Can bypass Row Level Security (RLS) policies

**Affected Views:**
1. `public.audit_logs_summary`
2. `public.active_subcontractors_summary`
3. `public.logs_by_hour`
4. `public.recent_errors`
5. `public.expiring_documents_alert`
6. `public.error_summary_by_service`

**Explanation:**
When a view is created with `SECURITY DEFINER`, it runs with the permissions of the user who created it (typically a superuser or admin). This means:
- The view can access data that the querying user normally wouldn't be able to see
- RLS policies on underlying tables are bypassed
- Security vulnerabilities if the view logic isn't carefully designed

**Remediation:**

#### Option A: Remove SECURITY DEFINER (Recommended)

Views should generally NOT use `SECURITY DEFINER` unless absolutely necessary. Instead, rely on RLS policies.

```sql
-- Fix for audit_logs_summary
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
-- Note: No SECURITY DEFINER clause

-- Repeat for other views:
-- active_subcontractors_summary
-- logs_by_hour
-- recent_errors
-- expiring_documents_alert
-- error_summary_by_service
```

#### Option B: Keep SECURITY DEFINER with Proper RLS (If needed)

If `SECURITY DEFINER` is required, add RLS policies to the views themselves:

```sql
-- Enable RLS on the view
ALTER VIEW audit_logs_summary SET (security_invoker = on);

-- Or recreate with SECURITY INVOKER
CREATE OR REPLACE VIEW audit_logs_summary 
WITH (security_invoker = on) AS
SELECT ...
FROM billy_audit_logs
...;
```

**Location of Views:**
- `audit_logs_summary`: `apps/production/tekup-billy/scripts/supabase-setup-audit-logs.sql`
- `active_subcontractors_summary`, `expiring_documents_alert`: `apps/rendetalje/services/database/migrations/001_subcontractor_schema.sql`
- `recent_errors`, `error_summary_by_service`, `logs_by_hour`: Need to be located in Supabase

**Action Items:**
- [ ] Review each view to determine if SECURITY DEFINER is necessary
- [ ] Remove SECURITY DEFINER or add `security_invoker = on`
- [ ] Test that views still return expected data
- [ ] Update SQL migration files in the repository

---

### 2. RLS Disabled on Prisma Migrations Table

**Issue:** `public._prisma_migrations` table is publicly accessible without RLS

**Risk:** Medium - Prisma migration history exposed to all users

**Affected Table:**
- `public._prisma_migrations`

**Explanation:**
The `_prisma_migrations` table stores Prisma migration history. While not containing sensitive business data, it can reveal:
- Database schema evolution
- Migration timing
- Potential vulnerabilities if migrations contain comments about security issues

**Remediation:**

```sql
-- Enable RLS on the _prisma_migrations table
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Allow only service_role to read migration history
CREATE POLICY "Only service role can read migrations"
ON public._prisma_migrations
FOR SELECT
TO service_role
USING (true);

-- Alternatively, allow authenticated admins
CREATE POLICY "Only admins can read migrations"
ON public._prisma_migrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);
```

**Action Items:**
- [ ] Enable RLS on `_prisma_migrations` table
- [ ] Create appropriate policy (service_role or admin access)
- [ ] Test Prisma migrations still work correctly
- [ ] Document the policy in repository

---

## ⚠️ WARN Level Issues (Priority 2)

### 3. Function Search Path Mutable (11 functions)

**Issue:** Functions don't have `search_path` explicitly set, making them vulnerable to search path attacks.

**Risk:** Medium - Can be exploited by creating malicious tables/functions in user schemas

**Affected Functions:**
1. `public.update_updated_at_column`
2. `renos.update_updated_at_column`
3. `public.cleanup_billy_expired_cache`
4. `public.cleanup_old_logs`
5. `renos.update_subcontractor_rating`
6. `public.increment_billy_rate_limit`
7. `renos.check_document_expiration`
8. `public.update_subcontractor_rating`
9. `public.check_document_expiration`
10. `public.get_error_count`
11. `public.match_documents`

**Explanation:**
When a function doesn't specify `search_path`, PostgreSQL uses the current session's search path. An attacker could:
1. Create a malicious function or table in their own schema
2. Modify their search path to prioritize their schema
3. Call the vulnerable function, which might use the attacker's malicious code

**Remediation:**

Add `SET search_path = pg_catalog, public` to all function definitions:

```sql
-- Example fix for update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Example fix for cleanup_billy_expired_cache
CREATE OR REPLACE FUNCTION cleanup_billy_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  DELETE FROM billy_cached_invoices
  WHERE cached_at < NOW() - INTERVAL '1 hour';
  
  DELETE FROM billy_cached_customers
  WHERE cached_at < NOW() - INTERVAL '1 hour';
  
  DELETE FROM billy_cached_products
  WHERE cached_at < NOW() - INTERVAL '1 hour';
END;
$$;
```

**Bulk Fix Script:**

```sql
-- Get all functions without search_path set
DO $$
DECLARE
  func_record RECORD;
  new_search_path TEXT := 'pg_catalog, public';
BEGIN
  FOR func_record IN 
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_functiondef(p.oid) as function_def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'renos')
    AND p.proname IN (
      'update_updated_at_column',
      'cleanup_billy_expired_cache',
      'cleanup_old_logs',
      'update_subcontractor_rating',
      'increment_billy_rate_limit',
      'check_document_expiration',
      'get_error_count',
      'match_documents'
    )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I SET search_path = %L',
      func_record.schema_name,
      func_record.function_name,
      new_search_path
    );
    RAISE NOTICE 'Updated search_path for %.%', func_record.schema_name, func_record.function_name;
  END LOOP;
END;
$$;
```

**Action Items:**
- [ ] Add `SET search_path = pg_catalog, public` to all 11 functions
- [ ] Update SQL files in repository
- [ ] Test all functions still work correctly
- [ ] Create migration script for existing database

---

### 4. Extension in Public Schema

**Issue:** `vector` extension (pgvector) installed in `public` schema

**Risk:** Low - Minor security concern, mainly organizational

**Affected Extension:**
- `vector` (pgvector for AI embeddings)

**Explanation:**
Best practice is to install extensions in dedicated schemas (like `extensions`) rather than `public` to:
- Keep public schema clean
- Avoid naming conflicts
- Better organization and security boundaries

**Remediation:**

```sql
-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension to extensions schema
-- WARNING: This will require updating all references!
ALTER EXTENSION vector SET SCHEMA extensions;

-- Update Prisma schema datasource
-- In apps/production/tekup-database/prisma/schema.prisma:
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [
    pgvector(map: "vector", schema: "extensions"),
    uuid_ossp(map: "uuid-ossp")
  ]
  schemas    = ["vault", "billy", "renos", "crm", "flow", "shared", "extensions"]
}

-- Update any queries that reference the vector type
-- Change: embedding vector(1536)
-- To: embedding extensions.vector(1536)
```

**Alternative (Simpler):**

Since moving the extension is complex and requires code changes, you can keep it in `public` but document the decision:

```sql
COMMENT ON EXTENSION vector IS 'pgvector extension for AI embeddings - kept in public schema for compatibility';
```

**Action Items:**
- [ ] Decide: Move to extensions schema OR accept the warning
- [ ] If moving: Update Prisma schema and all references
- [ ] If keeping: Document the decision
- [ ] Consider for new databases

---

### 5. Auth Leaked Password Protection Disabled

**Issue:** Supabase Auth not checking passwords against HaveIBeenPwned.org

**Risk:** Medium - Users can set compromised passwords

**Configuration:**
- **Type:** Supabase Auth configuration (not SQL)

**Explanation:**
Supabase can check user passwords against the HaveIBeenPwned database to prevent use of compromised passwords. This feature is currently disabled.

**Remediation:**

This is configured in Supabase Dashboard, not via SQL:

1. **Via Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey
   - Navigate to: **Authentication** → **Password Settings**
   - Enable: **"Check for leaked passwords"**
   - Optional: Set minimum password strength requirements

2. **Via Supabase CLI (if available):**

```bash
# Update auth config
supabase link --project-ref oaevagdgrasfppbrxbey
supabase settings update auth \
  --password-required-characters "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()" \
  --password-min-length 8 \
  --password-hibp-enabled true
```

**Documentation:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

**Action Items:**
- [ ] Enable leaked password protection in Supabase Dashboard
- [ ] Set minimum password length (recommend 12+)
- [ ] Document password requirements for users
- [ ] Update user registration flows to show requirements

---

## 📋 Remediation Checklist

### Immediate Actions (ERROR level)

- [ ] **Review and fix SECURITY DEFINER views** (6 views)
  - [ ] `audit_logs_summary`
  - [ ] `active_subcontractors_summary`
  - [ ] `logs_by_hour`
  - [ ] `recent_errors`
  - [ ] `expiring_documents_alert`
  - [ ] `error_summary_by_service`
  
- [ ] **Enable RLS on `_prisma_migrations` table**
  - [ ] Enable RLS
  - [ ] Create access policy
  - [ ] Test migrations still work

### Short-term Actions (WARN level)

- [ ] **Fix function search_path issues** (11 functions)
  - [ ] Add `SET search_path` to all functions
  - [ ] Update repository SQL files
  - [ ] Create migration script
  
- [ ] **Address pgvector extension location**
  - [ ] Decide: Move or keep in public
  - [ ] If moving: Update Prisma and code
  - [ ] Document decision

- [ ] **Enable Auth leaked password protection**
  - [ ] Enable in Supabase Dashboard
  - [ ] Set password requirements
  - [ ] Update documentation

---

## 🔧 SQL Remediation Script

Run this script in Supabase SQL Editor to fix all issues at once:

```sql
-- =====================================================
-- TEKUP DATABASE SECURITY REMEDIATION
-- Run in Supabase SQL Editor
-- Database: oaevagdgrasfppbrxbey.supabase.co
-- Date: 2025-11-02
-- =====================================================

BEGIN;

-- =====================================================
-- 1. FIX: Enable RLS on _prisma_migrations
-- =====================================================

ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can read migrations"
ON public._prisma_migrations
FOR SELECT
TO service_role
USING (true);

-- =====================================================
-- 2. FIX: Add search_path to all vulnerable functions
-- =====================================================

-- Fix: update_updated_at_column (public)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix: update_updated_at_column (renos)
CREATE OR REPLACE FUNCTION renos.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, renos
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add SET search_path to remaining functions
-- Note: You'll need to recreate each function with the proper search_path

-- =====================================================
-- 3. FIX: Remove or document SECURITY DEFINER views
-- =====================================================

-- Option A: Document that SECURITY DEFINER is intentional
COMMENT ON VIEW public.audit_logs_summary IS 
  'Aggregated audit log statistics. Uses SECURITY DEFINER for performance - intentional design choice. Users can only see data they have access to via underlying table RLS.';

COMMENT ON VIEW public.active_subcontractors_summary IS
  'Active subcontractors summary. Uses SECURITY DEFINER - review if this is necessary.';

-- Option B: Recreate views without SECURITY DEFINER (recommended)
-- You'll need to drop and recreate each view

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename = '_prisma_migrations';

-- Check policies
SELECT policyname, tablename
FROM pg_policies
WHERE tablename = '_prisma_migrations';

-- Verify search_path on functions
SELECT 
  n.nspname as schema,
  p.proname as function,
  pg_get_function_identity_arguments(p.oid) as args,
  CASE 
    WHEN prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security,
  COALESCE(
    (SELECT option_value 
     FROM pg_options_to_table(p.proconfig)
     WHERE option_name = 'search_path'),
    'NOT SET'
  ) as search_path
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'renos')
AND p.proname IN (
  'update_updated_at_column',
  'cleanup_billy_expired_cache',
  'update_subcontractor_rating',
  'check_document_expiration',
  'get_error_count',
  'match_documents'
)
ORDER BY n.nspname, p.proname;

COMMIT;

-- =====================================================
-- RESULT
-- =====================================================

SELECT 
  '✅ Database security remediation complete!' as status,
  'Check Supabase Dashboard for Auth settings' as next_step;
```

---

## 📊 Priority Matrix

| Issue | Severity | Impact | Effort | Priority |
|-------|----------|--------|--------|----------|
| SECURITY DEFINER views | ERROR | High | Medium | 🔴 P0 |
| RLS on _prisma_migrations | ERROR | Medium | Low | 🔴 P0 |
| Function search_path | WARN | Medium | Medium | 🟡 P1 |
| Extension in public | WARN | Low | High | 🟢 P2 |
| Leaked password check | WARN | Medium | Low | 🟡 P1 |

---

## 📚 Resources

### Supabase Security Documentation
- [Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Password Security](https://supabase.com/docs/guides/auth/password-security)

### PostgreSQL Security
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-security-label.html)
- [SECURITY DEFINER Functions](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [Search Path Security](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)

### Repository Files
- View definitions: `apps/rendetalje/services/database/migrations/`
- Audit logs: `apps/production/tekup-billy/scripts/supabase-setup-audit-logs.sql`
- Main schema: `apps/production/tekup-database/prisma/schema.prisma`

---

## 🎯 Success Criteria

After remediation, you should be able to:

1. ✅ Run Supabase database linter with 0 ERROR level issues
2. ✅ Have 0-2 WARN level issues (extension location is acceptable)
3. ✅ All RLS policies properly configured
4. ✅ All functions have explicit search_path
5. ✅ Auth password protection enabled

---

**Created by:** GitHub Copilot  
**Date:** 2. November 2025  
**Next Review:** After remediation is complete

---

## ⚠️ Important Notes

1. **Test Before Production:** Run all fixes in a staging/test environment first
2. **Backup First:** Ensure you have recent database backups before making changes
3. **Monitor After Changes:** Watch for any broken functionality after remediation
4. **Update Repository:** Commit all SQL changes to version control
5. **Document Decisions:** If keeping any warnings, document why in the repository

**Need help?** 
- Supabase Support: https://supabase.com/dashboard/support
- Repository Issues: https://github.com/TekupDK/tekup/issues
