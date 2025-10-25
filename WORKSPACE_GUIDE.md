# Tekup Portfolio Workspace Guide

**Last Updated:** October 25, 2025
**Workspace:** Tekup-Portfolio.code-workspace

---

## Overview

This is a **multi-project monorepo workspace** containing all Tekup portfolio projects. The workspace is organized hierarchically with clear separation of concerns.

---

## Folder Structure

```
tekup/
├── apps/
│   ├── production/              # Production-ready services
│   │   ├── tekup-database/      # Main database layer
│   │   ├── tekup-vault/         # Knowledge management (TekupVault)
│   │   └── tekup-billy/         # Accounting MCP server (Billy integration)
│   │
│   ├── web/                     # Web applications
│   │   └── tekup-cloud-dashboard/  # Main dashboard UI
│   │
│   └── rendetalje/              # Complete Rendetalje cleaning service platform
│       ├── monorepo/            # Primary development environment
│       ├── services/
│       │   ├── backend-nestjs/  # NestJS API server
│       │   ├── frontend-nextjs/ # Next.js web application
│       │   ├── mobile/          # React Native + Expo mobile app
│       │   ├── shared/          # Shared utilities and types
│       │   ├── database/        # Prisma schemas and migrations
│       │   ├── deployment/      # Deployment configurations
│       │   ├── scripts/         # Build and automation scripts
│       │   └── calendar-mcp/    # Calendar intelligence MCP service
│       └── docs/                # Comprehensive documentation
│
├── services/                    # Backend services (root level)
│   ├── tekup-ai/                # AI orchestration monorepo
│   └── tekup-gmail-services/    # Gmail automation services
│
├── tekup-secrets/               # Private: Credentials and secrets
├── archive/                     # Archived/deprecated projects
│
├── .vscode/                     # VS Code configurations
│   ├── launch.json              # Debug configurations
│   └── tasks.json               # Task automation
│
├── docker-compose.mobile.yml    # Docker orchestration for mobile dev
├── start-mobile-docker-isolated.ps1  # Helper script for parallel branches
└── Tekup-Portfolio.code-workspace    # This workspace file
```

---

## Project Relationships

### Rendetalje Ecosystem

The Rendetalje folder contains a complete full-stack application with multiple deployment targets:

- **Backend (NestJS)**: REST API serving both web and mobile
- **Frontend (Next.js)**: Web application for customers and admin
- **Mobile (Expo)**: Native iOS/Android app for field technicians
- **Calendar MCP**: AI-powered scheduling intelligence
- **Shared**: Common TypeScript types, utilities, validators

All services share the same database (Supabase PostgreSQL) and authentication system.

### Production Services

- **TekupVault**: Indexes and searches across all repositories
- **Tekup Billy**: MCP server for accounting integration (Billy.dk API)
- **Tekup Database**: Central data layer

### Service vs Monorepo

**apps/rendetalje/monorepo/** is the **primary development location** for Rendetalje. It contains the full codebase in a unified structure.

**apps/rendetalje/services/** contains individual services that can be deployed separately. Some services reference back to the monorepo, while others are standalone.

**Recommendation**: Develop in `monorepo/`, deploy from `services/` when needed.

---

## VS Code Configuration

### Debug Configurations (launch.json)

- **Backend: Debug (NestJS)**: Debug the NestJS backend
- **Frontend: Debug (Next.js)**: Debug the Next.js frontend
- **Mobile: Expo Start**: Start Expo dev server
- **Docker: Attach to Backend**: Attach to running Docker container
- **Test: Current File (Jest)**: Run Jest tests for current file
- **Full Stack: Backend + Frontend**: Start both simultaneously

### Tasks (tasks.json)

Quick commands available via `Ctrl+Shift+P` → "Run Task":

**Docker Tasks**:
- Docker: Start All Services
- Docker: Start All Services (Build)
- Docker: Stop All Services
- Docker: Mobile Isolated Start

**Backend Tasks**:
- Backend: Install Dependencies
- Backend: Start Dev Server
- Backend: Run Tests

**Frontend Tasks**:
- Frontend: Install Dependencies
- Frontend: Start Dev Server
- Frontend: Build Production
- Frontend: Run Playwright Tests

**Mobile Tasks**:
- Mobile: Install Dependencies
- Mobile: Start Expo
- Mobile: Start Expo (Clear Cache)
- Mobile: Reset & Reinstall

**Utility Tasks**:
- TypeScript: Check All
- Git: Pull All Repos
- Setup: Install All Dependencies (parallel)

---

## Port Allocation

See `PORT_ALLOCATION_MASTER.md` for complete port assignment strategy.

**Key Ports**:
- `3001`: Backend (NestJS)
- `3002`: Frontend (Next.js)
- `5432`: PostgreSQL
- `6379`: Redis
- `8081`: React Native Metro bundler
- `19000-19002`: Expo development tools

---

## Development Workflows

### Starting the Full Stack (Local)

```powershell
# Backend
cd apps/rendetalje/services/backend-nestjs
npm run start:dev

# Frontend
cd apps/rendetalje/services/frontend-nextjs
npm run dev

# Mobile
cd apps/rendetalje/services/mobile
npm run start
```

### Starting with Docker

```powershell
# All services
docker-compose -f docker-compose.mobile.yml up --build

# Or use the helper script (supports parallel branches)
.\start-mobile-docker-isolated.ps1
```

### Running Tests

```powershell
# Backend tests
cd apps/rendetalje/services/backend-nestjs
npm test

# Frontend E2E tests
cd apps/rendetalje/services/frontend-nextjs
npm run test:e2e
```

---

## Workspace Settings

Key settings configured in `Tekup-Portfolio.code-workspace`:

- **Auto-save**: On focus change
- **Format on save**: Prettier
- **ESLint auto-fix**: On save
- **TypeScript**: Workspace version
- **Excluded from explorer**: node_modules, .git, dist, .next, .turbo

---

## Git Workflow

### Branch Naming

- Feature branches: `feature/feature-name` or `claude/implement-feature-*`
- Bug fixes: `fix/bug-description`
- Main branch: `master`

### Parallel Branch Development

Use the `start-mobile-docker-isolated.ps1` script to run multiple feature branches simultaneously with isolated ports and containers.

---

## Documentation

- **BRANCH_STATUS.md**: Current branch status and history
- **FEATURE_ANALYSIS.md**: Technical feature deep-dives
- **PORT_ALLOCATION_MASTER.md**: Complete port assignment strategy
- **apps/rendetalje/docs/**: Comprehensive project documentation

---

## Next Steps for New Developers

1. **Install dependencies**: Run "Setup: Install All Dependencies" task
2. **Configure environment**: Copy `.env.example` to `.env.local` in each service
3. **Start Docker services**: Run "Docker: Start All Services (Build)" task
4. **Open documentation**: Read `apps/rendetalje/docs/` for project specifics
5. **Run tests**: Verify everything works with "Backend: Run Tests" task

---

## Troubleshooting

### Port Conflicts

Use `docker-compose -f docker-compose.mobile.yml down` to stop all services, then restart.

### Mobile App Not Loading

```powershell
cd apps/rendetalje/services/mobile
npm run reset  # Cleans cache and reinstalls
```

### TypeScript Errors

Run "TypeScript: Check All" task to see all errors across the workspace.

### Docker Build Fails

Check that no other containers are using the same ports:
```powershell
docker ps  # See running containers
docker-compose -f docker-compose.mobile.yml down  # Stop this project's containers
```

---

**Questions?** Check the documentation in `apps/rendetalje/docs/` or create an issue on GitHub.

**Last Review:** October 25, 2025
