# KOMPLET AI REPOS OVERSIGT - Tekup Portfolio
**Dato:** 22. Oktober 2025  
**Omfattning:** ALLE AI-relaterede repositories på tværs af workspace  
**Formål:** Komplet inventar til konsolidering

---

## 📂 WORKSPACE STRUKTUR

```
C:\Users\empir\
├── 🟢 AI PRIMÆRE REPOS (Produktion)
│   ├── tekup-chat                  # ChatGPT-style interface + TekupVault RAG
│   ├── tekup-ai-assistant         # MCP hub + dokumentation
│   ├── Tekup Google AI            # RenOS AI backend (superseded)
│   ├── RendetaljeOS               # Monorepo (AI + full system)
│   └── TekupVault                 # AI-powered semantic search + embeddings
│
├── 🔵 AI INTEGRERET REPOS
│   ├── renos-calendar-mcp         # RenOS Calendar AI (5 tools)
│   ├── Tekup-org                  # Monorepo med AI apps
│   ├── Tekup-Cloud                # Legacy (renos-calendar parent folder)
│   └── tekup-gmail-services       # Gmail AI services
│
├── ⚫ AI SUPPORT REPOS
│   ├── Agent-Orchestrator         # Multi-agent monitoring
│   └── tekup-cloud-dashboard      # Dashboards (mulig AI integration)
│
└── 📁 ANDRE REPOS (non-AI primært)
    ├── Tekup-Billy                # Accounting API (AI-ready)
    ├── tekup-gmail-automation     # Gmail forwarding (Python)
    ├── supabase-migration         # Database management
    ├── reports-archive            # Audit reports
    └── tekup-database             # Database utils
```

---

## 🟢 AI PRIMÆRE REPOS - Detaljeret Analyse

### 1. **tekup-chat** 🚀 PRODUKTION
**Location:** `C:\Users\empir\tekup-chat`

#### Tech Stack:
- Next.js 15 + React 18 + TypeScript
- OpenAI GPT-4o (streaming API)
- TekupVault RAG integration
- PostgreSQL + pgvector (semantic search)
- Server-Sent Events (SSE)

#### AI Features:
✅ **LLM Integration:**
- OpenAI GPT-4o streaming responses
- Context-aware conversations med TekupVault RAG
- Semantic search across 1,063 dokumenter fra 8 repos
- Token usage tracking

✅ **Voice AI:**
- Dansk voice input support
- Speech-to-text integration

✅ **RAG System:**
- Real-time semantic search via TekupVault API
- Query: `POST https://tekupvault-api.onrender.com/api/search`
- Embeddings: OpenAI text-embedding-3-small (1536 dims)
- Vector similarity: pgvector cosine distance

#### Deployment:
- **Local:** `http://localhost:3000`
- **API:** Next.js API Routes (`/api/chat`, `/api/search`)
- **Database:** Supabase PostgreSQL
- **Storage:** localStorage for sessions

#### File Structure:
```
tekup-chat/
├── app/
│   ├── page.tsx              # Main chat interface
│   └── api/
│       └── chat/route.ts     # OpenAI streaming endpoint
├── src/
│   ├── components/Chat/      # React components
│   ├── hooks/                # useChat, useVoice
│   ├── services/             # OpenAI, TekupVault clients
│   └── utils/                # Markdown, syntax highlighting
├── supabase/migrations/      # Database schema
└── tests/                    # Test suite
```

#### Dependencies (AI-specific):
```json
{
  "openai": "^4.73.0",
  "@supabase/supabase-js": "^2.46.1",
  "ai": "^3.4.33",
  "react-markdown": "^9.0.1",
  "react-syntax-highlighter": "^15.6.1"
}
```

---

### 2. **tekup-ai-assistant** 📚 MCP HUB + DOCS
**Location:** `C:\Users\empir\tekup-ai-assistant`

#### Tech Stack:
- Python 3.8+ (MCP servers)
- TypeScript + Node.js (MCP clients)
- Model Context Protocol (MCP) - Anthropic standard
- Jan AI, Claude Desktop, Cursor integrations

#### AI Features:
✅ **MCP Servers (Running):**
1. **Billy MCP** (Port 3001) - Billy.dk invoicing automation
   - Production: `https://tekup-billy.onrender.com`
   - Tools: invoicing, customers, products
   
2. **RenOS MCP** (Port 3002) - Calendar + booking AI
   - Tools: booking validation, conflict checking, overtime tracking
   
3. **System MCP** (Port 3003) - Performance monitoring
   - Tools: CPU, memory, disk usage tracking
   
4. **TekupVault MCP** (Port 3004) - Chat history archival
   - Tools: archive, search, retrieve conversations

