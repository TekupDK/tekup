# 🗺️ TEKUP MONOREPO - VISUAL STRUKTUR OVERSIGT

**Dato:** 24. Oktober 2025, 10:05  
**Formål:** Klar oversigt over mappestrukturen så det ikke er forvirrende

---

## 📊 OVERORDNET STRUKTUR (Top Level)

```
C:\Users\Jonas-dev\Tekup-Monorepo\
│
├── 📁 apps/                    ← ALLE APPLIKATIONER
│   ├── production/            ← Live production services
│   ├── rendetalje/            ← Rendetalje/RenOS platform
│   └── web/                   ← Web dashboards
│
├── 📁 services/               ← Backend services (AI, Gmail)
│
├── 📁 packages/               ← Shared packages (tom pt.)
│
├── 📁 scripts/                ← Build/deploy scripts
│
├── 📁 docs/                   ← Central documentation
│
├── 📁 tekup-secrets/          ← 🔐 Encrypted secrets (git-crypt)
│
├── 📁 archive/                ← Gamle projekter (read-only)
│
├── 📄 README.md               ← Main readme
├── 📄 Tekup-Portfolio.code-workspace  ← VS Code workspace
└── 📄 tekup-git-crypt.key     ← Encryption key
```

---

## 🏭 apps/production/ - PRODUCTION SERVICES (3 services)

```
apps/production/
│
├── 📦 tekup-billy/            ← Billy.dk MCP Server
│   ├── src/                   (TypeScript source)
│   ├── docs/                  (150+ markdown files)
│   ├── tests/                 (integration tests)
│   ├── deployment/            (Render.com configs)
│   ├── package.json           (@tekup-billy/mcp v1.4.3)
│   └── render.yaml            (Production deployment)
│
├── 📦 tekup-database/         ← Centralized Prisma DB Layer
│   ├── prisma/
│   │   ├── schema.prisma      (Main consolidated 1456 lines)
│   │   ├── schema-renos.prisma    (RenOS 557 lines)
│   │   ├── schema-crm.prisma      (CRM 322 lines)
│   │   └── schema-flow.prisma     (Flow 316 lines)
│   ├── src/client/            (TypeScript clients)
│   ├── examples/              (Usage examples)
│   └── package.json           (v1.1.0)
│
└── 📦 tekup-vault/            ← AI Knowledge Base
    ├── apps/
    │   ├── vault-api/         (REST API)
    │   └── vault-worker/      (GitHub sync worker)
    ├── packages/
    │   ├── vault-core/        (Shared types)
    │   ├── vault-ingest/      (Source connectors)
    │   └── vault-search/      (Semantic search)
    ├── supabase/migrations/   (Database schema)
    ├── turbo.json             (Turborepo config)
    └── pnpm-workspace.yaml    (pnpm workspaces)
```

**Status:**

- ✅ Kode komplet (123,171+ linjer)
- ⏳ Dependencies ikke installeret
- ✅ Production live (Billy, Vault)

---

## 🏢 apps/rendetalje/ - RENDETALJE/RENOS PLATFORM

### ⚠️ PROBLEM OMRÅDE - FORVIRRENDE STRUKTUR

