# 📊 Database Afsøgning - Tekup Workspace

**Dato:** 26. Oktober 2025  
**Analyseret af:** GitHub Copilot  
**Database Version:** PostgreSQL 16 + pgvector 0.8.1

---

## 🎯 Executive Summary

⚠️ **KRITISK STATUS: HYBRID MIGRATION - DELVIST FEJLET**

Tekup workspace har **ufuldstændig migration** fra Supabase til lokal Prisma:

```
📦 NUVÆRENDE STATUS:
├── 🐳 Docker (localhost:5432) - tekup_db
│   ├── ✅ 6 schemas deployed (vault, billy, renos, crm, flow, shared)
│   ├── ✅ 53 tabeller
│   └── � 0 rækker (TOM!)
│
└── ☁️ Supabase (oaevagdgrasfppbrxbey.supabase.co)
    ├── ⚠️ Stadig konfigureret i .env filer
    ├── ❓ Ukendt data status
    └── 🔄 Oprindelig cloud database
```

**PROBLEM:** Migration fra Supabase til Prisma er påbegyndt men IKKE fuldendt!

- ✅ Prisma schema deployed til lokal Docker
- ❌ Data IKKE migreret fra Supabase
- ⚠️ Apps peger stadig på forskellige databaser
- 🔄 HYBRID setup (skulle være consolidated)

---

## 🏗️ Database Arkitektur

### Primær Database: `tekup_db`

**Host:** Docker (localhost:5432)  
**Container:** `tekup-database-postgres`  
**Image:** `pgvector/pgvector:pg16`  
**Credentials:**

- User: `tekup`
- Password: `tekup123`
- Database: `tekup_db`

**Connection String:**

```
postgresql://tekup:tekup123@localhost:5432/tekup_db
```

---

## 📁 Schema Oversigt

### 1️⃣ **Vault Schema** (TekupVault - Knowledge Layer)

**Formål:** Central dokumentation og vector search  
**Tabeller:** 3

| Tabel         | Beskrivelse                                | Rækker |
| ------------- | ------------------------------------------ | ------ |
| `documents`   | Kildedokumenter (GitHub, Supabase, Render) | 0      |
| `embeddings`  | OpenAI vector embeddings (1536 dim)        | 0      |
| `sync_status` | Sync status per repository                 | 0      |

**Features:**

- ✅ pgvector support til semantic search
- ✅ Unique constraint på (source, repository, path)
- ✅ Indexes på source, repository, updated_at

**Brug:** `DATABASE_URL_VAULT=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=vault`

---

### 2️⃣ **Billy Schema** (Tekup-Billy MCP Server)

**Formål:** Billy.dk accounting API integration  
**Tabeller:** 8

| Tabel              | Beskrivelse                    | Rækker |
| ------------------ | ------------------------------ | ------ |
| `organizations`    | Billy organization credentials | 0      |
| `users`            | Billy user accounts            | 0      |
| `cached_invoices`  | Invoice cache                  | 0      |
| `cached_customers` | Customer cache                 | 0      |
| `cached_products`  | Product cache                  | 0      |
| `audit_logs`       | Tool execution logs            | 0      |
| `usage_metrics`    | API usage tracking             | 0      |
| `rate_limits`      | Rate limiting data             | 0      |

**Features:**

- ✅ Encrypted Billy API keys
- ✅ Supabase caching layer (5x speedup)
- ✅ Audit logging for all MCP tools
- ✅ Rate limit tracking

**Brug:** `DATABASE_URL_BILLY=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=billy`

---

### 3️⃣ **Renos Schema** (RendetaljeOS)

**Formål:** Complete cleaning service management  
**Tabeller:** 23

| Tabel                    | Beskrivelse            | Rækker |
| ------------------------ | ---------------------- | ------ |
| `leads`                  | Lead management        | 0      |
| `customers`              | Customer records       | 0      |
| `bookings`               | Cleaning bookings      | 0      |
| `invoices`               | Invoice management     | 0      |
| `invoice_line_items`     | Invoice line items     | 0      |
| `quotes`                 | Price quotes           | 0      |
| `services`               | Service catalog        | 0      |
| `cleaning_plans`         | Recurring plans        | 0      |
| `cleaning_plan_bookings` | Plan instances         | 0      |
| `cleaning_tasks`         | Task definitions       | 0      |
| `task_executions`        | Task execution logs    | 0      |
| `email_threads`          | Email conversations    | 0      |
| `email_messages`         | Individual emails      | 0      |
| `email_responses`        | Auto-responses         | 0      |
| `email_ingest_runs`      | Sync runs              | 0      |
| `chat_sessions`          | Live chat sessions     | 0      |
| `chat_messages`          | Chat messages          | 0      |
| `conversations`          | Customer conversations | 0      |
| `analytics`              | Business analytics     | 0      |
| `competitor_pricing`     | Market analysis        | 0      |
| `escalations`            | Issue tracking         | 0      |
| `labels`                 | Tagging system         | 0      |
| `breaks`                 | Employee breaks        | 0      |

