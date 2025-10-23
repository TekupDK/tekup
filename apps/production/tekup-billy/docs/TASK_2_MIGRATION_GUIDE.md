# 🚀 STEP-BY-STEP: Kør Supabase Migrations

**Task 2/9:** Execute Supabase SQL Migrations  
**Status:** 🔄 IN PROGRESS  
**Tid:** ~10 minutter (5 min per migration)

---

## 📋 HVAD SKAL DU GØRE

Du skal køre 2 SQL filer i Supabase SQL Editor:

1. **001_initial_schema.sql** → Billy.dk MCP tables (8 tables)
2. **002_renos_rls_fix.sql** → RenOS security fix (20 tables)

---

## 🎯 STEP 1: Åbn Supabase SQL Editor

**Klik på dette link:**

👉 **<https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/sql/new>**

**Eller:**

1. Gå til <https://supabase.com/dashboard>
2. Log ind (hvis nødvendigt)
3. Vælg project: **oaevagdgrasfppbrxbey**
4. Klik **SQL Editor** i sidebar (lyn-ikon ⚡)
5. Klik **+ New query**

---

## 🎯 STEP 2: Kør Billy.dk Migration (5 min)

### 2.1: Åbn SQL fil

I dette projekt, åbn filen:

```
docs/sql/001_initial_schema.sql
```

### 2.2: Copy indholdet

**Option A: Via VS Code**

```powershell
# Åbn fil i VS Code
code docs/sql/001_initial_schema.sql

# Marker alt (Ctrl+A) og kopier (Ctrl+C)
```

**Option B: Via PowerShell**

```powershell
# Copy til clipboard direkte
Get-Content "docs/sql/001_initial_schema.sql" -Raw | Set-Clipboard

# Nu kan du paste i Supabase
```

### 2.3: Paste i Supabase SQL Editor

1. Gå til Supabase SQL Editor tab
2. Paste hele SQL (Ctrl+V)
3. **RUN** knap (grøn) → Klik

### 2.4: Verificer output

**Forventet:**

```
✅ CREATE EXTENSION uuid-ossp
✅ CREATE TABLE billy_organizations
✅ CREATE TABLE billy_users
✅ CREATE TABLE billy_cached_invoices
✅ CREATE TABLE billy_cached_customers
✅ CREATE TABLE billy_cached_products
✅ CREATE TABLE billy_audit_logs
✅ CREATE TABLE billy_usage_metrics
✅ CREATE TABLE billy_rate_limits
✅ CREATE FUNCTION increment_billy_rate_limit
✅ CREATE FUNCTION cleanup_billy_expired_cache
✅ CREATE VIEW billy_cache_stats
✅ CREATE POLICY (12 policies total)
✅ CREATE INDEX (8 indexes)

SUCCESS: No errors
```

**Hvis fejl:**

- Screenshot fejlmeddelelsen
- Send til mig
- Jeg hjælper med debug

---

## 🎯 STEP 3: Kør RenOS Security Fix (5 min)

### 3.1: Åbn SQL fil

```
docs/sql/002_renos_rls_fix.sql
```

### 3.2: Copy indholdet

**PowerShell shortcut:**

```powershell
Get-Content "docs/sql/002_renos_rls_fix.sql" -Raw | Set-Clipboard
```

### 3.3: Ny query i Supabase

1. Klik **+ New query** igen i Supabase
2. Paste SQL (Ctrl+V)
3. **RUN** knap → Klik

### 3.4: Verificer output

**Forventet:**

```
✅ ALTER TABLE quotes ENABLE ROW LEVEL SECURITY
✅ ALTER TABLE invoices ENABLE ROW LEVEL SECURITY
... (18 more ALTER TABLE statements)
✅ CREATE POLICY service_role_all ON quotes
✅ CREATE POLICY service_role_all ON invoices
... (18 more CREATE POLICY statements)

SUCCESS: No errors

Verification Results:
20 tables with RLS enabled ✅
0 tables with RLS disabled ✅
```

---

## 🎯 STEP 4: Verificer Alt Er OK

### 4.1: Check Billy Tables Created

Kør denne query i Supabase SQL Editor:

```sql
-- Check Billy tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'billy_%' 
ORDER BY tablename;
```

**Forventet output:**

