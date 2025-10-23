# ✅ Supabase Status - Dashboard Confirmed

**Dato:** 22. Oktober 2025, 03:40  
**Kilde:** Supabase Dashboard Screenshot

---

## 🎯 BEKRÆFTET: 2 Supabase Projekter

### **Projekt 1: RenOS By Tekup**
```
Name: RenOS By Tekup
Region: AWS eu-central-1 (Frankfurt, Germany)
Tier: nano (Free tier)
Project ID: oaevagdgrasfppbrxbey
URL: https://oaevagdgrasfppbrxbey.supabase.co
```

**Bruges af:**
- ✅ Tekup-Billy (billy_* tabeller)
- ✅ Tekup Google AI (RenOS - 19 models)
- ✅ RendetaljeOS (duplicate af Google AI?)

**Tabeller:** ~25+ (RenOS models + Billy cache/audit)

---

### **Projekt 2: TekupVault**
```
Name: TekupVault
Region: AWS eu-west-3 (Paris, France)
Tier: nano (Free tier)
Project ID: twaoebtlusudzxshjral
URL: https://twaoebtlusudzxshjral.supabase.co
```

**Bruges af:**
- ✅ TekupVault (vault-api + vault-worker)

**Tabeller:** 3
- vault_documents
- vault_embeddings (pgvector)
- vault_sync_status

---

## 🎯 KLAR KONSOLIDERINGSSTRATEGI

### **Option A: Merge TekupVault → RenOS Projekt** ⭐ ANBEFALET

**Hvorfor:**
- RenOS projekt er i Frankfurt (tættere på Danmark)
- Allerede delt mellem 3 apps
- Større capacity allerede i brug

**Migration:**
```sql
-- I RenOS projekt (oaevagdgrasfppbrxbey):

-- 1. Opret vault tabeller
CREATE TABLE vault_documents (...);
CREATE TABLE vault_embeddings (...);
CREATE TABLE vault_sync_status (...);

-- 2. Migrer data fra TekupVault projekt
-- (Use Supabase migration tools eller pg_dump/restore)

-- 3. Install pgvector (hvis ikke done)
CREATE EXTENSION IF NOT EXISTS vector;
```

**Resultat:**
```
1 Supabase Projekt: RenOS By Tekup
├── Vault tabeller (3)
├── Billy tabeller (6+)
├── RenOS tabeller (19)
└── Total: ~28+ tabeller

Region: Frankfurt (optimal for DK)
Cost: FREE (nano tier)
```

**Effort:** 2-3 timer  
**Downtime:** ~10 minutter for TekupVault  

---

### **Option B: Opret Nyt "Tekup Central" Projekt**

**Hvorfor:**
- Clean slate
- Proper multi-schema design fra start
- Følger tekup-database schema structure

**Setup:**
```sql
-- Nyt projekt: "tekup-central-database"
-- Region: eu-central-1 (Frankfurt)

-- Opret schemas:
CREATE SCHEMA vault;
CREATE SCHEMA billy;
CREATE SCHEMA renos;
CREATE SCHEMA crm;
CREATE SCHEMA flow;
CREATE SCHEMA shared;

-- Install extensions:
CREATE EXTENSION vector;
CREATE EXTENSION "uuid-ossp";

-- Migrer data fra begge projekter
```

**Resultat:**
```
1 Supabase Projekt: tekup-central-database
├── vault schema (3 tables)
├── billy schema (6+ tables)
├── renos schema (19 tables)
├── crm schema (ready for future)
├── flow schema (ready for future)
└── shared schema (2 tables)

Region: Frankfurt
Cost: FREE → $25/mo (når vi scaler)
```

**Effort:** 4-6 timer  
**Downtime:** ~30 minutter total  

---

## 💰 Cost Analysis

### **Current (2 projekter):**
```
RenOS: nano tier = FREE
TekupVault: nano tier = FREE
─────────────────────────
Total: $0/mdr
```

### **After Merge (1 projekt):**
```
RenOS (merged): nano tier = FREE
eller
Tekup Central: nano tier = FREE
─────────────────────────
Total: $0/mdr

Ved scale (>500MB):
Pro tier: $25/mdr
```

**Konklusion:** Ingen cost forskel nu, men nemmere at scale senere

---