**Features:**

- ✅ Full CRM functionality
- ✅ Email integration (Gmail)
- ✅ Live chat support
- ✅ AI-powered lead scoring
- ✅ Calendar integration

**Brug:** `DATABASE_URL_RENOS=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=renos`

---

### 4️⃣ **CRM Schema** (Tekup CRM)

**Formål:** Multi-tenant CRM platform  
**Tabeller:** 8

| Tabel            | Beskrivelse        | Rækker |
| ---------------- | ------------------ | ------ |
| `CrmCompany`     | Company records    | 0      |
| `CrmContact`     | Contact management | 0      |
| `CrmDeal`        | Sales deals        | 0      |
| `CrmDealProduct` | Deal products      | 0      |
| `CrmActivity`    | Activity tracking  | 0      |
| `CrmTask`        | Task management    | 0      |
| `CrmEmail`       | Email tracking     | 0      |
| `CrmMetric`      | KPI metrics        | 0      |

**Features:**

- ✅ Multi-tenant architecture
- ✅ Sales pipeline management
- ✅ Activity tracking
- ✅ Email integration

**Brug:** `DATABASE_URL_CRM=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=crm`

---

### 5️⃣ **Flow Schema** (Flow API)

**Formål:** Lead generation and compliance workflows  
**Tabeller:** 9

| Tabel               | Beskrivelse              | Rækker |
| ------------------- | ------------------------ | ------ |
| `FlowWorkflow`      | Workflow definitions     | 0      |
| `FlowExecution`     | Workflow runs            | 0      |
| `FlowExecutionStep` | Individual steps         | 0      |
| `FlowExecutionLog`  | Execution logs           | 0      |
| `FlowSchedule`      | Scheduled runs           | 0      |
| `FlowIntegration`   | Third-party integrations | 0      |
| `FlowWebhook`       | Webhook configs          | 0      |
| `FlowVariable`      | Workflow variables       | 0      |
| `FlowMetric`        | Performance metrics      | 0      |

**Features:**

- ✅ GDPR compliance workflows
- ✅ Lead validation
- ✅ Integration orchestration
- ✅ Webhook management

**Brug:** `DATABASE_URL_FLOW=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=flow`

---

### 6️⃣ **Shared Schema**

**Formål:** Shared resources across all applications  
**Tabeller:** 2

| Tabel        | Beskrivelse           | Rækker |
| ------------ | --------------------- | ------ |
| `users`      | Global user accounts  | 0      |
| `audit_logs` | Cross-app audit trail | 0      |

**Features:**

- ✅ Single sign-on (SSO) ready
- ✅ Centralized audit logging

**Brug:** `DATABASE_URL_SHARED=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=shared`

---

## 🔌 Installed Extensions

| Extension   | Version | Beskrivelse                             |
| ----------- | ------- | --------------------------------------- |
| `plpgsql`   | 1.0     | PL/pgSQL procedural language (default)  |
| `uuid-ossp` | 1.1     | UUID generation                         |
| `vector`    | 0.8.1   | pgvector for semantic search (1536 dim) |

---

## 📊 Database Statistik

### Samlet Oversigt

```
Total Schemas:     6
Total Tables:      53
Total Data Rows:   0 (empty database)
Database Size:     11 MB (schema only)
```

### Per Schema

| Schema | Tabeller | Data   | Status   |
| ------ | -------- | ------ | -------- |
| vault  | 3        | 0 rows | 🟡 Empty |
| billy  | 8        | 0 rows | 🟡 Empty |
| renos  | 23       | 0 rows | 🟡 Empty |
| crm    | 8        | 0 rows | 🟡 Empty |
| flow   | 9        | 0 rows | 🟡 Empty |
| shared | 2        | 0 rows | 🟡 Empty |

---

