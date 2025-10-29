# 🚀 Migration Plan - TekupVault, Tekup-Billy, RendetaljeOS

**Dato:** 22. Oktober 2025, 03:43  
**Scope:** 3 primære repos til central database  
**Estimeret tid:** 8-10 timer total

---

## 🎯 Mål

**Fra:**
```
TekupVault → Supabase (twaoebtlusudzxshjral - Paris)
Tekup-Billy → Supabase (oaevagdgrasfppbrxbey - Frankfurt)  
RendetaljeOS → Supabase (oaevagdgrasfppbrxbey - Frankfurt)
```

**Til:**
```
TekupVault → RenOS Supabase (oaevagdgrasfppbrxbey - Frankfurt)
Tekup-Billy → RenOS Supabase (samme projekt, optimeret)
RendetaljeOS → RenOS Supabase (samme projekt, optimeret)

RESULTAT: 1 Supabase projekt for alle 3 apps ✅
```

---

## 📋 Repo Status

### 1. **TekupVault**

- **Current:** Separat Supabase projekt (Paris)
- **Database:** 3 tabeller (documents, embeddings, sync_status)
- **Tech:** Supabase client + pgvector
- **Migration:** Merge til RenOS projekt
- **Effort:** 2-3 timer

### 2. **Tekup-Billy**

- **Current:** Allerede på RenOS projekt (Frankfurt)
- **Database:** 6+ tabeller (billy_*)
- **Tech:** Supabase client + encryption
- **Migration:** Minimal - kun optimization
- **Effort:** 1 time

### 3. **RendetaljeOS**

- **Current:** Allerede på RenOS projekt (Frankfurt)
- **Database:** 19 Prisma models (leads, customers, bookings, etc.)
- **Tech:** Prisma ORM → Supabase
- **Migration:** Opdater til @tekup/database client (optional)
- **Effort:** 3-4 timer

---

## 🗺️ Migration Phases

### **PHASE 1: Setup & Forberedelse** ⏱️ 1-2 timer

#### 1.1 Backup Alle Data

```bash
# Backup TekupVault projekt (Paris)
cd c:/Users/empir/TekupVault
supabase db dump --db-url="postgresql://postgres.twaoebtlusudzxshjral:...@db.twaoebtlusudzxshjral.supabase.co:5432/postgres" \
  > backups/tekupvault-backup-$(date +%Y%m%d).sql

# Backup RenOS projekt (Frankfurt) - Billy + RendetaljeOS
supabase db dump --db-url="postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres" \
  > backups/renos-backup-$(date +%Y%m%d).sql
```

#### 1.2 Verificer Current State

```sql
-- Connect til RenOS projekt
psql "postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres"

-- List alle tabeller
\dt

-- Check sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check Billy tabeller
SELECT * FROM billy_organizations LIMIT 1;

-- Check RenOS tabeller  
SELECT COUNT(*) FROM leads;
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM bookings;
```

#### 1.3 Opret Migration Branches

```bash
# TekupVault
cd c:/Users/empir/TekupVault
git checkout -b feat/migrate-to-consolidated-supabase
git add .
git stash  # Gem uncommitted hvis nødvendigt

# Tekup-Billy
cd c:/Users/empir/Tekup-Billy
git checkout -b feat/optimize-supabase-connection
git add .
git stash

# RendetaljeOS
cd c:/Users/empir/RendetaljeOS
git checkout -b feat/update-database-connection
git add .
git stash
```

---

### **PHASE 2: Migrer TekupVault** ⏱️ 2-3 timer

#### 2.1 Opret Vault Tabeller i RenOS Projekt

```sql
-- Connect til RenOS projekt
psql "postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres"

-- Install pgvector (hvis ikke allerede)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enums
CREATE TYPE source_type AS ENUM ('github', 'supabase', 'render', 'copilot');
CREATE TYPE sync_status AS ENUM ('pending', 'in_progress', 'success', 'error');

-- Create vault_documents
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

CREATE INDEX idx_vault_documents_source ON vault_documents(source);
CREATE INDEX idx_vault_documents_repository ON vault_documents(repository);
CREATE INDEX idx_vault_documents_updated_at ON vault_documents(updated_at DESC);
CREATE INDEX idx_vault_documents_metadata ON vault_documents USING GIN(metadata);

-- Create vault_embeddings
CREATE TABLE vault_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES vault_documents(id) ON DELETE CASCADE,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (document_id)
);

-- IVFFlat index for fast similarity search
CREATE INDEX idx_vault_embeddings_vector 
ON vault_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create vault_sync_status
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

CREATE INDEX idx_vault_sync_status_source ON vault_sync_status(source);
CREATE INDEX idx_vault_sync_status_status ON vault_sync_status(status);
CREATE INDEX idx_vault_sync_status_updated_at ON vault_sync_status(updated_at DESC);

-- Create RLS policies (samme som original)
ALTER TABLE vault_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to documents"
  ON vault_documents FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Authenticated users can read documents"
  ON vault_documents FOR SELECT
  USING (auth.role() = 'authenticated');

-- Repeat for embeddings and sync_status...
```

