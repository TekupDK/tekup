# Render.com → Supabase Projekt Mapping

**Oprettet:** 20. Oktober 2025  
**Baseret på:** Deployment docs fra Render.com

---

## 🗺️ Komplet Mapping

### 1. **TekupVault** 🔵

**Render.com Deployment:**
```
URL: https://tekupvault-api.onrender.com (Web Service)
     https://tekupvault-worker.onrender.com (Worker)
Region: Frankfurt (eu-central-1)
Status: ✅ LIVE
Plan: Starter
```

**Supabase Projekt:**
```
Projekt: TekupVault
Region: AWS eu-west-3 (Paris)
Tier: nano (Free)
Database: PostgreSQL 15 + pgvector
```

**Environment Variables:**
```env
SUPABASE_URL=https://[tekupvault-project].supabase.co
DATABASE_URL=postgresql://postgres.[project]:[pwd]@db.[project].supabase.co:5432/postgres
```

**Tabeller:**
- `vault_documents`
- `vault_embeddings` (vector 1536)
- `vault_sync_status`

---

### 2. **Tekup-Billy** 💰

**Render.com Deployment:**
```
URL: https://tekup-billy.onrender.com
Region: Frankfurt (eu-central-1)
Status: ✅ LIVE (5+ min uptime)
Plan: Starter
Version: 1.0.0
```

**Supabase Projekt:**
```
Projekt: RenOS By Tekup
Region: AWS eu-central-1 (Frankfurt)
Tier: nano (Free)
Database: oaevagdgrasfppbrxbey.supabase.co
```

**Environment Variables (Fra Render docs):**
```env
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=[public-key]
SUPABASE_SERVICE_KEY=[admin-key] # UPDATED!
ENCRYPTION_KEY=[32-char-aes-key]
ENCRYPTION_SALT=[16-char-salt]
```

**Tabeller (8 stk):**
- `billy_organizations`
- `billy_users`
- `billy_cached_invoices`
- `billy_cached_customers`
- `billy_cached_products`
- `billy_audit_logs`
- `billy_usage_metrics`
- `billy_rate_limits`

---

### 3. **RenOS (Tekup Google AI)** ⚠️

**Render.com Deployment:**
```
Status: ⚠️ UKENDT
Region: Sandsynligvis Frankfurt
Database: Prisma + PostgreSQL (IKKE Supabase endnu)
```

**Nuværende Database:**
```
Type: Prisma + Separat PostgreSQL
Schema: 19 modeller, 536 linjer
Status: SKAL MIGRERES til Supabase
```

**Potentiel Migration Destination:**
```
Projekt: RenOS By Tekup (samme som Billy)
Schema: renos.*
```

---

## 📊 Supabase Projekt Distribution

### **Projekt 1: TekupVault** (eu-west-3 Paris)
```
Apps: 1
└── TekupVault (vault-api + vault-worker)
    └── Schemas: public (default)
        ├── vault_documents
        ├── vault_embeddings
        └── vault_sync_status
```

### **Projekt 2: RenOS By Tekup** (eu-central-1 Frankfurt)
```
Apps: 1 (snart 2)
├── Tekup-Billy (MCP Server)
│   └── Schemas: public (default)
│       ├── billy_organizations
│       ├── billy_users
│       ├── billy_cached_*
│       ├── billy_audit_logs
│       ├── billy_usage_metrics
│       └── billy_rate_limits
│
└── RenOS (PLANLAGT migration)
    └── Schemas: public eller renos
        ├── leads
        ├── customers
        ├── bookings
        └── ... (19 tabeller total)
```

---

## 🎯 Konsoliderings Strategi

### **Anbefaling: Brug "RenOS By Tekup" Som Central Database**

**Rationale:**
- ✅ Frankfurt (tættere på Danmark end Paris)
- ✅ Allerede har Tekup-Billy data
- ✅ Navnet passer til hovedprojekt (RenOS)
- ✅ Kan udvides til multi-schema setup

