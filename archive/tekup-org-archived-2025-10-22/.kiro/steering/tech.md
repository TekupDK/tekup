# Technology Stack & Build System

## Package Management
- **Package Manager**: pnpm 9.9.0 (required, managed via Corepack)
- **Node Version**: 18.18.0+ (use `.nvmrc` for version management)
- **Workspace**: pnpm workspaces with monorepo structure

## Core Technologies

### Backend
- **Framework**: NestJS for API applications
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth via `@tekup/auth` package
- **API Documentation**: OpenAPI/Swagger auto-generation

### Frontend
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shared via `@tekup/ui` package
- **State Management**: React hooks and context

### Development Tools
- **Build System**: Nx for monorepo orchestration
- **TypeScript**: Strict mode enabled, ES2021 target
- **Linting**: ESLint with TypeScript, JSDoc enforcement
- **Testing**: Jest with coverage thresholds (70% lines, 60% branches)
- **Formatting**: Prettier
- **Git Hooks**: Husky with lint-staged

## Common Commands

### Setup & Bootstrap
```bash
# Initial setup
corepack enable
corepack prepare pnpm@9.9.0 --activate
pnpm bootstrap
pnpm run env:auto  # Auto-generates .env files
```

### Development
```bash
pnpm dev                    # Run all services in parallel
pnpm run crm:dev           # Run CRM API only
pnpm run crm:web:dev       # Run CRM web only
```

### Building & Testing
```bash
pnpm build                 # Build all packages and apps
pnpm test                  # Run all tests
pnpm run crm:test         # Run CRM API tests
pnpm lint                 # Lint all code
pnpm typecheck            # TypeScript checking
```

### Database Operations
```bash
pnpm --filter tekup-crm-api exec prisma generate
pnpm --filter tekup-crm-api exec prisma migrate dev -n init
```

### Documentation
```bash
pnpm docs:dev             # Start local docs server
pnpm docs:typedoc         # Generate TypeDoc
pnpm docs:openapi         # Export OpenAPI specs
pnpm docs:all             # Build all documentation
```

### CI Pipeline
```bash
pnpm ci                   # Full CI: install, lint, typecheck, test, build
```

## Environment Management
- **Automation**: `scripts/env-auto.mjs` ensures required env vars across all apps
- **API Apps**: Auto-generates `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`
- **Web Apps**: Auto-infers `NEXT_PUBLIC_API_URL` from sibling API ports
- **Execution**: Runs on `postinstall` and via `pnpm run env:auto`

## Windows Development Notes
- Prefer Dev Container/WSL2 for optimal experience
- Enable Developer Mode and exclude repo from Windows Defender
- Avoid OneDrive paths for repository location
- Use pnpm config: `node-linker=hoisted` and `package-import-method=copy`

## Deployment
- **Containerization**: Docker Compose available for local development
- **Production**: Vercel for frontend apps, Railway/AWS for backend APIs
- **Monitoring**: Grafana + Prometheus setup in `/monitoring`