# Supabase - Nuværende Tilstand (Oktober 2025)

**Oprettet:** 20. Oktober 2025  
**Formål:** Dokumentation af eksisterende Supabase-struktur før consolidation

---

## 📊 Overview

**Antal Supabase Projekter I Brug:** 2 (måske flere)

| Projekt | App | Status | Tabeller | Features |
|---------|-----|--------|----------|----------|
| 🔵 TekupVault | vault-api + vault-worker | ✅ Production | 3 | pgvector, RLS, semantic search |
| 💰 Tekup-Billy | MCP Server | ✅ Production | 6+ | Caching, audit, encryption |
| ❓ Mulige andre | - | ⚠️ Ukendt | ? | Skal undersøges |

---

## 🔵 TekupVault Supabase Project

**Production URL:** `https://tekupvault.onrender.com`  
**Database:** Supabase PostgreSQL + pgvector  
**Region:** Formentlig EU (Frankfurt eller London)

### Schema Structure

```sql
-- Extensions
CREATE EXTENSION vector;  -- pgvector for embeddings

-- Enums
CREATE TYPE source_type AS ENUM ('github', 'supabase', 'render', 'copilot');
CREATE TYPE sync_status AS ENUM ('pending', 'in_progress', 'success', 'error');
```

### Tabeller (3 stk)

#### 1. **vault_documents** - Dokument storage
```sql
CREATE TABLE vault_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source source_type NOT NULL,
    repository VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    sha VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (source, repository, path)
);

-- Indexes
CREATE INDEX idx_vault_documents_source ON vault_documents(source);
CREATE INDEX idx_vault_documents_repository ON vault_documents(repository);
CREATE INDEX idx_vault_documents_updated_at ON vault_documents(updated_at DESC);
CREATE INDEX idx_vault_documents_metadata ON vault_documents USING GIN(metadata);
```

**Data:** ~1,000+ dokumenter fra 14 GitHub repos

#### 2. **vault_embeddings** - Vector embeddings
```sql
CREATE TABLE vault_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES vault_documents(id) ON DELETE CASCADE,
    embedding VECTOR(1536) NOT NULL,  -- OpenAI ada-002 embeddings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (document_id)
);

-- IVFFlat index for fast similarity search
CREATE INDEX idx_vault_embeddings_vector 
ON vault_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Data:** ~1,000+ vector embeddings (1536 dimensioner hver)

#### 3. **vault_sync_status** - Sync tracking
```sql
CREATE TABLE vault_sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source source_type NOT NULL,
    repository VARCHAR(255) NOT NULL,
    status sync_status NOT NULL DEFAULT 'pending',
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (source, repository)
);

-- Indexes
CREATE INDEX idx_vault_sync_status_source ON vault_sync_status(source);
CREATE INDEX idx_vault_sync_status_status ON vault_sync_status(status);
CREATE INDEX idx_vault_sync_status_updated_at ON vault_sync_status(updated_at DESC);
```

**Data:** ~14 repos tracked

### Functions

#### **match_documents()** - Semantic search
```sql
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_source source_type DEFAULT NULL,
    filter_repository VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    source source_type,
    repository VARCHAR,
    path TEXT,
    content TEXT,
    metadata JSONB,
    sha VARCHAR,
    similarity FLOAT
)
```

**Brug:** Cosine similarity search via pgvector

### Row Level Security (RLS)

```sql
-- Enabled på alle tabeller
ALTER TABLE vault_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_sync_status ENABLE ROW LEVEL SECURITY;

-- Service role: Full access
CREATE POLICY "Service role full access to documents"
  ON vault_documents FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Authenticated: Read-only
CREATE POLICY "Authenticated users can read documents"
  ON vault_documents FOR SELECT
  USING (auth.role() = 'authenticated');

-- Anonymous: No access (implicit deny)
```

### Migrations Applied

1. `20250114000000_initial_schema.sql` - Initial tables, indexes, functions
2. `20250116000000_add_rls_policies.sql` - Row Level Security policies

### Connection Info

```env
# TekupVault .env
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...  # Used for API
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
```

### Current Usage

**API Calls:**
- `/api/search` - Semantic search across documents
- `/api/sync-status` - Check sync health
- `/webhook/github` - GitHub push events

**Worker:**
- Syncs 14 repos every 6 hours
- Generates embeddings for new documents
- Updates sync status

---

## 💰 Tekup-Billy Supabase Project

**Production URL:** `https://tekup-billy.onrender.com`  
**Database:** Supabase PostgreSQL  
**Region:** Formentlig EU

### Schema Structure (Baseret på docs)

#### Tabeller (Minimum 6)

1. **billy_organizations** - Organization management
```sql
CREATE TABLE billy_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT UNIQUE NOT NULL,
    organization_name TEXT,
    api_key_encrypted TEXT NOT NULL,  -- AES-256-GCM encrypted
    api_key_iv TEXT NOT NULL,
    api_key_tag TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);
```

