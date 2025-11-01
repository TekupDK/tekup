# TekUp AI - Unified AI Services Monorepo

> Central AI infrastructure consolidating LLM providers, RAG/semantic search, MCP servers, and intelligent agents across the TekUp portfolio.

## 📋 What This Is

**TekUp AI** is a **pnpm + Turborepo monorepo** that unifies previously scattered AI capabilities:

- **LLM Abstraction**: OpenAI GPT-4o, Google Gemini 2.0 Flash, Ollama (local)
- **RAG/Semantic Search**: pgvector + OpenAI embeddings for documentation search
- **MCP Servers**: Model Context Protocol integrations (Billy.dk, RenOS, System, Vault, Calendar)
- **AI Agents**: Intent classification, task planning, execution orchestration
- **Chat Interface**: Next.js 15 ChatGPT-style UI with real-time streaming

## 🏗️ Monorepo Structure

```
tekup-ai/
├── apps/
│   ├── ai-chat/          # Next.js 15 ChatGPT interface
│   ├── ai-vault/         # Express REST API + GitHub sync
│   ├── ai-vault-worker/  # Background ingestion worker
│   ├── ai-agents/        # NestJS agent orchestration
│   └── ai-mcp-hub/       # Unified MCP server router
├── packages/
│   ├── ai-llm/           # LLM provider abstraction (@tekup-ai/llm)
│   ├── ai-mcp/           # MCP utilities (@tekup-ai/mcp)
│   ├── ai-rag/           # RAG pipeline (@tekup-ai/rag)
│   ├── ai-agents/        # Agent primitives (@tekup-ai/agents)
│   ├── ai-config/        # Shared config (@tekup-ai/config)
│   └── ai-types/         # TypeScript types (@tekup-ai/types)
└── docs/
    ├── architecture/     # System design docs
    ├── guides/           # LLM comparison, MCP setup, calendar tools
    ├── api/              # API references
    └── migration/        # TekupVault migration notes
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **pnpm 8.15+** (enforced via packageManager field)
- **PostgreSQL 15+** with pgvector extension (or Supabase)

### Installation

```bash
# Clone and install dependencies
git clone <repo-url> tekup-ai
cd tekup-ai
pnpm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys (OpenAI, Gemini, Supabase, Google Workspace)

# Build all packages and apps
pnpm build

# Start all services in development mode
pnpm dev
```

### Environment Variables

See `.env.example` for full reference. **Critical variables:**

```bash
# LLM Provider
LLM_PROVIDER=heuristic  # or openai, gemini, ollama
OPENAI_API_KEY=sk-proj-...
GEMINI_KEY=...

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/tekup_ai
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=...

# Google Workspace (for Calendar/Gmail)
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
GOOGLE_IMPERSONATED_USER=user@domain.com
```

## 📦 Packages Overview

### @tekup-ai/llm

Unified LLM provider abstraction supporting:

- **OpenAI**: GPT-4o, GPT-4o-mini with streaming
- **Gemini**: 2.0 Flash Experimental with structured output
- **Ollama**: Local models (llama3.1:8b)
- **Heuristic**: Rule-based fallback for simple classification

**Usage:**
```typescript
import { createLLMProvider } from '@tekup-ai/llm';
const llm = createLLMProvider('openai', { model: 'gpt-4o-mini' });
const response = await llm.generateText('Explain quantum computing');
```

### @tekup-ai/rag

RAG pipeline with pgvector + OpenAI embeddings:

- Document ingestion (GitHub, local files)
- Semantic search with similarity threshold
- Context retrieval for LLM prompts

### @tekup-ai/mcp

MCP server utilities and tool definitions:

- Billy.dk API integration (30+ tools)
- RenOS backend queries (15+ tools)
- Calendar intelligence (5 tools)
- System diagnostics

### @tekup-ai/agents

Agent primitives for multi-step workflows:

- Intent classification (regex + LLM)
- Task planning (dependency resolution)
- Execution orchestration with reflection

## 🔧 Development

### Package-specific Development

```bash
# Work on single package
pnpm --filter @tekup-ai/llm dev
pnpm --filter ai-chat dev

# Build dependencies first
pnpm --filter @tekup-ai/config build
pnpm --filter @tekup-ai/llm build
```

### Testing

```bash
# Run all tests
pnpm test

# Test specific package
pnpm --filter @tekup-ai/llm test
```

### Linting & Formatting

```bash
pnpm lint
pnpm format
```

## 📚 Documentation

- **Architecture**: `docs/architecture/` - System design, data flow
- **Guides**: `docs/guides/` - LLM comparison, MCP setup, calendar AI tools
- **API Reference**: `docs/api/` - Package APIs, REST endpoints
- **Migration Notes**: `docs/migration/` - TekupVault consolidation history

## 🚢 Deployment

### Render.com (Recommended)

Each app has a `render.yaml` configuration. Deploy via:

```bash
# Deploy all services
render deploy

# Or deploy individually
render deploy --service ai-chat
render deploy --service ai-vault
```

**Services:**

- `ai-chat`: <https://tekup-ai-chat.onrender.com>
- `ai-vault`: <https://tekup-ai-vault.onrender.com>
- `ai-agents`: <https://tekup-ai-agents.onrender.com>
- `ai-mcp-hub`: <https://tekup-ai-mcp.onrender.com>

### Docker

```bash
docker-compose up -d
```

## 🔗 Integration

### Source Repositories (Consolidated)

This monorepo consolidates:

- **tekup-chat** → `apps/ai-chat`
- **TekupVault** → `apps/ai-vault` + `apps/ai-vault-worker`
- **Tekup Google AI** → `packages/ai-llm` + `apps/ai-agents`
- **tekup-ai-assistant** → MCP tools merged into `apps/ai-mcp-hub`
- **renos-calendar-mcp** → Calendar tools in `packages/ai-mcp`

### External Dependencies

- **RendetaljeOS**: Backend API for RenOS data queries
- **Tekup-Billy**: Billy.dk MCP server (separate deployment)
- **tekup-gmail-services**: Email automation (separate monorepo)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Follow TypeScript strict mode (no implicit any)
3. Add tests for new features
4. Run `pnpm lint && pnpm typecheck` before commit
5. Submit PR with description

## 📝 License

MIT © TekUp Team

## 🆘 Support

- **Internal Docs**: `docs/` directory
- **Migration Questions**: See `docs/migration/TEKUP_AI_MIGRATION_PLAN.md`
- **TekupVault**: Check `docs/migration/CHATGPT_KNOWLEDGE_BASE.md`

---

**Last Updated**: October 2025  
**Migration Status**: Phase 1 Complete - Documentation & Configuration Gathered
