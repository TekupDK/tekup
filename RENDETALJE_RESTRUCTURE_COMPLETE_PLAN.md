# 🏗️ RENDETALJE/RENOS RESTRUCTURE - KOMPLET PLAN

**Dato:** 24. Oktober 2025  
**Computer:** PC2 (Jonas-dev)  
**Metode:** Tekup Research → Plan → Execute  
**Status:** 📋 Research Complete - Awaiting Review

---

## 📊 EXECUTIVE SUMMARY

### Problem:
Rendetalje/RenOS projektet er spredt med inkonsistent navngivning:
- **3 forskellige navnekonventioner** brugt samtidigt
- **1 tom mappe** (monorepo/) uden formål
- **Integration spredt** på tværs af 3 production services
- **Forvirring** mellem "Rendetalje" (brand) vs "RenOS" (platform)

### Løsning:
**Standardiser til "RenOS" som platform-navn** med klar struktur og konsistent naming.

### Impact:
- ✅ Klarhed for udviklere
- ✅ Konsistent package naming
- ✅ Lettere at finde kode
- ✅ Professionel tech-brand ("Renovation Operating System")

---

## 🔍 RESEARCH FINDINGS

### 1. Nuværende Mappestruktur

```
apps/rendetalje/                      ← Hovedmappe
├── docs/                             ✅ BEHOLD (god struktur)
│   └── services/cloud-docs/
│       ├── architecture/             (15+ docs)
│       ├── plans/                    (10+ strategiske plans)
│       ├── reports/                  (30+ audit reports)
│       ├── status/                   (deployment status)
│       ├── technical/                (API + deployment guides)
│       └── user-guides/              (customer/employee/owner)
│
├── monorepo/                         ❌ TOM - SLET
│   (0 filer - ingen funktion)
│
└── services/                         ✅ BEHOLD - men omdøb packages
    ├── backend-nestjs/               (@rendetaljeos/backend)
    ├── frontend-nextjs/              (@rendetaljeos/frontend)
    ├── calendar-mcp/                 (@renos/calendar-mcp) ← Kun denne bruger @renos
    │   ├── chatbot/                  (renos-calendar-chatbot)
    │   └── dashboard/                (renos-calendar-dashboard)
    ├── mobile/                       (@rendetaljeos/mobile)
    ├── shared/                       (@rendetaljeos/shared)
    ├── database/                     (setup scripts)
    ├── deployment/                   (render configs)
    └── scripts/                      (automation)
```

### 2. Package Names - INKONSISTENS FUNDET

| Package | Nuværende Navn | Problem |
|---------|---------------|---------|
| Backend | `@rendetaljeos/backend` | "rendetaljeos" (15 chars) |
| Frontend | `@rendetaljeos/frontend` | "rendetaljeos" |
| Mobile | `@rendetaljeos/mobile` | "rendetaljeos" |
| Shared | `@rendetaljeos/shared` | "rendetaljeos" |
| Calendar MCP | `@renos/calendar-mcp` | "renos" ← Kun denne! |
| Chatbot | `renos-calendar-chatbot` | Ingen namespace |
| Dashboard | `renos-calendar-dashboard` | Ingen namespace |

**Konklusion:** Calendar MCP bruger `@renos`, alt andet bruger `@rendetaljeos`. INGEN konsistens!

### 3. Integration med Tekup Production Services

#### A) tekup-database Integration:
```
apps/production/tekup-database/
└── prisma/schema-renos.prisma        ← RENOS schema (557 linjer)
    Schemas:
    - @@schema("renos")               ← Bruger "renos" som schema navn
    - RenosChatSession
    - RenosLead
    - RenosBooking
    - RenosCustomer
    osv...
```

**Konklusion:** Database bruger "renos" prefix overalt.

#### B) tekup-billy Integration:
```
apps/production/tekup-billy/
└── renos-backend-client/
    ├── README.md                     ← Client til "RenOS Backend"
    └── BillyMCPClient.ts            ← TypeScript client
```

**Konklusion:** Billy refererer til "RenOS" som klient-navn.