**Plan:**
```
FASE 1: Setup Schemas
├── Opret schema: vault
├── Opret schema: billy (eller behold i public)
├── Opret schema: renos
├── Opret schema: crm
├── Opret schema: flow
└── Opret schema: shared

FASE 2: Migrer TekupVault Data
├── Eksporter fra Paris projekt
├── Importer til Frankfurt projekt (vault schema)
└── Opdater TekupVault connection strings

FASE 3: Reorganiser Tekup-Billy
├── Beslut: Behold i public eller flyt til billy schema
└── Test thorougly

FASE 4: Migrer RenOS
├── Eksporter Prisma data
├── Migrer til renos schema
└── Opdater application code

FASE 5: Cleanup
├── Decommission Paris TekupVault projekt
├── Fejr succes! 🎉
```

---

## 📈 Resource Estimater Efter Consolidation

### **RenOS By Tekup Projekt (Frankfurt)**

**Før consolidation:**
```
Apps: 1 (Tekup-Billy)
Database Size: ~50-100 MB
Tables: 8
Rows: ~7,000
API Calls: ~50k/mdr
```

**Efter consolidation (Alle apps):**
```
Apps: 3 (Billy, Vault, RenOS)
Database Size: ~500 MB - 1 GB
Tables: ~30+
Rows: ~20,000+
API Calls: ~200k/mdr

Tier: Upgrade til Pro anbefales ($25/mdr)
```

---

## 🔗 Connection Strings Efter Migration

### **Central Database (RenOS By Tekup)**

```env
# REST API (alle apps)
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
SUPABASE_ANON_KEY=[key]
SUPABASE_SERVICE_KEY=[key]

# Direct PostgreSQL med schema
DATABASE_URL_VAULT=postgresql://postgres.oaevagd:[pwd]@db.oaevagd.supabase.co:5432/postgres?schema=vault
DATABASE_URL_BILLY=postgresql://postgres.oaevagd:[pwd]@db.oaevagd.supabase.co:5432/postgres?schema=billy
DATABASE_URL_RENOS=postgresql://postgres.oaevagd:[pwd]@db.oaevagd.supabase.co:5432/postgres?schema=renos
DATABASE_URL_CRM=postgresql://postgres.oaevagd:[pwd]@db.oaevagd.supabase.co:5432/postgres?schema=crm
DATABASE_URL_FLOW=postgresql://postgres.oaevagd:[pwd]@db.oaevagd.supabase.co:5432/postgres?schema=flow

# Pooler (production - anbefalet)
DATABASE_URL=postgresql://postgres.oaevagd:[pwd]@eu-central-1.pooler.supabase.com:6543/postgres
```

---

## ⏱️ Migration Timeline

### **Estimeret Tidsforbrug**

**Fase 1: Schema Setup** (2-3 timer)
- Opret schemas i RenOS projekt
- Setup RLS policies
- Test connection fra alle apps

**Fase 2: TekupVault Migration** (4-6 timer)
- Data eksport fra Paris
- Import til Frankfurt (vault schema)
- Update vault-api og vault-worker connection strings
- Test semantic search fungerer
- Deploy til Render.com

**Fase 3: Billy Reorganization** (2-3 timer) *OPTIONAL*
- Beslut om schema move er nødvendig
- Test at Billy MCP stadig virker
- Update docs

**Fase 4: RenOS Migration** (6-8 timer)
- Export Prisma data
- Import til renos schema
- Update Prisma schema config
- Test alle endpoints
- Deploy til Render.com

**TOTAL: 14-20 timer** (~2-3 arbejdsdage)

---

## ✅ Næste Skridt

1. **Beslut GO/NO-GO** på consolidation
2. **Backup begge Supabase projekter** (safety first!)
3. **Opret schemas** i RenOS By Tekup projekt
4. **Test schema isolation** med dummy data
5. **Start TekupVault migration** som pilot
6. **Migrer RenOS** efter TekupVault success
7. **Decommission** Paris TekupVault projekt

---

## 🔐 Sikkerhedsnoter

**Kritiske Secrets at Bevare:**
```
Tekup-Billy:
├── ENCRYPTION_KEY (AES-256-GCM)
├── ENCRYPTION_SALT (scrypt)
└── billy_api_key (encrypted i database)

TekupVault:
├── OPENAI_API_KEY
├── GITHUB_TOKEN
└── GITHUB_WEBHOOK_SECRET

RenOS:
├── Google OAuth credentials
├── Gmail/Calendar API tokens
└── Prisma connection string
```

**Alle skal overføres sikkert til nye environment variables!**

---

**Status:** 🟢 **KLAR TIL IMPLEMENTATION**

**Last Updated:** 20. Oktober 2025, 22:00
