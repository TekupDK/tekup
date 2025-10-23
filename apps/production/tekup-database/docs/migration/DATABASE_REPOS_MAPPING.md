# 🗄️ Database Repos Mapping - Komplet Oversigt

**Dato:** 22. Oktober 2025, 03:37  
**Formål:** Identificer hvilke repos påvirkes af database konsolidering

---

## 📊 Alle 12 Workspaces - Database Status

### ✅ HAR DATABASE (Skal migreres/forbindes)

#### 1. **TekupVault** 
**Location:** `c:\Users\empir\TekupVault`  
**Nuværende Database:** Supabase (twaoebtlusudzxshjral)  
**Schema:** vault_documents, vault_embeddings, vault_sync_status  
**Tech:** Supabase client + pgvector  
**Migration Target:** → `vault` schema i central database  
**Priority:** 🟡 MEDIUM (virker allerede, men skal konsolideres)  
**Påvirkning:** Opdater connection strings, test vector search

---

#### 2. **Tekup-Billy** 
**Location:** `c:\Users\empir\Tekup-Billy`  
**Nuværende Database:** Supabase (oaevagdgrasfppbrxbey) - DELT med RenOS  
**Schema:** billy_organizations, billy_cached_*, billy_audit_logs, billy_usage_metrics  
**Tech:** Supabase client + encryption (AES-256-GCM)  
**Migration Target:** → `billy` schema i central database  
**Priority:** 🟡 MEDIUM (virker allerede, encryption skal bevares)  
**Påvirkning:** Opdater connection strings, bevar encryption keys

---

#### 3. **Tekup Google AI (RenOS)** 
**Location:** `c:\Users\empir\Tekup Google AI`  
**Nuværende Database:** Supabase (oaevagdgrasfppbrxbey) - DELT med Billy  
**Schema:** 19 Prisma models (Lead, Customer, Booking, Invoice, etc.)  
**Tech:** Prisma ORM → Supabase PostgreSQL  
**Migration Target:** → `renos` schema i central database  
**Priority:** 🔴 HIGH (aktiv produktion)  
**Påvirkning:** Replace Prisma client med @tekup/database renos client

---

#### 4. **RendetaljeOS** 
**Location:** `c:\Users\empir\RendetaljeOS`  
**Nuværende Database:** Supabase (oaevagdgrasfppbrxbey) - DELT med Billy & RenOS  
**Schema:** 19 Prisma models (samme som Tekup Google AI - det er en duplicate!)  
**Tech:** Prisma ORM → Supabase PostgreSQL  
**Migration Target:** → `renos` schema i central database (SAMME som Google AI!)  
**Priority:** 🔴 HIGH (aktiv udvikling)  
**Påvirkning:** Replace Prisma client, merge med Google AI data?

---

#### 5. **Tekup-org** (Monorepo med FLERE apps)
**Location:** `c:\Users\empir\Tekup-org`  
**Nuværende Database:** Multiple Prisma schemas i forskellige apps

**Sub-apps med database:**

**5a. tekup-crm-api**
- Schema: 28+ Prisma models (multi-tenant CRM)
- Migration Target: → `crm` schema
- Priority: 🟡 MEDIUM
- Status: Skal undersøges om i aktiv brug

**5b. flow-api**
- Schema: 12 Prisma models (workflow automation)
- Migration Target: → `flow` schema
- Priority: 🟡 MEDIUM
- Status: Lead management system

**5c. rendetalje-os-backend**
- Schema: 17 Prisma models
- Migration Target: → Måske merge med `renos`?
- Priority: 🟢 LOW
- Status: Overlap med RendetaljeOS?

**5d. Andre apps** (tekup-unified-platform, essenza-pro, etc.)
- Status: ⚠️ Skal audites for aktiv brug

**Påvirkning:** Stor! Monorepo med mange apps der potentielt skal migreres

---

#### 6. **Tekup-Cloud**
**Location:** `c:\Users\empir\Tekup-Cloud`  
**Nuværende Database:** Ukendt (skal undersøges)  
**Schema:** Skal tjekkes  
**Migration Target:** TBD  
**Priority:** 🟢 LOW  
**Påvirkning:** Minimal (hvis overhovedet database)

---

### ❌ INGEN DATABASE (Ikke påvirket)

