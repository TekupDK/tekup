# 🚀 Tekup Portfolio Monorepo

**Complete development workspace** with ALL Tekup projects unified in one repository.

**Repository:** https://github.com/TekupDK/tekup  
**Type:** Multi-workspace monorepo (production services + web apps + backend)  
**Workspace File:** `Tekup-Portfolio.code-workspace`  
**Last Sync:** 23. Oktober 2025 (PC1 → PC2)

> 📊 **Status:** ✅ Fully synced across PC1 (empir) and PC2 (Jonas-dev)  
> 📁 **Total:** 700+ files, 150,000+ lines of code  
> 🔐 **Secrets:** Git submodule (private repo: TekupDK/tekup-secrets)

---

## 📁 Workspace Structure

```
Tekup/ (MONOREPO - everything in one repo!)
├── apps/
│   ├── production/        → Live production services
│   │   ├── tekup-database/
│   │   ├── tekup-vault/
│   │   └── tekup-billy/
│   └── web/               → Web applications
│       ├── rendetalje/
│       └── tekup-cloud-dashboard/
├── services/              → Backend services & APIs
│   ├── tekup-ai/
│   └── tekup-gmail-services/
├── tekup-secrets/         → Git submodule (TekupDK/tekup-secrets - private)
├── archive/               → Legacy projects (read-only)
├── docs/                  → Documentation hub
├── scripts/               → Build & deployment automation
└── Tekup-Portfolio.code-workspace ← Open this in VS Code!
```

---

## 🎯 Active Projects

### **🏭 Production Services** (`apps/production/`)

#### **tekup-billy** (v1.4.3)

