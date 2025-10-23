# Tekup-AI Monorepo Migration Plan
**Dato:** 22. Oktober 2025  
**Mål:** Konsolidere alle AI repos til `tekup-ai` monorepo  
**Timeline:** 14 dage (2 uger)  
**Status:** 📋 PLAN KLAR - Afventer godkendelse

---

## 🎯 VISION: tekup-ai Monorepo

Et unified AI-services monorepo der konsoliderer:
- ✅ LLM providers (OpenAI, Gemini, Ollama)
- ✅ MCP servers (tekup-ai-assistant's 4 servers + renos-calendar-mcp's 5 tools)
- ✅ RAG infrastructure (TekupVault's semantic search)
- ✅ Agent systems (Tekup Google AI's Intent→Plan→Execute)
- ✅ AI chat interface (tekup-chat's ChatGPT-style UI)

**Resultat:** Single source of truth for ALL Tekup AI functionality.

---

## 📁 REPO STRUKTUR

```
tekup-ai/
├── apps/
│   ├── ai-chat/                    # ChatGPT-style interface (fra tekup-chat)
│   │   ├── app/                    # Next.js 15 App Router
│   │   ├── src/                    # Components, hooks
│   │   └── package.json            # Next.js dependencies
│   │
│   ├── ai-vault/                   # Semantic search API (fra TekupVault)
│   │   ├── src/
│   │   │   ├── routes/             # Express routes
│   │   │   └── services/           # Search, embeddings
│   │   └── package.json            # Express + OpenAI
│   │
│   ├── ai-vault-worker/            # Background sync worker (fra TekupVault)
│   │   ├── src/
│   │   │   └── jobs/               # GitHub sync
│   │   └── package.json
│   │
│   ├── ai-agents/                  # Agent execution system (fra Tekup Google AI)
│   │   ├── src/
│   │   │   ├── agents/             # Intent → Plan → Execute
│   │   │   ├── tools/              # Tool Registry
│   │   │   └── services/           # Gmail, Calendar APIs
│   │   └── package.json            # NestJS eller Express
│   │
│   └── ai-mcp-hub/                 # Unified MCP server (4+5 tools konsolideret)
│       ├── src/
│       │   ├── tools/
│       │   │   ├── billy/          # Billy.dk MCP (fra tekup-ai-assistant)
│       │   │   ├── renos/          # RenOS MCP (fra tekup-ai-assistant)
│       │   │   ├── system/         # System MCP (fra tekup-ai-assistant)
│       │   │   ├── vault/          # TekupVault MCP (fra tekup-ai-assistant)
│       │   │   └── calendar/       # Calendar Intelligence (fra renos-calendar-mcp)
│       │   ├── index.ts            # MCP stdio server
│       │   └── http-server.ts      # HTTP REST server
│       └── package.json            # @modelcontextprotocol/sdk
│
├── packages/
│   ├── ai-llm/                     # Unified LLM provider abstraction
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   │   ├── openai.ts       # OpenAI GPT provider
│   │   │   │   ├── gemini.ts       # Google Gemini provider
│   │   │   │   └── ollama.ts       # Ollama local provider
│   │   │   ├── types.ts            # LLMProvider interface
│   │   │   └── index.ts            # Factory exports
│   │   └── package.json
│   │
│   ├── ai-mcp/                     # MCP client + server utilities
│   │   ├── src/
│   │   │   ├── client.ts           # MCP client
│   │   │   ├── server.ts           # MCP server helpers
│   │   │   └── transport.ts        # stdio + HTTP transports
│   │   └── package.json
│   │
│   ├── ai-rag/                     # RAG utilities (embeddings + search)
│   │   ├── src/
│   │   │   ├── embeddings.ts       # OpenAI embeddings
│   │   │   ├── search.ts           # pgvector search
│   │   │   └── ingestion.ts        # Document ingestion
│   │   └── package.json
│   │
│   ├── ai-agents/                  # Agent framework (Intent → Plan → Execute)
│   │   ├── src/
│   │   │   ├── intent.ts           # Intent classifier
│   │   │   ├── planner.ts          # Task planner (Gemini)
│   │   │   ├── executor.ts         # Plan executor
│   │   │   └── types.ts            # AssistantIntent, PlannedTask, etc.
│   │   └── package.json
│   │
│   ├── ai-config/                  # Shared configuration
│   │   ├── src/
│   │   │   ├── env.ts              # Zod env validation
│   │   │   └── config.ts           # App config
│   │   └── package.json
│   │
│   └── ai-types/                   # Shared TypeScript types
│       ├── src/
│       │   ├── llm.ts              # LLM types
│       │   ├── mcp.ts              # MCP types
│       │   ├── rag.ts              # RAG types
│       │   └── agent.ts            # Agent types
│       └── package.json
│
├── supabase/
│   └── migrations/                 # Unified Supabase schema
│       ├── 001_vault_tables.sql    # TekupVault tables
│       ├── 002_agent_tables.sql    # Agent execution logs
│       └── 003_mcp_tables.sql      # MCP call history
│
├── docs/
│   ├── architecture/               # System architecture
│   ├── guides/                     # Setup guides
│   ├── api/                        # API documentation
│   └── migration/                  # Migration from old repos
│
├── scripts/
│   ├── setup.ps1                   # Windows setup script
│   └── migrate-from-old-repos.ps1  # Migration helper
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  # CI/CD pipeline
│   │   └── deploy.yml              # Render.com deployment
│   └── copilot-instructions.md     # AI coding agent guide
│
├── docker-compose.yml              # Local development (PostgreSQL + pgvector)
├── render.yaml                     # Production deployment config
├── pnpm-workspace.yaml             # pnpm workspace config
├── turbo.json                      # Turborepo build pipeline
├── package.json                    # Root package.json
├── tsconfig.json                   # Root TypeScript config
└── README.md                       # Monorepo documentation
```

---

## 📦 KERNE PACKAGES (Fælles komponenter)

### 1. `@tekup-ai/llm` - LLM Provider Abstraction

**Fra:** Tekup Google AI, RendetaljeOS, renos-calendar-mcp  
**Formål:** Unified interface til OpenAI, Gemini, Ollama

```typescript
// packages/ai-llm/src/index.ts
export interface LLMProvider {
  completeChat(messages: ChatMessage[], options?: LLMOptions): Promise<string>;
  completeChatStream(messages: ChatMessage[], options?: LLMOptions): AsyncGenerator<string>;
  completeChatJSON<T>(messages: ChatMessage[], options?: LLMOptions): Promise<T>;
  completeChatWithFunctions<T>(
    messages: ChatMessage[],
    functions: FunctionDeclaration[],
    options?: LLMOptions
  ): Promise<{ name: string; args: T }>;
}

export class OpenAIProvider implements LLMProvider { /* ... */ }
export class GeminiProvider implements LLMProvider { /* ... */ }
export class OllamaProvider implements LLMProvider { /* ... */ }

// Factory
export function createLLMProvider(
  provider: 'openai' | 'gemini' | 'ollama',
  config: LLMConfig
): LLMProvider;
```

**Dependencies:**
```json
{
  "openai": "^4.73.0",
  "@google/generative-ai": "^0.21.0",
  "ollama": "^0.5.11"
}
```

---

### 2. `@tekup-ai/mcp` - MCP Client + Server Utilities

**Fra:** tekup-ai-assistant, renos-calendar-mcp  
**Formål:** Reusable MCP transport + tool helpers

```typescript
// packages/ai-mcp/src/index.ts
export class MCPClient {
  constructor(transport: 'stdio' | 'http', url?: string);
  async callTool<T>(name: string, args: Record<string, unknown>): Promise<T>;
  async listTools(): Promise<Tool[]>;
}

export class MCPServer {
  constructor(transport: 'stdio' | 'http', port?: number);
  registerTool(tool: ToolDefinition): void;
  start(): Promise<void>;
}

// Tool Registry Pattern
export class ToolRegistry {
  register(toolset: Toolset): void;
  getTool(name: string): Tool | undefined;
  getAllTools(): Tool[];
}
```

**Dependencies:**
```json
{
  "@modelcontextprotocol/sdk": "^1.20.0",
  "axios": "^1.7.7",
  "zod": "^3.22.4"
}
```

---

### 3. `@tekup-ai/rag` - RAG Utilities

**Fra:** TekupVault  
**Formål:** Embeddings generation + semantic search

```typescript
// packages/ai-rag/src/index.ts
export class EmbeddingService {
  constructor(provider: 'openai', apiKey: string);
  async generateEmbedding(text: string): Promise<number[]>;
  async generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class SemanticSearchService {
  constructor(supabaseClient: SupabaseClient);
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  async ingestDocument(doc: Document): Promise<void>;
  async deleteDocument(docId: string): Promise<void>;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  filters?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  repository: string;
  path: string;
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}
```

**Dependencies:**
```json
{
  "openai": "^4.73.0",
  "@supabase/supabase-js": "^2.75.0",
  "pgvector": "^0.5.0"
}
```

---

### 4. `@tekup-ai/agents` - Agent Framework

**Fra:** Tekup Google AI, RendetaljeOS  
**Formål:** Intent → Plan → Execute pattern

```typescript
// packages/ai-agents/src/index.ts
export class IntentClassifier {
  classify(input: string): Promise<AssistantIntent>;
}

export class TaskPlanner {
  constructor(llmProvider: LLMProvider);
  async plan(intent: AssistantIntent): Promise<PlannedTask[]>;
}

export class PlanExecutor {
  constructor(toolRegistry: ToolRegistry);
  async execute(tasks: PlannedTask[]): Promise<ExecutionResult[]>;
}

// Types
export interface AssistantIntent {
  type: string;
  confidence: number;
  description: string;
  customer?: { name: string; email: string };
  metadata?: Record<string, unknown>;
}

export interface PlannedTask {
  type: string;
  payload: Record<string, unknown>;
  blocking: boolean;
  dependsOn?: string[];
}

export interface ExecutionResult {
  taskType: string;
  success: boolean;
  data?: unknown;
  error?: string;
}
```

---

### 5. `@tekup-ai/config` - Shared Configuration

**Fra:** Alle repos  
**Formål:** Unified env validation + config

```typescript
// packages/ai-config/src/index.ts
import { z } from 'zod';

export const LLMConfigSchema = z.object({
  PROVIDER: z.enum(['openai', 'gemini', 'ollama', 'heuristic']),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
});

export const DatabaseConfigSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_KEY: z.string(),
});

export function validateConfig<T>(schema: z.ZodSchema<T>): T;
export function getEnv(key: string, defaultValue?: string): string;
```

---

## 🚀 APPS OVERSIGT

### App 1: `ai-chat` (Next.js 15 + React 18)

**Fra:** tekup-chat  
**Formål:** ChatGPT-style interface med TekupVault RAG

**Features:**
- OpenAI GPT-4o streaming
- TekupVault semantic search integration
- Voice input (dansk)
- Chat history persistence
- Markdown + syntax highlighting

**Dependencies:**
```json
{
  "next": "^15.0.0",
  "react": "^18.3.0",
  "openai": "^4.73.0",
  "ai": "^3.4.33",
  "@tekup-ai/rag": "workspace:*",
  "@tekup-ai/llm": "workspace:*"
}
```

**Integration:**
```typescript
// apps/ai-chat/src/services/chat.ts
import { createLLMProvider } from '@tekup-ai/llm';
import { SemanticSearchService } from '@tekup-ai/rag';

const llm = createLLMProvider('openai', { apiKey: process.env.OPENAI_API_KEY });
const search = new SemanticSearchService(supabaseClient);

export async function generateResponse(userMessage: string) {
  // 1. Search TekupVault for context
  const context = await search.search(userMessage, { limit: 5 });
  
  // 2. Generate AI response with context
  const response = await llm.completeChat([
    { role: 'system', content: `Context: ${context.map(r => r.content).join('\n')}` },
    { role: 'user', content: userMessage }
  ]);
  
  return response;
}
```

---

### App 2: `ai-vault` + `ai-vault-worker` (Express + Supabase)

**Fra:** TekupVault  
**Formål:** Semantic search API + GitHub sync worker

**Features:**
- REST API for semantic search
- OpenAI embeddings generation
- pgvector similarity search
- GitHub repo syncing (14 Tekup repos)
- Background worker (6-hour cron)

**Dependencies:**
```json
{
  "express": "^4.18.2",
  "@tekup-ai/rag": "workspace:*",
  "@tekup-ai/config": "workspace:*",
  "@supabase/supabase-js": "^2.75.0",
  "@octokit/rest": "^21.0.2"
}
```

**API Endpoints:**
```typescript
// apps/ai-vault/src/routes/search.ts
import { SemanticSearchService } from '@tekup-ai/rag';

router.post('/api/search', async (req, res) => {
  const { query, limit = 10, threshold = 0.7 } = req.body;
  
  const search = new SemanticSearchService(supabaseClient);
  const results = await search.search(query, { limit, threshold });
  
  res.json({ results });
});
```

---

### App 3: `ai-agents` (NestJS eller Express)

**Fra:** Tekup Google AI, RendetaljeOS  
**Formål:** Agent execution system (Intent → Plan → Execute)

**Features:**
- Intent classification (regex + optional LLM)
- Gemini-powered task planning
- Tool Registry execution
- Gmail + Calendar API integration
- Dry-run + live modes

**Dependencies:**
```json
{
  "@nestjs/core": "^10.0.0",
  "@tekup-ai/agents": "workspace:*",
  "@tekup-ai/llm": "workspace:*",
  "googleapis": "^144.0.0"
}
```

**Flow:**
```typescript
// apps/ai-agents/src/services/agent.ts
import { IntentClassifier, TaskPlanner, PlanExecutor } from '@tekup-ai/agents';

export class AgentService {
  async processRequest(userInput: string) {
    // 1. Classify intent
    const intent = await this.classifier.classify(userInput);
    
    // 2. Generate plan (Gemini)
    const tasks = await this.planner.plan(intent);
    
    // 3. Execute plan
    const results = await this.executor.execute(tasks);
    
    return { intent, tasks, results };
  }
}
```

---

### App 4: `ai-mcp-hub` (MCP Server - Stdio + HTTP)

**Fra:** tekup-ai-assistant (4 servers) + renos-calendar-mcp (5 tools)  
**Formål:** Unified MCP server med ALLE tools

**9 Tools Konsolideret:**

1. **Billy MCP** (Port 3001)
   - `billy_get_invoices`
   - `billy_create_invoice`
   - `billy_get_customers`
   - `billy_create_customer`

2. **RenOS MCP** (Port 3002)
   - `renos_book_appointment`
   - `renos_get_availability`

3. **System MCP** (Port 3003)
   - `system_get_cpu_usage`
   - `system_get_memory_usage`

4. **TekupVault MCP** (Port 3004)
   - `vault_archive_conversation`
   - `vault_search_history`

5. **Calendar Intelligence** (fra renos-calendar-mcp)
   - `validate_booking_date`
   - `check_booking_conflicts`
   - `auto_invoice_workflow`
   - `track_overtime`
   - `get_customer_intelligence`

**Dependencies:**
```json
{
  "@modelcontextprotocol/sdk": "^1.20.0",
  "@tekup-ai/mcp": "workspace:*",
  "@tekup-ai/llm": "workspace:*",
  "axios": "^1.7.7",
  "zod": "^3.22.4"
}
```

**Structure:**
```typescript
// apps/ai-mcp-hub/src/index.ts
import { MCPServer, ToolRegistry } from '@tekup-ai/mcp';
import { BillyToolset } from './tools/billy';
import { RenosToolset } from './tools/renos';
import { CalendarToolset } from './tools/calendar';

const server = new MCPServer('stdio');
const registry = new ToolRegistry();

// Register all toolsets
registry.register(new BillyToolset());
registry.register(new RenosToolset());
registry.register(new CalendarToolset());

// Start server
server.start();
```

---

## 📅 14-DAY MIGRATION TIMELINE

### **FASE 1: Setup & Foundation (Dag 1-3)**

#### **Dag 1: Repo Creation & Structure**
```powershell
# Create new repo
cd C:\Users\empir
mkdir tekup-ai
cd tekup-ai
git init
git remote add origin https://github.com/JonasAbde/tekup-ai.git

# Create monorepo structure
mkdir apps, packages, docs, scripts, supabase\migrations

# Initialize pnpm workspace
New-Item pnpm-workspace.yaml -Value @"
packages:
  - 'apps/*'
  - 'packages/*'
"@

# Root package.json
New-Item package.json -Value @"
{
  "name": "tekup-ai",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0"
  },
  "packageManager": "pnpm@8.15.0"
}
"@

# Turborepo config
New-Item turbo.json -Value @"
{
  "\$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
"@

pnpm install
```

#### **Dag 2: Core Packages Setup**
```powershell
# Create package structure
cd packages

# @tekup-ai/types
mkdir ai-types\src
cd ai-types
pnpm init
# Add dependencies + TypeScript config

# @tekup-ai/config
cd ..\ai-config
mkdir src
pnpm init

# @tekup-ai/llm
cd ..\ai-llm
mkdir src\providers
pnpm init
pnpm add openai @google/generative-ai ollama

# Repeat for ai-mcp, ai-rag, ai-agents
```

#### **Dag 3: Copy LLM Providers**
```powershell
# Copy from Tekup Google AI
Copy-Item "C:\Users\empir\Tekup Google AI\src\llm\*" `
  -Destination "C:\Users\empir\tekup-ai\packages\ai-llm\src\providers\" `
  -Recurse

# Refactor imports to use @tekup-ai/types
# Test builds: pnpm --filter @tekup-ai/llm build
```

---

### **FASE 2: Package Migration (Dag 4-7)**

#### **Dag 4: RAG Package (TekupVault)**
```powershell
# Copy RAG utilities
Copy-Item "C:\Users\empir\TekupVault\packages\vault-search\src\*" `
  -Destination "C:\Users\empir\tekup-ai\packages\ai-rag\src\" `
  -Recurse

# Copy embeddings logic
Copy-Item "C:\Users\empir\TekupVault\packages\vault-ingest\src\embeddings.ts" `
  -Destination "C:\Users\empir\tekup-ai\packages\ai-rag\src\embeddings.ts"

# Refactor to use @tekup-ai/config
# Test: pnpm --filter @tekup-ai/rag build
```

#### **Dag 5: MCP Package**
```powershell
# Copy MCP utilities
Copy-Item "C:\Users\empir\tekup-ai-assistant\mcp-clients\billy\src\*" `
  -Destination "C:\Users\empir\tekup-ai\packages\ai-mcp\src\" `
  -Recurse

# Create reusable MCPClient + MCPServer classes
# Test: pnpm --filter @tekup-ai/mcp build
```

#### **Dag 6-7: Agents Package**
```powershell
# Copy agent system
Copy-Item "C:\Users\empir\Tekup Google AI\src\agents\*" `
  -Destination "C:\Users\empir\tekup-ai\packages\ai-agents\src\" `
  -Recurse

# Refactor to use @tekup-ai/llm
# Test: pnpm --filter @tekup-ai/agents build
```

---

### **FASE 3: Apps Migration (Dag 8-12)**

#### **Dag 8-9: ai-chat App**
```powershell
cd C:\Users\empir\tekup-ai\apps
mkdir ai-chat

# Copy entire tekup-chat
Copy-Item "C:\Users\empir\tekup-chat\*" `
  -Destination "C:\Users\empir\tekup-ai\apps\ai-chat\" `
  -Recurse -Exclude node_modules, .next

# Update package.json dependencies
# Replace local services with @tekup-ai/* packages
# Test: pnpm --filter ai-chat dev
```

#### **Dag 10: ai-vault + ai-vault-worker**
```powershell
# Copy vault-api
Copy-Item "C:\Users\empir\TekupVault\apps\vault-api\*" `
  -Destination "C:\Users\empir\tekup-ai\apps\ai-vault\" `
  -Recurse -Exclude node_modules

# Copy vault-worker
Copy-Item "C:\Users\empir\TekupVault\apps\vault-worker\*" `
  -Destination "C:\Users\empir\tekup-ai\apps\ai-vault-worker\" `
  -Recurse -Exclude node_modules

# Refactor to use @tekup-ai/rag
# Test: pnpm --filter ai-vault dev
```

#### **Dag 11: ai-agents App**
```powershell
# Copy agent backend
Copy-Item "C:\Users\empir\Tekup Google AI\src\*" `
  -Destination "C:\Users\empir\tekup-ai\apps\ai-agents\src\" `
  -Recurse -Exclude llm, agents

# Refactor to use @tekup-ai/agents, @tekup-ai/llm
# Test: pnpm --filter ai-agents dev
```

#### **Dag 12: ai-mcp-hub (Unified MCP Server)**
```powershell
# Create new unified MCP server
cd C:\Users\empir\tekup-ai\apps\ai-mcp-hub
mkdir src\tools

# Copy Billy tools
Copy-Item "C:\Users\empir\tekup-ai-assistant\mcp-clients\billy\src\*" `
  -Destination "src\tools\billy\"

# Copy Calendar tools
Copy-Item "C:\Users\empir\Tekup-Cloud\renos-calendar-mcp\src\tools\*" `
  -Destination "src\tools\calendar\"

# Create unified server
# Test: pnpm --filter ai-mcp-hub dev
```

---

### **FASE 4: Integration & Testing (Dag 13-14)**

#### **Dag 13: Integration Testing**
```powershell
# Test all apps together
cd C:\Users\empir\tekup-ai

# Start all services
pnpm dev  # Runs all apps in parallel via Turborepo

# Verify:
# ✅ ai-chat: http://localhost:3000
# ✅ ai-vault: http://localhost:3001
# ✅ ai-agents: http://localhost:3002
# ✅ ai-mcp-hub: stdio + http://localhost:3003
```

#### **Dag 14: Documentation & Deployment**
```powershell
# Generate documentation
pnpm run docs:generate

# Setup Render.com deployment
# render.yaml with all 4 apps

# Deploy to production
git add .
git commit -m "feat: Initial tekup-ai monorepo migration"
git push origin main

# Trigger Render deployment
```

---

## 🔧 TEKNISK SETUP

### pnpm Workspace Structure

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Root package.json

```json
{
  "name": "tekup-ai",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rm -rf node_modules",
    "docs:generate": "typedoc --entryPointStrategy packages './packages/*/src/index.ts'"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0",
    "typedoc": "^0.25.0"
  },
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### Turborepo Config

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

### Package Dependencies Pattern

```json
// packages/ai-llm/package.json
{
  "name": "@tekup-ai/llm",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@tekup-ai/types": "workspace:*",
    "openai": "^4.73.0",
    "@google/generative-ai": "^0.21.0"
  }
}

// apps/ai-chat/package.json
{
  "name": "ai-chat",
  "version": "1.0.0",
  "dependencies": {
    "@tekup-ai/llm": "workspace:*",
    "@tekup-ai/rag": "workspace:*",
    "@tekup-ai/config": "workspace:*",
    "next": "^15.0.0",
    "react": "^18.3.0"
  }
}
```

---

## 🚢 DEPLOYMENT SETUP

### Render.com Configuration

```yaml
# render.yaml
services:
  # AI Chat (Next.js)
  - type: web
    name: tekup-ai-chat
    runtime: node
    buildCommand: pnpm --filter ai-chat build
    startCommand: pnpm --filter ai-chat start
    envVars:
      - key: NODE_ENV
        value: production
      - key: OPENAI_API_KEY
        sync: false
      - key: NEXT_PUBLIC_API_URL
        value: https://tekup-ai-vault.onrender.com

  # AI Vault API (Express)
  - type: web
    name: tekup-ai-vault
    runtime: node
    buildCommand: pnpm --filter ai-vault build
    startCommand: pnpm --filter ai-vault start
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false

  # AI Vault Worker (Background)
  - type: worker
    name: tekup-ai-vault-worker
    runtime: node
    buildCommand: pnpm --filter ai-vault-worker build
    startCommand: pnpm --filter ai-vault-worker start
    envVars:
      - key: GITHUB_TOKEN
        sync: false

  # AI Agents (NestJS)
  - type: web
    name: tekup-ai-agents
    runtime: node
    buildCommand: pnpm --filter ai-agents build
    startCommand: pnpm --filter ai-agents start
    envVars:
      - key: GEMINI_KEY
        sync: false
      - key: GOOGLE_CREDENTIALS
        sync: false

  # AI MCP Hub (MCP Server)
  - type: web
    name: tekup-ai-mcp-hub
    runtime: node
    buildCommand: pnpm --filter ai-mcp-hub build
    startCommand: pnpm --filter ai-mcp-hub start:http
    envVars:
      - key: BILLY_API_KEY
        sync: false
      - key: SUPABASE_URL
        sync: false

# Shared database
databases:
  - name: tekup-ai-db
    databaseName: tekup_ai
    user: tekup_ai_user
    region: frankfurt
```

---

## 📋 MIGRATION CHECKLIST

### Pre-Migration
- [ ] Backup all source repos til `C:\Users\empir\ai-repos-backup-2025-10-22`
- [ ] Verify all repos have latest commits pushed to GitHub
- [ ] Create new GitHub repo: `https://github.com/JonasAbde/tekup-ai`
- [ ] Setup Render.com project for tekup-ai

### FASE 1: Setup (Dag 1-3)
- [ ] Create monorepo structure
- [ ] Setup pnpm workspace + Turborepo
- [ ] Create all package folders
- [ ] Copy LLM providers from Tekup Google AI
- [ ] Test builds: `pnpm build`

### FASE 2: Packages (Dag 4-7)
- [ ] Migrate @tekup-ai/rag (TekupVault search)
- [ ] Migrate @tekup-ai/mcp (MCP utilities)
- [ ] Migrate @tekup-ai/agents (Intent → Plan → Execute)
- [ ] Test all packages: `pnpm --filter '@tekup-ai/*' build`

### FASE 3: Apps (Dag 8-12)
- [ ] Migrate ai-chat (tekup-chat)
- [ ] Migrate ai-vault + ai-vault-worker (TekupVault)
- [ ] Migrate ai-agents (Tekup Google AI)
- [ ] Create ai-mcp-hub (unified MCP server)
- [ ] Test all apps: `pnpm dev`

### FASE 4: Integration (Dag 13-14)
- [ ] Integration testing (all apps running)
- [ ] Documentation generation
- [ ] Render.com deployment setup
- [ ] Production deployment
- [ ] Verify production URLs

### Post-Migration
- [ ] Update all repos with deprecation notices
- [ ] Archive old repos (read-only mode)
- [ ] Update TekupVault to index new tekup-ai repo
- [ ] Update all CI/CD pipelines

---

## 🎯 SUCCESS CRITERIA

✅ **All apps running in monorepo:**
- ai-chat: http://localhost:3000
- ai-vault: http://localhost:3001
- ai-agents: http://localhost:3002
- ai-mcp-hub: http://localhost:3003

✅ **All packages building successfully:**
```bash
pnpm --filter '@tekup-ai/*' build
# ✅ @tekup-ai/llm
# ✅ @tekup-ai/mcp
# ✅ @tekup-ai/rag
# ✅ @tekup-ai/agents
# ✅ @tekup-ai/config
# ✅ @tekup-ai/types
```

✅ **Production deployment:**
- https://tekup-ai-chat.onrender.com
- https://tekup-ai-vault.onrender.com
- https://tekup-ai-agents.onrender.com
- https://tekup-ai-mcp-hub.onrender.com

✅ **Zero TypeScript errors:**
```bash
pnpm run lint
# ✅ 0 errors, 0 warnings
```

✅ **All tests passing:**
```bash
pnpm test
# ✅ 100+ tests passing
```

---

## 📚 DOKUMENTATION

### README.md Structure

```markdown
# Tekup-AI Monorepo

**Unified AI services for Tekup Portfolio**

## Quick Start
\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Apps
- **ai-chat** - ChatGPT-style interface
- **ai-vault** - Semantic search API
- **ai-agents** - Agent execution system
- **ai-mcp-hub** - Unified MCP server

## Packages
- **@tekup-ai/llm** - LLM provider abstraction
- **@tekup-ai/mcp** - MCP utilities
- **@tekup-ai/rag** - RAG infrastructure
- **@tekup-ai/agents** - Agent framework
```

---

## 🚀 NÆSTE SKRIDT

1. **Review denne plan** med team
2. **Godkend migration approach**
3. **Start FASE 1** (Dag 1-3: Setup)
4. **Daily standup** under migration (Dag 1-14)
5. **Production launch** efter Dag 14

**Estimeret effort:** 2 udviklere × 14 dage = 28 developer-days

---

**Spørgsmål før vi starter?**
1. Skal vi starte med FASE 1 nu? (Repo creation + structure)
2. Foretrækker I NestJS eller Express for ai-agents app?
3. Skal gamle repos arkiveres eller slettes efter migration?

---

**Dokumenteret af:** GitHub Copilot  
**Dato:** 22. Oktober 2025  
**Status:** 📋 PLAN KLAR - Klar til godkendelse