2. **billy_cached_invoices** - Invoice caching
```sql
CREATE TABLE billy_cached_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    invoice_id TEXT NOT NULL,
    invoice_data JSONB NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE (organization_id, invoice_id)
);

CREATE INDEX idx_cached_invoices_org ON billy_cached_invoices(organization_id);
CREATE INDEX idx_cached_invoices_expires ON billy_cached_invoices(expires_at);
```

3. **billy_cached_customers** - Customer caching
```sql
CREATE TABLE billy_cached_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    customer_data JSONB NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE (organization_id, customer_id)
);
```

4. **billy_cached_products** - Product caching
```sql
CREATE TABLE billy_cached_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_data JSONB NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE (organization_id, product_id)
);
```

5. **billy_audit_logs** - Audit trail
```sql
CREATE TABLE billy_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON billy_audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created ON billy_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON billy_audit_logs(action);
```

6. **billy_usage_metrics** - Usage tracking
```sql
CREATE TABLE billy_usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    total_execution_time_ms BIGINT DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_metrics_org ON billy_usage_metrics(organization_id);
CREATE INDEX idx_usage_metrics_tool ON billy_usage_metrics(tool_name);
```

### Mulige Yderligere Tabeller

7. **billy_rate_limits** - Rate limiting
8. **billy_webhooks** - Webhook subscriptions (hvis implementeret)
9. **billy_presets** - Workflow presets (v1.4.0+)

### Security Features

**Encryption:**
- API keys encrypted med AES-256-GCM
- Scrypt key derivation
- Unique IV per encryption

**Access Control:**
- Organization-based isolation
- Service role for backend operations
- Authenticated users for future multi-tenant

### Connection Info

```env
# Tekup-Billy .env
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
ENCRYPTION_KEY=your-32-char-passphrase
ENCRYPTION_SALT=your-16-char-salt
```

### Current Usage

**Features:**
- ✅ 5x hurtigere responses (caching)
- ✅ Audit trail for alle operations
- ✅ Usage analytics
- ✅ Rate limiting per organization
- ✅ Multi-tenant support

**Performance:**
- Cache hit rate: ~80%
- Average response time: <100ms (cached)
- 25 MCP tools supported

---

## 🔍 Potentielle Andre Supabase Projekter

### Skal Undersøges

Følgende projekter **kan** bruge Supabase, men skal verificeres:

1. **tekup-cloud-dashboard**
   - Bruger `@supabase/supabase-js` i dependencies
   - Connection til enten TekupVault eller eget projekt?

2. **Tekup-org apps**
   - Flere apps med Prisma schemas
   - Nogle kan være i Supabase-migration fase

3. **RenOS (Tekup Google AI)**
   - Dokumentation nævner "supabase-migration-package"
   - Status ukendt - sandsynligvis stadig Prisma

### Hvordan Tjekke

```bash
# Søg efter Supabase URLs i alle projekter
grep -r "supabase.co" c:/Users/empir/*/

# Tjek .env filer
find c:/Users/empir/ -name ".env*" -exec grep -l SUPABASE {} \;

# Se hvilke apps bruger @supabase/supabase-js
find c:/Users/empir/ -name "package.json" -exec grep -l "@supabase/supabase-js" {} \;
```

---

## 📊 Supabase Resource Usage (Estimat)

### TekupVault Projekt

```
Database Size: ~100-200 MB
- Documents: ~50 MB (text content)
- Embeddings: ~50-100 MB (vector data)
- Metadata: ~10 MB

Row Count:
- vault_documents: ~1,000 rows
- vault_embeddings: ~1,000 rows
- vault_sync_status: ~14 rows

API Requests: ~10,000/måned
- Search queries: ~5,000/måned
- Sync operations: ~720/måned (every 6 hours)
- Webhook calls: ~1,000/måned
```

### Tekup-Billy Projekt

```
Database Size: ~50-100 MB
- Cached data: ~30-50 MB (JSONB)
- Audit logs: ~10-20 MB
- Organizations: <1 MB

Row Count:
- billy_cached_invoices: ~500-1,000 rows
- billy_cached_customers: ~200-500 rows
- billy_cached_products: ~100-300 rows
- billy_audit_logs: ~5,000-10,000 rows
- billy_usage_metrics: ~100-200 rows

API Requests: ~50,000/måned
- MCP tool calls: ~40,000/måned
- Cache lookups: ~30,000/måned
- Audit writes: ~40,000/måned
```

### Combined (Hvis Samme Projekt)

```
Total Database Size: ~150-300 MB
Total Row Count: ~8,000-13,000 rows
Total API Requests: ~60,000/måned
```

**Supabase Free Tier Limits:**
- ✅ Database: 500 MB (vi bruger ~150-300 MB)
- ✅ API Requests: 500,000/måned (vi bruger ~60k)
- ✅ Storage: 1 GB (ikke brugt endnu)

**Status:** 🟢 **Inden for free tier!**

---

## 🎯 Migration Readiness

### TekupVault: ✅ KLAR

**Status:** Production-ready på Supabase  
**Schema:** Veldefineret, migreret, RLS aktiveret  
**Data:** Synkroniseret og indexed  
**Action:** Kan flyttes til `vault` schema i centralt projekt