## 🌐 Cloud Databases (Supabase) - ⚠️ MIGRATION PROBLEM

### ⚠️ KRITISK: Oprindelig Plan vs. Faktisk Situation

**OPRINDELIG PLAN (Korrekt):**

```
✅ Konsolider ALLE apps til ÉT Supabase projekt
✅ Fordele: Auto backups, RLS security, real-time, lavere cost
✅ Mål: 1 database provider for alle apps
```

**HVAD DER SKETE (Forkert):**

```
❌ tekup-database deployed til LOCAL Docker i stedet for Supabase
❌ Problem: Nu har vi STADIG 2 forskellige providers:
   - Supabase: oaevagdgrasfppbrxbey.supabase.co (cloud)
   - Docker: localhost:5432 (local)
❌ Data IKKE migreret mellem dem
```

### Supabase Projekt: RenOS By Tekup

**URL:** <https://oaevagdgrasfppbrxbey.supabase.co>  
**Region:** EU Central 1 (Frankfurt)  
**Status:** � Active MEN ikke migreret korrekt  
**Tier:** nano → Pro ($25/mdr)

**Connection Strings (Stadig i brug i nogle apps):**

```bash
# Fra tekup-billy/.env:
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
DATABASE_URL=postgresql://tekup:tekup123@localhost:5432/tekup_db?schema=renos
```

**⚠️ PROBLEM:** Apps har BEGGE connection strings - hvilket bruges?

### Supabase Projekt: TekupVault (Legacy)

**URL:** <https://twaoebtlusudzxshjral.supabase.co>  
**Status:** � Legacy - skulle være migrated  
**Brug:** Gammel vault project - refereret i tekup-vault/.env.example

---

## 🔄 Migration Status - ⚠️ UFULDSTÆNDIG

### ✅ Schema Migration (Completed)

✅ **Prisma schema** → Deployed til Docker PostgreSQL  
✅ **6 schemas** → vault, billy, renos, crm, flow, shared  
✅ **53 tabeller** → Alle oprettet korrekt  
✅ **Extensions** → pgvector, uuid-ossp installeret

### ❌ Data Migration (IKKE GENNEMFØRT)

❌ **Supabase data** → IKKE migreret til lokal database  
❌ **Apps** → Peger stadig delvist på Supabase  
❌ **Consolidation** → IKKE completd (skulle være 1 provider)  
❌ **Backup strategy** → Ikke konfigureret

### 🚨 KRITISK PROBLEM: HYBRID SETUP

**Fra KRITISK_FEJL_ANALYSE.md:**

```
PROBLEM: Migration stoppede halvvejs!
- TekupVault → Delvist migreret (schema OK, data mangler)
- Tekup-Billy → Delvist migreret (peger på begge databaser!)
- tekup-ai → .env har begge connection strings
```

**Konsekvens:**

- 🔴 Apps kan være forbundet til forkert database
- 🔴 Data split mellem Supabase og Docker
- 🔴 Ingen single source of truth
- � Backup strategy mangler

### 🎯 Hvad Der Skulle Være Sket

**KORREKT MIGRATION PLAN:**

1. ✅ Opret Prisma schema (done)
2. ❌ Eksporter data fra Supabase → Ikke gjort!
3. ❌ Importer data til Prisma → Ikke gjort!
4. ❌ Update ALLE .env filer → Delvist gjort
5. ❌ Test alle apps → Ikke gjort
6. ❌ Deaktiver Supabase projekt → Ikke gjort

**ELLER:** Skulle vi have konsolideret til Supabase i stedet?

- Fra docs: "Konsolidering til ét Supabase-projekt er højst anbefalingsværdigt"
- Fordele: Auto backups, RLS, real-time, lavere cost
- Problem: Vi gik i stedet mod Docker lokalt!

---

## 🛠️ Management Tools

### Docker Compose

**File:** `apps/production/tekup-database/docker-compose.yml`

```bash
# Start database
cd apps/production/tekup-database
docker-compose up -d postgres

# Stop database
docker-compose down

# View logs
docker-compose logs -f postgres

# Reset database (⚠️ DESTRUCTIVE)
docker-compose down -v
docker-compose up -d
```

### Prisma Commands

```bash
cd apps/production/tekup-database

# Generate Prisma Client
pnpm db:generate

# Push schema to database
pnpm db:push

# Create migration
pnpm db:migrate dev --name migration_name

# Deploy migrations (production)
pnpm db:migrate deploy

# Open Prisma Studio (GUI)
pnpm db:studio

# Health check
pnpm db:health
```