#### C) Backend References:
```typescript
// apps/rendetalje/services/backend-nestjs/src/main.ts
customSiteTitle: 'RendetaljeOS API Documentation'  ← "RendetaljeOS"
console.log('🚀 RendetaljeOS API running...')     ← "RendetaljeOS"
origin: 'https://rendetaljeos.onrender.com'        ← "rendetaljeos" URL
```

**Konklusion:** Backend bruger "RendetaljeOS" som display navn, men "rendetaljeos" i URLs.

### 4. Navngivnings-Analyse

| Variant | Hvor Brugt | Formål |
|---------|-----------|--------|
| **Rendetalje** | - Brand/virksomhed<br>- Domæne: rendetalje.dk<br>- Docs/user guides | Kunde-facing |
| **RenOS** | - Database schema<br>- Billy client<br>- Calendar MCP<br>- Teknisk docs | Tech/Platform |
| **RendetaljeOS** | - Backend UI/logs<br>- API title | Display navn |
| **rendetaljeos** | - Package namespace<br>- Render URLs | Code/deployment |
| **@renos** | - Calendar MCP package | Inkonsistent |

---

## 🎨 VISUAL DIAGRAMS

### Nuværende Struktur (Problem)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEKUP MONOREPO                               │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐           ┌────▼────┐          ┌────▼────┐
   │  apps/  │           │ apps/   │          │ apps/   │
   │production│          │rendetalje│         │  web/   │
   └────┬────┘           └────┬────┘          └─────────┘
        │                     │
   ┌────┴────┬────────┬───────┼──────────┬─────────┐
   │         │        │       │          │         │
┌──▼──┐  ┌──▼──┐  ┌──▼──┐ ┌──▼──┐    ┌──▼──┐  ┌──▼──┐
│billy│  │data-│  │vault│ │docs/│    │mono-│  │serv-│
│     │  │base │  │     │ │     │    │repo │  │ices/│
└──┬──┘  └──┬──┘  └─────┘ └─────┘    └──┬──┘  └──┬──┘
   │        │                            │        │
renos-  schema-                         TOM!   7 services
client  renos.prisma                    (0 files)
```

**PROBLEM OMRÅDER:**
- ❌ `monorepo/` tom mappe
- ❌ Integration spredt (billy, database)
- ❌ Inkonsistent naming (3 varianter)

### Fremtidig Struktur (Løsning)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEKUP MONOREPO                               │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐           ┌────▼────┐          ┌────▼────┐
   │  apps/  │           │  apps/  │          │ apps/   │
   │production│          │  renos/ │          │  web/   │
   └────┬────┘           └────┬────┘          └─────────┘
        │                     │
   ┌────┴────┬────────┬───────┼──────────┬─────────┐
   │         │        │       │          │         │
┌──▼──┐  ┌──▼──┐  ┌──▼──┐ ┌──▼──┐    ┌──▼──┐  ┌──▼──┐
│billy│  │data-│  │vault│ │docs/│    │back-│  │front│
│     │  │base │  │     │ │     │    │end/ │  │-end/│
└──┬──┘  └──┬──┘  └─────┘ └─────┘    └─────┘  └─────┘
   │        │                           │         │
renos-  schema-                     @renos/   @renos/
client  renos.prisma                backend   frontend
```

**FORBEDRINGER:**
- ✅ Konsistent `@renos/*` namespace
- ✅ `monorepo/` mappe slettet
- ✅ Klar "renos" brand for tech
- ✅ "Rendetalje" kun i brand/UI

---

## 💡 DESIGN DECISIONS

### Beslutning 1: Standardiser til "RenOS"

**Rationale:**
1. **Database allerede bruger "renos"** - schema navn er `@@schema("renos")`
2. **Kortere og nemmere** - "renos" (5 chars) vs "rendetaljeos" (13 chars)
3. **Tech branding** - "Renovation Operating System" er professionelt
4. **Fremtidssikret** - Platform kan ekspandere ud over Rendetalje virksomhed

**Pros:**
- ✅ Konsistent med eksisterende database schema
- ✅ Kortere package names
- ✅ Professionelt tech-brand
- ✅ Lettere at skrive og huske