#### 2.2 Migrer Data

```bash
# Export data fra TekupVault projekt
pg_dump "postgresql://postgres.twaoebtlusudzxshjral:...@db.twaoebtlusudzxshjral.supabase.co:5432/postgres" \
  --data-only \
  --table=vault_documents \
  --table=vault_embeddings \
  --table=vault_sync_status \
  > vault-data-export.sql

# Import til RenOS projekt
psql "postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres" \
  < vault-data-export.sql

# Verify counts match
# Original:
psql "postgresql://postgres.twaoebtlusudzxshjral:...@db.twaoebtlusudzxshjral.supabase.co:5432/postgres" \
  -c "SELECT 'documents' as table, COUNT(*) FROM vault_documents 
      UNION ALL SELECT 'embeddings', COUNT(*) FROM vault_embeddings
      UNION ALL SELECT 'sync_status', COUNT(*) FROM vault_sync_status;"

# New:
psql "postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres" \
  -c "SELECT 'documents' as table, COUNT(*) FROM vault_documents 
      UNION ALL SELECT 'embeddings', COUNT(*) FROM vault_embeddings
      UNION ALL SELECT 'sync_status', COUNT(*) FROM vault_sync_status;"
```

#### 2.3 Update TekupVault App

```bash
cd c:/Users/empir/TekupVault

# Update .env files
# apps/vault-api/.env
# apps/vault-worker/.env
```

```env
# OLD (Paris projekt):
SUPABASE_URL=https://twaoebtlusudzxshjral.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3YW9lYnRsdXN1ZHp4c2hqcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjMyMTAsImV4cCI6MjA3NjAzOTIxMH0.rS8Z5tCssvh8swyn7mtZlI-xtmyQjNEA-13fDvU5Oww
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3YW9lYnRsdXN1ZHp4c2hqcmFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2MzIxMCwiZXhwIjoyMDc2MDM5MjEwfQ.eBdhCLPdXoO6B6k1GrybkswcOjL1InwJo6qwoqH7ec8
DATABASE_URL=postgresql://postgres.twaoebtlusudzxshjral:Habibie12%40@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# NEW (Frankfurt RenOS projekt):
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Nzc3NjQsImV4cCI6MjA3NTQ1Mzc2NH0.M0Kt1Xi-3VVoq6NJ7VbhqBC0z9EK-JQ7ypssayMw7s8
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.94lDERK4Enw8YTH_OtE9BpQhQWs8fg_7GZQGnYS8rNo
DATABASE_URL=postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres
```

#### 2.4 Test TekupVault

```bash
# Start local
cd c:/Users/empir/TekupVault
pnpm install
pnpm dev

# Test API
curl http://localhost:3002/health
curl http://localhost:3002/api/search?q=test

# Test semantic search
# Verify embeddings work
# Check sync status
```

---

### **PHASE 3: Opdater Tekup-Billy** ⏱️ 1 time

Billy er allerede på RenOS projekt, så minimal migration:

#### 3.1 Verify Current Setup

```bash
cd c:/Users/empir/Tekup-Billy

# Check .env
cat .env | grep SUPABASE
# Skulle allerede være: oaevagdgrasfppbrxbey ✅
```

#### 3.2 Optimization (Optional)

```bash
# Opdater til nyeste Supabase client
pnpm update @supabase/supabase-js

# Test connections
pnpm test

# Verify encryption keys bevaret
# Test cache functionality
```

---

### **PHASE 4: Opdater RendetaljeOS** ⏱️ 3-4 timer

#### 4.1 Current Status Check

```bash
cd c:/Users/empir/RendetaljeOS

# Check backend .env
cat apps/backend/.env | grep SUPABASE
# Skulle allerede være: oaevagdgrasfppbrxbey ✅

# Check Prisma schema
cat apps/backend/prisma/schema.prisma | head -20
```