### Direct PostgreSQL Access

```bash
# Via Docker
docker exec -it tekup-database-postgres psql -U tekup -d tekup_db

# Common commands
\dn              # List schemas
\dt vault.*      # List tables in vault schema
\d+ vault.documents  # Describe table
\dx              # List extensions
```

---

## 🔒 Security Considerations

### Local Development

✅ Standard credentials (tekup:tekup123)  
✅ Not exposed to internet (localhost only)  
✅ Docker network isolation

### Production (Supabase)

🔒 Encrypted credentials  
🔒 Row Level Security (RLS) enabled  
🔒 Connection pooling (Supavisor)  
🔒 EU data residency (Frankfurt)

---

## 📚 Related Documentation

| Document       | Path                                                       | Beskrivelse            |
| -------------- | ---------------------------------------------------------- | ---------------------- |
| README         | `apps/production/tekup-database/README.md`                 | Main docs              |
| Supabase Setup | `apps/production/tekup-database/SUPABASE_SETUP.md`         | Cloud setup            |
| Prisma Schema  | `apps/production/tekup-database/prisma/schema.prisma`      | Full schema definition |
| Migration Plan | `apps/production/tekup-database/MIGRATION_PLAN_3_REPOS.md` | Migration guide        |
| API Reference  | `apps/production/tekup-database/docs/API_REFERENCE.md`     | API docs               |

---

## 🚀 KRITISKE ANBEFALINGER - HANDLINGSPLAN

### 🚨 PRIORITET 1: Vælg Strategi (BESLUTNING PÅKRÆVET)

**Option A: Fuldfør Migration til Docker/Prisma**

```bash
1. Eksporter data fra Supabase
2. Importer til lokal tekup_db
3. Opdater ALLE .env filer til kun at bruge Docker
4. Fjern Supabase credentials fra production
5. Setup backup strategi for lokal database
```

✅ Fordele: Fuld kontrol, ingen cloud costs  
❌ Ulemper: Ingen auto backups, selv hosting, ingen real-time features

**Option B: Revert til Supabase (ANBEFALET)**

```bash
1. Deploy Prisma schema til Supabase i stedet
2. Brug Supabase som central database
3. Opdater alle apps til at bruge Supabase
4. Behold Docker kun til lokal development
5. Få auto backups, RLS, real-time gratis
```

✅ Fordele: Auto backups, RLS security, lavere total cost  
❌ Ulemper: Cloud dependency

**Option C: Hybrid (NUVÆRENDE - IKKE ANBEFALET)**

```bash
❌ Behold nuværende setup
❌ Apps peger på forskellige databaser
❌ Ingen konsistent data
❌ Forvirring for udviklere
```

🔴 **IKKE ANBEFALET** - dette er den nuværende rod!

### 🔧 Næste Skridt (Efter Strategi Valgt)

**Hvis Option A (Docker):**

1. 🚨 **Eksporter Supabase Data:** `pg_dump` fra cloud
2. 🚨 **Import til Docker:** `psql` import script
3. 🚨 **Cleanup .env files:** Fjern Supabase credentials
4. 🚨 **Test Alle Apps:** Verify connectivity
5. 🚨 **Setup Backups:** Automated backup script

**Hvis Option B (Supabase - ANBEFALET):**

1. 🚨 **Deploy Prisma til Supabase:** `prisma migrate deploy`
2. 🚨 **Update DATABASE_URL:** Point til Supabase
3. 🚨 **Test Connection:** Verify alle schemas
4. 🚨 **Cleanup Docker:** Keep for local dev only
5. ✅ **Profit:** Auto backups + RLS security gratis

### ⚠️ Warnings

- 🔴 **UNDGÅ:** At køre apps uden at vide hvilken database de bruger
- 🔴 **UNDGÅ:** At lave ændringer før strategi er valgt
- 🔴 **UNDGÅ:** At køre `db:push` på begge databaser
- ✅ **GØR:** Beslut strategi NU før videre udvikling

---

## 📞 Support

**Repository:** <https://github.com/TekupDK/tekup>  
**Database Package:** `apps/production/tekup-database`  
**Issues:** GitHub Issues  
**Version:** 1.3.0

---

**Genereret:** 26. Oktober 2025  
**Næste Review:** Når data migration er complete