✅ **Local AI Integration:**
- Ollama setup guides (Llama 3.1, Mistral)
- Jan AI configuration
- Claude Desktop integration

✅ **Web Scraping MCP:**
- Python MCP server: `scripts/mcp_web_scraper.py`
- Tools: fetch_url, extract_content, parse_html

#### File Structure:
```
tekup-ai-assistant/
├── docs/
│   ├── ARCHITECTURE.md          # MCP architecture overview
│   ├── MCP_WEB_SCRAPER_GUIDE.md # Web scraper setup
│   ├── SETUP.md                 # AI assistant setup
│   └── TESTING_GUIDE.md         # Integration testing
├── configs/
│   ├── claude-desktop/          # Claude Desktop config
│   ├── jan-ai/                  # Jan AI config
│   └── cursor/                  # Cursor MCP config
├── mcp-clients/
│   └── billy/                   # Billy MCP client (TypeScript)
│       ├── src/billymcp.ts      # Production-ready
│       └── tests/               # Integration tests
├── scripts/
│   ├── mcp_web_scraper.py       # Python MCP server ✅
│   └── test_tekupvault.py       # TekupVault test ✅
└── examples/                    # Usage examples
```

#### Dependencies (AI-specific):
```toml
# Python (MCP servers)
mcp = "^1.1.2"
beautifulsoup4 = "^4.12.3"
requests = "^2.32.3"
```

```json
// TypeScript (MCP clients)
{
  "@modelcontextprotocol/sdk": "^1.0.4",
  "axios": "^1.7.7"
}
```

---

### 3. **Tekup Google AI** 🔄 LEGACY (SUPERSEDED)
**Location:** `C:\Users\empir\Tekup Google AI`

**Status:** ⚠️ SUPERSEDED af RendetaljeOS monorepo (men stadig functional)

#### Tech Stack:
- TypeScript + Node.js + Express
- Google Gemini 2.0 Flash (primær)
- OpenAI GPT-4o-mini (backup)
- Ollama (lokal fallback)
- Prisma + PostgreSQL

#### AI Features:
✅ **Multi-LLM Support:**
- Gemini 2.0 Flash Thinking (primær)
- OpenAI GPT-4o-mini (backup)
- Ollama Llama 3.1:8b (lokal)
- Heuristic fallback (rule-based)

✅ **AI Agent System:**
```typescript
Intent → Plan → Execute
│        │       │
│        │       └─ planExecutor.ts (Tool Registry eller handlers)
│        └─ taskPlanner.ts (Gemini-generated plan)
└─ intentClassifier.ts (Regex + optional LLM)
```

**Intent types:**
- `email.lead`, `email.compose`, `email.followup`
- `calendar.booking`, `calendar.reschedule`
- `analytics.overview`, `analytics.export`

✅ **LLM Provider Abstraction:**
```typescript
interface LLMProvider {
  completeChat(messages, options): Promise<string>
  completeChatStream(messages, options): AsyncGenerator<string>
  completeChatJSON<T>(messages, options): Promise<T>
  completeChatWithFunctions<T>(messages, functions, options): Promise<{name, args}>
}
```

**Implementations:**
- `GeminiProvider` - Native function calling (99%+ accuracy)
- `OpenAiProvider` - Standard OpenAI API
- `OllamaProvider` - Local models via Ollama

✅ **Google AI Best Practices:**
- Context caching (saves 50-80% tokens)
- Function calling (vs JSON parsing)
- Streaming for better UX
- JSON mode (responseMimeType="application/json")

#### File Structure:
```
Tekup Google AI/
├── src/
│   ├── agents/                  # AI Agent system
│   │   ├── intentClassifier.ts  # Intent detection
│   │   ├── taskPlanner.ts       # Gemini task planning
│   │   ├── planExecutor.ts      # Tool execution
│   │   └── handlers/            # Legacy handlers
│   │       ├── email.compose.ts
│   │       ├── email.followup.ts
│   │       └── calendar.book.ts
│   ├── llm/                     # LLM providers
│   │   ├── llmProvider.ts       # Interface
│   │   ├── geminiProvider.ts    # Google Gemini ✅
│   │   ├── openaiProvider.ts    # OpenAI GPT ✅
│   │   └── ollamaProvider.ts    # Ollama local ✅
│   ├── services/                # Google Workspace
│   │   ├── gmailService.ts      # Gmail API
│   │   └── calendarService.ts   # Calendar API
│   ├── tools/                   # Tool Registry (ADK-style)
│   │   ├── registry.ts          # Central registry
│   │   └── toolsets/
│   │       ├── CalendarToolset.ts
│   │       └── LeadToolset.ts
│   └── config.ts                # Multi-LLM config
├── docs/
│   ├── LLM_PROVIDER_COMPARISON.md  # Provider comparison
│   ├── CALENDAR_BOOKING.md         # Booking flows
│   └── EMAIL_AUTO_RESPONSE.md      # AI reply generation
└── tests/
    ├── intentClassifier.test.ts
    ├── taskPlanner.test.ts
    └── planExecutor.test.ts
```

