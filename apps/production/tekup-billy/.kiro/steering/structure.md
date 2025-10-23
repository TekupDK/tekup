# Project Structure

## Directory Organization

```
src/
├── index.ts              # MCP stdio server entry point
├── http-server.ts        # HTTP REST API wrapper
├── billy-client.ts       # Billy.dk API client with rate limiting
├── config.ts             # Environment validation and configuration
├── types.ts              # TypeScript interfaces for Billy.dk API
├── tools/                # MCP tool implementations
│   ├── invoices.ts       # Invoice lifecycle (8 tools)
│   ├── customers.ts      # Customer management (4 tools)
│   ├── products.ts       # Product catalog (3 tools)
│   ├── revenue.ts        # Revenue analytics (1 tool)
│   ├── presets.ts        # Workflow presets (6 tools)
│   ├── analytics.ts      # Data analytics (5 tools)
│   ├── test-runner.ts    # Test scenarios (3 tools)
│   └── debug.ts          # Debug utilities (2 tools)
├── database/             # Data layer
│   ├── supabase-client.ts    # Supabase integration
│   └── cache-manager.ts      # Caching with Redis support
├── middleware/           # Cross-cutting concerns
│   └── audit-logger.ts   # Audit logging wrapper
└── utils/                # Utilities
    ├── logger.ts         # Winston logging setup
    ├── data-logger.ts    # Action logging
    └── error-handler.ts  # Billy API error extraction
```

## Architecture Patterns

### Tool Organization

- **One file per domain**: invoices, customers, products, etc.
- **Consistent exports**: Each tool file exports async functions
- **Zod validation**: Input schemas defined at top of each file
- **Error handling**: Structured responses with Billy API error extraction

### Server Architecture

- **TekupBillyServer class**: Main server with tool registration
- **Lazy initialization**: Billy client, cache manager, auditor created on demand
- **Audit wrapper**: `wrapToolWithAudit()` for consistent logging
- **Dual transport**: Stdio (MCP) + HTTP (REST API)

### Configuration Management

- **Environment validation**: Zod schemas in `config.ts`
- **Flexible org ID**: Supports both `BILLY_ORG_ID` and `BILLY_ORGANIZATION_ID`
- **Optional features**: Supabase and Redis auto-detected from env vars
- **Deployment ready**: Docker, Render.com, environment groups

### File Naming Conventions

- **kebab-case**: For files and directories
- **PascalCase**: For classes and interfaces
- **camelCase**: For functions and variables
- **UPPER_CASE**: For constants and environment variables

## Key Files

- **Entry Points**: `index.ts` (MCP), `http-server.ts` (HTTP)
- **Core Logic**: `billy-client.ts` (API), `tools/*.ts` (implementations)
- **Configuration**: `config.ts`, `.env`, `package.json`
- **Deployment**: `Dockerfile`, `render.yaml`, `deployment/`
- **Documentation**: `docs/`, `README.md`, `CHANGELOG.md`
