# 🎯 TEKUP - Ny Mappestruktur Plan

**Created:** 22. Oktober 2025, 22:51 CET  
**Formål:** Organisér alle projekter under én "Tekup" hovedmappe

---

## 📁 **NY STRUKTUR - MED "TEKUP" SOM HOVEDMAPPE**

```
c:\Users\empir\
└── Tekup/                          ← NY HOVEDMAPPE
    │
    ├── production/                 ← LIVE production services
    │   ├── tekup-database/        (v1.4.0 - Central DB)
    │   ├── tekup-vault/           (v0.1.0 - Knowledge Layer)
    │   └── tekup-billy/           (v1.4.3 - Billy.dk MCP)
    │
    ├── development/                ← Aktiv udvikling
    │   ├── rendetalje-os/         (Monorepo - Cleaning management)
    │   ├── tekup-ai/              (AI Infrastructure monorepo)
    │   ├── tekup-cloud/           (Docs + RenOS Calendar MCP)
    │   └── tekup-cloud-dashboard/ (Unified dashboard)
    │
    ├── services/                   ← Supporting services
    │   ├── tekup-gmail-services/  (v1.0.0 - Email automation)
    │   ├── tekup-chat/            (v1.1.0 - Chat interface)
    │   └── tekup-ai-assistant/    (v1.5.0 - AI docs & configs)
    │
    ├── archive/                    ← Legacy projekter
    │   ├── tekup-org/             (66 apps - EKSTRAHER FØRST!)
    │   ├── tekup-google-ai/       (Migreret til tekup-ai)
    │   └── tekup-gmail-automation/(Migreret til gmail-services)
    │
    └── docs/                       ← Workspace documentation
        ├── TEKUP_COMPLETE_VISION_ANALYSIS.md
        ├── TEKUP_SESSION_COMPLETE_2025-10-22.md
        ├── README_START_HERE.md
        └── GIT_COMMIT_COMPLETE_2025-10-22.md
```

---

## 📋 **DETALJERET STATUS FOR HVER MAPPE**

### ✅ **PRODUCTION (3 mapper)**

#### 1. **tekup-database** → `Tekup/production/tekup-database/`

- **Version:** v1.4.0
- **Status:** ✅ CRITICAL - Central database
- **Seneste:** 22 Oct 2025 - All repos migrated
- **Schemas:** vault, billy, renos, crm, flow, shared
- **Dependencies:** ALLE projekter bruger denne
- **Action:** FLYT til production/

#### 2. **TekupVault** → `Tekup/production/tekup-vault/`

- **Version:** v0.1.0
- **Status:** ✅ LIVE - <https://tekupvault.onrender.com>
- **Seneste:** 22 Oct 2025 - Database migrated
- **Værdi:** €120,000
- **Health:** 8.5/10
- **Action:** FLYT til production/ + OMDØB til tekup-vault

#### 3. **Tekup-Billy** → `Tekup/production/tekup-billy/`

- **Version:** v1.4.3
- **Status:** ✅ LIVE - <https://tekup-billy.onrender.com>
- **Seneste:** 22 Oct 2025 - Repo restructured
- **Værdi:** €150,000
- **Health:** 9.2/10
- **Action:** FLYT til production/ + OMDØB til tekup-billy

---

### 🟡 **DEVELOPMENT (4 mapper)**

#### 4. **RendetaljeOS** → `Tekup/development/rendetalje-os/`

- **Status:** 🟡 Monorepo migrated (16 Oct 2025)
- **Seneste:** 16 Oct 2025 - 965 packages installed
- **Værdi:** €180,000
- **Health:** 8/10
- **Action:** FLYT til development/ + OMDØB til rendetalje-os

#### 5. **tekup-ai** → `Tekup/development/tekup-ai/`

- **Status:** 🟡 Phase 1 complete
- **Seneste:** 22 Oct 2025 - Database migrated
- **Værdi:** €120,000
- **Health:** 6/10
- **Action:** FLYT til development/

#### 6. **Tekup-Cloud** → `Tekup/development/tekup-cloud/`

- **Status:** ✅ Docs hub + MCP server
- **Seneste:** 22 Oct 2025 - 51 docs organized
- **Health:** 8.5/10
- **Action:** FLYT til development/ + OMDØB til tekup-cloud

