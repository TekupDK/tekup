# GitHub Copilot Instructions

## Architecture Overview

TekUp.org is a **pnpm monorepo** with 30+ apps and 18+ packages for multi-tenant SMB IT support SaaS. Key architectural patterns:

- **NestJS + Prisma** for backend APIs (flow-api, tekup-crm-api, secure-platform)
- **Next.js 15 + React 18** for web frontends with TailwindCSS
- **Shared packages** in `@tekup/*` namespace for cross-app utilities
- **Multi-tenant** with tenant isolation across all services
- **AI Integration** via Jarvis consciousness system with feature flag control

## Essential Commands

```bash
# Bootstrap entire monorepo (required after clone)
pnpm bootstrap

# Auto-generate .env files across all apps
pnpm run env:auto

# Run all services in parallel
pnpm dev

# App-specific development
pnpm --filter <app-name> dev
pnpm --filter @tekup/<package-name> build

# Database operations (Prisma)
pnpm --filter <app-name> exec prisma generate
pnpm --filter <app-name> exec prisma migrate dev --name <migration-name>
```

## Critical Dependencies

**Always build @tekup/config before running dependent apps:**
```bash
pnpm --filter @tekup/config build
```

Most apps depend on shared packages. Run `pnpm bootstrap` or build dependencies first.

## Environment Configuration

**Auto-generated environments** via `scripts/env-auto.mjs`:
- **API apps**: `DATABASE_URL`, `JWT_SECRET` (auto-generated), `JWT_EXPIRES_IN`
- **Web apps**: `NEXT_PUBLIC_API_URL` (auto-inferred from sibling `-api` apps)
- **Jarvis integration**: `JARVIS_ENABLED=true/false`, `NEXT_PUBLIC_VOICE_AGENT_JARVIS_MODE=mock/real/off`

Run `pnpm run env:auto` after adding new apps or missing env vars.

## Key Application Patterns

### NestJS APIs (flow-api, tekup-crm-api)
- **Structure**: `src/` with modules, controllers, services, DTOs
- **Scripts**: `dev`, `dev:jarvis` (with Jarvis enabled), `prisma:*` commands
- **Testing**: Jest with supertest for E2E, `--runInBand` for database tests

### Next.js Apps (flow-web, tekup-crm-web)
- **Structure**: `app/` directory (App Router), `components/`, `lib/`
- **Shared state**: Zustand for client state management
- **API calls**: `@tekup/api-client` package for typed API communication
- **Styling**: TailwindCSS with component patterns

### Shared Packages (@tekup/*)
- **Entry**: `src/index.ts` with named exports
- **Build**: TypeScript compilation to `dist/` 
- **Testing**: Jest with ts-jest, separate config per package

## Jarvis AI Integration

**Feature flag system** across applications:
- **Voice Agent**: `NEXT_PUBLIC_VOICE_AGENT_JARVIS_MODE` (mock/real/off)
- **Flow API**: `JARVIS_ENABLED` flag with `/jarvis/*` endpoints
- **Implementation**: Mock mode fully functional, real mode via dynamic imports

Example Jarvis-enabled development:
```bash
pnpm --filter @tekup/voice-agent dev:jarvis:mock  # Default
pnpm --filter flow-api dev:jarvis                 # Backend with Jarvis
```

## Package Management Conventions

**Workspace dependencies**:
- Use `workspace:*` for internal package references
- Shared overrides in root `package.json` for React versions
- Add deps: `pnpm --filter <app-name> add <package>`

**Common shared packages**:
- `@tekup/shared`: Utilities, voice processing, types
- `@tekup/config`: Centralized configuration management  
- `@tekup/auth`: JWT utilities and authentication helpers
- `@tekup/api-client`: Typed API client for cross-app communication

## Database Patterns

**Prisma integration**:
- Schema in `prisma/schema.prisma` per app
- Generated client: `@prisma/client` 
- Migrations: Use descriptive names, run in sequence
- Multi-tenant: Tenant filtering in all queries

## Testing Strategy

**Hierarchy**: Unit (Jest) → Integration (supertest) → E2E (playwright for web)
- **API tests**: `--runInBand` for database isolation
- **Web tests**: Vitest + Testing Library for Next.js apps
- **Shared tests**: `packages/testing` utilities

## Windows Development

**Required setup**:
- Enable Developer Mode
- Exclude repo from Windows Defender  
- Avoid OneDrive paths
- Close VS Code/Node before `pnpm install`
- Consider Dev Container or WSL2 for optimal experience

## Documentation Generation

**Automated docs** via scripts:
```bash
pnpm docs:typedoc    # Generate API docs
pnpm docs:openapi    # Export OpenAPI specs
pnpm docs:dev        # Serve docs locally
```

Generated docs in `docs/build/` directory.

## Common Pitfalls

1. **Forget to build @tekup/config** → Apps fail to start
2. **Missing env vars** → Run `pnpm run env:auto`
3. **Prisma client out of sync** → Run `prisma generate`
4. **Windows symlink issues** → Use `node-linker=hoisted` in .npmrc
5. **Port conflicts** → Apps use predictable ports (3000, 3001, 4000, 4010...)

## Multi-App Development

**Start related services together**:
```bash
pnpm dev:core     # flow-api + flow-web + voice-agent
pnpm dev:crm      # CRM API + Web
pnpm dev:ai       # AI-focused applications
```

Cross-app communication via `@tekup/api-client` with environment-based URLs.
