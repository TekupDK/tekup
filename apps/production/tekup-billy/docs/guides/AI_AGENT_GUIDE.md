# 📚 Tekup-Billy AI Agent Guide - Complete Reference

**Dato:** October 16, 2025  
**Version:** 1.0  
**Formål:** Comprehensive guide for AI agents på Tekup-Billy MCP Server  

---

## 📑 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Identity](#project-identity)
3. [Architecture Overview](#architecture-overview)
4. [Tekup Portfolio Context](#tekup-portfolio-context)
5. [Critical Billy.dk Patterns](#critical-billyddk-patterns)
6. [Developer Quick Reference](#developer-quick-reference)
7. [File Purpose Map](#file-purpose-map)
8. [Common Pitfalls](#common-pitfalls)
9. [TekupVault Integration](#tekupvault-integration)
10. [Deployment Variants](#deployment-variants)

---

## Executive Summary

**Tekup-Billy MCP Server** er en production-ready AI-agent integration med Billy.dk accounting API.

### 🎯 I 3 Punkter

1. **MCP Server med 32 tools** for invoicing, customers, products, revenue management
2. **Dual transport:** Stdio MCP (local) + HTTP REST (cloud on Render.com)
3. **Enterprise-grade:** Zod validation, rate limiting, audit logging, Supabase integration

### ✅ Status

- **Version:** 1.3.0
- **Build:** ✅ SUCCESS (Zero TypeScript errors)
- **Deployment:** ✅ PRODUCTION READY
- **Tools:** 32 functional MCP tools
- **Live URL:** <https://tekup-billy.onrender.com>

---

## Project Identity

### Metadata

- **Name:** Tekup-Billy MCP Server
- **Type:** Model Context Protocol Server + HTTP REST API
- **Language:** TypeScript (strict mode, ES modules)
- **Runtime:** Node.js 18+
- **License:** MIT
- **Developer:** Jonas Abde (Solo Developer & Technical Lead)

### Integration Points

- **AI Agents:** Claude Desktop ✅, Claude.ai Web ✅, ChatGPT ✅, VS Code Copilot ✅
- **Cloud:** Render.com, AWS Lambda, Google Cloud, Azure
- **Related:** RenOS Backend, TekupVault, Billy.dk API

---

## Architecture Overview

### Dual Transport Model

**Tekup-Billy understøtter 2 fundamentalt forskellige måder at invokere tools:**

#### 1. **Stdio MCP** (Local Development)

- Entry point: `src/index.ts`
- Protocol: Native MCP over stdin/stdout
- Clients: Claude Desktop, VS Code Copilot, local agents
- Deployment: Local machine

```bash
npm run build && npm start
# Listens on stdio for MCP protocol
```

#### 2. **HTTP REST** (Cloud Deployment)

- Entry point: `src/http-server.ts`
- Protocol: MCP Streamable HTTP (2025-03-26)
- Clients: ChatGPT, RenOS backend, generic HTTP clients
- Deployment: Render.com, AWS, Docker

```bash
npm run build && npm start:http
# Listens on port 3000 for HTTP /mcp endpoints
```

### 5-Layer Architecture

```
┌─────────────────────────────────┐
│ LAYER 1: AI AGENTS              │
│ Claude, ChatGPT, VS Code        │
└──────────────┬──────────────────┘
               │ MCP Protocol
               ↓
┌─────────────────────────────────┐
│ LAYER 2: TRANSPORT              │
│ Stdio / HTTP / SSE              │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│ LAYER 3: TOOL HANDLERS          │
│ 32 MCP tools (src/tools/*.ts)   │
│ Zod validation                  │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│ LAYER 4: INTEGRATION            │
│ BillyClient (API wrapper)       │
│ Rate limiting, error mapping    │
│ Data logging, audit trail       │
└──────────────┬──────────────────┘
               │ REST API
               ↓
┌─────────────────────────────────┐
│ LAYER 5: EXTERNAL SERVICES      │
│ Billy.dk API, Supabase, Vault   │
└─────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility |
|-----------|-----------------|
| `src/billy-client.ts` | ONLY Billy API communication. Never knows about MCP, HTTP, or logging. Pure API wrapper. |
| `src/tools/*.ts` | ONLY tool logic. Validate input → call client → log → format response. |
| `src/index.ts` | Stdio MCP server initialization, tool registration, connection handling. |
| `src/http-server.ts` | Express HTTP wrapper, token auth, session management, route mapping. |
| `src/database/`, `src/middleware/` | Supabase caching, audit logging (optional, doesn't block core). |

---

## Tekup Portfolio Context

### 🏢 Hvad er Tekup.dk?

**Tekup** er Jonas Abde's portfolio af AI-integrerede business software solutions. Alle projekter bruger **Model Context Protocol (MCP)** til at integrere AI agents.

### 📊 Portfolio Struktur

```
TEKUP PORTFOLIO
│
├── 1. TEKUP-BILLY (This Project)
│   ├── Formål: Billy.dk accounting API integration via MCP
│   ├── Status: ✅ Production Ready (v1.3.0)
│   ├── Tools: 32 MCP tools
│   └── Deployment: https://tekup-billy.onrender.com
│
├── 2. RENOS PLATFORM
│   ├── Frontend: React + Vite (renos-frontend)
│   ├── Backend: TypeScript + Prisma (renos-backend)
│   ├── Branche: Rendetalje ApS (Detail/Retail)
│   ├── Features: Inventory, invoicing, customers, revenue
│   └── Integration: Bruger Tekup-Billy MCP for accounting
│
└── 3. TEKUPVAULT (Knowledge Base)
    ├── Formål: Central search engine for all Tekup projects
    ├── Status: 🚧 Phase 1 In Progress (API Live, Search Pending)
    ├── URL: https://tekupvault-api.onrender.com
    └── Future: MCP Server for cross-project knowledge discovery
```

### 🔗 How They Connect

```
RenOS Frontend (React)
       ↓
RenOS Backend (TypeScript)
       ↓
Tekup-Billy MCP (32 tools)
       ↓
Billy.dk Accounting API
       ↓
Real invoices, customers, financial data
       
+ TekupVault (Knowledge Search)
  ├→ Indexes all 3 projects
  └→ AI agents can search across projects
```

### 💡 Why This Architecture?

✅ **AI-agent friendly** — MCP tools usable by all LLMs  
✅ **Reusable** — Same tools work locally and in cloud  
✅ **Secure** — Validation on all layers, audit logging  
✅ **Scalable** — Stateless HTTP, easy to deploy  
✅ **Enterprise** — Rate limiting, error handling, structured logging  

---

## Critical Billy.dk Patterns

### ⚠️ MUST KNOW: Common Mistakes

#### 1. **Always Use `organizationId` in Every Call**

```typescript
// ✅ CORRECT
await client.getInvoices({ organizationId: 'xxx', state: 'draft' });

// ❌ WRONG
await client.getInvoices({ state: 'draft' }); // Missing organizationId
```

#### 2. **Field Names Are Critical**

```typescript
// ✅ CORRECT
state: 'draft' | 'approved' | 'sent' | 'paid' | 'cancelled'

// ❌ WRONG
invoiceState: 'draft' // Field name is 'state', not 'invoiceState'
```

#### 3. **Contact Types**

```typescript
// ✅ CORRECT
type: 'customer' | 'supplier'

// ❌ WRONG
type: 'person' or type: 'company' // That's internal Billy terminology
```

#### 4. **Date Filtering Operators**

```typescript
// ✅ CORRECT
entryDateGte: '2025-01-01'  // Greater-than-or-equal
entryDateLte: '2025-12-31'  // Less-than-or-equal

// ❌ WRONG
entryDateFrom: '2025-01-01'
entryDateTo: '2025-12-31'
startDate, endDate  // Common mistakes
```

### Billy.dk API Structure

```typescript
// Every Billy API call:
// 1. Authentication: X-Access-Token header
// 2. Query parameters (NOT path parameters)
// 3. organizationId required on every call
// 4. Response includes full object with nested data

Example:
GET https://api.billysbilling.com/v2/invoices?organizationId=xxx&state=draft
Header: X-Access-Token: <API_KEY>

Response: { invoices: [...], pageNumber: 1, itemsPerPage: 20 }
```

---

## Developer Quick Reference

### First Time Setup

```powershell
# 1. Clone repository
git clone https://github.com/TekupDK/Tekup-Billy.git
cd Tekup-Billy

# 2. Copy environment template
Copy-Item .env.example -Destination .env

# 3. Edit .env - Set these required vars:
#    BILLY_API_KEY=<your_api_key>
#    BILLY_ORGANIZATION_ID=<your_org_id>

# 4. Install dependencies
npm install

# 5. Build TypeScript
npm run build

# 6. Choose deployment:
npm start              # Stdio MCP (local)
npm start:http         # HTTP REST (port 3000)
```

### Key Commands

| Command | Purpose | Best For |
|---------|---------|----------|
| `npm run dev` | Hot reload development | Active development |
| `npm run build` | Compile TypeScript to dist/ | Before npm start |
| `npm run inspect` | MCP Inspector GUI debugger | Debugging tool calls |
| `npm run test:integration` | Local integration tests | Testing with Supabase |
| `npm run test:production` | Production health checks | Before deployment |
| `npm start:http` | Start HTTP server (port 3000) | Cloud testing |
| `docker build . && docker run` | Docker container | Production-like testing |

### Adding a New Tool (Template)

**Step 1: Create `src/tools/newdomain.ts`**

```typescript
import { z } from 'zod';
import { BillyClient } from '../billy-client.js';
import { dataLogger } from '../utils/data-logger.js';

// Always define Zod schema FIRST
const myToolSchema = z.object({
  requiredParam: z.string().describe('User-facing description'),
  optionalParam: z.string().optional().describe('Optional parameter'),
  enumParam: z.enum(['option1', 'option2']).describe('One of these'),
}).strict(); // Reject extra fields

// Export async tool function
export async function myTool(client: BillyClient, args: unknown) {
  const startTime = Date.now();
  
  try {
    // 1. Validate input (catches LLM hallucinations early)
    const params = myToolSchema.parse(args);
    
    // 2. Log action start
    await dataLogger.logAction({
      action: 'myTool',
      tool: 'domain',
      parameters: params,
    });
    
    // 3. Call Billy API via client
    const result = await client.someMethod(params);
    
    // 4. Return MCP response
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
      structuredContent: result,
    };
    
  } catch (error) {
    // 5. Log error
    await dataLogger.logAction({
      action: 'myTool',
      tool: 'domain',
      result: 'error',
      metadata: {
        executionTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown',
      },
    });
    throw error; // MCP/HTTP layer will wrap this
  }
}
```

**Step 2: Register in `src/index.ts`**

```typescript
import { myTool } from './tools/newdomain.js';

// In setupTools() method:
this.server.setRequestHandler(McpRequest.CallTool, async (req) => {
  // Add case:
  case 'myTool':
    return await myTool(this.billyClient!, req.params.arguments);
});
```

---

## File Purpose Map

### Core Files

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/index.ts` | Stdio MCP server entry point | McpServer setup, tool registration |
| `src/http-server.ts` | Express HTTP wrapper for cloud | HTTP routes, token auth, session mgmt |
| `src/billy-client.ts` | Billy.dk API wrapper | BillyClient class, all API methods |
| `src/config.ts` | Environment validation | getBillyConfig(), envSchema |
| `src/types.ts` | TypeScript interfaces | BillyInvoice, BillyContact, etc. |

### Tools (MCP Tool Implementations)

| File | Tools | Count |
|------|-------|-------|
| `src/tools/invoices.ts` | listInvoices, createInvoice, getInvoice, sendInvoice, updateInvoice, approveInvoice, cancelInvoice, markInvoicePaid | 8 |
| `src/tools/customers.ts` | listCustomers, createCustomer, getCustomer, updateCustomer | 4 |
| `src/tools/products.ts` | listProducts, createProduct, updateProduct | 3 |
| `src/tools/revenue.ts` | getRevenue | 1 |
| `src/tools/presets.ts` | 6 preset workflow tools | 6 |
| `src/tools/analytics.ts` | 5 analytics tools | 5 |
| `src/tools/debug.ts` | validateAuth, testConnection | 2 |
| `src/tools/test-runner.ts` | listTestScenarios, runTestScenario, generateTestData | 3 |

### Utilities

| File | Purpose |
|------|---------|
| `src/utils/data-logger.ts` | Action logging for audit trail |
| `src/utils/error-handler.ts` | Error extraction from Billy responses |
| `src/database/cache-manager.ts` | Supabase caching logic |
| `src/middleware/audit-logger.ts` | Audit logging to Supabase |

### Configuration & Deployment

| File | Purpose |
|------|---------|
| `.env.example` | Template for required environment variables |
| `package.json` | npm scripts, dependencies |
| `tsconfig.json` | TypeScript configuration |
| `Dockerfile` | Docker production image |
| `render.yaml` | Render.com auto-deploy configuration |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | Public quickstart, feature list |
| `docs/BILLY_API_REFERENCE.md` | Billy.dk API endpoint patterns |
| `docs/PROJECT_SPEC.md` | Full feature specifications |
| `docs/MCP_IMPLEMENTATION_GUIDE.md` | MCP protocol details |

---

## Common Pitfalls

### 🚨 Top 5 Mistakes AI Agents Make

1. **Forgetting `organizationId` in API calls**
   - Billy.dk is multi-tenant, EVERY call needs it
   - Check if your request includes `organizationId` parameter

2. **Using wrong Billy field names**
   - `invoiceState` instead of `state`
   - `entryDateFrom` instead of `entryDateGte`
   - Always check field names in `BILLY_API_REFERENCE.md`

3. **Not validating input with Zod**
   - LLMs generate hallucinated parameters
   - Zod validation catches this early and throws clear errors
   - Always define schema before using parameters

4. **Accessing `client.config` directly**
   - It's a private property
   - Use `getBillyConfig()` function instead

5. **Mixing Stdio and HTTP in single process**
   - Use ONE or the OTHER, not both
   - `npm start` = Stdio MCP
   - `npm start:http` = HTTP REST

### Prevention Checklist

Before making Billy API calls:
- ✅ Is `organizationId` included?
- ✅ Are field names correct? (Check BILLY_API_REFERENCE.md)
- ✅ Is input validated with Zod schema?
- ✅ Are error messages structured?
- ✅ Is the action logged via dataLogger?

---

## TekupVault Integration

### What is TekupVault?

Central knowledge base that automatically indexes and makes searchable all Tekup project documentation and code. When complete, AI agents will be able to search across entire Tekup portfolio.

### Current Status (Phase 1)

**Status:** ✅ OPERATIONAL (Updated: 17. Oktober 2025)

#### ✅ All Systems Working

- **API Server:** `https://tekupvault-api.onrender.com` - Live
- **Database:** Supabase PostgreSQL + pgvector - Connected
- **GitHub Sync:** Real-time sync every 6 hours - Active
- **Search API:** Semantic search - Operational
- **Indexed Files:** 188 from Tekup-Billy + 875 from other Tekup repos
- **Embeddings:** 1,063 documents indexed, 56.4% embedded (in progress)

#### 🔍 Searching TekupVault (Available Now!)

AI agents can search Tekup-Billy documentation using TekupVault API:

**Example 1: Find Invoice Creation Docs**

```bash
curl -X POST https://tekupvault-api.onrender.com/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How to create and approve an invoice in Billy.dk?",
    "limit": 5
  }'
```

**Example 2: Search MCP Tool Implementations**

```bash
curl -X POST https://tekupvault-api.onrender.com/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "customer management tools MCP implementation",
    "limit": 10
  }'
```

**Example 3: Find Analytics Features**

```bash
curl -X POST https://tekupvault-api.onrender.com/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "analyze feedback and A/B test results",
    "limit": 5
  }'
```

**Check Sync Status:**

```bash
curl https://tekupvault-api.onrender.com/api/sync-status
```

**What You Can Find:**
- Source code from `src/` (all 32 tool implementations)
- Documentation from `docs/` (48+ markdown files)
- This AI_AGENT_GUIDE.md (661 lines)
- Billy.dk API patterns and examples
- Configuration and setup guides

### Future: Phase 2 (TekupVault MCP Server)

When TekupVault exposes MCP protocol, Tekup-Billy can add:

```typescript
export async function searchTekupDocs(client: BillyClient, args: unknown) {
  // Search across all Tekup projects via TekupVault MCP
  // Users: "Find all docs about invoice creation"
  // Result: Matches from Tekup-Billy, RenOS, TekupVault docs
}
```

**Benefits:**
- AI agents can search all Tekup projects without leaving MCP context
- Cross-project knowledge discovery
- Seamless context switching between projects

### For TekupVault Team

See `TEKUPVAULT_REQUIREMENTS_FROM_BILLY.md` for:
- Exact API specs
- Integration blockers
- Priority requirements

---

## Deployment Variants

### 1. Local MCP (VS Code Copilot, Claude Desktop)

```bash
npm run build && npm start
# Listens on stdin/stdout for MCP protocol
```

**Use when:**
- Developing locally
- Using Claude Desktop
- Using VS Code Copilot
- Testing with local agents

### 2. HTTP Cloud (Render.com, AWS, etc.)

```bash
npm run build && npm start:http
# Listens on port 3000 for HTTP /mcp endpoints
# Deploy with: docker build . && docker push <registry>/tekup-billy-mcp
# See render.yaml for Render.com auto-deploy config
```

**Use when:**
- Deploying to cloud
- Using ChatGPT
- RenOS backend integration
- Generic HTTP clients

### 3. Docker Container

```bash
docker build -t tekup-billy-mcp .
docker run --env-file .env -p 3000:3000 tekup-billy-mcp
```

**Use when:**
- Production-like testing
- On-premise deployment
- Container orchestration (Kubernetes, etc.)

### 4. Development with Hot Reload

```bash
npm run dev
# Auto-restarts on file changes, fastest iteration
```

**Use when:**
- Active development
- Debugging tool implementations
- Testing changes rapidly

---

## Quick Reference Commands

### Development

```bash
npm run dev           # Local development with hot reload
npm run inspect       # MCP Inspector GUI debugger
npm run build         # Compile TypeScript
```

### Deployment

```bash
npm start             # Production Stdio MCP
npm start:http        # Production HTTP server
npm run docker:build  # Build Docker image
npm run docker:run    # Run Docker container
```

### Testing

```bash
npm run test:integration    # Local integration tests
npm run test:production     # Production health checks
npm run test:operations     # Production operations tests
npm run test:billy          # Direct Billy API tests
npm run test:all            # All tests
```

---

## Environment Variables

### Required

```env
BILLY_API_KEY=<your_billy_api_key>
BILLY_ORGANIZATION_ID=<your_billy_org_id>
```

### Optional

```env
BILLY_API_BASE=https://api.billysbilling.com/v2  # Default provided
BILLY_TEST_MODE=false                             # Enable test mode
BILLY_DRY_RUN=false                                # Enable dry run (no real calls)
NODE_ENV=production                                # Environment
PORT=3000                                          # HTTP server port
CORS_ORIGIN=*                                      # CORS settings
```

### Supabase (for audit logging)

```env
SUPABASE_URL=<your_supabase_url>
SUPABASE_KEY=<your_supabase_key>
```

---

## Support & Resources

### Documentation

- `README.md` — Quickstart and feature overview
- `docs/BILLY_API_REFERENCE.md` — Billy.dk API patterns
- `docs/PROJECT_SPEC.md` — Full specifications
- `.cursorrules` — Detailed Cursor/Windsurf rules

### Integration Guides

- `docs/RENOS_INTEGRATION_GUIDE.md` — RenOS backend integration
- `docs/MCP_IMPLEMENTATION_GUIDE.md` — MCP protocol details
- `TEKUPVAULT_INTEGRATION.md` — TekupVault knowledge base

### External References

- Billy.dk API: <https://www.billy.dk/api>
- MCP Specification: <https://modelcontextprotocol.io>
- Render.com Docs: <https://render.com/docs>

---

## Summary: What Makes Tekup-Billy Special

### 🎯 Problem Solved

**Before:** AI agents couldn't reliably integrate with Billy.dk accounting  
**After:** 32 MCP tools enable Claude, ChatGPT, and other agents to manage invoices, customers, and products

### 💪 Key Strengths

1. **Production-ready** — Used in real RenOS deployments
2. **Multi-transport** — Works locally and in cloud
3. **Enterprise-grade** — Rate limiting, audit logging, error handling
4. **AI-optimized** — Zod validation, structured errors, clear tool descriptions
5. **Well-documented** — This guide, API references, integration guides

### 🚀 Next Steps

- **For Developers:** Follow "First Time Setup" section
- **For AI Agents:** Review "Critical Billy.dk Patterns"
- **For Integration:** Check deployment variant that fits your use case
- **For Growth:** Monitor TekupVault Phase 2 for cross-project search

---

**Last Updated:** October 17, 2025  
**Maintained by:** Jonas Abde & Tekup Team  
**License:** MIT
