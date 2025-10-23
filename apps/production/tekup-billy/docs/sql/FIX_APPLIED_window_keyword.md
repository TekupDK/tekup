# 🔧 SQL Fix Applied: Reserved Keyword Issue

**Problem:** PostgreSQL syntax error at line 193
**Error:** `ERROR: 42601: syntax error at or near "window"`

---

## 🐛 Root Cause

**`window` is a reserved keyword in PostgreSQL (used for window functions)**

Original code:

```sql
CREATE OR REPLACE FUNCTION increment_billy_rate_limit(
  org_id UUID,
  endpoint_path TEXT,
  window TIMESTAMP  -- ❌ Reserved keyword!
)
```

---

## ✅ Fix Applied

Changed parameter name to avoid conflict:

```sql
CREATE OR REPLACE FUNCTION increment_billy_rate_limit(
  org_id UUID,
  endpoint_path TEXT,
  window_start_time TIMESTAMP  -- ✅ Safe name
)
RETURNS TABLE(count INTEGER) AS $$
  INSERT INTO billy_rate_limits (organization_id, endpoint, window_start, request_count)
  VALUES (org_id, endpoint_path, window_start_time, 1)  -- ✅ Uses new name
  ON CONFLICT (organization_id, endpoint, window_start)
  DO UPDATE SET request_count = billy_rate_limits.request_count + 1
  RETURNING billy_rate_limits.request_count;
$$;
```

---

## 🚀 Next Steps

**Fixed SQL is now in your clipboard!** ✅

1. **Go back to Supabase SQL Editor**
2. **Select all old SQL** (Ctrl+A)
3. **Delete it** (Delete key)
4. **Paste new fixed SQL** (Ctrl+V) - already in clipboard
5. **Click RUN button** (green)

**Should now complete successfully with no errors!** 🎯

---

## 📋 Verification

After successful run, you should see:

```
✅ CREATE EXTENSION uuid-ossp (or "already exists" - OK)
✅ CREATE TABLE billy_organizations
✅ CREATE TABLE billy_users
✅ CREATE TABLE billy_cached_invoices
✅ CREATE TABLE billy_cached_customers
✅ CREATE TABLE billy_cached_products
✅ CREATE TABLE billy_audit_logs
✅ CREATE TABLE billy_usage_metrics
✅ CREATE TABLE billy_rate_limits
✅ CREATE FUNCTION increment_billy_rate_limit (FIXED!)
✅ CREATE FUNCTION cleanup_billy_expired_cache
✅ CREATE VIEW billy_cache_stats
✅ CREATE POLICY (12 policies)
✅ CREATE INDEX (8 indexes)

SUCCESS: No errors
```

---

**Prøv igen nu med den fixede SQL!** 🚀