#### Environment Variables:
```bash
# LLM Provider Selection
LLM_PROVIDER=gemini  # openai | gemini | ollama | heuristic

# Google Gemini
GEMINI_KEY=AIzaSyCIrKq05UNN62NTcaTBWRgN2yj1YvHwu6I
GEMINI_MODEL=gemini-2.0-flash-exp

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=800

# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Safety Rails
RUN_MODE=dry-run           # dry-run | live
AUTO_RESPONSE_ENABLED=false
FOLLOW_UP_ENABLED=false
ESCALATION_ENABLED=true
```

#### Dependencies (AI-specific):
```json
{
  "@google/generative-ai": "^0.21.0",
  "openai": "^4.73.0",
  "ollama": "^0.5.11"
}
```

#### Migration Notes:
🔄 **Superseded by RendetaljeOS** - All features moved to monorepo, but this repo still functional for reference/testing.

---

### 4. **RendetaljeOS** 🏢 MONOREPO (FULL SYSTEM)
**Location:** `C:\Users\empir\RendetaljeOS`

**Status:** 🟢 PRODUKTION - Komplet monorepo med AI + full system

#### Tech Stack:
- **Monorepo:** pnpm workspaces + Turborepo
- **Backend:** Node.js + Express + Prisma + Supabase
- **Frontend:** React 19 + Vite + Radix UI + Tailwind CSS
- **AI:** Gemini 2.0 Flash (primær), OpenAI GPT-4o (backup)

#### AI Features:
✅ **Gmail AI Automation:**
- Auto-response generation (AI-powered)
- Email classification og prioritering
- Follow-up automation
- Lead extraction fra emails

✅ **Calendar AI:**
- Smart booking validation
- Conflict detection
- Overtime tracking
- Automatic invoice generation

✅ **Customer Intelligence:**
- Customer memory (previous bookings, preferences)
- Sentiment analysis i emails
- Automatic lead scoring

✅ **Multi-Agent System:**
```typescript
Frontend Agents:
├── LeadAgent          # Lead extraction + CRM sync
├── BookingAgent       # Calendar booking validation
├── EmailAgent         # AI response generation
└── AnalyticsAgent     # KPI tracking + insights

Backend AI Services:
├── intentClassifier   # Email intent detection
├── taskPlanner        # Gemini task planning
├── planExecutor       # Tool execution
└── llmProviders       # Multi-LLM abstraction
```

#### File Structure:
```
RendetaljeOS/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── agents/        # AI agent system ✅
│   │   │   ├── llm/           # LLM providers ✅
│   │   │   ├── services/      # Gmail, Calendar APIs
│   │   │   └── tools/         # Tool Registry
│   │   └── prisma/            # Database schema
│   └── frontend/
│       ├── src/
│       │   ├── agents/        # Frontend AI agents ✅
│       │   ├── components/    # React components
│       │   └── hooks/         # AI hooks (useAI, useAgent)
│       └── vite.config.ts
├── packages/
│   └── shared-types/          # Shared TypeScript types
└── turbo.json                 # Turborepo config
```

#### AI Dependencies:
```json
// Backend
{
  "@google/generative-ai": "^0.21.0",
  "openai": "^4.73.0",
  "@prisma/client": "^5.22.0"
}

// Frontend
{
  "ai": "^3.4.33",
  "@radix-ui/react-*": "^1.1.2"
}
```

#### Environment Variables:
```bash
# AI/LLM
LLM_PROVIDER=gemini
GEMINI_KEY=AIzaSyCIrKq05UNN62NTcaTBWRgN2yj1YvHwu6I
OPENAI_API_KEY=sk-proj-...

# Google Workspace
GOOGLE_PROJECT_ID=...
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY=...

# Supabase
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

#### Quick Start:
```bash
cd RendetaljeOS
pnpm install  # 965 packages
pnpm dev      # Start frontend + backend

# URLs:
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
```

---

### 5. **TekupVault** 🗂️ SEMANTIC SEARCH + RAG
**Location:** `C:\Users\empir\TekupVault`

**Status:** 🟢 PRODUKTION LIVE - `https://tekupvault-api.onrender.com`

#### Tech Stack:
- **Monorepo:** Turborepo + pnpm workspaces
- **Backend:** Express + Helmet + CORS
- **AI:** OpenAI text-embedding-3-small (1536 dims)
- **Vector DB:** PostgreSQL 15 + pgvector 0.5+
- **Database:** Supabase (managed PostgreSQL)