**Migration complexity:** 🟢 LAV
- Kræver schema præfix (vault.*)
- Opdater connection strings
- Test semantic search

### Tekup-Billy: ✅ KLAR

**Status:** Production-ready på Supabase  
**Schema:** 6+ tabeller, encryption setup  
**Data:** Caching, audit, metrics operational  
**Action:** Kan flyttes til `billy` schema i centralt projekt

**Migration complexity:** 🟢 LAV
- Kræver schema præfix (billy.*)
- Encryption keys skal bevares
- Test caching logic

### Estimeret Effort

**Hvis TekupVault og Billy ER på samme projekt:**
- Migration: 2-3 timer (schema reorganization)
- Testing: 1-2 timer
- **Total:** 4-5 timer

**Hvis de ER på separate projekter:**
- Migration: 4-6 timer (data migration + schema merge)
- Testing: 2-3 timer
- **Total:** 6-9 timer

---

## 🔗 Connection Strings Nuværende

### TekupVault

```bash
# REST API (anon key)
SUPABASE_URL=https://[vault-project].supabase.co
SUPABASE_ANON_KEY=eyJhbGci...

# Direct PostgreSQL (service role)
DATABASE_URL=postgresql://postgres.[vault-project]:[password]@db.[vault-project].supabase.co:5432/postgres

# Pooler (Supavisor) - for production
DATABASE_URL=postgresql://postgres.[vault-project]:[password]@[region].pooler.supabase.com:5432/postgres
```

### Tekup-Billy

```bash
# REST API
SUPABASE_URL=https://[billy-project].supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

# Encryption keys (bevares efter migration)
ENCRYPTION_KEY=32-char-passphrase
ENCRYPTION_SALT=16-char-salt
```

---

## 📋 Migration Plan Overview

### Fase 1: Verificer Struktur ✅
- [x] Dokumenter TekupVault schema
- [x] Dokumenter Tekup-Billy schema
- [ ] Verificer om de bruger samme Supabase projekt
- [ ] Find andre potentielle Supabase-projekter

### Fase 2: Forbered Central Database
- [ ] Opret nyt Supabase projekt ELLER brug eksisterende
- [ ] Opret schemas: vault, billy, renos, crm, flow, shared
- [ ] Setup RLS policies per schema
- [ ] Konfigurer connection pooling

### Fase 3: Migrer Eksisterende (Vault & Billy)
- [ ] Eksporter data fra nuværende projekt(er)
- [ ] Migrer til vault/billy schemas
- [ ] Opdater connection strings i apps
- [ ] Test thorougly
- [ ] Cutover

### Fase 4: Migrer Prisma Apps (RenOS osv.)
- [ ] Se separat migration plan

---

## 🛠️ Verificering Commands

```bash
# Tjek om TekupVault og Billy bruger samme projekt
cd c:/Users/empir/TekupVault
grep SUPABASE_URL .env

cd c:/Users/empir/Tekup-Billy
grep SUPABASE_URL .env

# Sammenlign project IDs
# Hvis de er ens = samme projekt = lettere migration
# Hvis forskellige = separate projekter = mere arbejde

# Test connections
psql $VAULT_DATABASE_URL -c "\dt"
psql $BILLY_DATABASE_URL -c "\dt"

# Se om schemas allerede er separate
psql $DATABASE_URL -c "\dn"
```

---

## 📊 Cost Analysis

### Current Setup

**Hvis 2 separate Supabase projekter:**
```
TekupVault: Free tier (0 kr/mdr)
Tekup-Billy: Free tier (0 kr/mdr)
Total: 0 kr/mdr (men rammer limits hurtigere)
```

**Hvis 1 Supabase projekt (shared):**
```
Combined project: Free tier (0 kr/mdr)
Total: 0 kr/mdr (mere headroom)
```

### Efter Consolidation (Alle Apps)

**Estimeret resource brug:**
```
Database size: ~500 MB - 1 GB
API requests: ~200,000/måned
Connections: ~50 concurrent
```

**Anbefalet tier:**
```
Supabase Pro: $25/mdr
- 8 GB database (rigeligt)
- 50 GB bandwidth
- 100 GB storage
- Prioriteret support
```

**ROI:** Sparer stadig 30-65% sammenlignet med 5 separate databases!

---

## ✅ Næste Skridt

1. **Verificer om TekupVault og Billy deler projekt**
   ```bash
   cd c:/Users/empir/TekupVault && grep SUPABASE_URL .env
   cd c:/Users/empir/Tekup-Billy && grep SUPABASE_URL .env
   ```

2. **Find alle Supabase connections**
   ```bash
   grep -r "supabase.co" c:/Users/empir/*/
   ```

3. **Beslut migration strategi**
   - Samme projekt: Schema reorganization
   - Forskellige projekter: Data migration

4. **Opret migration plan** baseret på findings

---

**Dokumentet opdateres løbende med findings fra verification.**

**Last Updated:** 20. Oktober 2025, 21:52