- **Purpose:** MCP server for Billy.dk accounting API integration
- **Tech:** TypeScript, Express, Supabase, Redis
- **Status:** ✅ Production ready (https://tekup-billy.onrender.com)
- **Features:** 32 MCP tools, caching, audit logging, Sentry monitoring
- **Quick Start:** `cd apps/production/tekup-billy && npm install && npm start`

#### **tekup-database** (v1.1.0)

- **Purpose:** Centralized Prisma database layer for all Tekup projects
- **Tech:** TypeScript, Prisma ORM, PostgreSQL
- **Status:** ✅ Active development
- **Schemas:** RenOS, Billy, Vault, CRM, Flow (1456+ lines)
- **Quick Start:** `cd apps/production/tekup-database && pnpm install && npx prisma generate`

#### **tekup-vault** (v0.1.0)

- **Purpose:** AI-searchable knowledge base with semantic search
- **Tech:** TypeScript, Turborepo, OpenAI embeddings, pgvector
- **Status:** ✅ Production ready (https://tekupvault.onrender.com)
- **Features:** GitHub auto-sync, MCP server, vector search
- **Quick Start:** `cd apps/production/tekup-vault && pnpm install && pnpm dev`

---

### **🌐 Web Applications** (`apps/web/` & `apps/rendetalje/`)

#### **Rendetalje OS** (Complete Platform)

- **Purpose:** Renovation management + booking system
- **Tech:** NestJS (backend), Next.js (frontend), PostgreSQL
- **Status:** ✅ Active development with monitoring + test infrastructure
- **Recent:** Test infrastructure v1.0.0 (Oct 25, 2025)
  - ✅ Full test suites (Jest, RTL, Playwright, Supertest)
  - ✅ GitHub Actions CI/CD (5-job pipeline)
  - ✅ UI Component Library (Button, Input, Card, Badge, Modal)
  - ✅ State Management (Zustand stores)
  - ✅ Docker test database (PostgreSQL + Redis)
- **Structure:**
  - `backend-nestjs/` - NestJS API with monitoring + tests
  - `frontend-nextjs/` - Next.js UI with Sentry + E2E tests
  - `calendar-mcp/` - Calendar MCP server (local)
  - `shared/` - Shared TypeScript library (32/32 tests passing)
  - `database/` - PostgreSQL migrations
  - `deployment/` - Render.com configs

#### **tekup-cloud-dashboard**

- **Purpose:** Future unified dashboard for all services
- **Status:** 📦 Placeholder

---

### **⚙️ Backend Services** (`services/`)

#### **tekup-ai**

- **Purpose:** AI infrastructure and utilities
- **Status:** 🤖 Workspace reference

#### **tekup-gmail-services** (v1.0.0)

- **Purpose:** Email automation and integrations
- **Status:** 📧 Service layer

---

## 🚀 Quick Start

### **Setup for PC2 (First Time)**

1. **Clone workspace:**

   ```bash
   git clone https://github.com/TekupDK/tekup.git
   cd tekup
   ```

2. **Initialize secrets submodule:**

   ```powershell
   # Automated setup (recommended)
   .\setup-new-machine.ps1

   # Or manual setup:
   git submodule init
   git submodule update --recursive

   # Verify secrets are readable:
   Get-Content tekup-secrets\config\mcp.env -First 5
   ```

   **Note:** Requires access to `TekupDK/tekup-secrets` (private repo).  
   Request access from @JonasAbde if you get "repository not found" error.

3. **Install dependencies (choose project):**

   ```bash
   # Billy MCP Server
   cd apps/production/tekup-billy
   npm install

   # Database Layer
   cd apps/production/tekup-database
   pnpm install

   # TekupVault
   cd apps/production/tekup-vault
   pnpm install

   # RenOS Backend
   cd apps/rendetalje/services/backend-nestjs
   npm install
   ```

### **Run Development Servers**

```bash
# Billy MCP (requires BILLY_API_KEY in .env)
cd apps/production/tekup-billy
npm run build
npm start

# TekupVault (requires Supabase + OpenAI keys)
cd apps/production/tekup-vault
pnpm dev

# RenOS Backend (local development)
cd apps/rendetalje/services/backend-nestjs
npm run start:dev

# RenOS Frontend
cd apps/rendetalje/services/frontend-nextjs
npm run dev
```

---

## 📚 Documentation

### **Project-Specific Docs:**

- **Tekup-Billy:** [apps/production/tekup-billy/README.md](apps/production/tekup-billy/README.md)

  - [START_HERE.md](apps/production/tekup-billy/docs/START_HERE.md) - Quick intro
  - [DEPLOYMENT_COMPLETE.md](apps/production/tekup-billy/docs/DEPLOYMENT_COMPLETE.md) - Production guide
  - [COPILOT_INSTRUCTIONS.md](apps/production/tekup-billy/.github/copilot-instructions.md) - AI context

- **Tekup-Database:** [apps/production/tekup-database/README.md](apps/production/tekup-database/README.md)

  - [QUICK_START.md](apps/production/tekup-database/QUICK_START.md) - Setup guide
  - [SUPABASE_SETUP.md](apps/production/tekup-database/SUPABASE_SETUP.md) - Database config

- **TekupVault:** [apps/production/tekup-vault/README.md](apps/production/tekup-vault/README.md)

  - [QUICK_START_DANSK.md](apps/production/tekup-vault/QUICK_START_DANSK.md) - Dansk guide
  - [MCP_IMPLEMENTATION_COMPLETE.md](apps/production/tekup-vault/docs/MCP_IMPLEMENTATION_COMPLETE.md)

- **RenOS:** [apps/rendetalje/docs/](apps/rendetalje/docs/)
  - [FINAL_STATUS_REPORT.md](apps/rendetalje/services/FINAL_STATUS_REPORT.md) - Latest status
  - [RENDER_CLI_GUIDE.md](apps/rendetalje/services/RENDER_CLI_GUIDE.md) - Deployment

### **Workspace Docs:**

- **[WORKSPACE_STATUS_PC2_2025-10-23.md](WORKSPACE_STATUS_PC2_2025-10-23.md)** - Complete status overview
- **[CHANGELOG.md](CHANGELOG.md)** - Workspace-level changes
- **[Tekup-Portfolio.code-workspace](Tekup-Portfolio.code-workspace)** - VS Code multi-root setup

---

## 🛠️ Development

### **Code Standards**

- TypeScript strict mode
- ESLint + Prettier (configs in `/configs`)
- 80%+ test coverage target
- Conventional commits

### **Testing**

```bash
# Run workspace tests
pnpm test

# Run specific project tests
cd apps/production/tekup-vault
pnpm test
```

### **Linting**

```bash
# Lint all projects
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

---

## 📦 Packages

Shared libraries used across projects:

- `packages/shared-types` - TypeScript type definitions
- `packages/shared-ui` - Reusable UI components
- `packages/ai-llm` - LLM abstraction layer
- `packages/ai-mcp` - MCP utilities

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

**Code Ownership:** See [CODEOWNERS](CODEOWNERS) for responsibility assignments.

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for workspace-level changes.

---

## 📄 License

See individual project LICENSE files. Workspace-level coordination: MIT License.

---

## 🔗 Production Links

- **Tekup-Billy MCP:** https://tekup-billy.onrender.com
- **TekupVault API:** https://tekupvault.onrender.com
- **RenOS Backend:** https://renos-backend.onrender.com
- **RenOS Frontend:** https://renos-frontend.onrender.com
- **GitHub Repository:** https://github.com/TekupDK/tekup
- **Organization:** https://github.com/TekupDK

---

## 🔐 Secrets Management

All sensitive credentials are encrypted with **git-crypt**:

```
tekup-secrets/
├─ .env.development    # Local development keys
├─ .env.production     # Production credentials
├─ .env.billy          # Billy.dk API keys
├─ .env.database       # Database URLs
├─ .env.vault          # Vault service keys
└─ ... (12+ files total)
```

**Unlock:** `git-crypt unlock tekup-git-crypt.key`  
**Status:** 🔒 Encrypted (requires git-crypt installation)

---

## 📊 Workspace Statistics

- **Total Files:** 700+ source files
- **Lines of Code:** 150,000+ (TypeScript, JavaScript, SQL)
- **Documentation:** 100+ markdown files
- **Projects:** 7 active (3 production, 1 web platform, 3 services)
- **Languages:** TypeScript (primary), JavaScript, SQL, Prisma Schema
- **Frameworks:** NestJS, Next.js, Express, Turborepo

---

**Built with ❤️ by Tekup Team**  
**Last Updated:** 23. Oktober 2025, 21:45 CET  
**PC1 ↔ PC2 Sync:** ✅ Synchronized