#### 4.2 Option A: Keep Prisma (Minimal Change)

```bash
# Verify connection virker
cd apps/backend
pnpm db:generate
pnpm db:push

# Test app
cd ../..
pnpm dev
```

#### 4.3 Option B: Migrate til @tekup/database (Advanced)

```bash
# Install central database package
cd apps/backend
pnpm add @tekup/database@file:../../../tekup-database

# Update imports
# Replace: import { prisma } from './lib/prisma'
# With: import { renos } from '@tekup/database'

# Update queries
# Before: await prisma.lead.findMany(...)
# After: await renos.findLeads(...)
```

**Decision:** Start med Option A (keep Prisma) for sneller migration

---

### **PHASE 5: Testing** ⏱️ 1-2 timer

#### 5.1 Individual App Tests

```bash
# Test 1: TekupVault
cd c:/Users/empir/TekupVault
pnpm dev
# Verify: Search works, embeddings work, sync works

# Test 2: Tekup-Billy
cd c:/Users/empir/Tekup-Billy
pnpm test
# Verify: Cache works, audit logs, encryption

# Test 3: RendetaljeOS
cd c:/Users/empir/RendetaljeOS
pnpm dev
# Verify: Frontend loads, backend API works, database queries work
```

#### 5.2 Integration Tests

```bash
# Test alle 3 apps køre samtidigt
# Verify ingen connection pool issues
# Check Supabase dashboard for metrics
```

---

### **PHASE 6: Documentation & Cleanup** ⏱️ 1 time

#### 6.1 Update Documentation

```bash
# TekupVault
cd c:/Users/empir/TekupVault
# Update README.md med nye Supabase URLs
git add .
git commit -m "feat: migrate to consolidated RenOS Supabase project"
git push

# Tekup-Billy
cd c:/Users/empir/Tekup-Billy
git add .
git commit -m "docs: update Supabase connection documentation"
git push

# RendetaljeOS  
cd c:/Users/empir/RendetaljeOS
git add .
git commit -m "docs: confirm RenOS Supabase project connection"
git push
```

#### 6.2 Cleanup Old Resources

```bash
# Keep TekupVault Paris projekt i 30 dage (backup)
# Documenter decommission plan
# Update all docs med nye connection details
```

---

## 📊 Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Setup & Backup | 1-2h | ⏳ Pending |
| 2 | TekupVault Migration | 2-3h | ⏳ Pending |
| 3 | Billy Optimization | 1h | ⏳ Pending |
| 4 | RendetaljeOS Update | 3-4h | ⏳ Pending |
| 5 | Testing | 1-2h | ⏳ Pending |
| 6 | Docs & Cleanup | 1h | ⏳ Pending |
| **TOTAL** | **End-to-end** | **9-13h** | ⏳ **Ready** |

**Anbefalet opdeling:**

- Session 1 (4h): Phase 1-2 (TekupVault migration)
- Session 2 (2h): Phase 3 (Billy optimization)
- Session 3 (4h): Phase 4-5 (RendetaljeOS + testing)
- Session 4 (1h): Phase 6 (documentation)

---

## ✅ Success Criteria

- [ ] TekupVault fungerer på RenOS projekt
- [ ] Semantic search virker (pgvector)
- [ ] Tekup-Billy cache/audit virker
- [ ] Encryption keys bevaret
- [ ] RendetaljeOS frontend + backend virker
- [ ] Alle queries returnerer korrekt data
- [ ] Ingen connection pool errors
- [ ] Documentation opdateret
- [ ] Git committed og pushed
- [ ] Backup af gammel data

---

## 🚨 Rollback Plan

Hvis noget går galt:

```bash
# Restore TekupVault til Paris projekt
psql "postgresql://postgres.twaoebtlusudzxshjral:..." < backups/tekupvault-backup-YYYYMMDD.sql

# Revert .env ændringer
git checkout .env
git checkout apps/vault-api/.env
git checkout apps/vault-worker/.env

# Restore RenOS projekt hvis nødvendigt
psql "postgresql://postgres:Habibie12%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres" \
  < backups/renos-backup-YYYYMMDD.sql
```

---

## 🚀 Ready to Start?

**Fase 1 starter med backup og forberedelse!**

Klar til at begynde? Sig til! 🎯