## 🚀 Migration Plan - Detaljeret

### **STEP 1: Backup Alt** (30 min)
```bash
# Backup RenOS projekt
supabase db dump --db-url="postgresql://postgres:...@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres" > renos-backup.sql

# Backup TekupVault projekt  
supabase db dump --db-url="postgresql://postgres:...@db.twaoebtlusudzxshjral.supabase.co:5432/postgres" > vault-backup.sql
```

---

### **STEP 2: Opret Vault Tabeller i RenOS** (1 time)
```bash
# Connect til RenOS projekt
psql "postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres"
```

```sql
-- Install pgvector (hvis ikke allerede)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enums
CREATE TYPE source_type AS ENUM ('github', 'supabase', 'render', 'copilot');
CREATE TYPE sync_status AS ENUM ('pending', 'in_progress', 'success', 'error');

-- Create vault tables
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

CREATE TABLE vault_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES vault_documents(id) ON DELETE CASCADE,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (document_id)
);

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

-- Create indexes
CREATE INDEX idx_vault_documents_source ON vault_documents(source);
CREATE INDEX idx_vault_documents_repository ON vault_documents(repository);
CREATE INDEX idx_vault_documents_updated_at ON vault_documents(updated_at DESC);
CREATE INDEX idx_vault_documents_metadata ON vault_documents USING GIN(metadata);

CREATE INDEX idx_vault_embeddings_vector 
ON vault_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_vault_sync_status_source ON vault_sync_status(source);
CREATE INDEX idx_vault_sync_status_status ON vault_sync_status(status);
CREATE INDEX idx_vault_sync_status_updated_at ON vault_sync_status(updated_at DESC);
```

---

### **STEP 3: Migrer Data** (1 time)
```bash
# Option A: Direct copy (hurtigst)
pg_dump "postgresql://postgres:...@db.twaoebtlusudzxshjral.supabase.co:5432/postgres" \
  --data-only --table=vault_documents --table=vault_embeddings --table=vault_sync_status \
  | psql "postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres"

# Option B: Export/Import via CSV (mere kontrol)
# Export from TekupVault
# Import to RenOS
```

---

### **STEP 4: Update TekupVault App** (30 min)
```typescript
// apps/vault-api/.env
// OLD:
SUPABASE_URL=https://twaoebtlusudzxshjral.supabase.co
SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://postgres.twaoebtlusudzxshjral:...

// NEW:
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
DATABASE_URL=postgresql://postgres.oaevagdgrasfppbrxbey:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres
```

---

### **STEP 5: Test Everything** (30 min)
```bash
# Test TekupVault
cd c:/Users/empir/TekupVault
pnpm test

# Test semantic search
curl http://localhost:3002/api/search?q=test

# Verify data count matches
psql "..." -c "SELECT COUNT(*) FROM vault_documents;"
```

---

### **STEP 6: Cutover & Cleanup** (15 min)
```bash
# Deploy updated TekupVault to production
git commit -am "feat: migrate to consolidated RenOS Supabase project"
git push

# Wait for deployment
# Verify production works

# Decommission old TekupVault projekt
# (Keep backup for 30 days before deleting)
```

---

## ✅ Post-Migration Status

### **Før:**
```
Projekt 1: TekupVault (Paris) - 3 tabeller
Projekt 2: RenOS (Frankfurt) - 25 tabeller
```

### **Efter:**
```
Projekt: RenOS By Tekup (Frankfurt) - 28 tabeller
├── Vault: vault_documents, vault_embeddings, vault_sync_status
├── Billy: billy_organizations, billy_cached_*, billy_audit_logs
└── RenOS: leads, customers, bookings, invoices, etc.
```

---

## 🎯 Næste Skridt - Dit Valg

### **A) Start Migration Nu** (2-3 timer total)
- Jeg guider dig step-by-step
- Minimal downtime
- Klar til at starte

### **B) Planlæg Migration** (beslut senere)
- Lav detaljeret timeline
- Koordiner med team
- Schedule maintenance window

### **C) Behold Som Nu** (0 timer)
- 2 projekter virker fint
- Ingen akut behov

---

**Mit råd:** Option A - migrer nu mens vi har momentum og alt er friskt i hukommelsen! 🚀

Hvad siger du - skal vi køre migration nu?
