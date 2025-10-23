# 🚀 Supabase Migration Quick Guide

## Status: ✅ Ready to Execute

Du har allerede:

- ✅ Supabase projekt oprettet
- ✅ Credentials i `.env` fil
- ✅ Connection testet og virker
- ✅ SQL migration fil klar: `docs/sql/001_initial_schema.sql`

---

## 📋 Hvad vil blive oprettet?

### 8 Nye Tabeller (med `billy_` prefix)

| Tabel | Formål | Rækker |
|-------|--------|--------|
| `billy_organizations` | Multi-tenant org management | Start: 0 |
| `billy_users` | User accounts per org | Start: 0 |
| `billy_cached_invoices` | Cached invoices (TTL: 5 min) | Start: 0 |
| `billy_cached_customers` | Cached customers (TTL: 5 min) | Start: 0 |
| `billy_cached_products` | Cached products (TTL: 5 min) | Start: 0 |
| `billy_audit_logs` | Audit trail for all operations | Start: 0 |
| `billy_usage_metrics` | Hourly usage analytics | Start: 0 |
| `billy_rate_limits` | Rate limiting counters | Start: 0 |

### 2 Helper Functions

- `increment_billy_rate_limit()` - Atomic rate limit counter
- `cleanup_billy_expired_cache()` - Clean up expired cache

### 1 Monitoring View

- `billy_cache_stats` - Real-time cache statistics

### RLS Policies

- Organization isolation på alle cache tabeller
- Read-only audit logs for users
- Service role bypass (automatic)

---

## 🎯 Kør Migrations (3 metoder)

### Metode 1: Supabase SQL Editor (Anbefalet) ⭐

**Steps:**

1. Åbn Supabase Dashboard: <https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey>
2. Gå til **SQL Editor** (venstre menu)
3. Klik **"+ New query"**
4. Copy-paste hele indholdet af `docs/sql/001_initial_schema.sql`
5. Klik **"Run"** (eller tryk `Ctrl+Enter`)
6. Vent på success message: ✅

**Fordele:**

- ✅ Grafisk interface
- ✅ Syntax highlighting
- ✅ Fejl vises tydeligt
- ✅ Kan gemme query til senere

---

### Metode 2: Via psql kommandolinje

**Kræver PostgreSQL client installeret:**

```bash
# Windows (PowerShell)
$env:PGPASSWORD="Habibie12@"
psql -h db.oaevagdgrasfppbrxbey.supabase.co -U postgres -d postgres -f docs/sql/001_initial_schema.sql
```

**Fordele:**

- ✅ Automatisk (ingen copy-paste)
- ✅ Kan scriptes

**Ulemper:**

- ⚠️  Kræver psql installation

---

### Metode 3: Node.js migration script (Automatisk)

**Jeg kan lave et script der kører migrations:**

```typescript
// scripts/run-migrations.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const sql = fs.readFileSync('docs/sql/001_initial_schema.sql', 'utf8');
await supabase.rpc('exec_sql', { query: sql });
```

**Fordele:**

- ✅ Fuldt automatisk
- ✅ Del af build process

**Ulemper:**

- ⚠️  Kræver `exec_sql` RPC function i Supabase

---

## ✅ Efter Migration: Verification

### 1. Tjek at tabeller eksisterer

```sql
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE 'billy_%' 
ORDER BY tablename;
```

**Forventet output:**

```text
billy_audit_logs
billy_cached_customers
billy_cached_invoices
billy_cached_products
billy_organizations
billy_rate_limits
billy_usage_metrics
billy_users
```

### 2. Tjek cache stats view

```sql
SELECT * FROM billy_cache_stats;
```

**Forventet output:**

```text
resource_type | total_cached | active_cached | expired_cached | last_cached_at
--------------+--------------+---------------+----------------+---------------
invoices      |            0 |             0 |              0 | null
customers     |            0 |             0 |              0 | null
products      |            0 |             0 |              0 | null
```

### 3. Test RLS policies

```sql
-- Should succeed (no rows yet)
SELECT * FROM billy_organizations;
```

---

## 🔐 Seed Initial Test Data (Optional)

Hvis du vil teste med dummy data:

```sql
-- Create test organization
INSERT INTO billy_organizations (
  name, 
  billy_api_key, 
  billy_organization_id,
  settings
) VALUES (
  'Rendetalje Test',
  'ENCRYPTED_KEY_WILL_BE_SET_BY_APP', -- Placeholder
  'test-org-123',
  '{"cache_ttl_minutes": 5, "enable_audit_logging": true}'
) RETURNING *;

-- Create test user
INSERT INTO billy_users (
  email,
  organization_id,
  role
) VALUES (
  'info@rendetalje.dk',
  (SELECT id FROM billy_organizations WHERE name = 'Rendetalje Test'),
  'admin'
) RETURNING *;
```

---

## 🎯 Næste Skridt Efter Migration

1. ✅ **Migration kørt** - 8 tabeller oprettet
2. 🔄 **Implementer TypeScript kode:**
   - `src/database/supabase-client.ts` (connection + queries)
   - `src/database/cache-manager.ts` (caching logic)
   - `src/middleware/audit-logger.ts` (audit logging)
3. 🔗 **Wire ind i tools:**
   - Update `src/tools/invoices.ts` til at bruge cache
   - Update `src/tools/customers.ts` til at bruge cache
   - Update `src/tools/products.ts` til at bruge cache
4. 🧪 **Test lokalt:**
   - Kør MCP server lokalt
   - Verificer cache hits i logs
   - Check audit logs i Supabase
5. 🚀 **Deploy til Render.com:**
   - Add Supabase env vars til Render
   - Push til GitHub (auto-deploy)
   - Verificer i produktion

---

## 🆘 Troubleshooting

### Problem: "relation already exists"

**Løsning:** Tabeller eksisterer allerede. Skip eller drop først:

```sql
DROP TABLE IF EXISTS billy_rate_limits CASCADE;
DROP TABLE IF EXISTS billy_usage_metrics CASCADE;
DROP TABLE IF EXISTS billy_audit_logs CASCADE;
DROP TABLE IF EXISTS billy_cached_products CASCADE;
DROP TABLE IF EXISTS billy_cached_customers CASCADE;
DROP TABLE IF EXISTS billy_cached_invoices CASCADE;
DROP TABLE IF EXISTS billy_users CASCADE;
DROP TABLE IF EXISTS billy_organizations CASCADE;
```

Derefter kør migration igen.

---

### Problem: "permission denied"

**Løsning:** Du bruger anon key i stedet for service key.

Tjek at du bruger `SUPABASE_SERVICE_KEY` (ikke `SUPABASE_ANON_KEY`).

---

### Problem: "syntax error at or near..."

**Løsning:** Copy-paste fejl. Tjek at hele SQL filen er kopieret korrekt.

Prøv at køre hver sektion separat hvis hele filen fejler.

---

## 📊 Hvad siger du?

**Klar til at køre migration?**

1. **JA** - Jeg åbner Supabase SQL Editor nu og kører filen
2. **VIS MIG FØRST** - Hvad kommer der til at ske?
3. **VENT** - Jeg vil have dig til at lave automatisk script først

**Hvad foretrækker du?** 🎯
