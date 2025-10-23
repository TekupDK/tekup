# Supabase Setup Guide (Tekup-Billy MCP)

This guide provisions Supabase for caching, multi-tenant auth, audit logs and analytics.

## 1) Prerequisites

- Supabase account
- Project region: EU (Frankfurt) recommended
- Your Render.com service URL (for CORS): <https://tekup-billy.onrender.com>

## 2) Create project and collect keys

1. Create a new project in Supabase
2. From Settings → API copy:
   - Project URL → SUPABASE_URL
   - anon/public key → SUPABASE_ANON_KEY
   - service_role key → SUPABASE_SERVICE_KEY

Add to your `.env`:

```env
SUPABASE_URL=...            # https://<project>.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
ENCRYPTION_KEY=replace-with-strong-passphrase
ENCRYPTION_SALT=replace-with-random-salt
```

## 3) Create schema (SQL)

Open SQL Editor in Supabase and run in order:

- Organizations and Users (multi-tenant)
- Cached tables (invoices, customers, products)
- Audit logs & usage metrics
- Rate limiting
- Security policies (RLS)

Use the SQL from the architecture report sections:

- "Multi-Tenant Architecture"
- "Data Caching"
- "Audit Logging"
- "Analytics Dashboard"
- "Rate Limiting"

Tip: keep migrations as separate saved queries for clarity.

## 4) Recommended RLS policies

Enable RLS and apply minimum policies:

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
```

Example org isolation (adjust to your auth strategy):

```sql
CREATE POLICY org_isolation ON cached_invoices
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
```

## 5) Configure Auth

- Enable Email provider (Authentication → Providers)
- Optionally enable OAuth providers if needed
- Set JWT expiry to 1 hour

## 6) Local smoke test

PowerShell commands (Windows):

```powershell
# Install SDK
npm install @supabase/supabase-js

# Node one-liner test (PowerShell)
node -e "(async()=>{const { createClient } = await import('@supabase/supabase-js'); const c=createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY); const { data, error } = await c.from('organizations').select('*').limit(1); console.log({ ok: !error, count: data?.length ?? 0, error }); })()"
```

You should see ok:true even if the table is empty.

## 7) Production hardening

- Rotate service_role and encryption keys every 90 days
- Restrict CORS origins to your domains
- Set database backups and point-in-time recovery
- Prefer service_role only in server-side contexts (never in clients)

## 8) Next steps

- Wire `supabase-client.ts` and `cache-manager.ts` (from report) into your codebase
- Add audit logging middleware
- Enable rate limiting RPC functions
- Create a staging project and point `.env.staging` to it