#### AI Features:
✅ **Semantic Search:**
- OpenAI embeddings generation
- pgvector cosine similarity search
- IVFFlat index (lists=100, optimized for <100k docs)
- Threshold-based filtering (default: 0.7)

✅ **GitHub Sync Worker:**
- Automatic repo syncing every 6 hours
- 14 Tekup repos indexed (4 core + 2 docs + 8 dev)
- Filters: dokumentation, kode, markdown
- Binary file exclusion (png, jpg, pdf, zip, etc.)

✅ **RAG Pipeline:**
```
1. Content ingested → truncate to 8000 chars
2. OpenAI generates 1536-dim vector
3. Store in vault_embeddings table
4. Search via match_documents() PostgreSQL function
5. Return top-N results with similarity scores
```

#### API Endpoints:
```bash
# Semantic Search
POST https://tekupvault-api.onrender.com/api/search
{
  "query": "string",
  "limit": 10,
  "threshold": 0.7
}

# Health Check
GET https://tekupvault-api.onrender.com/health

# Repository Info
GET https://tekupvault-api.onrender.com/api/repositories

# Sync Status
GET https://tekupvault-api.onrender.com/api/sync-status
```

#### Database Schema:
```sql
-- Documents
CREATE TABLE vault_documents (
  id UUID PRIMARY KEY,
  source TEXT NOT NULL,
  repository TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT,
  metadata JSONB,
  sha TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, repository, path)
);

-- Embeddings (pgvector)
CREATE TABLE vault_embeddings (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES vault_documents(id),
  embedding VECTOR(1536) NOT NULL
);

-- IVFFlat Index
CREATE INDEX vault_embeddings_idx 
  ON vault_embeddings 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Sync Status
CREATE TABLE vault_sync_status (
  source TEXT NOT NULL,
  repository TEXT NOT NULL,
  status TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  PRIMARY KEY(source, repository)
);

-- Search Function
CREATE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
) RETURNS TABLE (
  id UUID,
  repository TEXT,
  path TEXT,
  content TEXT,
  similarity FLOAT
);
```

#### File Structure:
```
TekupVault/
├── apps/
│   ├── vault-api/              # REST API + webhooks
│   │   ├── src/
│   │   │   ├── routes/         # Express routes
│   │   │   ├── services/       # Business logic
│   │   │   └── middleware/     # Auth, logging
│   │   └── Dockerfile
│   └── vault-worker/           # Background sync worker
│       ├── src/
│       │   └── jobs/
│       │       └── sync-github.ts  # GitHub syncing ✅
│       └── Dockerfile
├── packages/
│   ├── vault-core/             # Shared types + config
│   │   └── src/
│   │       ├── types.ts        # TypeScript interfaces
│   │       └── config.ts       # Zod validation
│   ├── vault-ingest/           # Source connectors
│   │   └── src/
│   │       └── github.ts       # GitHub Octokit client
│   └── vault-search/           # Semantic search
│       └── src/
│           ├── embeddings.ts   # OpenAI embeddings
│           └── search.ts       # pgvector search
├── supabase/
│   └── migrations/             # PostgreSQL + pgvector schema
└── docker-compose.yml          # Local dev (PostgreSQL + pgvector)
```

#### Dependencies (AI-specific):
```json
{
  "openai": "^4.73.0",
  "@supabase/supabase-js": "^2.46.1",
  "pgvector": "^0.5.0",
  "@octokit/rest": "^21.0.2"
}
```

#### Environment Variables:
```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Supabase
DATABASE_URL=postgresql://postgres:...@db.*.supabase.co:5432/postgres
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

# GitHub
GITHUB_TOKEN=ghp_...
GITHUB_WEBHOOK_SECRET=...

# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

#### Production Deployment:
- **Platform:** Render.com (Frankfurt region)
- **Services:**
  - `vault-api` (Web Service, port 3000)
  - `vault-worker` (Background Worker, 6-hour cron)
- **Database:** Supabase managed PostgreSQL
- **Monitoring:** Pino structured logging

#### Integration Examples:
```typescript
// tekup-chat integration
import { searchTekupVault } from '@/services/tekupvault';

const results = await searchTekupVault({
  query: userQuestion,
  limit: 5,
  threshold: 0.75
});

const context = results.map(r => r.content).join('\n\n');
const prompt = `Context from docs:\n${context}\n\nQuestion: ${userQuestion}`;