```
apps/rendetalje/               ← Hovedmappe (inkonsistent naming)
│
├── 📁 docs/                   ✅ BEHOLD (god struktur)
│   └── services/cloud-docs/
│       ├── architecture/      (15 docs: system design, repos)
│       ├── plans/             (10 docs: strategiske plans)
│       ├── reports/           (30 docs: audits, analytics)
│       ├── status/            (8 docs: deployment status)
│       ├── technical/         (4 docs: API, deployment)
│       └── user-guides/       (3 docs: customer/employee/owner)
│
├── 📁 monorepo/               ❌ PROBLEM: TOM MAPPE (0 filer!)
│   └── (ingen filer)
│
└── 📁 services/               ⚠️ PROBLEM: Inkonsistent naming
    │
    ├── 📦 backend-nestjs/     (@rendetaljeos/backend)
    │   ├── src/
    │   │   ├── auth/          (JWT, guards, strategies)
    │   │   ├── customers/     (CRUD)
    │   │   ├── jobs/          (Job management)
    │   │   ├── team/          (Team management)
    │   │   ├── time-tracking/ (Time entries)
    │   │   ├── integrations/  (Billy, Vault, RenOS Calendar)
    │   │   ├── realtime/      (WebSocket gateway)
    │   │   ├── security/      (Audit, encryption)
    │   │   └── common/        (Logger, Sentry)
    │   ├── test/
    │   └── package.json       (@rendetaljeos/backend v1.0.0)
    │
    ├── 📦 frontend-nextjs/    (@rendetaljeos/frontend)
    │   ├── src/
    │   │   ├── app/           (Next.js 15 app router)
    │   │   ├── components/
    │   │   │   ├── customer/  (Booking, messaging, reviews)
    │   │   │   ├── employee/  (Job list, time tracker)
    │   │   │   └── dashboard/ (Owner KPIs, charts)
    │   │   ├── hooks/
    │   │   └── lib/
    │   └── package.json       (@rendetaljeos/frontend v1.0.0)
    │
    ├── 📦 calendar-mcp/       (@renos/calendar-mcp) ← Kun denne!
    │   ├── src/               (MCP server)
    │   ├── chatbot/           (renos-calendar-chatbot)
    │   ├── dashboard/         (renos-calendar-dashboard)
    │   ├── docs/              (API, deployment guides)
    │   ├── tests/
    │   └── package.json       (@renos/calendar-mcp v0.1.0)
    │
    ├── 📦 mobile/             (@rendetaljeos/mobile)
    │   └── package.json       (@rendetaljeos/mobile v1.0.0)
    │
    ├── 📦 shared/             (@rendetaljeos/shared)
    │   └── package.json       (@rendetaljeos/shared v1.0.0)
    │
    ├── 📁 database/           (SQL migrations, setup scripts)
    │   ├── migrations/        (4 SQL files)
    │   └── schema.sql
    │
    ├── 📁 deployment/         (Deployment configs)
    │   ├── render/
    │   │   └── render.yaml
    │   └── scripts/
    │
    └── 📁 scripts/            (Automation scripts)
        └── deploy-all.ps1
```

### 🔴 IDENTIFICEREDE PROBLEMER

1. **Inkonsistent Package Naming:**
   - Backend/Frontend/Mobile/Shared: `@rendetaljeos/*`
   - Calendar MCP: `@renos/*`
   - Chatbot/Dashboard: `renos-*` (ingen namespace)

2. **Tom Mappe:**
   - `monorepo/` - 0 filer, ingen formål

3. **Navneforvirring:**
   - Folder: `rendetalje`
   - Packages: `rendetaljeos`
   - Calendar: `renos`
   - Database schema: `renos`
   - Display navn: `RendetaljeOS`

**Løsning:** Se `RENDETALJE_RESTRUCTURE_COMPLETE_PLAN.md`

---

## 🌐 apps/web/ - WEB DASHBOARDS

```
apps/web/
│
└── 📦 tekup-cloud-dashboard/  ← Fremtidig unified dashboard
    └── (placeholder - ikke aktiv endnu)
```

---

## ⚙️ services/ - BACKEND SERVICES

```
services/
│
├── 📦 tekup-ai/               ← AI Infrastructure
│   └── (workspace reference)
│
└── 📦 tekup-gmail-services/   ← Email Automation
    └── (v1.0.0 - service layer)
```

---

## 🔐 tekup-secrets/ - ENCRYPTED SECRETS

```
tekup-secrets/
│
├── .env.development           ← Dev API keys
├── .env.production            ← Production credentials
├── .env.shared                ← Shared config
│
└── config/
    ├── ai-services.env        ← OpenAI, Gemini keys
    ├── apis.env               ← API credentials
    ├── databases.env          ← Database URLs
    ├── email.env              ← SMTP configs
    ├── google-workspace.env   ← Google credentials
    ├── monitoring.env         ← Sentry DSNs
    └── oauth.env              ← OAuth tokens
```

**Status:** ✅ Unlocked med git-crypt (alle filer læsbare)