#### 7. **tekup-cloud-dashboard** → `Tekup/development/tekup-cloud-dashboard/`

- **Status:** 🟡 Production-ready
- **Seneste:** Oct 2025 - Real-time integration
- **Health:** 6/10
- **Action:** FLYT til development/

---

### 🔧 **SERVICES (3 mapper)**

#### 8. **tekup-gmail-services** → `Tekup/services/tekup-gmail-services/`

- **Version:** v1.0.0
- **Status:** ✅ Consolidated (22 Oct 2025)
- **Health:** 9/10
- **Action:** FLYT til services/

#### 9. **tekup-chat** → `Tekup/services/tekup-chat/`

- **Version:** v1.1.0
- **Status:** ✅ Active (22 Oct 2025)
- **Note:** Candidate for tekup-ai consolidation
- **Action:** FLYT til services/

#### 10. **tekup-ai-assistant** → `Tekup/services/tekup-ai-assistant/`

- **Version:** v1.5.0
- **Status:** ✅ Docs & configs (22 Oct 2025)
- **Health:** 7/10
- **Action:** FLYT til services/

---

### 🔴 **ARCHIVE (3 mapper)**

#### 11. **Tekup-org** → `Tekup/archive/tekup-org/`

- **Status:** 🔴 FAILED EXPERIMENT
- **Size:** 3,228 items (66 apps)
- **Værdi:** €360,000 (skal ekstraheres!)
- **Extract:** Design system + Database schemas
- **Action:** EKSTRAHER VÆRDI → Derefter FLYT til archive/

#### 12. **Tekup Google AI** → `Tekup/archive/tekup-google-ai/`

- **Status:** 🔴 Legacy
- **Size:** 1,531 items
- **Note:** Features migreret til tekup-ai
- **Action:** FLYT til archive/

#### 13. **tekup-gmail-automation** → `Tekup/archive/tekup-gmail-automation/`

- **Status:** ✅ Migreret til tekup-gmail-services
- **Action:** FLYT til archive/ (eller SLET)

---

### 🗑️ **SLET DISSE (14 mapper)**

Tomme mapper - ingen indhold:

- `agent-orchestrator/` (0 items)
- `ansel/` (0 items)
- `backups/` (0 items)
- `frontend/` (0 items)
- `gmail-repos-backup-2025-10-22/` (0 items)
- `logs/` (0 items)
- `optimere/` (0 items)
- `rendetalje-ai-chat/` (0 items)
- `renos-backend/` (0 items) - Migreret til RendetaljeOS
- `renos-frontend/` (0 items) - Migreret til RendetaljeOS
- `supabase-migration/` (0 items)
- `tekup-unified-docs/` (0 items)
- `RendetaljeOS-Production/` (0 items)
- `Ny mappe/` (0 items)
- `Ny mappe (2)/` (0 items)

---

## 🚀 **IMPLEMENTATION PLAN**

### **Fase 1: Opret Struktur (5 min)**

```powershell
# Opret Tekup hovedmappe og undermapper
cd c:\Users\empir
mkdir Tekup
cd Tekup
mkdir production
mkdir development
mkdir services
mkdir archive
mkdir docs
```

### **Fase 2: Flyt Production (10 min)**

```powershell
# Flyt critical production services først
Move-Item "c:\Users\empir\tekup-database" "c:\Users\empir\Tekup\production\tekup-database"
Move-Item "c:\Users\empir\TekupVault" "c:\Users\empir\Tekup\production\tekup-vault"
Move-Item "c:\Users\empir\Tekup-Billy" "c:\Users\empir\Tekup\production\tekup-billy"
```

### **Fase 3: Flyt Development (10 min)**

```powershell
Move-Item "c:\Users\empir\RendetaljeOS" "c:\Users\empir\Tekup\development\rendetalje-os"
Move-Item "c:\Users\empir\tekup-ai" "c:\Users\empir\Tekup\development\tekup-ai"
Move-Item "c:\Users\empir\Tekup-Cloud" "c:\Users\empir\Tekup\development\tekup-cloud"
Move-Item "c:\Users\empir\tekup-cloud-dashboard" "c:\Users\empir\Tekup\development\tekup-cloud-dashboard"
```

