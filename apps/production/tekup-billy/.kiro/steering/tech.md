# Technology Stack

## Core Technologies

- **Runtime**: Node.js 18+ (ESM modules)
- **Language**: TypeScript 5.3+ with strict mode
- **Framework**: Model Context Protocol (MCP) SDK
- **HTTP Server**: Express.js with compression, CORS, helmet
- **API Client**: Axios with HTTP keep-alive agents

## Key Dependencies

- **MCP**: `@modelcontextprotocol/sdk` - Core MCP server functionality
- **Validation**: `zod` - Runtime type validation and schemas
- **Database**: `@supabase/supabase-js` - Optional caching and audit logging
- **Caching**: `ioredis` - Redis client for horizontal scaling
- **Security**: Built-in AES-256-GCM encryption, `helmet` for HTTP security
- **Monitoring**: `winston` - Structured logging, `opossum` - Circuit breaker

## Build System

```bash
# Development
npm run dev          # MCP stdio server (development)
npm run dev:http     # HTTP server (development)

# Production
npm run build        # TypeScript compilation to dist/
npm start            # MCP stdio server (production)
npm run start:http   # HTTP server (production)

# Testing
npm test             # Run all tests
npm run test:integration  # Local integration tests
npm run test:production   # Production health checks

# Docker
npm run docker:build     # Build Docker image
npm run docker:run       # Run container
```

## Configuration

- **Environment**: `.env` file with Billy.dk API credentials
- **TypeScript**: ESNext modules, strict type checking, source maps
- **Deployment**: Docker multi-stage builds, Render.com ready
- **Optional Features**: Supabase (caching), Redis (scaling), Sentry (monitoring)

## Code Standards

- **Modules**: ESM imports with `.js` extensions
- **Validation**: Zod schemas for all tool inputs
- **Error Handling**: Structured error responses with Billy API error extraction
- **Logging**: Winston with structured metadata
- **Types**: Comprehensive TypeScript interfaces for Billy.dk API