const aiResponse = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt }]
});
```

---

### 🔵 AI INTEGRERET REPOS

### 6. **renos-calendar-mcp** 🗓️ CALENDAR AI INTELLIGENCE
**Location:** `C:\Users\empir\Tekup-Cloud\renos-calendar-mcp`

**Status:** 🚧 MVP DEVELOPMENT (v0.1.0) - Production deployment planned

#### Tech Stack:
- **MCP Server:** TypeScript + Node.js 18+
- **AI/LLM:** LangChain + OpenAI integration
- **Integrations:** Google Calendar API, Billy.dk MCP, Supabase, Twilio
- **Deployment:** Docker + docker-compose, nginx reverse proxy

#### AI Features:
✅ **5 Intelligent Calendar Tools:**

1. **Booking Date Validator** (`validate_booking_date`)
   - AI-powered date/weekday match verification
   - Stops "28. oktober er mandag" errors (it's Tuesday!)
   - Customer pattern learning (e.g., "Jes = kun mandage")
   - Weekend booking policy enforcement
   - Confidence scoring with fail-safe mode (<80% → manual review)

2. **Conflict Checker** (`check_booking_conflicts`)
   - Real-time double-booking detection
   - 100% Google Calendar sync
   - Overlap detection with existing bookings
   - Proactive conflict prevention

3. **Invoice Automation** (`auto_invoice_workflow`)
   - Automatic Billy.dk invoice generation
   - Daily scanning for missing invoices
   - Eliminates 15+ missing invoices per month
   - Billy.dk MCP integration

4. **Overtime Tracker** (`track_overtime`)
   - Live overtime monitoring (e.g., Vinni: 9h vs 6h)
   - Twilio voice alerts after +1 hour overtime
   - Weekly overtime reports
   - Real-time notifications

5. **Customer Memory Bank** (`get_customer_intelligence`)
   - Intelligent customer preference learning
   - Fixed schedule patterns (e.g., "Jes = only Mondays")
   - Historical booking analysis
   - Auto-suggestion based on past behavior

✅ **AI-Powered Intelligence:**
- Pattern learning from 1000+ emails and bookings
- Proactive validation preventing 15 problem categories
- Confidence scoring for all decisions
- Fail-safe mode for low-confidence scenarios
- Undo function (5-minute window)

✅ **Mobile PWA Dashboard:**
- Today's bookings overview
- Missing invoice alerts
- Quick action buttons
- Customer satisfaction tracking

#### File Structure:
```
renos-calendar-mcp/
├── src/
│   ├── tools/                      # 5 AI tools
│   │   ├── booking-validator.ts    # Date validation + conflict checking ✅
│   │   ├── customer-memory.ts      # Customer intelligence ✅
│   │   ├── invoice-automation.ts   # Billy.dk integration ✅
│   │   ├── overtime-tracker.ts     # Overtime monitoring ✅
│   │   └── shortwave-analyzer.ts   # Email pattern analysis ✅
│   ├── validators/
│   │   ├── date-validator.ts       # Date/weekday logic
│   │   └── fail-safe.ts            # Confidence scoring
│   ├── integrations/
│   │   ├── google-calendar.ts      # Google Calendar API
│   │   ├── supabase.ts             # Customer intelligence DB
│   │   └── billy-mcp.ts            # Billy.dk MCP client
│   ├── index.ts                    # MCP stdio server
│   └── http-server.ts              # HTTP REST server
├── chatbot/                        # AI chatbot interface
├── dashboard/                      # PWA dashboard
├── tests/
│   ├── integration/                # Integration tests
│   └── unit/                       # Unit tests
├── docker-compose.yml              # Docker orchestration
├── Dockerfile                      # Production container
└── render.yaml                     # Render.com deployment
```

#### Dependencies (AI-specific):
```json
{
  "@langchain/openai": "^1.0.0",
  "@modelcontextprotocol/sdk": "^1.20.0",
  "@supabase/supabase-js": "^2.75.0",
  "axios": "^1.6.0",
  "date-fns": "^3.0.0",
  "date-fns-tz": "^3.0.0",
  "openai": "^4.73.0",
  "twilio": "^5.0.0"
}
```

#### Environment Variables:
```bash
# Google Calendar
GOOGLE_CALENDAR_ID=...
GOOGLE_CREDENTIALS=...

# Supabase (Customer Intelligence DB)
SUPABASE_URL=https://...supabase.co
SUPABASE_KEY=...

# Billy.dk MCP
BILLY_MCP_URL=https://tekup-billy.onrender.com
BILLY_API_KEY=...

# Twilio (Voice Alerts)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# AI/LLM
OPENAI_API_KEY=sk-proj-...
LLM_MODEL=gpt-4o-mini
```

#### Quick Start:
```bash
cd Tekup-Cloud/renos-calendar-mcp
npm install
npm run build

# Development mode
npm run dev          # MCP stdio server
npm run dev:http     # HTTP REST server

# Docker deployment
npm run docker:up    # Starts all services
```

#### MCP Tools API:
```typescript
// Tool 1: Validate Booking Date
{
  name: "validate_booking_date",
  arguments: {
    date: "2025-10-28",
    expectedDayName: "mandag",  // AI catches: "NEJ, det er tirsdag!"
    customerId: "customer_123"
  }
}

