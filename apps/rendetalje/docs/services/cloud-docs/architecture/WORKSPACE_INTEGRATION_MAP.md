# Tekup Workspace - Integration Map

**Generated:** 22. Oktober 2025, kl. 05:00 CET  
**Purpose:** Visual mapping of all inter-repository connections, APIs, databases, and dependencies

---

## VISUAL OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TEKUP ECOSYSTEM - INTEGRATION MAP                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │  SUPABASE    │
                              │  PostgreSQL  │
                              │  pgvector    │
                              └──────┬───────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                           │
          │                          │                           │
    ┌─────▼─────┐             ┌─────▼─────┐            ┌───────▼────────┐
    │  Tekup    │             │  TekupVault│            │  RendetaljeOS  │
    │  Billy    │◄────────────┤   (Core)   │───────────►│   Backend      │
    │  v1.4.2   │   Indexed   │   v0.1.0   │   Indexed  │    (RenOS)     │
    └─────┬─────┘             └─────┬──────┘            └────────┬───────┘
          │                          │                            │
          │ HTTP API                 │ MCP Server                 │ API calls
          │                          │                            │
    ┌─────▼──────┐            ┌─────▼─────┐             ┌───────▼────────┐
    │  RenOS     │            │  Claude   │             │  RenOS         │
    │  Calendar  │            │  ChatGPT  │             │  Calendar MCP  │
    │  MCP       │            │  Cursor   │             │  (Intelligence)│
    └────────────┘            └───────────┘             └────────────────┘
