# 🔍 Supabase Discovery Report - Hvad Er Der Faktisk?

**Dato:** 22. Oktober 2025, 03:34  
**Undersøgelse:** Alle Supabase projekter i workspaces

---

## 🎯 FUND: 2 Separate Supabase Projekter

### **Projekt 1: TekupVault**

**Project ID:** `twaoebtlusudzxshjral`  
**URL:** `https://twaoebtlusudzxshjral.supabase.co`  
**Region:** EU Central (Frankfurt)  
**Database:** `aws-0-eu-central-1.pooler.supabase.com`

**Tabeller (3):**

- `vault_documents` - Document storage
- `vault_embeddings` - Vector embeddings (1536 dim, pgvector)
- `vault_sync_status` - Sync tracking

**Migrations:**

- ✅ `20250114000000_initial_schema.sql` - Opret tabeller + indexes
- ✅ `20250116000000_add_rls_policies.sql` - Row Level Security

**Features:**

- ✅ pgvector extension (vector similarity search)
- ✅ RLS policies (service_role + authenticated)
- ✅ IVFFlat index for embeddings
- ✅ JSONB metadata support

**Status:** ✅ Production ready, i brug

---

### **Projekt 2: RenOS/Billy Shared** 🔄

**Project ID:** `oaevagdgrasfppbrxbey`  
**URL:** `https://oaevagdgrasfppbrxbey.supabase.co`  
**Region:** Unknown (sandsynligvis EU)  

**Note fra Billy .env:**
```
# NOTE: Dette Supabase projekt bruges også af RenOS Backend
# Vi vil oprette separate tabeller til Tekup-Billy MCP:
# - billy_organizations (isolated from RenOS)
# - billy_cached_invoices
# - billy_cached_customers
# - billy_cached_products
# - billy_audit_logs
# - billy_usage_metrics
```

**Shared mellem:**

- ✅ **Tekup-Billy MCP** - Billy.dk integration
- ✅ **RenOS Backend** - Cleaning operations  
- ⚠️ **RendetaljeOS** (?) - Skal verificeres

**Tabeller:**

- Billy tables: `billy_*` (6+ tabeller)
- RenOS tables: Lead, Customer, Booking, etc. (19+ models)
- Total: ~25+ tabeller?

**Status:** ✅ Production ready, delt mellem services

---

## 📊 Current Supabase Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Cloud Infrastructure              │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         │                                    │
    ┌────▼─────────────┐          ┌──────────▼──────────────┐
    │ Projekt 1        │          │ Projekt 2               │
    │ twaoebtlus...    │          │ oaevagdgra...           │
    │                  │          │                         │
    │ TekupVault       │          │ RenOS + Billy (Shared!) │
    │ ────────────     │          │ ────────────────────    │
    │ • documents      │          │ RenOS:                  │
    │ • embeddings     │          │ • leads (19 models)     │
    │ • sync_status    │          │ • customers             │
    │                  │          │ • bookings              │
    │ pgvector ✅      │          │ • invoices              │
    │ RLS ✅           │          │                         │
    │                  │          │ Billy:                  │
    │                  │          │ • billy_organizations   │
    │                  │          │ • billy_cached_*        │
    │                  │          │ • billy_audit_logs      │
    │                  │          │                         │
    └──────────────────┘          └─────────────────────────┘
         ↑                                    ↑
         │                                    │
    ┌────┴──────────┐          ┌─────────────┴────────────┐
    │ TekupVault    │          │ Tekup-Billy + RendetaljeOS
    │ Apps          │          │ Apps                      │
    └───────────────┘          └───────────────────────────┘
```

---

## 🚨 KRITISK OPDAGELSE

### **Billy + RenOS Deler SAMME Supabase Projekt!**

Fra Tekup-Billy `.env` linje 19-20:
```bash
# Supabase credentials (from RenOS project - REUSING!)
SUPABASE_URL=https://oaevagdgrasfppbrxbey.supabase.co
```

**Dette betyder:**

- ✅ RenOS og Billy er ALLEREDE konsolideret til 1 projekt
- ✅ Deler connection pool
- ✅ Deler backup strategi
- ⚠️ TekupVault er på SEPARAT projekt

---

## 🎯 Konsolideringsmuligheder

### **Option A: Merge Projekt 1 → Projekt 2** ⭐

```
Flyt TekupVault → RenOS/Billy projektet