// Tool 2: Check Conflicts
{
  name: "check_booking_conflicts",
  arguments: {
    date: "2025-10-28",
    startTime: "09:00",
    endTime: "12:00",
    customerId: "customer_123"
  }
}

// Tool 3: Auto Invoice
{
  name: "auto_invoice_workflow",
  arguments: {
    bookingId: "booking_456",
    customerId: "customer_123"
  }
}

// Tool 4: Track Overtime
{
  name: "track_overtime",
  arguments: {
    employeeId: "vinni",
    date: "2025-10-28"
  }
}

// Tool 5: Customer Memory
{
  name: "get_customer_intelligence",
  arguments: {
    customerId: "customer_123"
  }
}
```

#### Problem Categories Prevented:
1. ✅ Date/weekday mismatch errors (30+ cases)
2. ✅ Double-booking conflicts
3. ✅ Missing invoice generation (15+ per month)
4. ✅ Overtime tracking failures
5. ✅ Repeated customer preference violations
6. ✅ Weekend booking policy violations
7. ✅ Historical pattern deviations
8. ✅ Low-confidence decisions (<80%)

#### AI Learning System:
```typescript
// Customer Intelligence Schema
interface CustomerIntelligence {
  customerId: string;
  customerName: string;
  fixedSchedule?: {
    dayOfWeek: number;      // 0-6 (Sunday-Saturday)
    confidence: number;      // 0.0-1.0
    lastUpdated: Date;
  };
  preferences: {
    preferredDays: number[];
    avoidWeekends: boolean;
    preferredTimes: string[];
  };
  bookingHistory: {
    totalBookings: number;
    cancelationRate: number;
    averageDuration: number;
  };
  learningMetadata: {
    patternConfidence: number;
    lastLearned: Date;
    sampleSize: number;
  };
}
```

---

### 7. **Tekup-org** 🏢 MONOREPO (30+ apps)
**Location:** `C:\Users\empir\Tekup-org`

**Status:** 🟢 AKTIV - Multi-tenant SaaS monorepo

#### Tech Stack:
- **Monorepo:** pnpm workspaces + Turborepo
- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** Next.js 15 + React 18 + Tailwind CSS
- **AI:** Jarvis consciousness system

#### AI Apps/Packages:
```
Tekup-org/
├── apps/
│   ├── inbox-ai/                   # AI email processing ✅
│   │   └── src/ai/llm/            # LLM integrations
│   ├── ai-proposal-engine/         # AI proposal generation ✅
│   │   └── src/services/ai/
│   ├── agentrooms-backend/         # Multi-agent rooms ✅
│   │   └── providers/
│   │       ├── openai.ts          # OpenAI provider
│   │       ├── gemini.ts          # Gemini provider
│   │       └── anthropic.ts       # Claude provider
│   └── tekup-unified-platform/     # Unified platform
│       └── src/modules/core/services/
│           └── ai.service.ts       # AI service (OpenAI, Gemini)
├── packages/
│   ├── documentation-ai/           # AI documentation gen ✅
│   │   └── src/documentation-ai.ts
│   ├── voice-agent/                # Jarvis voice agent ✅
│   │   └── src/
│   │       ├── services/ai/
│   │       └── voice-processing/
│   └── @tekup/shared/              # Shared AI utilities
│       └── src/ai/
└── .agents/                        # Agent definitions
    └── types/agent-definition.ts   # Model types (100+ models)
```

#### Jarvis AI Integration:
```typescript
// Feature flag system
JARVIS_ENABLED=true
NEXT_PUBLIC_VOICE_AGENT_JARVIS_MODE=mock|real|off

// Development modes
pnpm --filter @tekup/voice-agent dev:jarvis:mock
pnpm --filter flow-api dev:jarvis
```

#### AI Services:
1. **inbox-ai** - Email AI processing
2. **ai-proposal-engine** - AI-generated proposals
3. **agentrooms-backend** - Multi-agent coordination
4. **documentation-ai** - Auto-documentation generation
5. **voice-agent** - Jarvis voice assistant

#### AI Models Supported:
```typescript
// .agents/types/agent-definition.ts
type ModelName =
  | 'openai/gpt-4o'
  | 'openai/gpt-4o-mini'
  | 'openai/o1-preview'
  | 'google/gemini-2.5-flash-lite'
  | 'anthropic/claude-3.5-sonnet'
  | 'x-ai/grok-4-07-09'
  | 'qwen/qwen3-coder'
  | 'deepseek/deepseek-chat-v3-0324'
  // ... 100+ models
