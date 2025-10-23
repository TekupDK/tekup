# Tekup Workspace - Complete Repository Index
**Generated:** 22. Oktober 2025, kl. 04:45 CET  
**Total Repositories:** 12  
**Scan Method:** Filesystem + Git + Package Analysis

---

## TABLE OF CONTENTS

1. [Tekup-Billy](#1-tekup-billy)
2. [TekupVault](#2-tekupvault)
3. [RendetaljeOS](#3-rendetaljeos)
4. [RenOS Calendar MCP](#4-renos-calendar-mcp)
5. [Agent-Orchestrator](#5-agent-orchestrator)
6. [tekup-cloud-dashboard](#6-tekup-cloud-dashboard)
7. [tekup-ai-assistant](#7-tekup-ai-assistant)
8. [tekup-gmail-automation](#8-tekup-gmail-automation)
9. [Tekup-org](#9-tekup-org)
10. [Tekup Google AI](#10-tekup-google-ai)
11. [Tekup-Cloud](#11-tekup-cloud)
12. [Gmail-PDF-Auto & Gmail-PDF-Forwarder](#12-gmail-pdf-repositories)

---

## 1. Tekup-Billy

### Basic Information
- **Name**: `@tekup/billy-mcp`
- **Version**: 1.4.2
- **Path**: `C:\Users\empir\Tekup-Billy`
- **Status**: ✅ PRODUCTION
- **Type**: ES Module
- **Git**: ✅ Clean repository
- **Last Modified**: 22. Oktober 2025

### Purpose
Billy.dk API integration for AI agents via Model Context Protocol (MCP) with Redis horizontal scaling. Provides 32 MCP tools for invoice, customer, product, and revenue management.

### Technical Stack
```yaml
Language: TypeScript
Runtime: Node.js >=18.0.0
Package Manager: npm
Framework: Express 5.1.0
MCP SDK: 1.20.0
Database: Supabase (optional caching)
Cache: Redis (ioredis 5.4.1)
Deployment: Render.com Docker
```

### Dependencies (Key)
- `@modelcontextprotocol/sdk` ^1.20.0
- `express` ^5.1.0
- `axios` ^1.6.0
- `ioredis` ^5.4.1 (NEW in v1.4.0)
- `opossum` ^8.1.4 (Circuit breaker)
- `compression` ^1.7.4
- `@supabase/supabase-js` ^2.75.0
- `winston` ^3.18.3
- `zod` ^3.22.0

### File Structure
```
Tekup-Billy/
├── src/                 # TypeScript source (31 files)
│   ├── index.ts        # MCP server entry
│   ├── http-server.ts  # HTTP REST API
│   ├── billy-client.ts # Billy.dk API client
│   ├── tools/          # 32 MCP tool implementations
│   └── utils/          # Redis, circuit breaker, logging
├── tests/              # Integration & production tests
├── docs/               # 85+ markdown files
├── deployment/         # Docker + Render config
└── dist/               # Compiled JavaScript

Total Files: 500+
Documentation: 85+ markdown files
Tests: 8 test files
```

### Scripts
```bash
npm run build           # TypeScript compilation
npm run start          # Production stdio MCP
npm run start:http     # Production HTTP server
npm run dev            # Development stdio
npm run dev:http       # Development HTTP
npm run test           # All tests
npm run test:production # Production health check
npm run docker:build   # Build Docker image
```

### Production Endpoints
- **URL**: https://tekup-billy.onrender.com
- **Health**: https://tekup-billy.onrender.com/health
- **Tools**: https://tekup-billy.onrender.com/api/v1/tools (POST)
- **Protocol**: MCP over HTTP + Stdio

### Features
- 32 MCP Tools:
  - 8 Invoice operations
  - 4 Customer operations
  - 3 Product operations
  - 1 Revenue operation
  - 6 Preset workflow tools
  - 10 Test/development tools
- Horizontal scaling with Redis
- Circuit breaker pattern
- HTTP Keep-Alive pooling
- 70% bandwidth reduction (compression)
- 30% faster responses (v1.4.0)

### Integration Points
- ✅ Claude.ai Web (custom connector)
- ✅ ChatGPT (custom connector)
- ✅ Claude Desktop (stdio MCP)
- ✅ RenOS Backend (HTTP API)
- ✅ TekupVault (indexed, 188 files)

### Issues & Recommendations
- **Git Status**: Clean ✅
- **Documentation**: Excellent (85+ files)
- **Tests**: 6/6 passing ✅
- **Security**: 7-layer stack ✅
- **Recommendation**: Continue active development, add more preset workflows

---

## 2. TekupVault

### Basic Information
- **Name**: `tekupvault`
- **Version**: 0.1.0
- **Path**: `C:\Users\empir\TekupVault`
- **Status**: ✅ PRODUCTION
- **Type**: Turborepo Monorepo
- **Git**: 🟡 Modified (README.md)
- **Last Modified**: 18. Oktober 2025

### Purpose
Central intelligent knowledge layer for Tekup Portfolio. Automatically indexes, consolidates, and enables semantic search across 14 GitHub repositories using OpenAI embeddings and pgvector.

### Technical Stack
```yaml
Language: TypeScript
Runtime: Node.js 18+
Package Manager: pnpm 8.15+
Monorepo: Turborepo
Database: Supabase PostgreSQL + pgvector
Search: OpenAI text-embedding-3-small
Deployment: Render.com (API + Worker)
```

### Dependencies (Key)
- `@supabase/supabase-js` (database)
- `openai` (embeddings)
- `@octokit/rest` (GitHub API)
- `zod` (validation)
- `winston` (logging)
- `helmet` (security)
- `cors` (API security)

### Monorepo Structure
```
TekupVault/
├── apps/
│   ├── vault-api/      # REST API + MCP server
│   └── vault-worker/   # Background sync (6 hours)
├── packages/
│   ├── vault-core/     # Shared types & config
│   ├── vault-ingest/   # GitHub sync logic
│   └── vault-search/   # Semantic search
├── supabase/
│   └── migrations/     # Database schema
└── test-scenarios/     # 150+ test cases

Workspaces: 5
Tests: 31 passing
```

### Scripts
```bash
pnpm install           # Install all deps
pnpm build             # Build all packages
pnpm dev               # Dev mode (all apps)
pnpm test              # Unit tests (Vitest)
pnpm check:ports       # Port conflict check
```

### Production Endpoints
- **API**: https://tekupvault.onrender.com
- **Worker**: Background service (no public URL)
- **Health**: https://tekupvault.onrender.com/health
- **Search**: POST /api/search
- **Sync Status**: GET /api/sync-status
- **MCP**: /.well-known/mcp.json

### Features
- 14 GitHub repositories indexed
- 1,063+ files synced
- OpenAI embeddings (text-embedding-3-small)
- pgvector similarity search
- 6 MCP tools (search, fetch, sync status, repos)
- Automatic sync every 6 hours
- API key authentication
- Rate limiting

### Indexed Repositories (14)
**Tier 1 (Core - 4):**
1. Tekup-Billy
2. renos-backend
3. renos-frontend
4. TekupVault (self-indexing)

**Tier 2 (Documentation - 2):**
5. tekup-unified-docs
6. tekup-ai-assistant

**Tier 3 (Development - 8):**
7. tekup-cloud-dashboard
8. tekup-renos
9. tekup-renos-dashboard
10. Tekup-org
11. Cleaning-og-Service
12. tekup-nexus-dashboard
13. rendetalje-os
14. Jarvis-lite

### Integration Points
- ✅ All 14 repos auto-synced
- ✅ Claude Desktop (MCP stdio)
- ✅ ChatGPT (OpenAI-compatible search)
- ✅ Cursor AI (MCP integration ready)

### Issues & Recommendations
- **Git Status**: Modified README.md (🟡 commit pending)
- **Phase 3**: Complete (MCP integration) ✅
- **Phase 4**: Pending (Web UI with React + Tailwind)
- **Recommendation**: Build Web UI, add real-time search

---

## 3. RendetaljeOS

### Basic Information
- **Name**: `rendetalje-os`
- **Version**: 1.0.0
- **Path**: `C:\Users\empir\RendetaljeOS`
- **Status**: ✅ ACTIVE DEVELOPMENT
- **Type**: pnpm Monorepo
- **Git**: 🟡 Modified (frontend package.json, pnpm-lock.yaml)
- **Last Modified**: 22. Oktober 2025

### Purpose
Full-featured AI-powered automation system for Rendetalje.dk. Handles Gmail integration, email automation, customer management, booking system, and calendar sync.

### Technical Stack
```yaml
Language: TypeScript + JavaScript
Runtime: Node.js >=18
Package Manager: pnpm
Monorepo: pnpm workspaces + Turborepo
Backend: Express + Prisma + Supabase
Frontend: React 19 + Vite + Radix UI + Tailwind
```

### Dependencies
- **Total**: 965 packages installed
- **Backend**: Prisma 6.16.3, Express 4.19.2, @google/generative-ai 0.24.1
- **Frontend**: React 19, Vite, Radix UI, Tailwind
- **AI**: OpenAI 4.28.4, Gemini integration

### Monorepo Structure
```
RendetaljeOS/
├── apps/
│   ├── backend/        # Node + Express + Prisma
│   │   ├── src/        # 196 TypeScript files
│   │   ├── prisma/     # Database schema
│   │   └── tests/      # 16 test files
│   └── frontend/       # React 19 + Vite
│       ├── src/        # 112 files (78 .tsx, 30 .ts)
│       └── public/
├── packages/
│   └── shared-types/   # Shared TypeScript types
├── -Mobile/            # React Native/Expo (186 files)
└── scripts/

Workspaces: 3 (backend, frontend, shared-types)
```

### Scripts
```bash
pnpm install           # Install deps (965 packages)
pnpm dev               # Start all apps
pnpm build             # Build all apps
pnpm test              # Run tests
pnpm supabase:gen-types # Generate Supabase types
```

### URLs
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:3001
- **Prisma Studio**: `cd apps/backend && pnpm db:studio`

### Features
- Gmail integration (Google APIs)
- Email automation & auto-response
- Customer management (CRM features)
- Booking system with conflict detection
- Calendar sync (Google Calendar)
- Multi-agent AI system (Gemini + OpenAI)
- Label management
- Follow-up automation
- Conflict escalation
- Invoice integration (via Billy MCP)

### Integration Points
- ✅ Gmail API
- ✅ Google Calendar API
- ✅ Supabase Database
- ✅ OpenAI API
- ✅ Google Gemini API
- 🟡 Billy MCP (integration planned)

### Issues & Recommendations
- **Git Status**: Modified files in frontend/ (🟡 commit pending)
- **Untracked Files**: CHANGELOG.md, DEBUGGING_SUMMARY.md, TESTING_REPORT.md
- **-Mobile Folder**: Duplicate or separate? (186 files, needs clarification)
- **Recommendation**: 
  - Commit frontend changes
  - Clarify mobile app relationship
  - Deploy backend to Render
  - Deploy frontend to Vercel/Netlify

---

## 4. RenOS Calendar MCP

### Basic Information
- **Name**: `@renos/calendar-mcp`
- **Version**: 0.1.0
- **Path**: `C:\Users\empir\Tekup-Cloud\renos-calendar-mcp`
- **Status**: ✅ DOCKERIZED (NEW - Oct 22, 2025)
- **Type**: Docker Compose Multi-Service
- **Git**: Subproject of Tekup-Cloud
- **Last Modified**: 22. Oktober 2025

### Purpose
AI-powered calendar intelligence for RenOS. Provides 5 specialized tools for booking validation, conflict checking, invoice automation, overtime tracking, and customer memory.

### Technical Stack
```yaml
Language: TypeScript
Runtime: Node.js 18
Transport: HTTP REST API (MCP protocol)
Frontend: 2 React apps (Dashboard 3006, Chatbot 3005)
Infrastructure: Docker Compose (5 services)
Database: Supabase
AI: LangChain (simplified for Node 18)
Testing: Jest + Supertest
```

### Dependencies (Key)
- `@modelcontextprotocol/sdk`
- `express` + `router`
- `dotenv`, `zod` (config)
- `winston`, `pino` (logging)
- `langchain` (AI chat)
- `supertest` (testing)
- `tailwindcss` (UI)

### Docker Services
```
renos-calendar-mcp/
├── mcp-server     # Port 3001 (MCP HTTP API)
├── dashboard      # Port 3006 (React UI)
├── chatbot        # Port 3005 (React chatbot)
├── nginx          # Ports 80, 443 (reverse proxy)
└── redis          # Port 6379 (caching)

Total Services: 5
Port Configuration: ✅ Fully configurable via .env
```

### Scripts
```bash
npm run build              # TypeScript compilation
npm run start:http         # Start HTTP server
npm run test               # Run all tests
npm run test:integration   # Integration tests
npm run check:ports        # Port conflict detection
npm run docker:up          # Start Docker Compose
npm run docker:logs        # View logs
npm run snapshot:perf      # Performance snapshot
```

### Production Status
- **Current**: http://localhost:3001 (local only)
- **Planned**: Deploy to Render.com
- **Docker**: ✅ Complete
- **Port System**: ✅ Complete
- **Tests**: ✅ Integration tests passing

### Features
- 5 AI Tools:
  1. **Validate Booking Date**: Check day/date consistency, customer patterns
  2. **Check Booking Conflicts**: Calendar conflict detection
  3. **Auto Create Invoice**: Integration with Billy MCP
  4. **Track Overtime Risk**: Monitor job duration vs. estimates
  5. **Get Customer Memory**: Retrieve customer intelligence
- LangChain integration (conversation handling)
- Port configuration system (all 6 ports configurable)
- Environment key management
- UI/UX enhancements (dark mode, animations)

### Integration Status
- ✅ Google Calendar (Service Account)
- ✅ Supabase (connected, tables pending creation)
- ❌ Billy.dk MCP (disabled for v1)
- ❌ Twilio (disabled for v1)
- 🟡 **Operational Status**: 2/5 tools working, 3 need Supabase tables

### Issues & Recommendations
- **Critical**: Create Supabase tables:
  - `customer_intelligence` (for Customer Memory tool)
  - `overtime_logs` (for Overtime Risk tool)
- **High**: Deploy to Render.com
- **Medium**: Enable Billy.dk integration
- **Low**: Enable Twilio for voice alerts
- **Recommendation**: Create tables, deploy, then enable remaining features

---

## 5. Agent-Orchestrator

### Basic Information
- **Name**: `tekup-agent-orchestrator`
- **Version**: 1.0.0
- **Path**: `C:\Users\empir\Agent-Orchestrator`
- **Status**: 🟡 DEVELOPMENT
- **Type**: Electron Desktop App
- **Git**: ✅ Clean repository
- **Last Modified**: 21. Oktober 2025

### Purpose
Visual interface for multi-agent AI orchestration. Desktop application for managing and monitoring AI agents.

### Technical Stack
```yaml
Language: TypeScript + React
Runtime: Electron 38.2.2
Framework: React 19.2.0 + Vite 7.1.10
UI: Tailwind CSS 3.4.18 + Lucide icons
State: Zustand 5.0.8
Build: electron-builder 26.0.12
```

### Dependencies (Key)
- `electron` ^38.2.2
- `react` ^19.2.0
- `vite` ^7.1.10
- `@tanstack/react-query` ^5.90.3
- `tailwindcss` ^3.4.18
- `zustand` ^5.0.8
- `socket.io` ^4.8.1

### File Structure
```
Agent-Orchestrator/
├── electron/         # Electron main & preload
├── src/             # React source
│   ├── components/  # AgentDashboard, MessageFlow, UI
│   ├── hooks/       # useAgentStatus, useAgentMessages
│   ├── services/    # renderApi
│   └── styles/      # Tailwind CSS
├── dist/            # Built executable
│   └── win-unpacked/ # Windows build (ready to run)
└── public/

Total Components: ~20
```

### Scripts
```bash
npm run dev              # Vite + Electron dev
npm run build            # TypeScript + Vite build
npm run build:electron   # Full Electron app build
```

### Build Status
- **Executable**: ✅ Built (dist/win-unpacked/)
- **Size**: ~200MB (includes Electron runtime)
- **Platform**: Windows (ready for macOS/Linux builds)

### Features
- Visual agent dashboard
- Agent card components
- Message flow visualization
- Real-time agent status monitoring
- Render API integration
- Socket.io for real-time updates

### Integration Points
- 🟡 Render API (integration layer)
- 🟡 Agent services (to be connected)

### Issues & Recommendations
- **Git Status**: Clean ✅
- **Purpose**: Nice-to-have, not critical for core business
- **Priority**: LOW
- **Recommendation**: Keep as-is, low maintenance mode

---

## 6. tekup-cloud-dashboard

### Basic Information
- **Name**: `vite-react-typescript-starter`
- **Version**: 0.0.0
- **Path**: `C:\Users\empir\tekup-cloud-dashboard`
- **Status**: 🟡 DEVELOPMENT
- **Type**: React Web App
- **Git**: 🟡 Modified (5 files)
- **Last Modified**: 20. Oktober 2025

### Purpose
Cloud dashboard for Tekup services. Provides agent monitoring, analytics, system health, integrations, leads, and settings management.

### Technical Stack
```yaml
Language: TypeScript
Framework: React 18.3.1 + Vite 5.4.2
UI: Tailwind CSS 3.4.1
Router: React Router 7.9.4
Database: Supabase 2.57.4
Icons: Lucide React 0.344.0
```

### Dependencies
- `react` ^18.3.1
- `react-router-dom` ^7.9.4
- `@supabase/supabase-js` ^2.57.4
- `lucide-react` ^0.344.0
- `tailwindcss` ^3.4.1
- `vite` ^5.4.2

### File Structure
```
tekup-cloud-dashboard/
├── src/
│   ├── components/      # UI components
│   │   ├── agents/     # AgentMonitor
│   │   ├── ai/         # JarvisChat
│   │   ├── auth/       # Auth components
│   │   ├── dashboard/  # KPI, charts, activity
│   │   ├── layout/     # Sidebar, TopNav
│   │   └── ui/         # Badge, Button, Card
│   ├── contexts/       # AppContext, ThemeContext
│   ├── hooks/          # useAuth
│   ├── lib/            # api.ts, supabase.ts
│   ├── pages/          # All route pages
│   └── types/          # TypeScript types
├── dist/               # Built for production
└── public/

Pages: 8 (Dashboard, Agents, Analytics, Integrations, Leads, Settings, SystemHealth, Placeholder)
```

### Scripts
```bash
npm run dev        # Vite dev server
npm run build      # Production build
npm run preview    # Preview build locally
npm run typecheck  # TypeScript check
```

### Git Status (🟡 Modified)
```
Modified: README.md, package.json, src/App.tsx, src/lib/supabase.ts, src/pages/Dashboard.tsx
Untracked: .env.example, API_DOCUMENTATION.md, CHANGELOG.md
```

### Features
- Agent monitoring dashboard
- Analytics & KPIs
- System health monitoring
- Integration management
- Lead management
- JWT authentication (Supabase)
- Responsive UI (Tailwind)

### Integration Points
- ✅ Supabase (authentication + database)
- 🟡 Agent services (API integration needed)

### Issues & Recommendations
- **Git Status**: Uncommitted changes (🟡)
- **Action**: Commit changes, create .env from .env.example
- **Deployment**: Not yet deployed (ready for Vercel/Netlify)
- **Priority**: MEDIUM
- **Recommendation**: Commit changes, deploy to Vercel, connect to production APIs

---

## 7. tekup-ai-assistant

### Basic Information
- **Name**: (No package.json in root)
- **Version**: N/A
- **Path**: `C:\Users\empir\tekup-ai-assistant`
- **Status**: 🟡 CONFIGURATION HUB
- **Type**: Documentation + Config Repository
- **Git**: ✅ Clean repository
- **Last Modified**: 19. Oktober 2025

### Purpose
AI assistant configuration hub, MCP client implementations, and documentation repository for Tekup ecosystem.

### File Structure
```
tekup-ai-assistant/
├── configs/
│   ├── claude-desktop/   # Claude MCP setup
│   ├── jan-ai/
│   ├── ollama/
│   └── open-webui/       # Docker Compose
├── docs/
│   ├── analysis/         # RENOS, Billy, TekupVault analyses
│   ├── api/              # tekup-billy-api.md
│   ├── diagrams/         # Mermaid diagrams
│   ├── examples/         # Usage examples
│   └── guides/           # Integration guides
├── mcp-clients/
│   └── billy/            # Billy.dk MCP client (TypeScript)
├── scripts/
│   └── mcp_web_scraper.py # Python MCP scraper
└── site/                 # Built MkDocs site (static HTML)

Total Docs: 40+ markdown files
MCP Clients: 1 (Billy)
Scripts: 5 (Python + PowerShell)
```

### MCP Client: Billy
```yaml
Location: mcp-clients/billy/
Language: TypeScript
Package Manager: npm
Version: (defined in package.json)
Status: ✅ Production-ready
Purpose: Billy.dk MCP client for AI integrations
```

### Documentation Categories
1. **Analysis**: RENOS backend/frontend, Billy, TekupVault
2. **API**: Billy API reference
3. **Architecture**: System diagrams (Mermaid)
4. **Examples**: Create invoice, etc.
5. **Guides**: Billy integration, CLI control, daily workflow, Docker troubleshooting, TekupVault guide
6. **Status**: Installation status, AI assistant status
7. **Testing**: Qwen implementation, test results

### Features
- MCP configuration templates (Claude, Ollama, Open WebUI)
- Billy.dk MCP client
- Comprehensive documentation (40+ files)
- MkDocs static site (site/ folder)
- Python MCP web scraper
- Integration examples

### Integration Points
- ✅ Claude Desktop (config provided)
- ✅ Ollama (config provided)
- ✅ Open WebUI (Docker Compose provided)
- ✅ Billy MCP (client implemented)

### Issues & Recommendations
- **Git Status**: Clean ✅
- **Purpose**: Documentation/configuration hub
- **Priority**: LOW
- **Recommendation**: Keep as-is, update docs as needed, no urgent changes

---

## 8. tekup-gmail-automation

### Basic Information
- **Name**: (Python project - pyproject.toml)
- **Version**: N/A
- **Path**: `C:\Users\empir\tekup-gmail-automation`
- **Status**: 🟡 HYBRID (Python + Node.js)
- **Type**: Automation Scripts + MCP Server
- **Git**: ⚠️ NOT A GIT REPOSITORY
- **Last Modified**: 21. Oktober 2025

### Purpose
Gmail PDF forwarding automation, receipt processing, and email handling. Hybrid project with Python core and Node.js MCP server.

### Technical Stack
```yaml
Primary: Python 3.x
Secondary: Node.js (gmail-mcp-server/)
Package Manager: pip (Python), npm (Node.js)
APIs: Gmail API, Google Photos API, Economic API
```

### File Structure
```
tekup-gmail-automation/
├── src/
│   ├── core/           # Gmail forwarder, scheduler, main scripts
│   ├── integrations/   # Economic API integration
│   ├── processors/     # Receipt processors, reconciliation
│   └── utils/
├── gmail-mcp-server/   # Node.js MCP server
│   ├── src/            # TypeScript MCP implementation
│   ├── package.json
│   └── tsconfig.json
├── config/             # Google service account JSON
├── tests/              # Python integration tests
└── scripts/            # run.bat

Python Files: 30+
Node.js Files: ~20 (MCP server)
```

### Python Scripts (src/)
- `gmail_forwarder.py` - Main forwarder logic
- `gmail_pdf_mcp_forwarder.py` - MCP-enabled forwarder
- `scheduler.py` - Cron job scheduler
- Economic API integration
- Google Photos receipt processing
- Invoice analysis & reconciliation

### Node.js MCP Server (gmail-mcp-server/)
```yaml
Language: TypeScript
Purpose: MCP server for Gmail operations
Features: Filter management, label management, evaluations
Package: gmail-mcp-server (separate package.json)
```

### Features
- Gmail PDF forwarding
- Email filtering and labeling
- Google Photos receipt processing
- Economic API integration
- Invoice reconciliation
- Automated invoice processing
- MCP server for AI integrations

### Integration Points
- ✅ Gmail API
- ✅ Google Photos API
- ✅ Economic API
- 🟡 MCP server (available but unclear if actively used)

### Issues & Recommendations
- **Git Status**: ⚠️ NOT A GIT REPOSITORY
- **Action Required**: `git init` or archive if unused
- **Priority**: LOW (if inactive), MEDIUM (if active)
- **Recommendation**: 
  - Verify if actively used
  - Initialize git repository if active
  - Archive if superseded by other projects
  - Document MCP server usage

---

## 9. Tekup-org

### Basic Information
- **Name**: `tekup-monorepo`
- **Version**: (No version in package.json)
- **Path**: `C:\Users\empir\Tekup-org`
- **Status**: 🔴 LEGACY - NEEDS CONSOLIDATION
- **Type**: Massive pnpm Monorepo
- **Git**: 🟡 Untracked files
- **Last Modified**: 20. Oktober 2025

### Purpose
MASSIVE monorepo containing 30+ apps and 18+ packages. Includes lead management, CRM, scheduling, MCP servers, dashboards, testing frameworks, and more.

### Technical Stack
```yaml
Language: TypeScript + JavaScript
Runtime: Node.js >=20.10.0
Package Manager: pnpm 10.15.1
Monorepo: pnpm workspaces
Type: module
Testing: Playwright, Jest, Vitest
```

### Monorepo Structure
```
Tekup-org/
├── apps/                 # 30+ applications
│   ├── tekup-crm-api/   # NestJS CRM API
│   ├── tekup-crm-web/   # Next.js CRM web
│   ├── cloud-dashboard/
│   ├── Tekup Website Figma/
│   └── ...              # 26+ more apps
├── packages/             # 18+ shared packages
│   ├── @tekup/config
│   ├── @tekup/observability
│   ├── @tekup/ui
│   ├── @tekup/testing
│   ├── @tekup/sso
│   ├── @tekup/shared
│   └── ...              # 12+ more packages
├── .mcp/                # MCP configuration
├── mcp-gmail-server/    # Gmail MCP server
├── monitoring/          # Prometheus, Grafana
├── k8s/                 # Kubernetes configs
└── docs/                # Documentation

Total Files: 2,000+
Apps: 30+
Packages: 18+
Package.json Files: 75+
```

### Major Apps
1. **tekup-crm-api** (NestJS backend)
2. **tekup-crm-web** (Next.js frontend)
3. **cloud-dashboard** (React dashboard)
4. **Tekup Website Figma** (Website integration)
5. ... 26+ more apps

### Major Packages
1. **@tekup/config** - Shared configuration
2. **@tekup/observability** - Monitoring & metrics
3. **@tekup/ui** - Shared UI components
4. **@tekup/testing** - Test utilities
5. **@tekup/sso** - Single sign-on
6. **@tekup/shared** - Shared utilities
7. **@tekup/service-registry** - Service discovery
8. ... 11+ more packages

### Scripts (Root)
```bash
pnpm install           # Install all deps
pnpm dev               # Dev mode (all apps)
pnpm build             # Build all
pnpm test              # Run all tests
pnpm e2e               # E2E tests (Playwright)
pnpm compose:up        # Docker Compose up
pnpm mcp:validate      # Validate MCP configs
pnpm health:scan       # Health check all services
```

### Git Status (🟡 Untracked)
```
Untracked:
- EXTRACTION_SCRIPTS.md
- LEAD-PROCESSING-AGENT-FRAMEWORK.md
- TEKUP-LEADS-FINAL.csv
- TEKUPVAULT_CONNECTION_FINAL_REPORT.md
- TEKUPVAULT_CONNECTION_SAFETY_ASSESSMENT.md
- TEKUP_ORG_FORENSIC_REPORT.md
- LESSONS_LEARNED.md
- SALVAGEABLE_CODE_INVENTORY.md
```

### Issues & Recommendations
- **Complexity**: ⚠️ EXTREME (30+ apps is too much)
- **Maintenance**: ⚠️ HIGH burden (75+ package.json files)
- **Performance**: ⚠️ Slow installs/builds
- **Clarity**: ⚠️ Unclear which apps are active
- **Priority**: 🔴 CRITICAL
- **Recommendation**: 
  - **Extract Core Apps**: Identify 3-5 active apps, move to separate repos
  - **Archive Rest**: Archive or delete unused apps
  - **Simplify Packages**: Keep only essential shared packages
  - **Document**: Create SALVAGE_PLAN.md with extraction strategy
  - **Goal**: Reduce from 30+ apps to 3-5 focused repositories

---

## 10. Tekup Google AI

### Basic Information
- **Name**: `rendetalje-assistant`
- **Version**: 0.1.0
- **Path**: `C:\Users\empir\Tekup Google AI`
- **Status**: 🔴 LEGACY - SUPERSEDED
- **Type**: TypeScript Backend + React Frontend
- **Git**: 🟡 Modified (README.md), Deleted (pnpm-lock.yaml)
- **Last Modified**: 20. Oktober 2025

### Purpose
Original RenOS system for Rendetalje.dk. Now superseded by RendetaljeOS monorepo. Contains extensive documentation and deployment history.

### Technical Stack
```yaml
Language: TypeScript + JavaScript
Runtime: Node.js
Database: Supabase
Frontend: React 18 + Vite
Backend: Express + Prisma
Deployment: Render.com (1,198 render.com references)
```

### File Structure
```
Tekup Google AI/
├── client/                 # React 18 frontend
│   ├── src/               # React components
│   └── package.json
├── client-backup-oct8-2025/ # Backup of old client
├── supabase-migration-package/
├── docs/                  # Extensive documentation
└── *.md                   # 67+ COMPLETE files, 63+ STATUS files

Total Markdown Files: 130+
React Components: 100+
Documentation: EXCESSIVE (over-documented)
```

### Documentation (⚠️ EXCESSIVE)
- 67+ files named `*COMPLETE*.md`
- 63+ files named `*STATUS*.md`
- 291 files contain render.com URLs (1,198 total matches)
- Likely outdated deployment information

### Git Status
```
Modified: README.md
Deleted: pnpm-lock.yaml
```

### Issues & Recommendations
- **Status**: 🔴 LEGACY (superseded by RendetaljeOS)
- **Documentation**: ⚠️ EXTREME over-documentation (130+ status/complete files)
- **Deployment Info**: ⚠️ Outdated (1,198 render.com URL references)
- **Priority**: 🔴 CRITICAL
- **Recommendation**: 
  - **Verify**: Check if any features missing from RendetaljeOS
  - **Migrate**: Move missing features to RendetaljeOS
  - **Archive**: Archive this repository (rename to `Tekup-Google-AI-ARCHIVED`)
  - **Cleanup**: Delete excessive documentation files
  - **Timeline**: Complete within 7 days

---

## 11. Tekup-Cloud

### Basic Information
- **Name**: `rendetaljeos`
- **Version**: 1.0.0
- **Path**: `C:\Users\empir\Tekup-Cloud`
- **Status**: 🟡 WORKSPACE ROOT (MULTI-PROJECT)
- **Type**: Git Repository (Workspace Root)
- **Git**: 🟡 Modified + 30+ untracked files
- **Last Modified**: 22. Oktober 2025

### Purpose
Workspace root containing multiple sub-projects and extensive documentation. Primary project is renos-calendar-mcp (NEW).

### Contents
```
Tekup-Cloud/
├── renos-calendar-mcp/     # NEW - Primary project (145 files)
├── backend/                # 127 TypeScript files
├── frontend/               # 44 files (31 .tsx, 6 .ts)
├── shared/                 # 13 TypeScript files
├── RendetaljeOS-Mobile/    # 186 files (DUPLICATE?)
├── powershell-script-safety/
├── database/               # 7 SQL files
├── deployment/             # 6 deployment files
├── docs/                   # 6 markdown files
├── scripts/                # 5 PowerShell + JS scripts
├── snapshots/              # Portfolio snapshots
└── *.md                    # 50+ documentation files

Total Documentation Files: 50+
Total Code Files: 500+
Sub-Projects: 3-5
```

### Git Status (🟡)
```
Modified:
- .gitignore
- README.md
- Tekup-Workspace.code-workspace

Untracked (30+):
- AI_ASSISTANT_*.md
- SALES_TRACKING_*.md
- STRATEGIC_ACTION_PLAN_*.md
- TEKUP_*.md
- MCP_DIAGNOSTIC_REPORT_*.md
- PORT_*.md
- .kiro/
- .qoder/quests/
- scripts/
```

### Sub-Projects
1. **renos-calendar-mcp/** (Primary - NEW)
   - RenOS Calendar MCP server
   - 145 files
   - Docker Compose ready
   - See detailed entry (#4)

2. **backend/** (Purpose unclear)
   - 127 TypeScript files
   - Express + Prisma likely
   - Needs investigation

3. **frontend/** (Purpose unclear)
   - 44 files (31 .tsx, 6 .ts)
   - React likely
   - Needs investigation

4. **RendetaljeOS-Mobile/** (DUPLICATE?)
   - 186 files
   - Likely duplicate of `../RendetaljeOS/-Mobile/`
   - Needs verification

### Issues & Recommendations
- **Git Status**: Many untracked files (🟡)
- **Organization**: Mixing multiple projects in one repo (🟡)
- **Duplicates**: RendetaljeOS-Mobile likely duplicate (⚠️)
- **Clarity**: Purpose of backend/ and frontend/ unclear (⚠️)
- **Priority**: MEDIUM
- **Recommendation**: 
  - **Commit**: Commit or delete untracked documentation files
  - **Organize**: Clarify purpose of backend/ and frontend/
  - **Remove Duplicates**: Delete RendetaljeOS-Mobile if duplicate
  - **Focus**: Keep renos-calendar-mcp as primary project
  - **Clean**: Add patterns to .gitignore for *.md reports

---

## 12. Gmail-PDF Repositories

### Basic Information
- **Names**: `Gmail-PDF-Auto`, `Gmail-PDF-Forwarder`
- **Paths**: 
  - `C:\Users\empir\Gmail-PDF-Auto`
  - `C:\Users\empir\Gmail-PDF-Forwarder`
- **Status**: ⚫ UNKNOWN
- **Type**: Unknown (no README found)
- **Git**: ⚠️ NOT GIT REPOSITORIES
- **Last Modified**: Unknown

### Purpose
Unknown. No README files found, not git repositories. Possibly related to Gmail automation.

### File Structure
```
Gmail-PDF-Auto/
└── (unknown structure)

Gmail-PDF-Forwarder/
└── (unknown structure)
```

### Issues & Recommendations
- **Status**: ⚫ UNKNOWN (no README, not git repos)
- **Relationship**: Possibly related to tekup-gmail-automation (#8)
- **Priority**: LOW (if unused), MEDIUM (if active)
- **Recommendation**: 
  - **Investigate**: Check folder contents, verify if active
  - **Options**:
    1. If unused: Delete folders
    2. If active: Initialize git, add README, document purpose
    3. If superseded: Archive or merge into tekup-gmail-automation
  - **Timeline**: Investigate within 7 days

---

## SUMMARY STATISTICS

### Repository Count
- **Total**: 12 workspace paths
- **Git Repositories**: 10 (83%)
- **Non-Git**: 2 (Gmail-PDF repos)

### Status Breakdown
- 🟢 **Production**: 4 (Tekup-Billy, TekupVault, RendetaljeOS, RenOS Calendar MCP)
- 🟡 **Development**: 4 (Agent-Orchestrator, tekup-cloud-dashboard, tekup-ai-assistant, tekup-gmail-automation)
- 🔴 **Legacy**: 3 (Tekup-org, Tekup Google AI, Tekup-Cloud)
- ⚫ **Unknown**: 1 (Gmail-PDF repos)

### Language Distribution
- **TypeScript**: 9 repos (75%)
- **Python**: 2 repos (16.7%)
- **Unknown**: 1 repo (8.3%)

### Package Manager Distribution
- **npm**: 5 repos (41.7%)
- **pnpm**: 4 repos (33.3%)
- **mixed**: 2 repos (16.7%)
- **unknown**: 1 repo (8.3%)

### Documentation Statistics
- **Total Markdown Files**: 300+
- **Excessive Documentation**: Tekup Google AI (130+ status/complete files)
- **Well-Documented**: Tekup-Billy (85+ files), TekupVault (comprehensive)

### Integration Points
- **Production APIs**: 4 (Tekup-Billy, TekupVault, RenOS Backend, RenOS Calendar MCP pending)
- **Render Deployments**: 4 (Tekup-Billy, TekupVault API + Worker, RenOS Calendar MCP pending)
- **Supabase Projects**: 2 (shared instances)
- **MCP Servers**: 3 (Tekup-Billy, TekupVault, RenOS Calendar MCP)

---

**Next:** Review Integration Map and Action Items

