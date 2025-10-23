# Copilot Instructions for Tekup-Billy MCP Server

## Project Identity

- **Name:** Tekup-Billy MCP Server
- **Purpose:** AI-agent-friendly integration of Billy.dk accounting API via Model Context Protocol (MCP)
- **Type:** Full-stack TypeScript MCP server with HTTP REST fallback for cloud deployment
- **Status:**  **PRODUCTION READY** (v1.4.2) - Zero TypeScript errors, 32 tools functional, Redis scaling, HTTP Keep-Alive, Compression
- **Runtime:** Node.js 18+, deployable on Render.com, AWS Lambda, Docker, or local stdio

## Architecture Essence (What Makes This Different)

### Dual Transport Model

The project supports **two fundamentally different ways to invoke tools**:
1. **Stdio MCP** (src/index.ts)  Native MCP protocol for Claude Desktop, VS Code Copilot, local agents
2. **HTTP REST** (src/http-server.ts)  Cloud-deployed REST API using new MCP Streamable HTTP (2025-03-26) standard
   - Both are **identical tool sets**  same validation, same Billy API calls, same error handling
   - HTTP layer wraps MCP tool functions directly (not a shim or translation layer)
   - Enables single codebase to work with HTTP clients (ChatGPT, RenOS backend, generic HTTP clients) **and** native MCP clients

### Data Flow Architecture

``
Claude/LLM  MCP Tool Call  Tool Function  Zod Validation

                            BillyClient (rate limiting)
                                        
                            Billy.dk API (X-Access-Token auth)
                                        
                            Response  DataLogger  Supabase (audit trail)
                                        
                            MCP Response (content[] + structuredContent)
``

### Component Boundaries