```

---

### 7. **Tekup-Cloud** ☁️ RENOS CALENDAR MCP
**Location:** `C:\Users\empir\Tekup-Cloud`

**Status:** 🟢 AKTIV - RenOS Calendar AI tools

#### AI Features:
✅ **RenOS Calendar MCP Server:**
```
Tekup-Cloud/renos-calendar-mcp/
├── src/
│   └── tools/                     # 5 AI tools
│       ├── booking-validation.ts  # AI booking validation ✅
│       ├── conflict-checking.ts   # Smart conflict detection ✅
│       ├── overtime-tracking.ts   # Overtime analysis ✅
│       ├── customer-memory.ts     # Customer preferences ✅
│       └── auto-invoice.ts        # Auto invoice generation ✅
└── docker-compose.yml             # Dockerized deployment
```

**MCP Tools:**
1. `validate_booking` - AI-powered booking validation
2. `check_conflicts` - Intelligent scheduling conflict detection
3. `track_overtime` - Overtime tracking + alerts
4. `remember_customer` - Customer memory + preferences
5. `generate_invoice` - Automatic invoice generation

#### Quick Start:
```bash
cd Tekup-Cloud/renos-calendar-mcp
npm install
npm run docker:up
```

---

### 8. **tekup-gmail-services** 📧 GMAIL AI
**Location:** `C:\Users\empir\tekup-gmail-services`

**Status:** 🟢 KONSOLIDERET (22. Oktober 2025)

#### AI Features:
✅ **Gmail AI Services:**
```
tekup-gmail-services/
├── apps/
│   ├── gmail-automation/          # Python Gmail forwarding
│   ├── gmail-mcp-server/         # Node.js MCP server
│   └── renos-gmail-services/     # AI email services ✅
│       ├── emailAutoResponseService.ts
│       ├── intentClassifier.ts
│       └── llm/                   # LLM providers
└── shared/                        # Shared types + utils
```

**AI Services:**
- Email intent classification
- AI auto-response generation
- LLM integration (OpenAI, Gemini)
- Email sentiment analysis

---

## ⚫ AI SUPPORT REPOS

### 9. **Agent-Orchestrator** 🤖 MULTI-AGENT MONITORING
**Location:** `C:\Users\empir\Agent-Orchestrator`

**Status:** 🟢 AKTIV - Real-time agent monitoring

#### Tech Stack:
- Electron + React + TypeScript
- File-based communication (agent-messages.json, agent-config.json)
- Chokidar file watcher

#### Features:
✅ **Agent Dashboard:**
- Real-time agent status monitoring
- Message flow visualization
- Priority/type filtering
- Status indicators (working, idle, blocked, offline)

✅ **Agent Communication:**
- 18+ message types (api_request, help_request, etc.)
- Priority levels (critical, high, normal, low)
- Status tracking (pending, in_progress, completed, failed)

#### File Structure:
```
Agent-Orchestrator/
├── src/
│   ├── components/
│   │   ├── AgentDashboard/      # Agent status cards
│   │   └── MessageFlow/         # Message queue
│   ├── hooks/
│   │   ├── useAgentMessages.ts  # IPC messaging
│   │   └── useAgentStatus.ts    # Status updates
│   └── types/
│       ├── agent.types.ts       # Agent definitions
│       └── message.types.ts     # Message types
└── electron/
    ├── main/                     # File watcher
    └── preload/                  # IPC bridge