**Cons:**
- ⚠️ Kræver package omdøbning (breaking change hvis published)
- ⚠️ Import paths skal opdateres
- ⚠️ URL ændring (rendetaljeos.onrender.com → renos.onrender.com)

### Beslutning 2: Behold "Rendetalje" i UI/Brand

**Rationale:**
- "Rendetalje.dk" er virksomhedens brand
- Kunder kender "Rendetalje" navnet
- "RenOS" er intern tech platform

**Implementation:**
```typescript
// Code (intern):
import { RenosCustomer } from '@renos/backend';

// UI (kunde-facing):
<h1>Velkommen til Rendetalje</h1>
<title>Rendetalje - Book en rengøring</title>

// Display navn:
console.log('🚀 RenOS API running...');
```

### Beslutning 3: Slet tom `monorepo/` mappe

**Rationale:**
- 0 filer - ingen funktion
- Forvirring: "Er dette en monorepo structure?"
- Services er allerede under `services/` mappen

---

## 🗺️ MIGRATIONSPLAN - STEP BY STEP

### FASE 1: Forberedelse (5 min)

#### 1.1 Commit nuværende state
```powershell
cd C:\Users\Jonas-dev\Tekup-Monorepo
git add .
git commit -m "docs: pre-restructure snapshot - rendetalje current state"
git push origin master
```

#### 1.2 Opret backup branch
```powershell
git checkout -b backup/rendetalje-pre-restructure
git push origin backup/rendetalje-pre-restructure
git checkout master
```

#### 1.3 Opret restructure branch
```powershell
git checkout -b refactor/rendetalje-to-renos
```

---

### FASE 2: Mappestruktur (10 min)

#### 2.1 Omdøb hovedmappe
```powershell
# Omdøb apps/rendetalje → apps/renos
git mv apps/rendetalje apps/renos
```

#### 2.2 Slet tom monorepo mappe
```powershell
# Slet tom mappe
Remove-Item apps/renos/monorepo -Force
git add -A
```

#### 2.3 Verificer struktur
```powershell
tree apps/renos /F | Select-Object -First 50
```

---

### FASE 3: Package Names (20 min)

#### 3.1 Update Backend package.json
```powershell
cd apps/renos/services/backend-nestjs

# Backup
Copy-Item package.json package.json.backup

# Update name
(Get-Content package.json) -replace '@rendetaljeos/backend', '@renos/backend' | Set-Content package.json
```

#### 3.2 Update Frontend package.json
```powershell
cd ../frontend-nextjs
(Get-Content package.json) -replace '@rendetaljeos/frontend', '@renos/frontend' | Set-Content package.json
```

#### 3.3 Update Mobile package.json
```powershell
cd ../mobile
(Get-Content package.json) -replace '@rendetaljeos/mobile', '@renos/mobile' | Set-Content package.json
```

#### 3.4 Update Shared package.json
```powershell
cd ../shared
(Get-Content package.json) -replace '@rendetaljeos/shared', '@renos/shared' | Set-Content package.json
```

#### 3.5 Update Calendar MCP sub-packages
```powershell
cd ../calendar-mcp/chatbot
(Get-Content package.json) -replace 'renos-calendar-chatbot', '@renos/calendar-chatbot' | Set-Content package.json

cd ../dashboard
(Get-Content package.json) -replace 'renos-calendar-dashboard', '@renos/calendar-dashboard' | Set-Content package.json
```

---

### FASE 4: Import Paths (30 min)

#### 4.1 Backend imports
```powershell
cd apps/renos/services/backend-nestjs/src

# Find all imports
Get-ChildItem -Recurse -Filter "*.ts" | ForEach-Object {
    (Get-Content $_.FullName) -replace '@rendetaljeos/', '@renos/' | Set-Content $_.FullName
}
```

#### 4.2 Frontend imports
```powershell
cd ../../../frontend-nextjs/src

Get-ChildItem -Recurse -Filter "*.tsx","*.ts" | ForEach-Object {
    (Get-Content $_.FullName) -replace '@rendetaljeos/', '@renos/' | Set-Content $_.FullName
}
```

#### 4.3 Calendar MCP imports
```powershell
cd ../../../calendar-mcp/src

Get-ChildItem -Recurse -Filter "*.ts" | ForEach-Object {
    (Get-Content $_.FullName) -replace 'rendetaljeos', 'renos' | Set-Content $_.FullName
}
```