- **src/billy-client.ts**  ONLY Billy API communication. Never knows about MCP, HTTP, or logging details. Pure API wrapper.
- **src/tools/*.ts**  ONLY tool logic. Each tool: validate input  call client  log  format response. No Billy API calls directly.
- **src/index.ts**  Stdio MCP server initialization, tool registration, connection handling.
- **src/http-server.ts**  Express HTTP wrapper, token auth, session management, route mapping to tools.
- **src/database/ & src/middleware/**  Supabase caching and audit logging (optional, doesn't block core tools).

## Developer Quick Reference

### First Time Setup

``powershell
Copy-Item .env.example -Destination .env

# Edit .env: set BILLY_API_KEY and BILLY_ORGANIZATION_ID

npm install
npm run build
npm start                 # Stdio MCP
npm start:http            # HTTP REST (port 3000)
``

### Key Commands

| Command | Purpose | Notes |
|---------|---------|-------|
| `npm run dev` | Local dev with hot reload (tsx) | Use for development, auto-restarts |
| `npm run build` | Compile TypeScript to `dist/` | Required before `npm start` |
| `npm run inspect` | MCP Inspector debugger | Shows tool calls in real-time GUI |
| `npm run test:integration` | Local test suite | Requires Supabase credentials |
| `npm start:http` | HTTP REST server | Cloud-deployment testing |
| `docker build . && docker run` | Container test | Production-like environment |

## Critical Billy.dk API Patterns (MUST KNOW)

**Always use query params + organizationId in every call:**
- CORRECT: wait client.getInvoices({ organizationId: 'xxx', state: 'draft' })
- WRONG: wait client.getInvoices({ organizationId: 'xxx', invoiceState: 'draft' })  Field name is state

**Contact types:**
- CORRECT:  ype: 'customer' | 'supplier'
- WRONG:  ype: 'person' or  ype: 'company'  Internal Billy terminology only

**Date filtering:**
- CORRECT: entryDateGte: '2025-01-01' and entryDateLte: '2025-12-31'
- WRONG: entryDateFrom, entryDateTo, startDate, endDate  Common mistakes

## File Purpose Quick Map

| File | Purpose |
|------|---------|
| `src/config.ts` | Env var validation with zod |
| `src/billy-client.ts` | Billy.dk API wrapper + rate limit |
| `src/tools/*.ts` | MCP tool implementations |
| `src/http-server.ts` | Express HTTP wrapper |
| `src/mcp-streamable-transport.ts` | MCP Streamable HTTP protocol (2025-03-26) |
| `.env.example` | Template for required env vars |

## Common Pitfalls

1. **Forgetting `organizationId`**  Billy.dk is multi-tenant, EVERY call needs it
2. **Using wrong Billy field names**  e.g., `invoiceState` instead of `state`
3. **Not validating input with zod**  LLMs generate hallucinated parameters; validation catches this early
4. **Accessing `client.config` directly**  It's private; use `getBillyConfig()` instead
5. **Mixing Stdio and HTTP**  Use ONE or the OTHER, not both

## Key Reference Files

- `docs/BILLY_API_REFERENCE.md`  API endpoint patterns and field names
- `README.md`  Quickstart and deployment options
- `.cursorrules`  Extended Cursor/Windsurf-specific rules

## 🔗 TekupVault Integration (Phase 1)

**Status:** 🚧 In Progress (API Live, Search Endpoint Pending)

### What is TekupVault?

Central knowledge base that automatically indexes and makes searchable all Tekup project documentation and code. When complete, AI agents will be able to search across entire Tekup portfolio.

### Current Capabilities

- ✅ **API Server Live** — `https://tekupvault-api.onrender.com`
- ✅ **Repository Registered** — Tekup-Billy indexed every 6 hours (target)
- ✅ **Documentation Tracked** — All markdown, source, and config files
- 🚧 **Search API** — Under development (returns 404 for now)
- 🚧 **GitHub Sync** — Mock data only, real sync in progress

### Future: Phase 2 (TekupVault MCP Server)

When TekupVault exposes MCP protocol, Tekup-Billy can add a `searchTekupDocs` tool allowing AI agents to search all Tekup projects without leaving MCP context.

### For TekupVault Team

See `TEKUPVAULT_REQUIREMENTS_FROM_BILLY.md` for exact API specs and integration blockers.

## 📊 Logging & Monitoring

### Log Infrastructure

**Winston Logger** (src/utils/logger.ts):
- JSON structured logs in production
- PII redaction (email, phone, API keys)
- Console + file output
- Log levels: error, warn, info, debug

**Audit Logging** (src/middleware/audit-logger.ts):
- Wraps all tool executions
- Logs to Supabase `audit_logs` table
- Tracks: tool name, action, duration, success/failure, input/output params
- Optional: Set `SUPABASE_URL` to enable

**Supabase Caching & Database** (docs/operations/SUPABASE_CACHING_SETUP.md):
- Production database setup guide
- Environment variable configuration
- Cache performance metrics (5x speedup)
- Troubleshooting guide for common issues

**Local Logs** (logs/ directory):

```
logs/user-actions-YYYY-MM-DD.json  # Daily tool call logs
logs/exceptions.log                 # Uncaught exceptions
logs/rejections.log                 # Promise rejections
logs/combined.log                   # All logs (production)
logs/error.log                      # Errors only (production)
```

### Accessing Render.com Production Logs

**Dashboard Access:**
1. Go to <https://dashboard.render.com>
2. Select service: `tekup-billy-mcp` (srv-d3kk30t6ubrc73e1qon0)
3. Click "Logs" tab for real-time stream

**CLI Access:**

```bash
npm install -g @renderinc/cli
render login
render logs -s srv-d3kk30t6ubrc73e1qon0 --tail
```

**Key Log Patterns to Monitor:**
- `"Tekup-Billy MCP HTTP Server started"` → Server boot success
- `"Billy API Error"` → API failures (rate limit, auth issues)
- `"tools/call"` → Tool invocations with params
- `"executionTime"` → Performance metrics per tool

### Usage Patterns Analysis

**See detailed reports:**
- `docs/operations/USAGE_PATTERNS_REPORT.md` → Tool usage statistics, peak hours, optimization recommendations
- `docs/operations/RENDER_LOGS_GUIDE.md` → Complete guide to accessing and analyzing Render logs

**Quick Stats (11-12 Oct 2025):**
- Top 5 tools: updateProduct (40%), createCustomer (25%), updateCustomer (20%)
- Peak hours: 17:00-22:00 CET
- Error rate: 0% (test mode)
- Avg response: <5ms

---
**Last Updated:** October 20, 2025