```

---

## PRODUCTION API ENDPOINTS

### 1. Tekup-Billy MCP

**URL:** <https://tekup-billy.onrender.com>  
**Protocol:** HTTP REST + Stdio MCP  
**Port:** 3000 (production)

**Endpoints:**
```
GET  /health                           # Health check
POST /api/v1/tools                     # List all tools
POST /api/v1/tools/list_invoices       # List invoices
POST /api/v1/tools/create_invoice      # Create invoice
POST /api/v1/tools/list_customers      # List customers
POST /api/v1/tools/create_customer     # Create customer
POST /api/v1/tools/list_products       # List products
POST /api/v1/tools/get_revenue         # Get revenue data
... 24 more tools ...
```

**Clients:**

- Claude.ai Web (custom connector)
- ChatGPT (custom connector)
- Claude Desktop (stdio MCP)
- RenOS Calendar MCP (HTTP API - pending)
- RenOS Backend (HTTP API - pending)

**Upstream:**

- Billy.dk API: <https://api.billysbilling.com/v2>
- Supabase: <https://twaoebtlusudzxshjral.supabase.co> (optional caching)
- Redis: (horizontal scaling)

---

### 2. TekupVault API

**URL:** <https://tekupvault.onrender.com>  
**Protocol:** HTTP REST + MCP  
**Port:** 3000 (production)

**Endpoints:**
```
GET  /health                    # Health check
POST /api/search                # Semantic search
GET  /api/sync-status           # Repository sync status
POST /webhook/github            # GitHub webhook
GET  /.well-known/mcp.json      # MCP discovery
```

**MCP Tools:**

- `search` - Semantic search
- `fetch` - Fetch document by ID
- `search_knowledge` - Advanced search
- `get_sync_status` - Sync status
- `list_repositories` - List indexed repos
- `get_repository_info` - Repository details

**Clients:**

- Claude Desktop (MCP stdio)
- ChatGPT (OpenAI-compatible search)
- Cursor AI (MCP integration ready)
- All Tekup projects (documentation search)

**Upstream:**

- GitHub API: <https://api.github.com> (14 repositories)
- OpenAI API: Embeddings (text-embedding-3-small)
- Supabase: <https://twaoebtlusudzxshjral.supabase.co> (database + pgvector)

**Worker Service:**

- Background sync every 6 hours
- Automatic embeddings generation
- No public URL (internal service)

---

### 3. RenOS Backend

**URL:** (Local development - not yet deployed)  
**Protocol:** HTTP REST  
**Port:** 3001 (local)

**Purpose:**

- Gmail integration & automation
- Customer management
- Booking system
- Calendar sync
- Multi-agent AI system

**Endpoints:** (Assumed based on structure)
```
GET  /health                    # Health check
POST /api/customers             # Customer CRUD
POST /api/bookings              # Booking CRUD
POST /api/calendar              # Calendar operations
POST /api/emails                # Email operations
GET  /api/leads                 # Lead management
```

**Clients:**

- RenOS Frontend (React app)
- RenOS Calendar MCP (API calls - pending)

**Upstream:**

- Gmail API: <https://gmail.googleapis.com>
- Google Calendar API: <https://www.googleapis.com/calendar>
- Supabase: <https://twaoebtlusudzxshjral.supabase.co>
- OpenAI API
- Google Gemini API
- Tekup-Billy: <https://tekup-billy.onrender.com> (invoice automation)

---

### 4. RenOS Calendar MCP (PENDING DEPLOYMENT)

**URL:** <http://localhost:3001> (local) → Render.com (pending)  
**Protocol:** HTTP REST (MCP protocol)  
**Port:** 3001 (configurable)

**Endpoints:**
```
GET  /health                               # Health check
POST /api/v1/tools                         # List all tools
POST /api/v1/tools/validate_booking_date   # Validate booking date
POST /api/v1/tools/check_booking_conflicts # Check conflicts
POST /api/v1/tools/auto_create_invoice     # Create invoice (disabled)
POST /api/v1/tools/track_overtime_risk     # Track overtime
POST /api/v1/tools/get_customer_memory     # Customer intelligence
GET  /diagnostics/snapshot                 # System diagnostics
```

**Clients (Planned):**

- RenOS Backend (HTTP API)
- Claude Desktop (stdio MCP)
- RenOS Dashboard (React app, port 3006)
- RenOS Chatbot (React app, port 3005)

**Upstream:**

- Google Calendar API (Service Account: <renos-319@renos-465008.iam.gserviceaccount.com>)
- Supabase: <https://twaoebtlusudzxshjral.supabase.co>
- Tekup-Billy: <https://tekup-billy.onrender.com> (disabled for v1)
- Twilio API (disabled for v1)

**Docker Services:**

- mcp-server: Port 3001
- dashboard: Port 3006
- chatbot: Port 3005
- nginx: Ports 80, 443
- redis: Port 6379

---

## SHARED SERVICES

### Supabase PostgreSQL

**URL:** <https://twaoebtlusudzxshjral.supabase.co>  
**Type:** Hosted PostgreSQL + pgvector  
**Region:** (Unknown - likely EU)

**Used By:**

1. **Tekup-Billy** (optional caching)
   - Tables: `billy_cache`, `billy_audit_logs`, `billy_usage_metrics`

2. **TekupVault** (core database)
   - Tables: `vault_documents`, `vault_embeddings`, `vault_sync_status`
   - Extensions: pgvector

3. **RendetaljeOS Backend**
   - Tables: Customer, Booking, Email, Lead, etc. (Prisma schema)

4. **RenOS Calendar MCP** (pending tables)
   - Tables needed: `customer_intelligence`, `overtime_logs`

**Security:**

- Service Role Key (full access)
- Anon Key (row-level security)

---

### Google APIs

#### Google Calendar API

**Used By:**

- RendetaljeOS Backend
- RenOS Calendar MCP

**Service Account:**

- Email: <renos-319@renos-465008.iam.gserviceaccount.com>
- Calendar ID: <c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com>

#### Gmail API

**Used By:**

- RendetaljeOS Backend
- tekup-gmail-automation

**Authentication:**

- Service Account JSON (decent-digit-461308-p8-984aefc14e32.json)

#### Google Photos API

**Used By:**

- tekup-gmail-automation (receipt processing)

---

### Billy.dk API

**URL:** <https://api.billysbilling.com/v2>  
**Access:** Via Tekup-Billy proxy only

**Direct Clients:** None (all go through Tekup-Billy MCP)

**Indirect Clients (via Tekup-Billy):**

- RenOS Calendar MCP (disabled for v1)
- RendetaljeOS Backend (planned)
- Claude.ai users
- ChatGPT users

---

### OpenAI API

**Used By:**

1. **TekupVault** - Embeddings (text-embedding-3-small)
2. **RendetaljeOS Backend** - Chat completions
3. **RenOS Calendar MCP** - LangChain integration (pending)

---

### GitHub API

**URL:** <https://api.github.com>  
**Used By:**

- TekupVault (syncing 14 repositories)

**Indexed Repositories:**

1. TekupDK/Tekup-Billy
2. TekupDK/renos-backend
3. TekupDK/renos-frontend
4. TekupDK/TekupVault
5. TekupDK/tekup-unified-docs
6. TekupDK/tekup-ai-assistant
7. TekupDK/tekup-cloud-dashboard
8. TekupDK/tekup-renos
9. TekupDK/tekup-renos-dashboard
10. TekupDK/Tekup-org
11. TekupDK/Cleaning-og-Service
12. TekupDK/tekup-nexus-dashboard
13. TekupDK/rendetalje-os
14. TekupDK/Jarvis-lite

---

## MCP ECOSYSTEM

### Production MCP Servers

#### 1. Tekup-Billy MCP

**Transport:** Dual (HTTP + Stdio)  
**Tools:** 32  
**Status:** ✅ Production  
**URL:** <https://tekup-billy.onrender.com>

**Tool Categories:**

- Invoice Operations (8 tools)
- Customer Operations (4 tools)
- Product Operations (3 tools)
- Revenue Operations (1 tool)
- Preset Workflows (6 tools)
- Test Operations (10 tools)

#### 2. TekupVault MCP

**Transport:** HTTP  
**Tools:** 6  
**Status:** ✅ Production  
**URL:** <https://tekupvault.onrender.com>

**Tools:**

- search
- fetch
- search_knowledge
- get_sync_status
- list_repositories
- get_repository_info

#### 3. RenOS Calendar MCP

**Transport:** HTTP  
**Tools:** 5  
**Status:** 🟡 Pending Deployment  
**URL:** <http://localhost:3001> (local)

**Tools:**

- validate_booking_date
- check_booking_conflicts
- auto_create_invoice (disabled)
- track_overtime_risk (needs Supabase tables)
- get_customer_memory (needs Supabase tables)

---

## DATA FLOW DIAGRAMS

### Search Query Flow (TekupVault)

```
User Query
    │
    ▼