---

### FASE 5: Display Names & URLs (15 min)

#### 5.1 Update Backend display names
```powershell
cd apps/renos/services/backend-nestjs/src

# main.ts updates
$mainFile = "main.ts"
(Get-Content $mainFile) -replace 'RendetaljeOS', 'RenOS' | Set-Content $mainFile
(Get-Content $mainFile) -replace 'rendetaljeos.onrender.com', 'renos.onrender.com' | Set-Content $mainFile
```

#### 5.2 Update README files
```powershell
cd apps/renos

Get-ChildItem -Recurse -Filter "README.md" | ForEach-Object {
    (Get-Content $_.FullName) -replace 'rendetaljeos', 'renos' | Set-Content $_.FullName
    (Get-Content $_.FullName) -replace 'RendetaljeOS', 'RenOS' | Set-Content $_.FullName
}
```

---

### FASE 6: Deployment Configs (10 min)

#### 6.1 Update render.yaml
```powershell
cd apps/renos/services/deployment

# Backup
Copy-Item render/render.yaml render/render.yaml.backup

# Update service names & URLs
(Get-Content render/render.yaml) -replace 'rendetaljeos', 'renos' | Set-Content render/render.yaml
```

#### 6.2 Update docker-compose.yml
```powershell
cd ../calendar-mcp
(Get-Content docker-compose.yml) -replace 'rendetaljeos', 'renos' | Set-Content docker-compose.yml
```

---

### FASE 7: Documentation (15 min)

#### 7.1 Update workspace README
```powershell
cd C:\Users\Jonas-dev\Tekup-Monorepo

# Update main README to reflect new structure
# (Manual edit required - reference apps/renos instead of apps/rendetalje)
```

#### 7.2 Update AI context
```powershell
# AI_CONTEXT_SUMMARY.md
(Get-Content AI_CONTEXT_SUMMARY.md) -replace 'apps/rendetalje', 'apps/renos' | Set-Content AI_CONTEXT_SUMMARY.md
(Get-Content AI_CONTEXT_SUMMARY.md) -replace 'rendetaljeos', 'renos' | Set-Content AI_CONTEXT_SUMMARY.md
```

#### 7.3 Create migration notice
```powershell
# Opret MIGRATION_RENDETALJE_TO_RENOS.md (denne fil)
```

---

### FASE 8: Testing & Verification (20 min)

#### 8.1 Verify package.json changes
```powershell
Get-ChildItem -Path apps/renos -Filter package.json -Recurse | ForEach-Object {
    Write-Output "=== $($_.Directory.Name) ==="
    Get-Content $_.FullName | Select-String '"name":'
}

# Expected output:
# backend-nestjs: "@renos/backend"
# frontend-nextjs: "@renos/frontend"
# mobile: "@renos/mobile"
# shared: "@renos/shared"
# calendar-mcp: "@renos/calendar-mcp"
# chatbot: "@renos/calendar-chatbot"
# dashboard: "@renos/calendar-dashboard"
```

#### 8.2 Verify import paths
```powershell
# Search for any remaining @rendetaljeos references
Get-ChildItem -Path apps/renos -Recurse -Include "*.ts","*.tsx","*.js" | 
    Select-String -Pattern '@rendetaljeos' | 
    Select-Object -First 10

# Should return 0 results
```

#### 8.3 Verify URLs
```powershell
# Search for old URLs
Get-ChildItem -Path apps/renos -Recurse -Include "*.ts","*.md","*.yaml" |
    Select-String -Pattern 'rendetaljeos.onrender.com' |
    Select-Object -First 10

# Should return 0 results
```

#### 8.4 Test build (optional but recommended)
```powershell
# Backend
cd apps/renos/services/backend-nestjs
npm install
npm run build

# Frontend
cd ../frontend-nextjs
npm install
npm run build
```

---

### FASE 9: Commit & Push (5 min)

#### 9.1 Stage all changes
```powershell
cd C:\Users\Jonas-dev\Tekup-Monorepo
git add -A
```