### **Fase 4: Flyt Services (5 min)**

```powershell
Move-Item "c:\Users\empir\tekup-gmail-services" "c:\Users\empir\Tekup\services\tekup-gmail-services"
Move-Item "c:\Users\empir\tekup-chat" "c:\Users\empir\Tekup\services\tekup-chat"
Move-Item "c:\Users\empir\tekup-ai-assistant" "c:\Users\empir\Tekup\services\tekup-ai-assistant"
```

### **Fase 5: Archive Legacy (10 min)**

```powershell
# VIGTIGT: Ekstraher værdi fra Tekup-org FØRST!
# TODO: Extract design system + schemas fra Tekup-org

Move-Item "c:\Users\empir\Tekup-org" "c:\Users\empir\Tekup\archive\tekup-org"
Move-Item "c:\Users\empir\Tekup Google AI" "c:\Users\empir\Tekup\archive\tekup-google-ai"
Move-Item "c:\Users\empir\tekup-gmail-automation" "c:\Users\empir\Tekup\archive\tekup-gmail-automation"
```

### **Fase 6: Flyt Docs (2 min)**

```powershell
Move-Item "c:\Users\empir\TEKUP_COMPLETE_VISION_ANALYSIS.md" "c:\Users\empir\Tekup\docs\"
Move-Item "c:\Users\empir\TEKUP_SESSION_COMPLETE_2025-10-22.md" "c:\Users\empir\Tekup\docs\"
Move-Item "c:\Users\empir\README_START_HERE.md" "c:\Users\empir\Tekup\docs\"
Move-Item "c:\Users\empir\GIT_COMMIT_COMPLETE_2025-10-22.md" "c:\Users\empir\Tekup\docs\"
```

### **Fase 7: Slet Tomme Mapper (2 min)**

```powershell
# Slet alle tomme mapper
Remove-Item "c:\Users\empir\agent-orchestrator" -Recurse
Remove-Item "c:\Users\empir\ansel" -Recurse
Remove-Item "c:\Users\empir\backups" -Recurse
Remove-Item "c:\Users\empir\frontend" -Recurse
Remove-Item "c:\Users\empir\gmail-repos-backup-2025-10-22" -Recurse
Remove-Item "c:\Users\empir\logs" -Recurse
Remove-Item "c:\Users\empir\optimere" -Recurse
Remove-Item "c:\Users\empir\rendetalje-ai-chat" -Recurse
Remove-Item "c:\Users\empir\renos-backend" -Recurse
Remove-Item "c:\Users\empir\renos-frontend" -Recurse
Remove-Item "c:\Users\empir\supabase-migration" -Recurse
Remove-Item "c:\Users\empir\tekup-unified-docs" -Recurse
Remove-Item "c:\Users\empir\RendetaljeOS-Production" -Recurse
Remove-Item "c:\Users\empir\Ny mappe" -Recurse
Remove-Item "c:\Users\empir\Ny mappe (2)" -Recurse
```

---

## ✅ **EFTER IMPLEMENTERING**

### **Ny Clean Struktur:**

```
c:\Users\empir\
├── Tekup/                    ← ALT Tekup er her nu!
│   ├── production/          (3 services - €270K)
│   ├── development/         (4 projects - €300K+)
│   ├── services/            (3 supporting)
│   ├── archive/             (3 legacy - €360K værdi)
│   └── docs/                (4 workspace docs)
└── [standard Windows folders]
```

**Total reorganisering tid:** ~45 minutter  
**Mapper flyttet:** 13  
**Mapper slettet:** 14  
**Mapper arkiveret:** 3  
**Resultat:** Clean, organiseret workspace med klar struktur

---

## 🎯 **NÆSTE SKRIDT**

**Option 1: Start Nu** ✅ ANBEFALET

- Kør Fase 1-7 commands ovenfor
- Implementér ny struktur
- Test at alt virker

**Option 2: Ekstraher Værdi Først** 🎯

- Extract design system fra Tekup-org
- Extract database schemas
- Derefter flyt til archive

**Option 3: Review Plan** 📖

- Gennemgå plan med team
- Juster hvis nødvendigt
- Godkend og eksekvér

**Hvad vil du?** 🚀