Claude/ChatGPT/Cursor
    │
    ▼ (MCP protocol)
TekupVault API (/api/search)
    │
    ├── Generate embedding (OpenAI)
    │
    ├── Query pgvector (Supabase)
    │
    └── Return ranked results
        │
        ▼
    User receives relevant docs
```

### Invoice Creation Flow (Tekup-Billy)

```
AI Agent Request
    │
    ▼ (MCP call: create_invoice)
Tekup-Billy HTTP Server
    │
    ├── Validate input (Zod schema)
    │
    ├── Check cache (Redis)
    │
    ├── Create invoice (Billy.dk API)
    │
    ├── Log to Supabase (optional)
    │
    └── Return invoice data
        │
        ▼
    AI Agent confirms creation
```

### Booking Validation Flow (RenOS Calendar MCP)

```
Booking Request
    │
    ▼
RenOS Calendar MCP (/api/v1/tools/validate_booking_date)
    │
    ├── Check day/date consistency
    │
    ├── Query customer intelligence (Supabase)
    │
    ├── Check Google Calendar conflicts
    │
    ├── Run AI validation (LangChain)
    │
    └── Return validation result
        │
        ▼
    RenOS Backend processes booking
```

---

## DEPENDENCY GRAPH

### Tekup-Billy

```
Tekup-Billy
├── Billy.dk API (upstream)
├── Supabase (optional - caching)
├── Redis (optional - scaling)
└── Clients (downstream)
    ├── Claude.ai Web
    ├── ChatGPT
    ├── Claude Desktop
    ├── RenOS Calendar MCP (planned)
    └── RenOS Backend (planned)
```

### TekupVault

```
TekupVault
├── GitHub API (upstream - 14 repos)
├── OpenAI API (upstream - embeddings)
├── Supabase (upstream - database)
└── Clients (downstream)
    ├── Claude Desktop
    ├── ChatGPT
    ├── Cursor AI
    └── All Tekup projects (documentation search)
```

### RenOS Calendar MCP

```
RenOS Calendar MCP
├── Google Calendar API (upstream)
├── Supabase (upstream - customer data)
├── Tekup-Billy (upstream - invoicing, disabled)
├── Twilio (upstream - voice alerts, disabled)
└── Clients (downstream)
    ├── RenOS Backend (planned)
    ├── RenOS Dashboard (React app)
    └── RenOS Chatbot (React app)
```

### RendetaljeOS Backend

```
RendetaljeOS Backend
├── Gmail API (upstream)
├── Google Calendar API (upstream)
├── Supabase (upstream - database)
├── OpenAI API (upstream - chat)
├── Google Gemini API (upstream - chat)
├── Tekup-Billy (upstream - invoicing, planned)
├── RenOS Calendar MCP (upstream - intelligence, planned)
└── Clients (downstream)
    └── RenOS Frontend (React app)
```

---

## DEPLOYMENT ARCHITECTURE

### Render.com Services

```
Render.com
├── tekup-billy (Web Service)
│   ├── Region: Frankfurt (eu-central)
│   ├── Instance: Free tier → Starter ($7/month)
│   ├── Auto-deploy: GitHub main branch
│   └── Docker: ✅ Dockerfile
│
├── tekupvault-api (Web Service)
│   ├── Region: Frankfurt (eu-central)
│   ├── Instance: Starter ($7/month)
│   ├── Auto-deploy: GitHub main branch
│   └── Docker: ✅ render.yaml
│
└── tekupvault-worker (Background Worker)
    ├── Region: Frankfurt (eu-central)
    ├── Instance: Starter ($7/month)
    ├── Schedule: Every 6 hours
    └── Docker: ✅ render.yaml