#### 7. **tekup-ai-assistant**
**Location:** `c:\Users\empir\tekup-ai-assistant`  
**Database:** Ingen selvstændig database  
**Påvirkning:** ❌ Ingen - bruger måske andre services' APIs

---

#### 8. **tekup-cloud-dashboard**
**Location:** `c:\Users\empir\tekup-cloud-dashboard`  
**Database:** Muligvis deler med Supabase projekter  
**Påvirkning:** ⚠️ Skal undersøges

---

#### 9. **tekup-gmail-automation**
**Location:** `c:\Users\empir\tekup-gmail-automation`  
**Database:** Python-baseret, ingen persistent database  
**Påvirkning:** ❌ Ingen

---

#### 10. **Agent-Orchestrator**
**Location:** `c:\Users\empir\Agent-Orchestrator`  
**Database:** Ingen fundet  
**Påvirkning:** ❌ Ingen

---

#### 11. **Gmail-PDF-Forwarder**
**Location:** `c:\Users\empir\Gmail-PDF-Forwarder`  
**Database:** Ingen  
**Påvirkning:** ❌ Ingen

---

#### 12. **Gmail-PDF-Auto**
**Location:** `c:\Users\empir\gmail-pdf-auto`  
**Database:** Ingen  
**Påvirkning:** ❌ Ingen

---

## 🎯 Migration Priority Matrix

### 🔴 HIGH Priority (Skal forbindes FØRST)

| Repo | Reason | Current DB | Target Schema | Effort |
|------|--------|------------|---------------|--------|
| **Tekup Google AI** | Aktiv produktion | Supabase | `renos` | 3-4t |
| **RendetaljeOS** | Aktiv udvikling | Supabase | `renos` | 3-4t |

**Note:** Disse 2 deler sandsynligvis SAMME data (duplicates?)

---

### 🟡 MEDIUM Priority (Kan vente, men bør gøres)

| Repo | Reason | Current DB | Target Schema | Effort |
|------|--------|------------|---------------|--------|
| **TekupVault** | Konsolidering | Supabase (sep) | `vault` | 2-3t |
| **Tekup-Billy** | Konsolidering | Supabase (shared) | `billy` | 2-3t |
| **Tekup-org/crm-api** | Multi-tenant CRM | Prisma | `crm` | 4-5t |
| **Tekup-org/flow-api** | Workflow engine | Prisma | `flow` | 2-3t |

---

### 🟢 LOW Priority (Audit først)

| Repo | Reason | Status | Action |
|------|--------|--------|--------|
| **Tekup-org/rendetalje-os-backend** | Overlap? | Unknown | Audit + decide |
| **Tekup-Cloud** | Unclear | Unknown | Audit + decide |
| **tekup-cloud-dashboard** | Maybe shared | Unknown | Check dependencies |

---

## 📋 Repos der SKAL Forbindes til Central Database

### **Definite YES - Skal forbindes:**

1. ✅ **TekupVault** → vault schema
   - Connection: @tekup/database vault client
   - Changes: Replace Supabase client imports
   - Testing: Vector search functionality

2. ✅ **Tekup-Billy** → billy schema
   - Connection: @tekup/database billy client
   - Changes: Replace Supabase client imports
   - Special: Bevar encryption keys

3. ✅ **Tekup Google AI** → renos schema
   - Connection: @tekup/database renos client
   - Changes: Replace Prisma client imports
   - Testing: Full integration test

4. ✅ **RendetaljeOS** → renos schema
   - Connection: @tekup/database renos client
   - Changes: Replace Prisma client imports
   - Decision: Merge med Google AI data eller separate?

---

### **Maybe YES - Undersøg først:**

5. ⚠️ **Tekup-org/crm-api** → crm schema
   - Audit: Er den i aktiv brug?
   - Schema: 28 models - stor migration
   - Decision needed

6. ⚠️ **Tekup-org/flow-api** → flow schema
   - Audit: Er den i aktiv brug?
   - Schema: 12 models
   - Lead management features

7. ⚠️ **Tekup-org/rendetalje-os-backend** → ??
   - Audit: Overlap med RendetaljeOS?
   - Decision: Merge eller separat?

---

### **NO - Ikke relevant:**