#### 9.2 Commit with detailed message
```powershell
git commit -m "refactor: standardize Rendetalje → RenOS naming

BREAKING CHANGES:
- Renamed apps/rendetalje → apps/renos
- Package namespace: @rendetaljeos/* → @renos/*
- Display name: RendetaljeOS → RenOS
- Deleted empty monorepo/ folder
- Updated all import paths
- Updated deployment configs (render.yaml, docker-compose)

Rationale:
- Consistency with database schema (@@schema('renos'))
- Shorter package names (renos vs rendetaljeos)
- Professional tech branding (Renovation Operating System)
- Aligns with existing Billy/Database integration naming

Migration impact:
- Import paths must be updated in dependent projects
- Render.com service URLs will change
- Customer-facing UI still shows 'Rendetalje' brand

Tested:
- All package.json updated
- Import paths verified (0 @rendetaljeos refs remaining)
- URLs updated (rendetaljeos.onrender.com → renos.onrender.com)
- Build: PENDING (dependencies not installed yet)

See: RENDETALJE_RESTRUCTURE_COMPLETE_PLAN.md for full details"
```

#### 9.3 Push to remote
```powershell
git push origin refactor/rendetalje-to-renos
```

---

### FASE 10: Render.com Deployment Updates (15 min)

**⚠️ VIGTIGT: Udføres EFTER merge til master**

#### 10.1 Update Render.com services
```
1. Log ind på https://dashboard.render.com
2. Rename services:
   - rendetaljeos-backend → renos-backend
   - rendetaljeos-frontend → renos-frontend
   
3. Update environment variables (hvis nødvendigt)

4. Trigger manual deploy for each service
```

#### 10.2 Update domain mappings (hvis custom domain)
```
rendetalje.dk → renos backend (API)
www.rendetalje.dk → renos frontend (UI)
```

---

## 🔄 ROLLBACK PLAN

Hvis migration fejler:

### Quick Rollback (5 min)
```powershell
# Gå tilbage til backup branch
git checkout backup/rendetalje-pre-restructure

# Force push til master (FARLIGT - kun i nødstilfælde)
git checkout master
git reset --hard backup/rendetalje-pre-restructure
git push origin master --force
```

### Selective Rollback (10 min)
```powershell
# Behold nogle ændringer, drop andre
git checkout master
git cherry-pick <specific-commit-hash>
```

### Restore from backup files
```powershell
# Hvis package.json backups blev lavet
Get-ChildItem -Path apps/renos -Filter "*.backup" -Recurse | ForEach-Object {
    $original = $_.FullName -replace '\.backup$', ''
    Copy-Item $_.FullName $original -Force
}
```

---

## 📋 POST-MIGRATION CHECKLIST

### Immediately After Merge:
- [ ] Verify build succeeds: `npm run build` in all packages
- [ ] Update Render.com service names
- [ ] Test production deployments
- [ ] Verify API endpoints respond correctly
- [ ] Check frontend loads without errors

### Within 24 Hours:
- [ ] Update documentation links (internal wikis, etc.)
- [ ] Notify team of new package names
- [ ] Update CI/CD pipelines (if any)
- [ ] Search & destroy any remaining old references

### Within 1 Week:
- [ ] Monitor error logs for import issues
- [ ] Check customer-facing apps still show "Rendetalje" brand
- [ ] Verify integrations (Billy, Database, Vault) still work
- [ ] Update external documentation (if published)

---

## 📊 IMPACT ANALYSIS

### Files Changed (Estimated):
- **7 package.json** files (backend, frontend, mobile, shared, calendar-mcp, chatbot, dashboard)
- **~50-100 TypeScript** files (import path updates)
- **~10 Markdown** files (README, docs)
- **3 Config files** (render.yaml, docker-compose.yml, etc.)
- **1 Folder rename** (apps/rendetalje → apps/renos)
- **1 Folder deletion** (monorepo/)

**Total estimated:** ~70-120 files touched

### Breaking Changes:
1. **Package names** - Any external projects importing `@rendetaljeos/*` must update
2. **API URLs** - Render deployment URLs change
3. **Import paths** - All internal imports need update

