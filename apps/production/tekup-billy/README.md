# Tekup-Billy MCP Server

[![CI/CD Pipeline](https://github.com/JonasAbde/Tekup-Billy/actions/workflows/ci.yml/badge.svg)](https://github.com/JonasAbde/Tekup-Billy/actions/workflows/ci.yml)
[![CodeQL Security](https://github.com/JonasAbde/Tekup-Billy/actions/workflows/codeql.yml/badge.svg)](https://github.com/JonasAbde/Tekup-Billy/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

**Status:** ✅ **PRODUCTION READY** | **Version:** 1.4.3 | **Build:** ✅ SUCCESS | **HTTP:** ✅ CLOUD READY | **SCALABLE:** ✅ 10+ INSTANCES

**🆕 v2.0 SPECIFICATION READY:** Complete enhancement plan with 40+ tasks for advanced analytics, ML capabilities, and enterprise features → [View Specification](docs/TEKUP_BILLY_V2_SPECIFICATION.md)

En Model Context Protocol (MCP) server til integration med Billy.dk API. Denne server giver adgang til faktura-, kunde-, produkt- og omsætningsstyring gennem Billy.dk's API med fuld Supabase-integration for caching, audit logging og usage metrics.

**🆕 v1.4.3: Repository Organization - 87% cleaner root directory!**

**✨ Nye Features:**

- 📁 **Repository Restructure** - 40+ docs organized in 9 categories
- 🔧 **Scripts Consolidation** - 10 PowerShell scripts in `scripts/`
- 📚 **Documentation Hub** - Logical categorization under `docs/`
- 🎯 **Clean Root** - Only 10 essential config files
- 🇩🇰 **Danish Spell Check** - `.cspell.json` with 100+ Danish terms

**v1.4.2 Features:**

- 🚀 **Redis Integration** - Horizontal scaling til 10+ instances
- ⚡ **HTTP Keep-Alive** - 25% hurtigere API calls via connection pooling
- 📦 **Compression** - 70% bandwidth reduction
- 🛡️ **Circuit Breaker** - Automatisk failure handling
- 📊 **Enhanced Monitoring** - Dependency health checks

## 👨‍💻 Udvikler

**Jonas Abde** - Solo Developer & Technical Lead

- 🔗 LinkedIn: [jonas-abde-22691a12a](https://www.linkedin.com/in/jonas-abde-22691a12a/)
- 🐙 GitHub: [JonasAbde](https://github.com/JonasAbde)
- 📧 Tekup: Tekup-Billy MCP Server Project Lead

**Klar til brug i:**

- ☁️ **Cloud:** Render.com, AWS, Azure, Google Cloud (HTTP REST API + MCP)
- 🤖 **AI Agents:** Claude.ai Web ✅, Claude Desktop ✅, ChatGPT ✅, RenOS Backend
- 💻 **Local:** Claude Desktop, VS Code Copilot (Stdio MCP)
- 🔌 **Platforms:** Universal MCP plugin med support for alle LLM platforms

## 📁 Projektstruktur

```text
Tekup-Billy/
├── src/                      # Source code
│   ├── index.ts             # MCP server entry point (stdio)
│   ├── http-server.ts       # HTTP REST API wrapper
│   ├── billy-client.ts      # Billy.dk API client
│   ├── supabase-client.ts   # Supabase operations
│   ├── cache-manager.ts     # Caching logic
│   ├── config.ts            # Configuration
│   ├── types.ts             # TypeScript types
│   ├── tools/               # MCP tool implementations (32 tools)
│   │   ├── invoices.ts      # Invoice operations
│   │   ├── customers.ts     # Customer operations
│   │   ├── products.ts      # Product operations
│   │   ├── revenue.ts       # Revenue operations
│   │   ├── presets.ts       # Preset management
│   │   ├── ops.ts           # Operational diagnostics
│   │   └── test-runner.ts   # Test scenarios
│   ├── middleware/          # Server middleware
│   │   └── audit-logger.ts  # Audit logging
│   └── utils/               # Utility functions
│       ├── logger.ts        # Winston logger
│       ├── data-logger.ts   # Data logging
│       └── preset-system.ts # Preset system
├── tests/                    # Test files
│   ├── test-integration.ts  # Local integration tests
│   ├── test-production.ts   # Production health checks
│   └── run-tests.ps1        # PowerShell test runner
├── deployment/               # Deployment configuration
│   ├── Dockerfile           # Docker configuration (Node 20)
│   ├── render.yaml          # Render.com config
│   └── *.txt                # Environment variable guides
├── docs/                     # 📚 Documentation (organized)
│   ├── planning/            # Planning docs, reports, status updates
│   ├── operations/          # Daily ops, deployment guides
│   ├── billy/               # Billy API reports and samples
│   ├── analysis/            # Product cleanup and analytics
│   ├── ai-integration/      # Claude, ChatGPT integration guides
│   ├── troubleshooting/     # Terminal fixes, setup guides
│   ├── completed/           # Session reports, completion markers
│   ├── releases/            # Release notes
│   ├── examples/            # Config examples (Claude Desktop)
│   ├── integrations/        # TekupVault and external integrations
│   ├── MASTER_INDEX.md      # Complete documentation index
│   ├── START_HERE.md        # Quick start guide
│   └── ROADMAP.md           # Future development plans
├── scripts/                  # 🔧 PowerShell utility scripts
│   ├── get-todays-mcp-usage.ps1      # Usage analytics
│   ├── analyze-product-usage.ps1     # Product analysis
│   ├── analyze-render-logs.ps1       # Log analysis
│   └── *.ps1                         # Other utility scripts
├── .github/                  # GitHub configuration
│   └── copilot-instructions.md  # Copilot instructions
├── .cspell.json             # Spell checker config (Danish support)
├── .env.example             # Environment template
├── package.json             # NPM dependencies
├── tsconfig.json            # TypeScript config
├── CHANGELOG.md             # Version history
├── CONTRIBUTING.md          # Contribution guidelines
└── README.md                # This file
```

## 🚀 Funktioner

- **Fakturaer**: List, opret, hent, opdater, godkend, annuller, marker betalt og send fakturaer ✨
- **Kunder**: List, opret, hent og opdater kundeoplysninger og kontakter ✨
- **Produkter**: List, opret, hent og opdater produktkataloget ✨
- **Omsætning**: Hent omsætningsrapporter og statistikker
- **Rate Limiting**: Indbygget rate limiting for API-kald
- **Error Handling**: Robust fejlhåndtering og validering
- **Dry Run Mode**: Test mode uden reelle API kald

## 🌐 Hurtig Start

### Claude.ai Web

**Tilføj Billy til Claude.ai på 2 minutter:**

1. **Åbn Claude.ai** → Settings → Connectors
2. **Klik "Add custom connector"**
3. **Indtast URL:** `https://tekup-billy.onrender.com`
4. **Klik "Add"**
5. **I chatten:** Åbn "Search and tools" → Enable Billy tools
6. **Test:** `@billy list your available tools`

📖 **Guide:** [docs/CLAUDE_WEB_SETUP.md](./docs/CLAUDE_WEB_SETUP.md)  
**Kræver:** Claude Pro, Max, Team eller Enterprise

### ChatGPT

**Tilføj Billy til ChatGPT custom connector:**

1. **Åbn ChatGPT** → Settings → Custom Connectors
2. **Navn:** `Billy Regnskab`
3. **URL:** `https://tekup-billy.onrender.com`
4. **Klik "Opret"**
5. **Test:** `@billy list your tools`

📖 **Guide:** [docs/CHATGPT_SETUP.md](./docs/CHATGPT_SETUP.md)

---

## 📋 Forudsætninger

- Node.js 18+
- TypeScript
- Billy.dk API adgang (API nøgle og organisation ID)
- **Redis** (optional - for horizontal scaling, anbefalet til production)
- (For Claude.ai Web: Pro/Max/Team/Enterprise plan)

## 🛠️ Installation

1. **Installer dependencies**

```bash
npm install
```

1. **Konfigurer miljøvariabler**

```bash
cp .env.example .env
```

Rediger `.env` filen med dine Billy.dk API oplysninger:

```env
BILLY_API_KEY=din_billy_api_nøgle
BILLY_ORGANIZATION_ID=din_organisation_id
BILLY_API_BASE=https://api.billysbilling.com/v2
```

1. **Build projektet**

```bash
npm run build
```

## 🚀 Deployment

### ☁️ Cloud Deployment (Anbefalet)

**Deploy til Render.com som standalone HTTP service:**

```bash
# Kort version:
# 1. Push til GitHub
# 2. Opret Web Service på Render.com
# 3. Select Docker environment
# 4. Tilføj environment variables (se deployment/ENV_GROUP_*.txt)
# 5. Deploy!
```

📖 **Læs dokumentation:**

- [`docs/DEPLOYMENT_COMPLETE.md`](./docs/DEPLOYMENT_COMPLETE.md) - Komplet deployment guide
- [`docs/PRODUCTION_VALIDATION_COMPLETE.md`](./docs/PRODUCTION_VALIDATION_COMPLETE.md) - Validering og tests
- [`deployment/`](./deployment/) - Environment Group konfigurationer

**Live server:** `https://tekup-billy.onrender.com`

### 💻 Lokal Brug

**Stdio MCP (Claude Desktop, VS Code):**

```bash
npm run dev         # Development mode
npm start           # Production mode
```

**HTTP Server (Testing cloud deployment lokalt):**

```bash
npm run dev:http    # Development mode
npm run start:http  # Production mode
```

### 🐳 Docker

```bash
npm run docker:build  # Build image
npm run docker:run    # Run container
```

## 🔧 Tilgængelige Tools

### Fakturaer (8 tools)

#### `list_invoices`

Henter en liste over fakturaer med filtrering og paginering.

#### `create_invoice`

Opretter en ny faktura med linjer og kunde information.

#### `get_invoice`

Henter detaljer for en specifik faktura.

#### `send_invoice`

Sender en faktura til kunden via email.

#### `update_invoice` ✨ NY

Opdaterer en eksisterende faktura (linjer, kunde, dato, betalingsbetingelser).

#### `approve_invoice` ✨ NY

Godkender en faktura og ændrer status fra draft til approved.

#### `cancel_invoice` ✨ NY

Annullerer en faktura med optional årsag.

#### `mark_invoice_paid` ✨ NY

Markerer en faktura som betalt med betalingsdato og beløb.

### Kunder (4 tools)

#### `list_customers`

Henter en liste over kunder med søgning og paginering.

#### `create_customer`

Opretter en ny kunde med kontaktoplysninger.

#### `get_customer`

Henter detaljer for en specifik kunde.

#### `update_customer` ✨ NY

Opdaterer kundeoplysninger (navn, email, telefon, adresse).

### Produkter (3 tools)

#### `list_products`

Henter en liste over produkter med søgning.

#### `create_product`

Opretter et nyt produkt med pris og beskrivelse.

#### `update_product` ✨ NY

Opdaterer produktinformation (navn, beskrivelse, priser).

### Omsætning (1 tool)

#### `get_revenue`

Henter omsætningsdata for en periode med gruppering.

### Preset Workflows (6 tools) 🎯 NY

#### `analyze_user_patterns`

Analyserer bruger-mønstre og genererer indsigt og anbefalinger.

#### `generate_personalized_presets`

Genererer personlige workflow presets baseret på bruger-adfærd.

#### `get_recommended_presets`

Henter anbefalede presets baseret på bruger-mønstre eller forretningstype.

#### `execute_preset`

Udfører en preset workflow med optional parameter overrides.

#### `list_presets`

Lister alle tilgængelige presets med filtrering og usage statistik.

#### `create_custom_preset`

Opretter en custom workflow preset med specificerede actions.

## 🧪 Testing

### Lokal Integration Testing

```bash
# Kør alle integration tests
.\tests\run-tests.ps1

# Eller direkte:
npx tsx tests/test-integration.ts
```

### Production Health Check

```bash
npx tsx tests/test-production.ts
```

### Production Operations Testing

```bash
npx tsx tests/test-production-operations.ts
```

### Direct Billy.dk API Test

```bash
npx tsx tests/test-billy-api.ts
```

📖 **Læs mere:** [`docs/PRODUCTION_VALIDATION_COMPLETE.md`](./docs/PRODUCTION_VALIDATION_COMPLETE.md)

## 🔒 Sikkerhed

- **Kryptering:** AES-256-GCM med scrypt key derivation for Billy API keys
- **Autentifikation:** MCP_API_KEY for HTTP API requests
- **Rate Limiting:** 100 requests per 15 minutter per IP
- **Input Validering:** Zod schemas for alle tool inputs
- **Audit Logging:** Alle operations logges i Supabase (optional)
- **Environment Variables:** Alle secrets i Environment Groups (Render) eller .env (lokal)

## 🗄️ Database Consolidation Initiative

**Status:** ✅ **ALREADY ON SUPABASE** - Ready for central consolidation

Tekup-Billy bruger allerede Supabase til caching, audit logging og analytics. Se database consolidation planerne:

📋 **[→ Database Consolidation Analysis](../DATABASE_CONSOLIDATION_ANALYSE.md)** - Komplet analyse af alle Tekup databaser  
🚀 **[→ Migration Quick Start](../MIGRATION_QUICK_START.md)** - Hurtig-guide til migration  
🛠️ **[→ GitHub Migration Resources](../GITHUB_MIGRATION_RESOURCES.md)** - Migration tools

**Tekup-Billy's rolle:**

- ✅ Allerede på Supabase med sofistikeret setup
- ✅ AES-256-GCM encryption for API keys
- ✅ Caching, audit logging, rate limiting
- 🎯 Klar til `billy` schema i centralt projekt

---

## 🗄️ Supabase Integration (Optional)

**Supabase er OPTIONAL** - serveren fungerer fint uden det! Men hvis du vil have caching, analytics og audit logs, kan du aktivere det:

### Fordele ved at aktivere Supabase

- **⚡ 5x hurtigere responses** - Cache-lag mellem Billy API og MCP
- **📊 Usage analytics** - Se hvilke tools bruges mest
- **🔍 Audit logs** - Komplet trail af alle operations
- **🛡️ Rate limiting** - Beskyt mod API misuse
- **👥 Multi-tenant support** - Flere organizationer i samme instance

### Sådan aktiverer du Supabase

1. **Opret gratis Supabase-projekt** på [supabase.com](https://supabase.com)
2. **Kør SQL-scripts** fra `docs/sql/001_initial_schema.sql`
3. **Tilføj credentials til `.env`**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
ENCRYPTION_KEY=generate-strong-32-char-passphrase
ENCRYPTION_SALT=generate-random-16-char-salt
```

Genbyg og deploy - Supabase aktiveres automatisk når credentials er sat.

📖 **Komplet guide:** [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md)

**Uden Supabase:** Serveren bruger direkte Billy.dk API - perfekt til små setups og testing.  
**Med Supabase:** Production-ready med caching, analytics og multi-tenant support.

## 🤝 Integration

### RenOS Backend Integration

Serveren er designet til at integrere med RenOS-backend systemet gennem MCP HTTP API:

```typescript
// HTTP API eksempel
const response = await axios.post(
  "https://tekup-billy.onrender.com/api/v1/tools/list_invoices",
  {
    pageSize: 10,
    page: 1,
  },
  {
    headers: {
      "X-API-Key": "your_mcp_api_key",
      "Content-Type": "application/json",
    },
  }
);
```

📖 **Læs mere:** [`docs/RENOS_INTEGRATION_GUIDE.md`](./docs/RENOS_INTEGRATION_GUIDE.md)

## 📚 Dokumentation

Komplet dokumentation er organiseret i `docs/` mappen:

### 📖 Quick Start

- [`docs/START_HERE.md`](./docs/START_HERE.md) - **Start her!** Quick start guide
- [`docs/MASTER_INDEX.md`](./docs/MASTER_INDEX.md) - Komplet dokumentations-index
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) - Fremtidige features og planer

### 🤖 AI Integration

- [`docs/CLAUDE_WEB_SETUP.md`](./docs/CLAUDE_WEB_SETUP.md) - Claude.ai Web setup (2 min)
- [`docs/CHATGPT_SETUP.md`](./docs/CHATGPT_SETUP.md) - ChatGPT integration
- [`docs/UNIVERSAL_MCP_PLUGIN_GUIDE.md`](./docs/UNIVERSAL_MCP_PLUGIN_GUIDE.md) - Universal platform guide
- [`docs/ai-integration/`](./docs/ai-integration/) - AI assistant guides og reports
- [`docs/examples/claude-desktop-config.json`](./docs/examples/claude-desktop-config.json) - Claude Desktop config

### 🚀 Deployment & Operations

- [`docs/DEPLOYMENT_COMPLETE.md`](./docs/DEPLOYMENT_COMPLETE.md) - Complete deployment guide
- [`docs/PRODUCTION_VALIDATION_COMPLETE.md`](./docs/PRODUCTION_VALIDATION_COMPLETE.md) - Validation reports
- [`docs/operations/`](./docs/operations/) - Daily operations og deployment status
- [`deployment/`](./deployment/) - Environment konfigurationer og Dockerfile

### 💼 Billy.dk Integration

- [`docs/BILLY_API_REFERENCE.md`](./docs/BILLY_API_REFERENCE.md) - Billy.dk API reference
- [`docs/billy/`](./docs/billy/) - Invoice reports og sample data

### 📊 Project Specifications

- [`docs/TEKUP_BILLY_V2_SPECIFICATION.md`](./docs/TEKUP_BILLY_V2_SPECIFICATION.md) - v2.0 Enhancement Plan
- [`docs/PROJECT_SPEC.md`](./docs/PROJECT_SPEC.md) - Komplet projekt specifikation
- [`docs/MCP_IMPLEMENTATION_GUIDE.md`](./docs/MCP_IMPLEMENTATION_GUIDE.md) - MCP protokol implementation
- [`docs/planning/`](./docs/planning/) - Planning docs og status reports

### 🔧 Troubleshooting & Setup

- [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md) - Supabase integration guide
- [`docs/REDIS_SETUP_GUIDE.md`](./docs/REDIS_SETUP_GUIDE.md) - Redis setup for scaling
- [`docs/troubleshooting/`](./docs/troubleshooting/) - Terminal fixes og PowerShell setup

### 🔌 Integrations

- [`docs/RENOS_INTEGRATION_GUIDE.md`](./docs/RENOS_INTEGRATION_GUIDE.md) - RenOS integration
- [`docs/SHORTWAVE_INTEGRATION_GUIDE.md`](./docs/SHORTWAVE_INTEGRATION_GUIDE.md) - Shortwave AI integration
- [`docs/integrations/tekupvault/`](./docs/integrations/tekupvault/) - TekupVault integration docs

## 🔗 TekupVault Integration

**TekupVault** er Tekup Portfolio's centrale knowledge base der automatisk indexerer Tekup-Billy.

**Status:** ✅ OPERATIONAL (Updated: 17. Oktober 2025)

- **Repository:** <https://github.com/JonasAbde/TekupVault> (Private)
- **API:** <https://tekupvault-api.onrender.com>
- **Sync:** Hver 6. time (GitHub → TekupVault)
- **Indexeret:** 188 filer fra Tekup-Billy + 875 fra andre Tekup repos
- **Database:** Supabase PostgreSQL + pgvector
- **Phase 2:** MCP server integration planlagt

**Hvad indexeres fra Tekup-Billy:**

- ✅ Source code (src/) - Alle 32 tool implementations
- ✅ Documentation (docs/, \*.md) - 48+ markdown filer
- ✅ Configuration files (package.json, tsconfig.json, etc.)
- ✅ API reference og guides
- ✅ AI_AGENT_GUIDE.md (661 linjer)

**Semantic Search Examples:**

```bash
# Find invoice creation documentation
curl -X POST https://tekupvault-api.onrender.com/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "How to create and approve an invoice?", "limit": 5}'

# Search for MCP tool implementations
curl -X POST https://tekupvault-api.onrender.com/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "customer management MCP tools", "limit": 10}'

# Find analytics features
curl -X POST https://tekupvault-api.onrender.com/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "analyze feedback and usage patterns", "limit": 5}'
```

**Sync Status:**

```bash
curl https://tekupvault-api.onrender.com/api/sync-status
```

**Related Projects:**

- [renos-backend](https://github.com/JonasAbde/renos-backend) - TypeScript + Prisma (607 files indexed)
- [renos-frontend](https://github.com/JonasAbde/renos-frontend) - React + Vite (268 files indexed)

## 📊 Status

**Production Status:** ✅ Live på <https://tekup-billy.onrender.com>

**Test Results:**

- ✅ Local Integration: 6/6 tests passing
- ✅ Production Health: 4/4 tests passing
- ✅ Production Operations: 4/4 tests passing

**Available Tools:** 25 MCP tools ✨ (inkl. 6 preset workflow tools)

- 8 Invoice operations (update, approve, cancel, mark paid, list, create, get, send)
- 4 Customer operations (list, create, get, update)
- 3 Product operations (list, create, update)
- 6 Preset workflow tools (analyze patterns, generate presets, get recommendations, execute, list, create custom)
- 1 Revenue operation
- 3 Test operations

## 📝 License

MIT License - Se LICENSE fil for detaljer

## 👨‍💻 Udviklet til

RenOS - Rendetalje ApS  
Integration med Billy.dk accounting system
<https://www.billy.dk/api>