---

## 📦 archive/ - GAMLE PROJEKTER

```
archive/
│
├── tekup-ai-assistant-archived-2025-10-23/
├── tekup-chat-archived-2025-10-23/
└── ... (gamle projekter - read-only)
```

---

## 🎯 INTEGRATION MELLEM PROJEKTER

```
┌──────────────────────────────────────────────────────────┐
│                    TEKUP ECOSYSTEM                       │
└──────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
   │  Billy  │      │Database │     │  Vault  │
   │   MCP   │      │ (Prisma)│     │Knowledge│
   └────┬────┘      └────┬────┘     └────┬────┘
        │                │                │
        │    ┌───────────┴───────────┐    │
        │    │                       │    │
        └────▼────┐           ┌──────▼────┘
        │ RenOS   │           │           │
        │ Backend │◄──────────┤   Vault   │
        │(NestJS) │           │   Search  │
        └────┬────┘           └───────────┘
             │
      ┌──────┴──────┬────────────┐
      │             │            │
┌─────▼─────┐ ┌─────▼─────┐ ┌───▼────┐
│  RenOS    │ │ Calendar  │ │ Mobile │
│ Frontend  │ │    MCP    │ │  App   │
│(Next.js)  │ │           │ │        │
└───────────┘ └───────────┘ └────────┘
```

**Dependencies:**

- RenOS Backend → tekup-database (Prisma schemas)
- RenOS Backend → tekup-billy (Invoice API via MCP client)
- RenOS Backend → tekup-vault (Knowledge search)
- Calendar MCP → RenOS Backend (Booking validation)

---

## 📊 STATISTIK

### Projekter

- **Production Services:** 3 (Billy, Database, Vault)
- **RenOS Services:** 7 (Backend, Frontend, Calendar, Mobile, Shared, Database, Scripts)
- **Web Dashboards:** 1 (placeholder)
- **Backend Services:** 2 (AI, Gmail)

### Kode

- **Total filer:** 700+ filer
- **Total linjer:** 150,000+ linjer
- **Secrets:** 10 encrypted .env filer

### Dependencies Status

- ✅ **Secrets unlocked** (git-crypt)
- ⏳ **Dependencies mangler** (npm/pnpm install)
- ⏳ **Build ikke kørt** (npm run build)

---

## 🚨 HVAD ER FORVIRRENDE (OG HVORDAN VI LØSER DET)

### Problem 1: "Hvor er RenOS koden?"

**Svar:** `apps/rendetalje/services/` ← Alt RenOS kode er her

### Problem 2: "Hvorfor hedder det både rendetalje OG renos?"

**Svar:** Inkonsistent naming - derfor laver vi restructure planen!

### Problem 3: "Hvad er den tomme monorepo/ mappe?"

**Svar:** Fejl - skal slettes (0 filer)

### Problem 4: "Hvordan hænger Billy, Database og Vault sammen?"

**Svar:**

- Billy = API til fakturering
- Database = Fælles schemas for alle projekter
- Vault = Knowledge base for AI search
- RenOS Backend bruger ALLE TRE

### Problem 5: "Skal jeg installere dependencies i hver mappe?"

**Svar:** Ja, hver package.json skal have `npm install` / `pnpm install`

---

## ✅ NÆSTE STEPS

### For at få klarhed

1. ✅ **Læs denne fil** (du er her!)
2. ⏳ **Beslut:** Kør Rendetalje restructure? (se RENDETALJE_RESTRUCTURE_COMPLETE_PLAN.md)
3. ⏳ **Installer dependencies** når struktur er klar

### Quick Commands til at udforske

```powershell
# Se production services
ls apps\production\

# Se RenOS services
ls apps\rendetalje\services\

# Tjek package names
Get-ChildItem -Path apps -Filter package.json -Recurse | 
  ForEach-Object { Get-Content $_ | Select-String '"name":' }

# Se secrets (nu læsbare!)
ls tekup-secrets\
```

---

**Håber det er mere klart nu!** 🎯

Hvis noget stadig er forvirrende, spørg om den SPECIFIKKE del!