```

---

## 📊 KONSOLIDERINGSANBEFALING

### ✅ KORT SIGT (Allerede gjort):
1. ✅ **Gmail konsolidering** → `tekup-gmail-services` (22. Okt 2025)
   - Konsolideret: tekup-gmail-automation, Gmail-PDF-Auto, Gmail-PDF-Forwarder
   - Resultat: 1 unified repo med 3 apps

### 🎯 NÆSTE SKRIDT:

#### Option A: AI Services Monorepo (Anbefalet)
**Navn:** `tekup-ai-services`

```
tekup-ai-services/
├── apps/
│   ├── ai-chat/                   ← Fra tekup-chat
│   ├── ai-assistant-server/       ← Fra tekup-ai-assistant (MCP servers)
│   ├── ai-vault/                  ← Fra TekupVault
│   └── ai-agents/                 ← Fra Tekup Google AI (agent system)
├── packages/
│   ├── ai-llm/                    # Fælles LLM providers
│   │   ├── openai/
│   │   ├── gemini/
│   │   └── ollama/
│   ├── ai-mcp/                    # MCP client + server utilities
│   ├── ai-rag/                    # RAG utilities (embeddings, search)
│   └── ai-agents/                 # Agent framework (Intent → Plan → Execute)
└── docs/
```

**Fordele:**
- ✅ Fælles LLM abstraction across ALL AI services
- ✅ Unified MCP server deployment
- ✅ Shared RAG infrastructure
- ✅ Single source of truth for AI configs

**Ulemper:**
- ⚠️ TekupVault er allerede produktion-deployed
- ⚠️ tekup-chat er standalone app (muligvis skal forblive separat)

#### Option B: Behold Eksisterende Struktur (Federated)
**Ingen konsolidering**, men standardiser:
- ✅ Fælles `@tekup/ai-llm` package (LLM providers)
- ✅ Fælles `@tekup/ai-mcp` package (MCP utilities)
- ✅ Fælles `@tekup/ai-rag` package (RAG utilities)
- ✅ Cross-repo documentation i `tekup-ai-assistant`

**Fordele:**
- ✅ Ingen migration risk
- ✅ Services forbliver uafhængige
- ✅ TekupVault/tekup-chat kan udvikles separat

**Ulemper:**
- ⚠️ Overlap i LLM provider implementations
- ⚠️ Fragmenteret MCP server deployment

---

## 📈 OVERLAP MATRIX

| Feature | tekup-chat | tekup-ai-assistant | Tekup Google AI | RendetaljeOS | TekupVault | renos-calendar-mcp |
|---------|------------|--------------------|--------------------|--------------|------------|-------------------|
| **OpenAI Integration** | ✅ GPT-4o | ❌ | ✅ GPT-4o-mini | ✅ GPT-4o | ✅ Embeddings | ✅ LangChain |
| **Gemini Integration** | ❌ | ❌ | ✅ 2.0 Flash | ✅ 2.0 Flash | ❌ | ❌ |
| **Ollama Integration** | ❌ | ✅ Docs | ✅ Full | ❌ | ❌ | ❌ |
| **MCP Servers** | ❌ | ✅ 4 servers | ❌ | ❌ | ✅ Planned | ✅ 5 tools |
| **RAG/Semantic Search** | ✅ Client | ❌ | ❌ | ❌ | ✅ Full | ❌ |
| **Agent System** | ❌ | ❌ | ✅ Intent→Plan→Execute | ✅ Multi-agent | ❌ | ✅ Intelligence |
| **Gmail Integration** | ❌ | ❌ | ✅ Gmail API | ✅ Gmail API | ❌ | ❌ |
| **Calendar Integration** | ❌ | ❌ | ✅ Calendar API | ✅ Calendar API | ❌ | ✅ Google Cal |
| **Voice AI** | ✅ Voice input | ❌ | ❌ | ❌ | ❌ | ✅ Twilio |
| **Production Deployed** | ✅ Local | ❌ | ⚠️ Superseded | ✅ Yes | ✅ Render.com | 🚧 MVP |

### Overlap %:
- **OpenAI:** 83% (5/6 repos)
- **Gemini:** 33% (2/6 repos)
- **MCP:** 50% (3/6 repos)
- **RAG:** 33% (2/6 repos)
- **Agent Systems:** 50% (3/6 repos)
- **Calendar AI:** 50% (3/6 repos)

---

## 🎯 BESLUTNINGSMATRIX

### Konsolider AI repos HVIS:
- ✅ I vil centralisere LLM provider maintenance
- ✅ I vil unified MCP server deployment
- ✅ I vil shared RAG infrastructure
- ✅ I vil single AI configuration source
- ✅ Team kan håndtere migration (2-3 uger)

### Behold Federated HVIS:
- ✅ TekupVault/tekup-chat skal forblive standalone
- ✅ Services skal udvikles uafhængigt
- ✅ Migration risk er for høj lige nu
- ✅ Foretrækker graduel standardisering via shared packages

---

## 🚀 NÆSTE SKRIDT

1. **Review denne analyse** med team
2. **Beslut konsoliderings-strategi:**
   - Option A: AI Services Monorepo
   - Option B: Federated med shared packages
3. **Hvis Option A:**
   - Lav `TEKUP_AI_SERVICES_MIGRATION_PLAN.md`
   - 14-day implementation roadmap
   - Docker + production deployment plan
4. **Hvis Option B:**
   - Opret `@tekup/ai-llm` package (LLM providers)
   - Opret `@tekup/ai-mcp` package (MCP utilities)
   - Opret `@tekup/ai-rag` package (RAG utilities)
   - Refactor repos til at bruge shared packages

---

**Spørgsmål til team:**
1. Skal TekupVault forblive standalone? (produktion deployed)
2. Skal tekup-chat forblive standalone? (user-facing app)
3. Er I okay med at migrere Tekup Google AI → RendetaljeOS? (allerede superseded)
4. Foretrækker I monorepo eller federated architecture?

---

**Dokumenteret af:** GitHub Copilot  
**Dato:** 22. Oktober 2025  
**Status:** ✅ KOMPLET INVENTAR
