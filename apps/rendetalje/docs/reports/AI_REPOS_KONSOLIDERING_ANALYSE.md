# AI Repositories Konsolideringsanalyse
**Dato:** 22. Oktober 2025  
**Scope:** AI-relaterede repositories på tværs af Tekup Portfolio  
**Formål:** Identificere overlap og anbefale konsolidering af AI-funktionalitet

---

## 📊 REPOSITORIES UNDER ANALYSE

### 1. **tekup-chat** ✅ PRODUKTION
- **Path:** `C:\Users\empir\tekup-chat`
- **Status:** 🟢 PRODUKTION KLAR
- **Git:** ✅ Git repository
- **Version:** 1.1.0
- **Tech Stack:** Next.js 15, React 18, TypeScript

#### Funktionalitet:
**Core Features:**
- ✅ ChatGPT-lignende UI (streaming responses)
- ✅ TekupVault integration (1,063 dokumenter, 8 repos)
- ✅ OpenAI GPT-4o integration
- ✅ Semantic search med pgvector
- ✅ Session storage (localStorage)
- ✅ Chat history persistence
- ✅ Markdown + syntax highlighting
- ✅ Voice input (dansk support)
- ✅ Code block copy funktionalitet

**Integration:**
- OpenAI GPT-4o (streaming)
- TekupVault RAG API
- Supabase (PostgreSQL)
- Server-Sent Events (SSE)

**Deployment:**
- Running: `http://localhost:3000`
- Next.js API Routes backend

**Struktur:**
```
tekup-chat/
├── app/                    # Next.js 15 App Router
├── src/                    # Components, hooks, utils
├── supabase/              # Database migrations
├── tests/                 # Test suite
└── public/                # Static assets
```

---

### 2. **tekup-ai-assistant** ✅ DOKUMENTATION HUB
- **Path:** `C:\Users\empir\tekup-ai-assistant`
- **Status:** 🟢 AKTIV (Dokumentation + MCP configs)
- **Git:** ✅ Git repository
- **Version:** -
- **Tech Stack:** Dokumentation + Python MCP servers

#### Funktionalitet:
**Core Features:**
- ✅ MCP server guides og configs
- ✅ Jan AI / Claude Desktop integration setup
- ✅ Ollama local AI configuration
- ✅ Billy.dk MCP client (production-ready)
- ✅ TekupVault MCP integration
- ✅ Web scraper MCP server (Python)

**MCP Servers Dokumenteret:**
1. **Billy MCP** (Port 3001) - Billy.dk invoicing
2. **RenOS MCP** (Port 3002) - Booking & calendar
3. **System MCP** (Port 3003) - Performance monitoring
4. **TekupVault MCP** (Port 3004) - Chat history archival