| tablename | rowsecurity |
|-----------|-------------|
| billy_audit_logs | true |
| billy_cached_customers | true |
| billy_cached_invoices | true |
| billy_cached_products | true |
| billy_organizations | true |
| billy_rate_limits | true |
| billy_usage_metrics | true |
| billy_users | true |

**Total: 8 rows** ✅

### 4.2: Check RenOS Tables Fixed

```sql
-- Check RenOS RLS status
SELECT tablename, 
  CASE WHEN rowsecurity THEN '✅ RLS Enabled' 
  ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables 
WHERE tablename IN (
  'quotes', 'invoices', 'invoice_line_items',
  'email_messages', 'email_threads', 'email_responses',
  'conversations', 'chat_sessions', 'chat_messages',
  'cleaning_plans', 'cleaning_plan_bookings', 'cleaning_tasks',
  'analytics', 'task_executions', 'escalations',
  'competitor_pricing', 'breaks', 'Service', 'Label'
)
ORDER BY tablename;
```

**Forventet: Alle 20 tables med "✅ RLS Enabled"**

### 4.3: Check Supabase Dashboard

Gå til Supabase Dashboard → **Database** → **Tables**

**Skal se:**

- 28 tables total (20 RenOS + 8 Billy)
- 0 security warnings (var 20 før)
- Alle tables har grøn ✅ ved RLS column

---

## 🆘 TROUBLESHOOTING

### Problem: "Extension uuid-ossp already exists"

**Fix:** Ignorer denne besked. Det er OK - extension var allerede installeret.

**Fortsæt:** Resten af migrationen kører stadig.

### Problem: "Table already exists"

**Betyder:** Du har kørt migrationen før.

**Fix:**

**Option A: Drop og re-run** (safe hvis test data)

```sql
DROP TABLE IF EXISTS billy_organizations CASCADE;
DROP TABLE IF EXISTS billy_users CASCADE;
DROP TABLE IF EXISTS billy_cached_invoices CASCADE;
DROP TABLE IF EXISTS billy_cached_customers CASCADE;
DROP TABLE IF EXISTS billy_cached_products CASCADE;
DROP TABLE IF EXISTS billy_audit_logs CASCADE;
DROP TABLE IF EXISTS billy_usage_metrics CASCADE;
DROP TABLE IF EXISTS billy_rate_limits CASCADE;
DROP FUNCTION IF EXISTS increment_billy_rate_limit CASCADE;
DROP FUNCTION IF EXISTS cleanup_billy_expired_cache CASCADE;
DROP VIEW IF EXISTS billy_cache_stats CASCADE;

-- Derefter kør 001_initial_schema.sql igen
```

**Option B: Skip dette step** (hvis tabeller allerede OK)

### Problem: "Permission denied"

**Fix:** Check at du er logget ind med korrekt Supabase account.

**Verify:**

```sql
SELECT current_user, session_user;
```

Skal returnere: `postgres` eller `supabase_admin`

### Problem: RenOS migration fejler på nogle tables

**Mulig årsag:** Table eksisterer ikke.

**Fix:** Check hvilke tables faktisk findes:

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Sammenlign med listen i 002_renos_rls_fix.sql. Fjern de manglende tables fra SQL og kør igen.

---

## ✅ SUCCESS CRITERIA

Efter begge migrations:

- ✅ 8 nye `billy_*` tables
- ✅ Alle Billy tables har RLS enabled
- ✅ 20 RenOS tables har RLS enabled  
- ✅ 0 security warnings i Supabase
- ✅ Ingen fejlmeddelelser

**Hvis alt det er opfyldt:**

**Rapporter tilbage:** "Task 2 done ✅" og jeg fortsætter med Task 3!

---

## 🎬 START NU

**Åbn Supabase SQL Editor:**

👉 <https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey/sql/new>

**Copy første SQL:**

```powershell
Get-Content "docs/sql/001_initial_schema.sql" -Raw | Set-Clipboard
```

**Kør migrationen og rapporter tilbage!** 🚀

---

## 📞 HVIS DU SIDDER FAST

Send mig:

1. Screenshot af fejlen
2. Copy-paste fejlmeddelelsen
3. Hvilken SQL du kører (001 eller 002)

Jeg fixer det med det samme! 💪
