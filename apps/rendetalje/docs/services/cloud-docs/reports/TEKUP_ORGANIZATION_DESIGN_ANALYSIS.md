# 🏢 TEKUP ORGANISATION - Design & Arkitektur Analyse
**Dato**: 18. Oktober 2025  
**Formål**: Forstå hvordan alle Tekup-komponenter spiller sammen  
**Scope**: Organisatorisk design - INGEN kodeændringer

---

## 📋 INDHOLDSFORTEGNELSE
1. [Nuværende Situation (AS-IS)](#nuværende-situation)
2. [Tilsigtet Vision (TO-BE)](#tilsigtet-vision)
3. [Komponent Relation Diagram](#komponent-relationer)
4. [Workspace Strategi](#workspace-strategi)
5. [Konsoliderings Roadmap](#konsoliderings-roadmap)

---

## 🔍 NUVÆRENDE SITUATION (AS-IS)

### Problem: Fragmenteret Organisation

Din Tekup-organisation er i øjeblikket **spredt over 14+ separate komponenter** uden klar struktur:

```
TEKUP ØKOSYSTEM - NUVÆRENDE KAOS
═══════════════════════════════════════════════════════════════

📁 LOKALE WORKSPACES (3 stk - spredt på disk)
├── Tekup-Cloud/          ← Dokumentation & audit scripts
├── Tekup-org/            ← Rapporter (utilgængeligt fra andre workspaces)
└── RendetaljeOS/         ← Monorepo eksperiment (aldrig deployét)

🗂️ GITHUB REPOSITORIES (11 stk - ingen klar gruppering)
├── 🟢 PRODUKTION (4 stk)
│   ├── TekupVault         → Render.com ✅
│   ├── renos-backend      → Render.com ✅
│   ├── renos-frontend     → Render.com ✅
│   └── Tekup-Billy        → Render.com ✅
│
├── 🟡 DASHBOARDS (3 stk - hvad er forskellen?)
│   ├── tekup-cloud-dashboard
│   ├── tekup-renos-dashboard
│   └── tekup-nexus-dashboard
│
├── 🔵 INFRASTRUKTUR (2 stk)
│   ├── Tekup-org (20 åbne issues!)
│   └── tekup-unified-docs
│
└── 🔴 ARKIVERET/EKSPERIMENTER (3 stk)
    ├── Tekup-OS (tom siden august)
    ├── Tekup-OS-Emergent (6 issues)
    └── tekup-renos (13 issues, forældet)

☁️ RENDER.COM SERVICES (4 stk - alle i "Tekup" workspace)
├── TekupVault (Node.js) - apps/vault-api/
├── renos-backend (Node.js) - Express + Prisma + AI
├── renos-frontend (Static) - Vite + React
└── Tekup-Billy (Docker) - MCP Server for Billy.dk

🔌 EKSTERNE SERVICES (spredt integration)
├── Supabase PostgreSQL (bruges af: backend, TekupVault)
├── Redis Cache (bruges af: backend)
├── Clerk Auth (bruges af: backend)
└── Sentry Monitoring (bruges af: backend)
```

### 🚨 Kerneproblem

**DU HAR INGEN SAMLET "TEKUP.DK" ORGANISATION**

- 3 lokale workspaces med forskellige formål
- 11 GitHub repos uden klar taxonomi
- 3 dashboards der muligvis gør det samme
- Dokumentation spredt over Tekup-Cloud, Tekup-org, og repositories
- Ingen single source of truth

---

## 🎯 TILSIGTET VISION (TO-BE)

### Idéel Struktur: **Tekup.dk Unified Platform**

```
╔═══════════════════════════════════════════════════════════════╗
║                    TEKUP.DK PLATFORM                          ║
║              (Single Unified Organization)                     ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────┐
│  📁 TEKUP.DK WORKSPACE (Single Source of Truth)             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🗂️ CORE PLATFORM (Monorepo)                                │
│  ├── apps/                                                   │
│  │   ├── tekup-vault/        ← Intelligence Layer          │
│  │   ├── tekup-renos/        ← RenOS (backend + frontend)  │
│  │   ├── tekup-billy/        ← Billy.dk Integration        │
│  │   └── tekup-dashboard/    ← Unified Dashboard           │
│  │                                                           │
│  ├── packages/                                               │
│  │   ├── @tekup/shared-ui    ← Design system               │
│  │   ├── @tekup/api-client   ← Fælles API client           │
│  │   ├── @tekup/auth         ← Clerk wrapper               │
│  │   └── @tekup/database     ← Prisma schemas              │
│  │                                                           │
│  ├── infrastructure/                                         │
│  │   ├── docker/             ← Dockerfiles                  │
│  │   ├── render/             ← Render.com configs           │
│  │   └── supabase/           ← Database migrations          │
│  │                                                           │
│  └── docs/                                                   │
│      ├── architecture/       ← Denne fil + diagrammer       │
│      ├── api/                ← API dokumentation            │
│      ├── deployment/         ← Deploy guides                │
│      └── reports/            ← Audit reports                │
│                                                              │
│  🔧 TOOLING                                                  │
│  ├── turbo.json             ← Turborepo orchestration       │
│  ├── pnpm-workspace.yaml    ← Package management            │
│  └── .github/workflows/     ← CI/CD pipelines              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 KOMPONENT RELATIONER - Sådan Spiller Det Sammen

### 🎭 **Lag-Arkitektur**

```
┌────────────────────────────────────────────────────────────────┐
│                      LAG 1: PRÆSENTATION                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   RenOS      │  │   Billy.dk   │  │   Unified    │         │
│  │  Dashboard   │  │  Interface   │  │  Dashboard   │         │
│  │ (React SPA)  │  │  (React UI)  │  │  (Next.js)   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
│         └─────────────────┴──────────────────┘                  │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                      LAG 2: API GATEWAY                         │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────┐         │
│  │         API Router / Load Balancer                │         │
│  │  (Muligvis Cloudflare Workers / Nginx)            │         │
│  └────────────┬─────────────────────┬─────────────────┘        │
│               │                     │                           │
└───────────────┼─────────────────────┼───────────────────────────┘
                │                     │
┌───────────────┼─────────────────────┼───────────────────────────┐
│          LAG 3: FORRETNINGSLOGIK                                │
│               │                     │                           │
│  ┌────────────▼─────────┐  ┌───────▼────────────┐             │
│  │   RenOS Backend      │  │   Tekup-Billy      │             │
│  │  (Express + Prisma)  │  │  (MCP HTTP Server) │             │
│  │                      │  │                    │             │
│  │  • AI Agents (6)     │  │  • Billy.dk Tools  │             │
│  │  • Gmail/Calendar    │  │  • Invoices        │             │
│  │  • Lead Management   │  │  • Products        │             │
│  │  • Booking System    │  │  • Contacts        │             │
│  └──────────┬───────────┘  └──────────┬─────────┘             │
│             │                          │                        │
│             └──────────┬───────────────┘                        │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────────┐
│                   LAG 4: INTELLIGENCE                           │
│                        │                                        │
│  ┌─────────────────────▼────────────────────────┐              │
│  │            TekupVault                        │              │
│  │  (Knowledge Graph + Semantic Search)         │              │
│  │                                              │              │
│  │  • Ingestion Pipeline                        │              │
│  │    ├─ GitHub Sync (3 repos, 6h cycles)      │              │
│  │    ├─ Shortwave MCP Server (emails)         │              │
│  │    └─ Webhook Endpoint (real-time)          │              │
│  │                                              │              │
│  │  • Processing                                │              │
│  │    ├─ OpenAI Embeddings (text-embedding-3)  │              │
│  │    ├─ Chunk + Index (pgvector)              │              │
│  │    └─ Metadata Extraction                   │              │
│  │                                              │              │
│  │  • Query Interface                           │              │
│  │    ├─ Semantic Search API                   │              │
│  │    ├─ Context Retrieval                     │              │
│  │    └─ AI Agent Memory                       │              │
│  └──────────────────┬───────────────────────────┘              │
│                     │                                           │
└─────────────────────┼───────────────────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────────────────┐
│                LAG 5: DATA & INFRASTRUKTUR                      │
│                     │                                           │
│  ┌──────────────────▼────────────┐  ┌─────────────────┐        │
│  │   Supabase PostgreSQL         │  │  Redis Cache    │        │
│  │                               │  │                 │        │
│  │  • RenOS Database (23 models) │  │  • Sessions     │        │
│  │  • TekupVault (pgvector)      │  │  • Rate limits  │        │
│  │  • Billy.dk Cache             │  │  • Temp data    │        │
│  └───────────────────────────────┘  └─────────────────┘        │
│                                                                 │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │  Clerk Auth      │  │ Sentry Monitor │  │  OpenAI API    │ │
│  │  (Users/Orgs)    │  │ (Error Track)  │  │  (AI Models)   │ │
│  └──────────────────┘  └────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 🔄 **Data Flow Eksempel: Lead Processing**

```
1. Email kommer ind (Gmail API)
            ↓
2. RenOS Backend AI Agent scanner emailen
            ↓
3. Agent forespørger TekupVault: "Find lignende leads"
            ↓
4. TekupVault returnerer semantisk søgning på historiske leads
            ↓
5. Agent opretter lead i RenOS database (Prisma)
            ↓
6. Hvis leadet accepteres → oprettes faktura i Billy.dk via Tekup-Billy
            ↓
7. Faktura data gemmes i RenOS + Billy.dk
            ↓
8. TekupVault indexerer ny lead + faktura for fremtidig kontekst
            ↓
9. Dashboard viser opdateret status (real-time via websockets)
```

---

## 📂 WORKSPACE STRATEGI

### 🎯 **Anbefalingen: Single Unified Workspace**

**Navn**: `Tekup-Platform` eller `Tekup-Monorepo`

#### **Hvad Skal Samles:**

```
KONSOLIDER DISSE 3 WORKSPACES:
┌─────────────────────────────────────────────────┐
│ ❌ Tekup-Cloud/     (audit scripts + docs)      │
│ ❌ Tekup-org/       (rapporter)                  │
│ ❌ RendetaljeOS/    (monorepo eksperiment)       │
│                                                  │
│                     ↓ MERGE ↓                    │
│                                                  │
│ ✅ Tekup-Platform/  (UNIFIED WORKSPACE)          │
│    ├── apps/                                     │
│    │   ├── tekup-vault/     (fra TekupVault)    │
│    │   ├── renos-backend/   (fra renos-backend) │
│    │   ├── renos-frontend/  (fra renos-frontend)│
│    │   ├── tekup-billy/     (fra Tekup-Billy)   │
│    │   └── dashboard/       (NYT - unified)     │
│    │                                             │
│    ├── packages/                                 │
│    │   ├── @tekup/ui        (shared components) │
│    │   ├── @tekup/api       (API clients)       │
│    │   └── @tekup/auth      (Clerk wrapper)     │
│    │                                             │
│    ├── docs/                                     │
│    │   ├── architecture/    (denne analyse)     │
│    │   ├── reports/         (fra Tekup-org)     │
│    │   └── deployment/      (Render configs)    │
│    │                                             │
│    └── scripts/                                  │
│        └── audit/           (fra Tekup-Cloud)   │
└─────────────────────────────────────────────────┘
```

#### **Hvad Skal Arkiveres:**

```
ARKIVER DISSE REPOS (lav GitHub archive):
├── ❌ Tekup-OS (tom siden august 2025)
├── ❌ Tekup-OS-Emergent (eksperiment, 6 issues)
├── ❌ tekup-renos (forældet, erstattet af renos-backend/frontend)
├── ❌ tekup-nexus-dashboard (uklart formål)
└── ❌ tekup-renos-dashboard (duplikeret af unified dashboard)
```

#### **Hvad Skal Beholdes Som Separate Repos:**

```
SEPARATE REPOS (dokumentation/public):
├── ✅ tekup-unified-docs (PowerShell scripts, public docs)
├── ✅ tekup-ai-assistant (public AI integration guides)
└── ✅ tekup-cloud-dashboard (hvis distinct fra unified dashboard)
```

---

## 🗺️ KONSOLIDERINGS ROADMAP

### **FASE 0: Planlægning (1-2 dage)** ⬅️ DU ER HER

**Mål**: Forstå arkitekturen uden at ændre kode

✅ **Opgaver**:
- [✅] Identificer alle komponenter (DONE)
- [✅] Map relationer mellem systemer (DONE)
- [✅] Dokument nuværende vs. tilsigtet tilstand (DETTE DOKUMENT)
- [ ] Få stakeholder buy-in (dig selv 😊)

**Output**: Denne analyse rapport

---

### **FASE 1: Repository Audit (2-3 dage)**

**Mål**: Tag inventory og beslut hvad der skal beholdes

✅ **Opgaver**:
1. **Health Check på alle 11 repos**:
   ```bash
   # For hvert repo:
   - Sidste commit dato
   - Åbne issues/PRs
   - Dependencies status
   - Deployment status
   - Code duplication check
   ```

2. **Kategoriser**:
   - 🟢 KEEP: Aktiv produktion (4 repos)
   - 🟡 EVALUATE: Potentiel værdi (3 dashboard repos)
   - 🔴 ARCHIVE: Forældet/tom (4 repos)

3. **Dependency Mapping**:
   ```
   Hvilke repos deler kode?
   Hvilke kan merges?
   Hvilke SKAL forblive separate?
   ```

**Output**: `REPOSITORY_AUDIT_REPORT.md`

---

### **FASE 2: Unified Workspace Oprettelse (3-5 dage)**

**Mål**: Opret den nye `Tekup-Platform` monorepo

#### **Step 1: Bootstrap Monorepo**
```bash
# Opret ny monorepo struktur
mkdir Tekup-Platform
cd Tekup-Platform

# Init Turborepo
pnpm dlx create-turbo@latest
```

#### **Step 2: Migrer Core Apps (én ad gangen)**
```bash
# Priority 1: TekupVault (mest kompleks)
git subtree add --prefix apps/tekup-vault \
  https://github.com/JonasAbde/TekupVault.git main

# Priority 2: renos-backend
git subtree add --prefix apps/renos-backend \
  https://github.com/JonasAbde/renos-backend.git main

# Priority 3: renos-frontend
git subtree add --prefix apps/renos-frontend \
  https://github.com/JonasAbde/renos-frontend.git main

# Priority 4: Tekup-Billy
git subtree add --prefix apps/tekup-billy \
  https://github.com/JonasAbde/Tekup-Billy.git main
```

#### **Step 3: Ekstraher Shared Packages**
```typescript
// Identificer duplikeret kode:
// - Prisma schemas (backend + vault)
// - API client logic
// - UI components (hvis delt mellem dashboards)
// - Auth wrapper (Clerk i backend)

// Flyt til packages/@tekup/*
```

#### **Step 4: Konsolider Dokumentation**
```bash
# Saml alt fra:
# - Tekup-Cloud/ → docs/
# - Tekup-org/reports/ → docs/reports/
# - Hver app's README → docs/apps/{app-name}.md
```

**Output**: Fungerende monorepo lokalt

---

### **FASE 3: CI/CD & Deployment (2-3 dage)**

**Mål**: Opdater Render.com til at deploye fra monorepo

#### **Render.com Opdateringer**:

```yaml
# render.yaml (monorepo root)
services:
  - type: web
    name: tekup-vault
    runtime: node
    rootDir: apps/tekup-vault
    buildCommand: pnpm install && pnpm --filter tekup-vault build
    startCommand: pnpm --filter tekup-vault start
    
  - type: web
    name: renos-backend
    runtime: node
    rootDir: apps/renos-backend
    buildCommand: pnpm install && pnpm --filter renos-backend build
    startCommand: pnpm --filter renos-backend start
    
  - type: static
    name: renos-frontend
    rootDir: apps/renos-frontend
    buildCommand: pnpm install && pnpm --filter renos-frontend build
    publishPath: apps/renos-frontend/dist
    
  - type: web
    name: tekup-billy
    runtime: docker
    dockerfilePath: apps/tekup-billy/Dockerfile
    dockerContext: .
```

#### **GitHub Actions**:
```yaml
# .github/workflows/deploy.yml
name: Deploy to Render
on:
  push:
    branches: [main]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm turbo build
      # Render auto-deploy from here
```

**Output**: Automatisk deployment fra single repo

---

### **FASE 4: Archive & Cleanup (1-2 dage)**

**Mål**: Ryd op i gamle repos og workspaces

#### **GitHub Archives**:
```bash
# Arkiver disse repos (Settings → Archive):
- Tekup-OS
- Tekup-OS-Emergent  
- tekup-renos
- tekup-nexus-dashboard (hvis duplikat)
- tekup-renos-dashboard (hvis duplikat)
```

#### **Lokal Cleanup**:
```powershell
# Slet gamle workspaces (efter backup):
Remove-Item -Recurse -Force C:\Users\empir\Tekup-Cloud
Remove-Item -Recurse -Force C:\Users\empir\Tekup-org  
Remove-Item -Recurse -Force C:\Users\empir\RendetaljeOS

# Evt. git clone separate repos til arkiv mappe:
mkdir C:\Users\empir\Tekup-Archive
cd C:\Users\empir\Tekup-Archive
git clone --mirror https://github.com/JonasAbde/Tekup-OS.git
# ... osv for alle arkiverede repos
```

**Output**: Ryddet workspace, kun `Tekup-Platform` tilbage

---

### **FASE 5: Documentation & Training (1 dag)**

**Mål**: Opdater al dokumentation til ny struktur

✅ **Opgaver**:
- Opdater README.md i Tekup-Platform
- Lav `CONTRIBUTING.md` guide
- Opret `MIGRATION_GUIDE.md` for teammedlemmer
- Opdater TekupVault til at kun sync ét repo nu (Tekup-Platform)

**Output**: Komplet dokumenteret system

---

## 📊 SAMMENLIGNING: FØR vs. EFTER

### **❌ FØR (Nuværende Kaos)**

```
Repositories:     11 separate repos
Workspaces:       3 spredte lokale mapper
Documentation:    Spredt (Tekup-Cloud, Tekup-org, hver repo)
Deployment:       4 separate Render services
Dependencies:     Duplikeret (Prisma, Clerk, React, etc.)
Onboarding tid:   4-6 timer (find repos, setup, docs)
Build tid:        N/A (hver app bygger separat)
Code sharing:     Umuligt (copy/paste mellem repos)
```

### **✅ EFTER (Unified Platform)**

```
Repositories:     1 monorepo + 2-3 public docs repos
Workspaces:       1 enkelt Tekup-Platform
Documentation:    Centraliseret (docs/ folder)
Deployment:       1 render.yaml, 4 services fra samme repo
Dependencies:     Shared (packages/@tekup/*)
Onboarding tid:   30 minutter (clone + pnpm install)
Build tid:        Optimeret (Turborepo caching)
Code sharing:     Built-in (import from @tekup/*)
```

---

## 🎯 BESLUTNINGSPUNKTER

### **Spørgsmål Til Dig:**

1. **Dashboard Strategi**:
   - Har du 3 forskellige dashboards (cloud, renos, nexus)?
   - Eller skal de merges til ét unified dashboard?
   - → *Action*: Audit hver dashboard, bestem formål

2. **Tekup-org Repo**:
   - 20 åbne issues + massive uncommitted files
   - Indeholder det værdifuld kode?
   - → *Action*: Git forensics, beslut om revival eller archive

3. **Migration Timing**:
   - Hvornår vil du starte konsolideringen?
   - Skal det være en "big bang" migration eller gradvis?
   - → *Action*: Vælg FASE 1 start dato

4. **Branding**:
   - Skal det hedde "Tekup-Platform", "Tekup-Monorepo", eller "Tekup.dk"?
   - → *Action*: Beslut navn til unified workspace

---

## 📝 NÆSTE SKRIDT

### **Umiddelbart (i dag):**
1. ✅ **Læs denne analyse** - forstå big picture
2. 🔍 **Audit de 3 dashboards**:
   ```bash
   # Hvad GØR hver dashboard faktisk?
   cd C:\Users\empir\tekup-cloud-dashboard
   cat README.md
   cat package.json
   # Gentag for nexus + renos
   ```
3. 📊 **Besvar de 4 beslutningspunkter ovenfor**

### **I morgen:**
4. 🗂️ **Start FASE 1**: Repository audit
5. 📋 **Opret project board** (GitHub Projects):
   - Columns: Backlog, In Progress, Review, Done
   - Tasks fra hver fase

### **Næste uge:**
6. 🚀 **Start FASE 2**: Opret Tekup-Platform monorepo
7. 🔄 **Migrer første app** (start med TekupVault)

---

## 🎓 LÆRINGER & PRINCIPPER

### **Hvorfor Monorepo?**

✅ **Fordele**:
- Single source of truth
- Atomic commits (ændre backend + frontend samtidig)
- Shared tooling (ESLint, TypeScript config)
- Lettere code review
- Turborepo caching = 5-10x hurtigere builds

⚠️ **Ulemper**:
- Større initial setup
- Kræver disciplin (code owners, folder structure)
- Git history bliver tungere (men git subtree bevarer historik)

### **Hvornår IKKE Monorepo?**

- Public open source repos (bedre som separate)
- Meget forskellige tech stacks (Python + TypeScript)
- Teams der arbejder 100% isoleret

**Dit tilfælde**: Monorepo giver MENING fordi:
- Samme tech stack (TypeScript, Node.js, React)
- Deler dependencies (Prisma, Supabase, Clerk)
- Behov for tæt integration (TekupVault ↔ RenOS ↔ Billy)

---

## 🔗 RELATEREDE DOKUMENTER

- [Portfolio Executive Summary](./PORTFOLIO_EXECUTIVE_SUMMARY.md)
- [Tekup Workspace ChatGPT Config](./TEKUP_WORKSPACE_CHATGPT_PROJECT.md)
- [Render Deployment Status](./RENDER_DEPLOYMENT_STATUS.md)

---

## 📞 SUPPORT & SPØRGSMÅL

**Hvis du er i tvivl om:**
- Hvilken fase du skal starte med
- Hvordan man laver git subtree migration
- Render.com monorepo setup

**Så spørg mig!** Jeg kan:
- Lave detaljerede guides til hver fase
- Hjælpe med at auditere specifikke repos
- Generere migration scripts
- Review din beslutning før du committer

---

**🎯 TL;DR:**
- Du har 11 repos spredt ud - det er kaos
- Idéel tilstand: 1 unified `Tekup-Platform` monorepo
- 5 faser: Planlægning (done) → Audit → Migration → Deploy → Cleanup
- Start med at audit dine 3 dashboards og besvar 4 beslutningspunkter
- Jeg står klar til at hjælpe med hver fase! 🚀