RESULTAT:
- 1 Supabase projekt for ALT
- vault schema + billy tabeller + renos tabeller
- Unified backup, monitoring, billing

EFFORT: 2-3 timer
```

**Fordele:**

- ✅ 1 projekt = lavere cost
- ✅ Delt connection pool
- ✅ Unified monitoring

**Ulemper:**

- 🔄 Migration effort
- ⚠️ Downtime for TekupVault

---

### **Option B: Keep 2 Projects, Add tekup-database**

```
Projekt 1: TekupVault (eksisterende)
Projekt 2: RenOS + Billy (eksisterende)
Projekt 3: tekup-database (NY på Supabase)

RESULTAT:
- 3 Supabase projekter
- tekup-database som central schema registry
- Services peger på deres respektive projekter
```

**Fordele:**

- ✅ Ingen migration af eksisterende
- ✅ Isolation mellem services

**Ulemper:**

- ❌ 3 projekter at maintaine
- ❌ Højere cost ved scale

---

### **Option C: Consolidate ALL → tekup-database** 🚀

```
Opret NYT Supabase projekt: "tekup-central-database"

Migrer:
- TekupVault → vault schema
- Billy → billy schema  
- RenOS → renos schema
- CRM → crm schema
- Flow → flow schema

RESULTAT:
- 1 CENTRAL Supabase projekt
- Multi-schema design
- Alt data i én database
```

**Fordele:**

- ✅ Fuldt konsolideret
- ✅ Laveste cost ($0-25/mdr)
- ✅ Unified alt
- ✅ Følger original plan

**Ulemper:**

- 🔄 Stor migration (4-6 timer)
- ⚠️ Risk of downtime

---

## 📋 Næste Skridt for at Undersøge Videre

### 1. Check RenOS Project Tables

```bash
# Se hvilke tabeller der findes i oaevagdgra projektet
cd c:/Users/empir/RendetaljeOS
grep SUPABASE_URL apps/backend/.env

# Connect og list tabeller
psql "postgresql://postgres.oaevagdgrasfppbrxbey:[password]@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres" -c "\dt"
```

### 2. Check Database Sizes

```sql
-- TekupVault projekt
SELECT pg_size_pretty(pg_database_size('postgres'));

-- RenOS/Billy projekt  
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Se per-table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. List All Migrations

```bash
# TekupVault
cd c:/Users/empir/TekupVault/supabase
supabase db diff

# RenOS (hvis det har supabase folder)
cd c:/Users/empir/RendetaljeOS
find . -name "supabase" -type d
```

---

## 💡 MIN ANBEFALING

**OPTION C: Full Consolidation til NYT Central Projekt**

**Hvorfor:**

1. ✅ Følger original DATABASE_CONSOLIDATION_ANALYSE plan
2. ✅ Laveste long-term cost
3. ✅ Unified monitoring & backup
4. ✅ Clean slate med proper schema design
5. ✅ Fremtidssikret for nye services

**Migration Approach:**

1. Opret nyt Supabase projekt "tekup-central-database"
2. Setup 6 schemas (vault, billy, renos, crm, flow, shared)
3. Export data fra begge eksisterende projekter
4. Import til nye schemas
5. Cutover services én ad gangen
6. Verificer alt virker
7. Decommission gamle projekter

**Timeline:**

- Dag 1 (2t): Opret projekt + setup schemas
- Dag 2 (3t): Migrer TekupVault data
- Dag 3 (3t): Migrer Billy + RenOS data
- Dag 4 (2t): Test & cutover
- Total: 10 timer spread over 4 dage

**Cost:**

- Current: $0 (2 free tier projekter)
- After: $0 (1 free tier projekt under 500MB)
- At scale: $25/mdr (Pro tier når vi når limits)

---

## ❓ Spørgsmål til Dig

1. **Har du adgang til Supabase dashboard?**  
   - Kan du se begge projekter?
   - Kan du se database sizes?

2. **Hvilken migration approach foretrækker du?**
   - A) Merge TekupVault → RenOS projekt
   - B) Keep separate + add 3rd
   - C) Full consolidation til nyt projekt

3. **Har vi tid til 10 timers migration?**
   - Eller skal vi gå med hurtigere løsning?

---

**Status:** Afventer beslutning  
**Næste:** Verificer RenOS tabeller i oaevagdgra projekt
