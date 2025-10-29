# TekupAI - AI Assistant Platform

A Shortwave.ai-like AI Assistant with Model Context Protocol (MCP) integration.

## Overview

TekupAI is a production-ready AI assistant platform that integrates with your existing MCP servers and provides:

- **Smart Chat Interface** - Streaming AI responses with tool visualization
- **Memory System** - Persistent user memories and preferences
- **MCP Integration** - Connect to knowledge, code intelligence, database, and custom MCP servers
- **Saved Prompts** - Quick access to frequently used prompts
- **Customization** - Model selection, temperature, system prompts

## Architecture

```
apps/tekup-ai/
├── frontend/          # Next.js 15 + React 18 + TypeScript
├── backend/           # NestJS 10 + Prisma + Socket.io
├── shared/            # Shared types and schemas
├── docker/            # Docker configurations
└── docs/              # Documentation
```

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **State**: Zustand 4
- **API**: TanStack Query 5
- **WebSocket**: Socket.io-client
- **UI**: shadcn/ui (Radix UI)

### Backend
- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **ORM**: Prisma 6
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth + JWT
- **WebSocket**: Socket.io 4.7
- **AI**: Anthropic Claude API
- **MCP**: @modelcontextprotocol/sdk

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL (Supabase account)
- Anthropic API key

### Installation

```bash
# Clone and navigate
cd apps/tekup-ai

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
cd backend
pnpm prisma migrate dev

# Start development servers
cd ..
pnpm dev
```

### Environment Variables

Create `.env` file in root:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# AI Providers
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..." # Optional backup

# Redis (for production)
REDIS_URL="redis://..."

# MCP Servers (auto-discovered from user integrations)
```

## Development

```bash
# Start all services
pnpm dev

# Frontend only (http://localhost:3000)
pnpm --filter @tekup/ai-frontend dev

# Backend only (http://localhost:3001)
pnpm --filter @tekup/ai-backend dev

# Build for production
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## Project Structure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture.

## MCP Integration

TekupAI integrates with your existing MCP servers:

- **knowledge-mcp** (port 8051) - Documentation search
- **code-intelligence-mcp** (port 8052) - Code analysis
- **database-mcp** (port 8053) - Database operations
- **billy-mcp** (Render.com) - Accounting operations

See [docs/MCP_INTEGRATION.md](docs/MCP_INTEGRATION.md) for integration guide.

## Deployment

### Render.com (Recommended)

```bash
# Deploy using render.yaml
render deploy
```

### Docker

```bash
# Build images
docker-compose build

# Run containers
docker-compose up -d
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment guide.

## Features

### Phase 1: Foundation ✅
- [x] Project structure
- [x] Database schema
- [x] Authentication
- [x] Basic UI shell

### Phase 2: Core Chat (In Progress)
- [ ] Chat interface
- [ ] Streaming responses
- [ ] Conversation management
- [ ] Message history

### Phase 3: MCP Integration
- [ ] HTTP MCP client
- [ ] STDIO MCP client
- [ ] Tool execution
- [ ] Tool visualization

### Phase 4: Memory System
- [ ] Memory CRUD
- [ ] Memory injection
- [ ] Auto-detection
- [ ] Memory UI

### Phase 5: Integrations
- [ ] Settings UI
- [ ] MCP management
- [ ] Saved prompts

### Phase 6: Production
- [ ] Performance optimization
- [ ] Monitoring
- [ ] Testing
- [ ] Documentation

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [MCP Integration](docs/MCP_INTEGRATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

PRIVATE - All rights reserved

## Support

For issues and questions, contact Jonas Abde <[email protected]>