**Integration Points:**
- Tekup-Billy API (https://tekup-billy.onrender.com)
- RenOS Backend/Frontend
- TekupVault RAG API
- Jan AI, Claude Desktop, Cursor configs

**Struktur:**
```
tekup-ai-assistant/
├── docs/                   # Setup guides, architecture
│   ├── ARCHITECTURE.md
│   ├── MCP_WEB_SCRAPER_GUIDE.md
│   └── SETUP.md
├── configs/               # Jan AI, Claude Desktop configs
│   └── claude-desktop/
├── mcp-clients/          # Billy MCP client (TypeScript)
│   └── billy/            # Production-ready
├── scripts/              # Python MCP servers
│   ├── mcp_web_scraper.py ✅
│   └── test_tekupvault.py ✅
└── examples/             # Usage examples
```

---

### 3. **Tekup Google AI (RenOS)** ✅ PRODUKTION
- **Path:** `C:\Users\empir\Tekup Google AI`
- **Status:** 🟢 PRODUKTION (superseded af RendetaljeOS monorepo)
- **Git:** ✅ Git repository
- **Version:** 0.1.0
- **Tech Stack:** TypeScript, Node.js, NestJS

#### AI-Funktionalitet:
**LLM Services:**
- ✅ OpenAI Provider (GPT-4o-mini, GPT-4o)
- ✅ Gemini Provider (Gemini 2.0 Flash)
- ✅ AI Email Generation (emailResponseGenerator.ts)
- ✅ AI Auto-response (emailAutoResponseService.ts)
- ✅ Intent Classification (intentClassifier.ts)
- ✅ Task Planning (taskPlanner.ts)
- ✅ Plan Execution (planExecutor.ts)

**AI Agent System:**
- Intent → Plan → Execute arkitektur
- Multi-agent orchestration
- Tool Registry (ADK-style)
- Execution tracing og reflection
- Gemini AI for email generation
- Lead monitoring og parsing

**Integration:**
- OpenAI API (GPT-4o)
- Google Gemini AI
- Gmail API (AI-drevet email processing)
- Google Calendar
- Billy.dk (via MCP)
- Supabase database

**Struktur:**
```
Tekup Google AI/
├── src/
│   ├── agents/            # Intent, planner, executor
│   ├── llm/              # OpenAI + Gemini providers
│   ├── services/         # Gmail, Calendar, Email
│   └── tools/            # Tool registry, toolsets
├── prisma/               # Database schema
└── tests/                # Vitest test suite
```

---

### 4. **Tekup-org (Monorepo)** 🏢 ENTERPRISE
- **Path:** `C:\Users\empir\Tekup-org`
- **Status:** 🟢 MULTI-APP MONOREPO
- **Git:** ✅ Git repository
- **Version:** -
- **Tech Stack:** pnpm workspaces, Turborepo

#### AI Apps i Monorepo:

##### **A) inbox-ai** (Email AI Assistant)
**Location:** `apps/inbox-ai/`
**Features:**
- ✅ MCPService (komplet MCP integration)
- ✅ Plugin-system for MCP servers
- ✅ Tool execution framework
- ✅ Resource access management
- ✅ Prompt templates

**MCP Capabilities:**
```typescript
// apps/inbox-ai/src/main/services/MCPService.ts
- startServer / stopServer
- callTool (tool execution)
- getResource (resource access)
- getPrompt (prompt templates)
- Plugin management
```

##### **B) ai-proposal-engine-api** (AI Proposal Generator)
**Location:** `apps/ai-proposal-engine-api/`
**Features:**
- ✅ MCP Host orchestration
- ✅ Transcript analysis (buying signals)
- ✅ Research integration
- ✅ Narrative generation (OpenAI)
- ✅ Multi-server MCP architecture

**MCP Servers:**
```
apps/ai-proposal-engine-api/src/
├── mcp-host/              # Main orchestrator
└── servers/
    ├── transcript-analysis/
    ├── research/
    └── narrative-generation/
```

##### **C) agentrooms-backend** (Multi-Provider AI)
**Location:** `apps/agentrooms-backend/`
**Features:**
- ✅ OpenAI Provider integration
- ✅ Multi-model support
- ✅ Streaming chat responses
- ✅ Image support capability

**Struktur:**
```
Tekup-org/
├── apps/
│   ├── inbox-ai/                    # Email AI + MCP
│   ├── ai-proposal-engine-api/      # Proposal AI
│   └── agentrooms-backend/          # Multi-AI provider
├── packages/
│   └── shared/                      # Shared types, MCP defs
└── turbo.json
```

---

## 🔍 OVERLAP ANALYSE

### Funktionalitet Overlap Matrix

| Funktion | tekup-chat | tekup-ai-assistant | Tekup Google AI | Tekup-org |
|----------|------------|-------------------|-----------------|-----------|
| **OpenAI Integration** | ✅ GPT-4o | Docs only | ✅ GPT-4o-mini | ✅ Multi-model |
| **Gemini AI** | ❌ | Docs only | ✅ 2.0 Flash | ❌ |
| **MCP Protocol** | ❌ (bruger REST) | ✅ Servers + Docs | ❌ (har clients) | ✅ Full framework |
| **Chat UI** | ✅ Production | ❌ | ❌ | ❌ |
| **TekupVault RAG** | ✅ | ✅ Docs | ❌ | ❌ |
| **Email AI** | ❌ | ❌ | ✅ Auto-response | ✅ inbox-ai |
| **Billy Integration** | ❌ | ✅ MCP client | ✅ MCP client | ❌ |
| **Agent System** | ❌ | Docs only | ✅ Intent→Plan→Execute | ✅ MCP framework |
| **Voice Input** | ✅ Danish | ❌ | ❌ | ❌ |
| **Session Storage** | ✅ localStorage | ❌ | ✅ Supabase | ❌ |
| **Streaming** | ✅ SSE | ❌ | ❌ | ✅ OpenAI |
| **Local AI (Ollama)** | ❌ | ✅ Docs + configs | ❌ | ❌ |
| **Multi-Tenant** | ❌ | ❌ | ❌ | ✅ inbox-ai |

---

## 🎯 OVERLAP VURDERING

### 🔴 **HØJE OVERLAP (70-90%)**

1. **OpenAI Integration**
   - **tekup-chat**: GPT-4o via Next.js API routes
   - **Tekup Google AI**: GPT-4o-mini via llm/openAiProvider.ts
   - **Tekup-org (agentrooms)**: Multi-provider med OpenAI
   - **Overlap:** 85% - Alle tre bruger OpenAI, men forskellig arkitektur

2. **MCP Server Implementation**
   - **tekup-ai-assistant**: Python MCP servers + Billy client
   - **Tekup-org (inbox-ai)**: TypeScript MCP framework
   - **Overlap:** 80% - Samme protocol, forskelligt sprog

3. **Email AI Processing**
   - **Tekup Google AI**: emailAutoResponseService, AI-genereret svar
   - **Tekup-org (inbox-ai)**: MCPService med email tools
   - **Overlap:** 75% - Begge AI-drevet email, forskellig tilgang

### 🟡 **MELLEM OVERLAP (30-70%)**

4. **Chat Interface**
   - **tekup-chat**: Production-ready Next.js chat UI
   - **tekup-ai-assistant**: Dokumentation for Jan AI / Claude Desktop
   - **Overlap:** 40% - Begge chat, men tekup-chat er web-baseret

5. **TekupVault Integration**
   - **tekup-chat**: REST API integration
   - **tekup-ai-assistant**: MCP server dokumentation
   - **Overlap:** 50% - Samme datakilde, forskellig protokol

6. **Agent Orchestration**
   - **Tekup Google AI**: Intent→Plan→Execute pattern
   - **Tekup-org (ai-proposal-engine)**: MCP Host orchestration
   - **Overlap:** 60% - Lignende workflow, forskellig implementation

### 🟢 **UNIKKE FEATURES**

**tekup-chat (unikke):**
- ✅ Production web chat UI (ChatGPT-style)
- ✅ Session storage med localStorage
- ✅ Voice input (dansk)
- ✅ Real-time streaming responses
- ✅ Code block copy

**tekup-ai-assistant (unikke):**
- ✅ Ollama local AI setup + guides
- ✅ Jan AI / Claude Desktop configs
- ✅ Python MCP web scraper
- ✅ ROI dokumentation (~2 timer/dag besparelse)
- ✅ Billy MCP client (production-ready TypeScript)

**Tekup Google AI (unikke):**
- ✅ Gemini 2.0 Flash integration
- ✅ Gmail lead monitoring
- ✅ Intent classification system
- ✅ Task planning framework
- ✅ Execution tracing + reflection
- ✅ Tool Registry (ADK-style)
- ✅ Calendar booking confirmation emails

**Tekup-org (unikke):**
- ✅ Multi-tenant MCP framework
- ✅ AI Proposal Engine (transcript → proposal)
- ✅ Multi-provider AI (OpenAI + custom)
- ✅ Enterprise monorepo structure
- ✅ Shared MCP types (@tekup/shared)

---

## 💡 KONSOLIDERING ANBEFALING

### ✅ **ANBEFALET STRATEGI: ARKITEKTUR-DREVET SEPARATION**

**Rationale:** AI-funktionalitet spænder over 4 meget forskellige use cases:
1. **End-user chat** (tekup-chat)
2. **AI integration guides** (tekup-ai-assistant)
3. **Production email/lead AI** (Tekup Google AI)
4. **Enterprise multi-app AI** (Tekup-org)

**Anbefaling:** BEHOLD ALLE 4 REPOS, men standardiser interfaces.

---

## 📁 FORESLÅET ARKITEKTUR: "AI UNIVERSE"

```
Tekup AI Universe (Federated Architecture)
│
├── 1️⃣ tekup-chat (End-user AI Interface)
│   ├── Purpose: ChatGPT-style web chat for Tekup team
│   ├── Stack: Next.js 15, React 18, OpenAI GPT-4o
│   ├── Integration: TekupVault REST API
│   └── Status: ✅ Production ready (localhost:3000)
│
├── 2️⃣ tekup-ai-assistant (AI Integration Hub)
│   ├── Purpose: MCP configs, guides, standalone MCP servers
│   ├── Stack: Python MCP servers + TypeScript clients
│   ├── Integration: Jan AI, Claude Desktop, Cursor
│   ├── MCP Servers:
│   │   ├── Billy MCP (TypeScript) ✅
│   │   ├── Web Scraper MCP (Python) ✅
│   │   └── TekupVault MCP (docs) ✅
│   └── Status: ✅ Documentation + working servers
│
├── 3️⃣ Tekup Google AI (RenOS AI Core)
│   ├── Purpose: Production email AI, lead AI, agent system
│   ├── Stack: TypeScript, NestJS, OpenAI + Gemini
│   ├── Integration: Gmail, Calendar, Billy, Supabase
│   ├── AI Agents:
│   │   ├── Intent Classifier
│   │   ├── Task Planner
│   │   ├── Plan Executor
│   │   ├── Email Auto-Response
│   │   └── Lead Monitor
│   └── Status: ✅ Production (superseded by RendetaljeOS)
│
└── 4️⃣ Tekup-org (Enterprise AI Monorepo)
    ├── Purpose: Multi-tenant AI apps med shared MCP framework
    ├── Stack: pnpm monorepo, Turborepo, TypeScript
    ├── Apps:
    │   ├── inbox-ai (Email AI + MCP framework)
    │   ├── ai-proposal-engine-api (Proposal generation)
    │   └── agentrooms-backend (Multi-provider AI)
    ├── Packages:
    │   └── @tekup/shared (MCP types, utilities)
    └── Status: ✅ Active development
```

---

## 🎨 STANDARDISERING ANBEFALING

### **Option A: MCP Protocol som Standard Interface** ⭐ ANBEFALET

**Rationale:** MCP er industry standard (Anthropic), supports:
- OpenAI ChatGPT (Custom GPTs)
- Claude Desktop
- Cursor IDE
- VS Code Copilot
- Jan AI

**Implementation:**
1. **tekup-chat**: Tilføj MCP client support (parallel til REST)
2. **tekup-ai-assistant**: Udvid med flere MCP servers
3. **Tekup Google AI**: Expose AI agents som MCP tools
4. **Tekup-org**: Allerede MCP-native ✅

**Fordele:**
- ✅ Single protocol på tværs af alle AI apps
- ✅ Industry standard, future-proof
- ✅ AI-first design (self-documenting tools)
- ✅ Kan integreres med alle AI assistants

**Migration Plan:**
```
Phase 1 (1-2 uger):
├── Standardiser MCP tool schemas (@tekup/shared)
├── Port tekup-chat til MCP client
└── Document unified MCP architecture

Phase 2 (2-3 uger):
├── Expose Tekup Google AI agents som MCP
├── Centralize MCP server discovery
└── Unified MCP config for alle IDEs

Phase 3 (1 uge):
├── Cross-repo testing (chat → agents → tools)
├── Performance optimization
└── Production deployment
```

---

### **Option B: REST API som Common Layer**

**Rationale:** Simplere, mere universelt

**Implementation:**
- Alle AI services expose REST endpoints
- tekup-chat fortsætter med REST (som nu)
- Tekup-org inbox-ai tilføjer REST wrapper

**Fordele:**
- ✅ Simplere implementation
- ✅ Bedre debugging (curl, Postman)
- ✅ Standard HTTP caching

**Ulemper:**
- ⚠️ Ikke AI-optimeret (mangler tool discovery)
- ⚠️ Ingen integration med AI IDEs
- ⚠️ Custom dokumentation nødvendigt

---

## 🚀 KONSOLIDERING ROADMAP

### Fase 1: Standardisering (Uge 1-2)

**Mål:** Fælles MCP interface definitions

**Tasks:**
1. ✅ Opret `@tekup/ai-shared` package i Tekup-org monorepo
   ```typescript
   // packages/ai-shared/src/mcp/types.ts
   export interface TekupMCPTool {
     name: string;
     description: string;
     inputSchema: JSONSchema;
     provider: 'billy' | 'renos' | 'gmail' | 'tekupvault';
   }
   ```

2. ✅ Document MCP server ports:
   - Billy MCP: `3001`
   - RenOS MCP: `3002`
   - System MCP: `3003`
   - TekupVault MCP: `3004`
   - Gmail MCP: `3005` (ny)

3. ✅ Unified MCP config template:
   ```json
   // claude_desktop_config.json (template)
   {
     "mcpServers": {
       "billy": { "command": "node", "args": ["./mcp-servers/billy/dist/index.js"] },
       "renos": { "command": "node", "args": ["./mcp-servers/renos/dist/index.js"] },
       "tekupvault": { "command": "node", "args": ["./mcp-servers/tekupvault/dist/index.js"] }
     }
   }
   ```

---

### Fase 2: Integration (Uge 3-4)

**Mål:** Cross-repo MCP communication

**Tasks:**
1. ✅ **tekup-chat**: Add MCP client support
   ```typescript
   // tekup-chat/src/lib/mcp-client.ts
   import { MCPClient } from '@tekup/ai-shared';
   
   const client = new MCPClient({
     servers: ['billy', 'renos', 'tekupvault']
   });
   
   // Usage in chat
   const tools = await client.listTools();
   const result = await client.callTool('billy', 'create_invoice', {...});
   ```

2. ✅ **Tekup Google AI**: Expose AI agents via MCP
   ```typescript
   // Tekup Google AI/src/mcp/agent-mcp-server.ts
   import { Server } from '@modelcontextprotocol/sdk/server/index.js';
   
   const server = new Server({
     name: 'renos-ai-agents',
     version: '1.0.0'
   });
   
   server.setRequestHandler(ListToolsRequestSchema, async () => ({
     tools: [
       {
         name: 'classify_intent',
         description: 'Klassificér bruger intent (email.compose, calendar.book, etc)',
         inputSchema: { /* ... */ }
       },
       {
         name: 'generate_email',
         description: 'Generer AI-drevet email med Gemini',
         inputSchema: { /* ... */ }
       }
     ]
   }));
   ```

3. ✅ **tekup-ai-assistant**: Centralize MCP configs
   ```
   tekup-ai-assistant/
   ├── configs/
   │   ├── claude-desktop/
   │   │   └── claude_desktop_config.json (✅ unified)
   │   ├── cursor/
   │   │   └── mcp.json
   │   ├── vscode/
   │   │   └── copilot-config.json
   │   └── jan-ai/
   │       └── assistant-config.json
   └── scripts/
       └── install-mcp-configs.sh (auto-installer)
   ```

---

### Fase 3: Testing & Documentation (Uge 5)

**Mål:** End-to-end validation og dokumentation

**Tasks:**
1. ✅ Integration test suite
   ```typescript
   // test/integration/mcp-cross-repo.test.ts
   describe('Cross-repo MCP Integration', () => {
     it('tekup-chat kan kalde Billy MCP', async () => {
       const chat = new TekupChat();
       const response = await chat.sendMessage('Opret faktura til Michael');
       expect(response).toContain('INV-');
     });
     
     it('Tekup Google AI agents tilgængelige via MCP', async () => {
       const tools = await mcpClient.listTools('renos-ai-agents');
       expect(tools).toContainEqual({ name: 'classify_intent' });
     });
   });
   ```

2. ✅ Update README.md i alle repos
   - Tilføj "MCP Integration" sektion
   - Link til fælles MCP docs
   - Port mapping reference

3. ✅ Opret `AI_UNIVERSE.md` i Tekup-org monorepo
   - Arkitektur diagram
   - Use case mapping (chat → agents → tools)
   - Performance benchmarks

---

## 📊 COST-BENEFIT ANALYSE

### **Option 1: Konsolidér Alt til Tekup-org Monorepo**

**Fordele:**
- ✅ Single source of truth
- ✅ Shared packages (ingen duplication)
- ✅ Unified CI/CD
- ✅ Centraliseret dependency management

**Ulemper:**
- ⚠️ Massive migration effort (3-4 uger)
- ⚠️ Breaking changes til eksisterende brugere (tekup-chat production)
- ⚠️ Tab af repo-specifik context (git history)
- ⚠️ Monorepo complexity for små projekter

**Tid:** 4-6 uger  
**Risiko:** HØJ (production downtime)  
**ROI:** Middel (kun hvis vi planlægger mange flere AI apps)

---

### **Option 2: Federated Architecture med MCP Standard** ⭐ ANBEFALET

**Fordele:**
- ✅ Bevar eksisterende struktur (minimal disruption)
- ✅ MCP som standard interface (industry standard)
- ✅ Gradvis migration (kan testes isoleret)
- ✅ Production apps fortsætter uforstyrret

**Ulemper:**
- ⚠️ Skal vedligeholde MCP protocol across repos
- ⚠️ Dupliceret MCP client code (kan mitigeres med npm package)

**Tid:** 2-3 uger  
**Risiko:** LAV (kan testes uden at påvirke production)  
**ROI:** HØJ (enabler AI agent ecosystem)

---

### **Option 3: Status Quo + Dokumentation**

**Fordele:**
- ✅ Zero migration effort
- ✅ Ingen risiko

**Ulemper:**
- ⚠️ Fortsatte overlap
- ⚠️ Ingen cross-repo integration
- ⚠️ Teknisk gæld vokser

**Tid:** 0 uger  
**Risiko:** INGEN  
**ROI:** LAV (ingen forbedring)

---

## 🎯 FINAL ANBEFALING

### ✅ **VÆLG OPTION 2: FEDERATED ARCHITECTURE MED MCP STANDARD**

**Hvorfor?**
1. **Minimal disruption** - Production apps (tekup-chat, Tekup Google AI) fortsætter
2. **Industry alignment** - MCP er standard fra Anthropic, bruges af Claude, ChatGPT, Cursor
3. **Future-proof** - AI agent ecosystems kræver standard protocols
4. **Gradual migration** - Kan implementeres i faser uden breaking changes
5. **Shared benefits** - Alle repos får adgang til hinandens AI capabilities

**Implementation Priority:**
1. **Uge 1-2**: Standardisér MCP interfaces (@tekup/ai-shared package)
2. **Uge 3**: Tilføj MCP client til tekup-chat (parallel til REST)
3. **Uge 4**: Expose Tekup Google AI agents via MCP
4. **Uge 5**: Testing + dokumentation

**Success Metrics:**
- ✅ tekup-chat kan kalde Billy MCP (create invoice via chat)
- ✅ Cursor kan bruge Tekup Google AI agents (AI-assisted coding)
- ✅ Claude Desktop kan søge TekupVault + execute RenOS actions
- ✅ Zero production downtime under migration

---

## 📝 NÆSTE SKRIDT

### Umiddelbar Handling (Denne Uge):

1. **Review denne analyse** med Jonas/team
2. **Beslut strategy** (Option 2 anbefalet)
3. **Opret `@tekup/ai-shared` package** i Tekup-org
4. **Document MCP port mapping** (3001-3005)
5. **Start Fase 1**: MCP interface standardisering

### Spørgsmål til Afklaring:

1. **Skal tekup-chat understøtte både REST og MCP?** (Anbefaling: Ja, gradual migration)
2. **Skal Tekup Google AI migreres til Tekup-org monorepo?** (Anbefaling: Nej, behold standalone)
3. **Priority på cross-repo integration?** (Anbefaling: tekup-chat → Billy MCP først)
4. **Timeline flexibility?** (Kan det tage 5 uger eller skal det gå hurtigere?)

---

**Konklusion:** Med MCP som standard interface kan alle AI repos samarbejde uden at skulle konsolideres fysisk. Dette giver maximum flexibility med minimum disruption.

**Status:** ⏳ Afventer beslutning  
**Næste Review:** Efter team feedback

---

**Prepared by:** AI Assistant  
**Date:** October 22, 2025  
**Document Version:** 1.0