```

### Supabase Services

```
Supabase (twaoebtlusudzxshjral.supabase.co)
├── PostgreSQL 15
│   ├── Region: (Unknown - likely EU)
│   ├── Plan: Free tier → Pro ($25/month)
│   └── Extensions: pgvector
│
├── Auth
│   ├── JWT tokens
│   └── Row-level security
│
└── Storage
    └── (Not currently used)
```

### Local Development

```
Local (Windows 11)
├── RenOS Calendar MCP
│   ├── Docker Compose (5 services)
│   ├── Ports: 3001, 3005, 3006, 80, 443, 6379
│   └── Status: ✅ Dockerized, pending deployment
│
├── RendetaljeOS Backend
│   ├── Port: 3001
│   └── Status: Development
│
└── RendetaljeOS Frontend
    ├── Port: 5173 (Vite dev)
    └── Status: Development
```

---

## INTEGRATION ISSUES & GAPS

### Missing Integrations

1. **RenOS Backend → Tekup-Billy**: Planned, not implemented
2. **RenOS Backend → RenOS Calendar MCP**: Planned, not implemented
3. **RenOS Calendar MCP → Tekup-Billy**: Disabled for v1 (needs re-enabling)

### Pending Deployments

1. **RenOS Calendar MCP**: Dockerized, ready for Render deployment
2. **RendetaljeOS Backend**: Local only, needs Render deployment
3. **tekup-cloud-dashboard**: Local only, needs Vercel/Netlify deployment

### Missing Database Tables

1. **RenOS Calendar MCP**: Needs `customer_intelligence`, `overtime_logs` in Supabase
2. **Tekup-Billy**: Optional caching tables (not critical)

### Configuration Issues

1. **Port Conflicts**: ✅ RESOLVED (all ports now configurable)
2. **Environment Keys**: Scattered across multiple repos (needs centralization)
3. **API Keys**: Some stored in TekupVault, others in local .env files

---

## SECURITY CONSIDERATIONS

### API Authentication

- **Tekup-Billy**: X-API-Key header (MCP_API_KEY)
- **TekupVault**: X-API-Key header (API_KEY)
- **RenOS Calendar MCP**: No authentication yet (add before deployment)
- **Supabase**: JWT tokens + Row-level security

### Secrets Management

- **Current**: Environment variables in Render/local .env
- **Issue**: No centralized secrets management
- **Recommendation**: Use Render environment groups or Vault

### Rate Limiting

- **Tekup-Billy**: ✅ Express rate limit (100 req/15min)
- **TekupVault**: ✅ Express rate limit (search + webhooks)
- **RenOS Calendar MCP**: ❌ No rate limiting (add before deployment)

---

## PERFORMANCE CONSIDERATIONS

### Bottlenecks

1. **TekupVault Sync**: 6-hour sync interval (could be real-time with webhooks)
2. **Tekup-Billy Redis**: Optional (performance boost when enabled)
3. **RenOS Calendar MCP**: No caching layer (Redis recommended)

### Optimization Opportunities

1. **TekupVault**: Add real-time sync with GitHub webhooks
2. **Tekup-Billy**: Enable Redis for all deployments
3. **RenOS Calendar MCP**: Add Redis caching layer
4. **All Services**: Add CDN for static assets

---

## MONITORING & OBSERVABILITY

### Current State

- **Tekup-Billy**: Winston logging, no external monitoring
- **TekupVault**: Winston logging, no external monitoring
- **RenOS Calendar MCP**: Winston logging, diagnostics endpoint
- **RendetaljeOS**: Pino logging, Sentry integration (configured)

### Recommendations

1. **Add**: Sentry for error tracking (all services)
2. **Add**: Grafana + Prometheus for metrics
3. **Add**: Uptime monitoring (UptimeRobot, Pingdom)
4. **Add**: Log aggregation (Papertrail, Loggly)

---

## SUMMARY

### Integration Health: 7.5/10 (B+)

**Strengths:**

- ✅ 3 production MCP servers (Tekup-Billy, TekupVault, RenOS Calendar MCP pending)
- ✅ Shared Supabase database (cost-effective)
- ✅ Well-defined API endpoints
- ✅ MCP ecosystem integration

**Weaknesses:**

- ⚠️ Missing inter-service integrations (RenOS Backend ↔ Billy/Calendar MCP)
- ⚠️ No centralized secrets management
- ⚠️ No monitoring/observability stack
- ⚠️ Some services local only (pending deployment)

**Immediate Actions:**

1. Deploy RenOS Calendar MCP to Render
2. Create missing Supabase tables
3. Implement RenOS Backend → Billy/Calendar MCP integrations
4. Add rate limiting to RenOS Calendar MCP
5. Set up Sentry for error tracking

---

**Next:** Review Action Items (prioritized)