### Non-Breaking:
1. **Database schema** - Already uses `renos`, no change
2. **Customer-facing UI** - Still shows "Rendetalje" brand
3. **Functionality** - Zero functional changes, only naming

---

## 🎯 SUCCESS METRICS

Migration successful if:

✅ **Build Success**
- [ ] Backend builds without errors
- [ ] Frontend builds without errors
- [ ] Calendar MCP builds without errors

✅ **No Old References**
- [ ] 0 matches for `@rendetaljeos` in source code
- [ ] 0 matches for `rendetaljeos.onrender.com` in configs
- [ ] No broken imports

✅ **Deployment Success**
- [ ] Render.com services deploy successfully
- [ ] API responds to health checks
- [ ] Frontend loads in browser

✅ **Integration Intact**
- [ ] Billy MCP client still works
- [ ] Database connections work
- [ ] Calendar MCP talks to backend

---

## 🤝 REVIEW & APPROVAL NEEDED

**Før vi kører migrationen, skal PC1 reviewe:**

### Kritiske Beslutninger:
1. ✅ Enig i "RenOS" som standard navn?
2. ✅ OK at slette tom `monorepo/` mappe?
3. ✅ OK med Render URL ændring (rendetaljeos → renos)?
4. ✅ Timing: Kør migration nu eller senere?

### PC1 Review Checklist:
- [ ] Læs igennem DESIGN DECISIONS sektion
- [ ] Gennemgå VISUAL DIAGRAMS
- [ ] Verificer MIGRATIONSPLAN er komplet
- [ ] Approve eller request changes

**Når approved:** PC2 kører FASE 1-10 commands step-by-step.

---

## 📞 NEXT STEPS

### For PC1 (Empir):
1. Læs denne docs grundigt
2. Beslut: Approve eller request changes?
3. Hvis approved: Notify PC2 to proceed
4. Hvis changes needed: Opdater plan sammen

### For PC2 (Jonas-dev):
1. ✅ Research complete
2. ✅ Plan dokumenteret
3. ⏳ Awaiting PC1 approval
4. ⏳ Execute migration (når approved)

---

## 📚 APPENDIX

### A. Navngivnings-Ordliste

| Term | Betydning | Brug |
|------|----------|------|
| **Rendetalje** | Virksomhedsnavn | Brand, kunde-facing UI |
| **Rendetalje.dk** | Domæne | Website URL |
| **RenOS** | Platform navn | Tech docs, logs, internal |
| **@renos** | Package namespace | npm packages, imports |
| **renos** | Schema navn | Database, backend code |

### B. File Extensions Affected

```
.ts      - TypeScript source (import paths)
.tsx     - React TypeScript (import paths)
.json    - package.json (package names)
.md      - Documentation (references)
.yaml    - Deployment configs (service names)
.yml     - Docker compose (service names)
```

### C. Estimated Timeline

| Fase | Tid | Kritikalitet |
|------|-----|-------------|
| Forberedelse | 5 min | 🔴 Critical |
| Mappestruktur | 10 min | 🔴 Critical |
| Package Names | 20 min | 🔴 Critical |
| Import Paths | 30 min | 🟡 Important |
| Display Names | 15 min | 🟢 Nice-to-have |
| Deployment Configs | 10 min | 🔴 Critical |
| Documentation | 15 min | 🟡 Important |
| Testing | 20 min | 🔴 Critical |
| Commit & Push | 5 min | 🔴 Critical |
| Render Updates | 15 min | 🟡 Important |
| **TOTAL** | **~2.5 timer** | |

---

## ✅ FÆRDIG MED RESEARCH

**Status:** Klar til PC1 review og approval.

**Dokumenteret:**
- ✅ Komplet current state analyse
- ✅ Visual diagrammer (før/efter)
- ✅ Design decisions med rationale
- ✅ Step-by-step migrationsplan
- ✅ Rollback procedure
- ✅ Success metrics
- ✅ Post-migration checklist

**Næste:** PC1 skal godkende plan, derefter execute migration.

---

**Lavet af:** PC2 (GitHub Copilot)  
**Metode:** Tekup Research → Plan → Execute  
**Dato:** 24. Oktober 2025, 01:15 CET