8. ❌ **tekup-ai-assistant** - Ingen database
9. ❌ **tekup-gmail-automation** - Python, ingen DB
10. ❌ **Agent-Orchestrator** - Ingen database
11. ❌ **Gmail-PDF-Forwarder** - Ingen database
12. ❌ **Gmail-PDF-Auto** - Ingen database

---

## 🔍 Kritiske Spørgsmål der Skal Besvares

### 1. **RendetaljeOS vs Tekup Google AI**
```
❓ Er disse to SAMME system med duplicate data?
❓ Eller separate deployments?
❓ Skal de merge til samme renos schema?

Action: Sammenlign data i Supabase projekt
```

### 2. **Tekup-org Apps**
```
❓ Hvilke apps i Tekup-org er i aktiv brug?
❓ tekup-crm-api - bruges den?
❓ flow-api - bruges den?
❓ rendetalje-os-backend - overlap med RendetaljeOS?

Action: Git log analysis + team interview
```

### 3. **Supabase Projekt Strategi**
```
❓ Skal vi merge TekupVault ind i oaevagdgrasfppbrxbey?
❓ Eller opret nyt centralt Supabase projekt?
❓ Eller brug tekup-database Docker for development?

Action: Beslut migration strategi
```

---

## 📊 Migration Effort Estimat

### **Definite Migrations (Core 4):**
```
TekupVault:           2-3 timer
Tekup-Billy:          2-3 timer
Tekup Google AI:      3-4 timer
RendetaljeOS:         3-4 timer
────────────────────────────────
TOTAL:               10-14 timer
```

### **If Tekup-org Apps (Additional 3):**
```
CRM API:              4-5 timer
Flow API:             2-3 timer
Rendetalje Backend:   2-3 timer
────────────────────────────────
ADDITIONAL:          8-11 timer
```

### **Grand Total:**
```
Minimum (Core 4):    10-14 timer
Maximum (All 7):     18-25 timer
```

---

## 🎯 Anbefalet Tilgang

### **Phase 1: Quick Wins** (10-14 timer)
1. ✅ Setup central database (Supabase eller Docker)
2. ✅ Migrer TekupVault → vault schema
3. ✅ Migrer Tekup-Billy → billy schema
4. ✅ Migrer Tekup Google AI → renos schema
5. ✅ Beslut RendetaljeOS strategi (merge eller separat)

### **Phase 2: Tekup-org Audit** (4-6 timer)
1. 🔍 Audit hvilke apps er i aktiv brug
2. 🔍 Identificer data duplicates
3. 🔍 Beslut migration scope

### **Phase 3: Full Migration** (8-11 timer)
1. ✅ Migrer aktive Tekup-org apps
2. ✅ Cleanup unused apps
3. ✅ Decommission gamle databases

---

## 🚀 Quick Decision Tree

```
START
  │
  ├─ Har du brug for central database NU?
  │  │
  │  ├─ JA → Migrer Core 4 repos (10-14t)
  │  │        └─ TekupVault, Billy, Google AI, RendetaljeOS
  │  │
  │  └─ NEJ → Behold nuværende setup
  │           └─ Opdater docs til at reflektere dette
  │
  ├─ Skal Tekup-org apps med?
  │  │
  │  ├─ JA → Audit først (4-6t), derefter migrer (8-11t)
  │  │
  │  └─ NEJ → Skip Tekup-org for nu
  │
  └─ Database provider?
     │
     ├─ Supabase → Følg original plan
     │
     └─ Docker → Behold tekup-database as-is
```

---

## 📝 Næste Konkrete Steps

1. **Beslut migration scope:**
   - [ ] Core 4 only? (10-14t)
   - [ ] Include Tekup-org? (18-25t)

2. **Beslut database provider:**
   - [ ] Merge til eksisterende Supabase (oaevagdgrasfppbrxbey)
   - [ ] Opret nyt Supabase projekt
   - [ ] Behold Docker for dev + Supabase for prod

3. **Undersøg duplicates:**
   - [ ] Er Tekup Google AI og RendetaljeOS samme data?
   - [ ] Skal de merge eller køre separat?

4. **Tekup-org audit:**
   - [ ] Check git log for sidste activity
   - [ ] Interview team om hvilke apps bruges
   - [ ] Identificer dead projects

---

**Status:** Afventer beslutninger  
**Blokkers:** Ingen - alt information er samlet  
**Ready to proceed:** Når scope er besluttet
