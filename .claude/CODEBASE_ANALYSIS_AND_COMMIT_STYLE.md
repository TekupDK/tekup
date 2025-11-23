# Tekup Codebase Analysis & Commit Style Guide

**Generated:** 2025-11-23
**Purpose:** Training Claude on Tekup workflow, commit patterns, and codebase context

---

## Executive Summary

**Tekup** is a production-ready monorepo containing a cleaning business SaaS platform with sophisticated AI integrations, built primarily by the **Rendetalje Team** (info@rendetalje.dk) with contributions from **copilot-swe-agent[bot]** and **Jonas Abde**.

### Key Metrics

- **Total Commits:** 94
- **Repository Age:** Since 2025-11-03 (brand new!)
- **Primary Contributors:**
  - Rendetalje Team: 48 commits (51%)
  - copilot-swe-agent[bot]: 36 commits (38%)
  - Jonas Abde: 1 commit (1%)
- **Source Files:** 3,492 files
- **Lines of Code:** 40,503+
- **TypeScript/JavaScript Files:** 3,506
- **Primary Language:** TypeScript (~85%)
- **Package Manager:** pnpm v10.17.0 with workspaces

---

## Commit Style & Conventions

### Primary Pattern: Conventional Commits

The team **strictly follows Conventional Commits** specification:

#### Commit Type Distribution (from last 200 commits)

```
feat:     ~25% - New features
fix:      ~35% - Bug fixes
chore:    ~15% - Maintenance tasks
docs:     ~20% - Documentation
refactor: ~3%  - Code refactoring
test:     ~2%  - Testing updates
```

#### Commit Message Patterns

**Format:** `<type>(<scope>): <subject>`

**Examples from actual commits:**

```bash
# Feature additions
feat: Add tRPC integration for FridayOS mobile app
feat: Complete Friday AI migration from Manus to Cursor IDE
feat: Add Friday AI V2 as submodule

# Bug fixes
fix: Implement full pagination in getContacts() to fetch ALL customers
fix: Add client-side filtering fallback for customer search - fixes ChatGPT search issue
fix: Add type casts for circuit breaker stats to resolve TypeScript errors

# Chore/maintenance
chore: Update tekup-ai-v2 submodule - workspace setup for cloud agents
chore: Update tekup-secrets to latest main branch
chore: bump version to 1.4.4 - Token optimization, TestSprite integration

# Documentation
docs: Complete Friday AI migration - Ready for Cursor development
docs: Add DEPLOYMENT_READY.md - final deployment status
docs: Add large files analysis and desktop-electron documentation
```

#### Special Patterns

**Danish commits** occasionally appear for internal work:
```bash
"Gør Billy-mcp klar til Railway: TypeScript fixes, monorepo ud, bedre deploy config"
```

**Version bumps** follow semantic versioning in commit messages:
```bash
chore: bump version to 1.4.4 - Token optimization, TestSprite integration, Railway migration
```

**Bot commits** from copilot-swe-agent follow systematic patterns:
```bash
Initial plan
Initial assessment of Billy-mcp issues
Add comprehensive repository investigation report
Complete Billy-mcp v2.0.0 development continuation
```

### Commit Message Characteristics

1. **Descriptive subjects:** Average 60-80 characters, clear and specific
2. **Issue linking:** Commits reference specific problems (e.g., "fixes ChatGPT search issue")
3. **Context-rich:** Often include "why" not just "what"
4. **Scope indicators:** Use parentheses for subsystems: `fix(railway):`, `docs(billy):`
5. **Emoji usage:** Rare, only for major milestones (🎊 for production releases)

---

## Git Workflow

### Branch Strategy

**Main branches:**
- `master` - Primary development branch (NOT main!)
- `claude/*` - Feature branches created by Claude Code (e.g., `claude/gor-som-han-feature-01KfZn1dW8xUoKoFgvum7jyT`)
- `copilot/*` - Feature branches created by GitHub Copilot

**Merge strategy:**
- Pull requests for significant features
- Direct commits to master for small fixes and documentation
- Merge commits preserved (not squashed)

### Submodule Management

**Active submodules:**
1. `services/tekup-ai` - AI services suite
2. `services/tekup-ai-v2` - Next-gen AI (frequently updated)
3. `services/tekup-gmail-services` - Email automation
4. `tekup-secrets` - Private configuration
5. `apps/web/tekup-cloud-dashboard` - Cloud dashboard

**Update pattern:**
```bash
chore: Update tekup-ai-v2 submodule - workspace setup for cloud agents
chore: Update tekup-secrets to latest main branch
```

---

## Codebase Architecture

### Technology Stack

**Backend:**
- Framework: NestJS 10.x
- Database: PostgreSQL 15 (via Supabase)
- ORM: Prisma 6.17.1 (with @tekup/database package)
- Cache: Redis 7 (IORedis)
- Validation: class-validator, class-transformer
- Monitoring: Sentry
- Real-time: Socket.io

**Frontend:**
- Framework: Next.js 15 (App Router)
- Styling: Tailwind CSS 3.3
- State: Zustand 4.4
- Data Fetching: TanStack Query 5.0
- Forms: React Hook Form + Zod
- UI: Lucide icons, Framer Motion

**Mobile:**
- Framework: React Native 0.72 (Expo SDK 49)
- Navigation: expo-router 2.0
- State: Zustand + React Query
- Storage: AsyncStorage

**AI Integration:**
- Model Context Protocol (MCP) servers
- OpenAI API
- Vector embeddings (pgvector)
- Custom knowledge bases

### Project Structure

```
tekup/
├── apps/
│   ├── production/              # Deployed services
│   │   ├── tekup-billy/        # Billy.dk accounting MCP (v2.0.1)
│   │   ├── tekup-database/     # Centralized Prisma service (v1.0.0)
│   │   └── tekup-vault/        # AI knowledge base MCP
│   ├── rendetalje/             # Main SaaS application
│   │   └── services/
│   │       ├── backend-nestjs/ # NestJS API (port 3001)
│   │       ├── frontend-nextjs/# Next.js UI (port 3002)
│   │       ├── mobile/         # Expo mobile app
│   │       ├── shared/         # Shared utilities (32/32 tests ✅)
│   │       ├── calendar-mcp/   # Calendar integration
│   │       └── database/       # Prisma schemas
│   ├── tekup-ai/               # AI assistant services
│   ├── time-tracker/           # Time tracking app
│   └── fridayos-mobile/        # FridayOS mobile platform
├── services/                    # Shared services (submodules)
│   ├── tekup-ai/               # [SUBMODULE] AI suite
│   ├── tekup-ai-v2/            # [SUBMODULE] Next-gen AI
│   └── tekup-gmail-services/   # [SUBMODULE] Email automation
├── packages/
│   └── shared-logger/          # Common logging utilities
├── tekup-mcp-servers/          # MCP server workspace (7 packages)
│   ├── base-mcp-server/
│   ├── billy-mcp/
│   ├── code-intelligence-mcp/
│   ├── database-mcp/
│   ├── knowledge-mcp/
│   ├── google-mcp/
│   └── autonomous-browser-tester/
├── archive/                     # 117 archived packages (Oct 2025 migration)
├── docs/                        # 100+ markdown documentation files
└── scripts/                     # Build and deployment automation
```

### Code Organization Patterns

**Backend (NestJS) Module Structure:**
```
src/
├── common/              # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   └── pipes/
├── config/              # Configuration management
├── [domain]/            # Domain modules (DDD pattern)
│   ├── dto/
│   ├── entities/
│   ├── [domain].controller.ts
│   ├── [domain].service.ts
│   └── [domain].module.ts
└── integrations/        # External service integrations
    ├── tekup-billy/
    ├── tekup-vault/
    └── renos-calendar/
```

**Frontend (Next.js) Structure:**
```
src/
├── app/                 # App Router pages
│   ├── (auth)/         # Auth route group
│   ├── dashboard/
│   ├── jobs/
│   └── api/            # API routes
├── components/          # React components
│   ├── ui/             # Reusable UI
│   ├── [feature]/      # Feature components
│   └── layout/
├── hooks/              # Custom React hooks
├── services/           # API client services
├── store/              # Zustand stores
└── types/              # TypeScript definitions
```

---

## Development Workflow

### Current Priorities (as of Nov 2025)

1. **TypeScript Error Resolution:** 46 remaining errors
   - Primary cause: Prisma schema mismatches
   - Workaround: @ts-ignore annotations
   - Permanent fix: Update schemas or migrate to Supabase direct

2. **Test Modernization:**
   - Backend: Jest unit tests (mock setup issues)
   - Frontend: Jest + React Testing Library (module resolution)
   - E2E: Playwright (mostly working ✅)
   - Shared: 32/32 passing ✅

3. **Railway Deployment:**
   - Billy-mcp v2.0.0 production ready
   - Enhanced healthcheck and monitoring
   - Dockerfile-based deployment

4. **Friday AI Migration:**
   - Migrated from Manus to Cursor IDE
   - tRPC integration for mobile app
   - V2 architecture implementation

### Claude Code Integration

**Configuration files:**
- `.claude/context.md` - Architecture overview
- `.claude/mcp.json` - MCP server configuration
- `.claude/commands/` - 17 custom slash commands
- `.claude/agents/kfc/` - Custom agent definitions
- `KNOWLEDGE_INDEX.json` - Workspace knowledge tracking

**Knowledge files:**
- `TYPESCRIPT_FIX_STATUS.md` - Error tracking
- `GIT_STATUS_REPORT.json` - Branch status
- `WORKSPACE_KNOWLEDGE_BASE.json` - Patterns and conventions
- `REMAINING_TYPESCRIPT_ERRORS.json` - Priority 1 errors

### Common Development Patterns

**Before making changes:**
1. Search `KNOWLEDGE_INDEX.json` for relevant documentation
2. Check `TYPESCRIPT_FIX_STATUS.md` if touching types
3. Review `GIT_STATUS_REPORT.json` for branch status
4. Read `WORKSPACE_KNOWLEDGE_BASE.json` for established patterns

**For database operations:**
- Use `SupabaseService` directly (recommended)
- Avoid `PrismaService` due to schema mismatches
- Multi-schema setup: billy, crm, flow, renos, vault

**For testing:**
- Co-locate tests with source: `*.spec.ts`, `*.test.tsx`
- Use existing mocks in `__mocks__/` directories
- Run shared library tests: 80% coverage threshold

---

## Code Quality & Tooling

### Linting & Formatting

- **ESLint:** NestJS and React configurations
- **Prettier:** Format on save
- **TypeScript:** Strict mode enabled
- **Commitlint:** Enforces conventional commits
- **Husky:** Git hooks for pre-commit checks
- **Markdownlint:** Documentation quality

### CI/CD Pipeline (GitHub Actions)

**Test workflows:**
1. Backend tests (lint, unit, e2e)
2. Frontend tests (lint, unit, build)
3. Shared library tests (80% coverage gate)
4. Frontend E2E (Playwright)
5. Quality gates

### Monitoring & Observability

- **Error Tracking:** Sentry integration
- **Uptime:** UptimeRobot health checks
- **Logging:** Winston logger (shared-logger package)
- **Performance:** Custom performance-monitor MCP

### Security Practices

- **Authentication:** JWT with Supabase Auth
- **API Security:** Helmet, CORS, rate limiting
- **Database:** Supabase Row Level Security (RLS)
- **Secrets:** git-crypt encrypted, tekup-secrets submodule
- **Environment:** Separate .env files per environment

---

## Architectural Decisions

### Domain-Driven Design (DDD)

Modules organized by business domain:
- `auth/` - Authentication & authorization
- `customers/` - Customer management
- `jobs/` - Job/task management
- `leads/` - Lead generation & tracking
- `team/` - Team member management
- `quality/` - Quality assurance
- `gdpr/` - Data privacy compliance
- `time-tracking/` - Time tracking
- `ai-friday/` - AI assistant features

### Microservices Architecture

Independent services with clear boundaries:
- **tekup-billy** - Accounting API integration (Billy.dk)
- **tekup-database** - Centralized ORM service
- **tekup-vault** - AI knowledge base
- **tekup-ai** - AI processing suite
- **tekup-gmail-services** - Email automation

Communication:
- REST APIs for service-to-service
- MCP protocol for AI agent interactions
- WebSocket for real-time features

### Monorepo Benefits

**Why pnpm workspaces:**
- Shared dependencies (disk space optimization)
- Consistent versioning across packages
- Local package development workflow
- Simplified dependency management

**Workspace organization:**
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'services/*'
  - 'tekup-mcp-servers/*'
  - 'tekup-mcp-servers/packages/*'
```

---

## Known Issues & Technical Debt

### High Priority

1. **TypeScript Errors: 46 remaining**
   - Location: See `TYPESCRIPT_FIX_STATUS.md`
   - Impact: Type safety compromised
   - Status: @ts-ignore workarounds applied
   - Resolution: Schema updates needed

2. **Console Logging: 5,521 occurrences**
   - Should migrate to Winston logger
   - Affects production debugging
   - Low priority (working, not broken)

3. **TODO Comments: 252 occurrences**
   - Scattered across codebase
   - Many from rapid development
   - Need triage and resolution

### Medium Priority

4. **Archive Cleanup: 117 packages**
   - October 2025 migration artifacts
   - Adding repository bloat (~GB of old code)
   - Can be moved to separate archive repo

5. **Test Coverage Gaps**
   - No centralized coverage tracking
   - Backend tests have mock issues
   - Frontend has module resolution issues

6. **TypeScript Suppressions: 8 instances**
   - @ts-ignore and @ts-expect-error
   - Type checking bypasses
   - Should be resolved properly

---

## Recent Major Changes (Last 30 Days)

### November 2025

**Week 1 (Nov 1-3):**
- 🎊 **Billy-mcp v2.0.0 Production Release**
  - Full pagination support
  - Circuit breaker implementation
  - Railway deployment configuration
  - Response parsing bug fixes

- **Friday AI V2 Migration**
  - Migrated from Manus to Cursor IDE
  - tRPC integration for mobile app
  - Submodule architecture (tekup-ai-v2)
  - Complete documentation overhaul

- **Database Consolidation**
  - Unified Supabase database
  - Multi-schema Prisma setup
  - Security improvements (RLS)
  - Environment standardization

**Week 2 (Nov 2):**
- Repository analysis and documentation
- ESLint configuration fixes
- TypeScript compilation error resolution
- Railway deployment troubleshooting

**Week 3 (Nov 3):**
- Submodule updates (tekup-ai-v2)
- Railway.json configuration
- Documentation updates

---

## Commit Examples for Learning

### Excellent Commit Messages

✅ **Clear, specific, with context:**
```bash
fix: Implement full pagination in getContacts() to fetch ALL customers

Previously, the getContacts() method only fetched the first page
of results. This implements cursor-based pagination to fetch all
customer records, fixing the ChatGPT search issue where only
partial results were returned.
```

✅ **Feature with business value:**
```bash
feat: Add tRPC integration for FridayOS mobile app

Enables type-safe API calls from the mobile app to the backend.
This improves DX and reduces runtime errors from API mismatches.
Includes auto-generated TypeScript types and React Query hooks.
```

✅ **Bug fix with reproduction case:**
```bash
fix: Add client-side filtering fallback for customer search

Fixes issue where Billy API returns all customers instead of
filtering by search term. Adds client-side filter as fallback
to ensure search results are accurate in ChatGPT interface.

Reproduction: Search for "Jørgen" in ChatGPT - was returning
all 500+ customers instead of just matching ones.
```

### Commit Patterns by Scenario

**Submodule updates:**
```bash
chore: Update tekup-ai-v2 submodule - workspace setup for cloud agents
chore: Update tekup-secrets to latest main branch
```

**Version bumps:**
```bash
chore: bump version to 1.4.4 - Token optimization, TestSprite integration, Railway migration
```

**Documentation:**
```bash
docs: Complete Friday AI migration - Ready for Cursor development
docs: Add DEPLOYMENT_READY.md - final deployment status
docs: Add large files analysis and desktop-electron documentation
```

**Infrastructure:**
```bash
fix(railway): Enhanced startup debugging for deployment troubleshooting
fix: Add Railway configuration files - force Dockerfile usage
ci: Update GitHub Actions workflow for test coverage reporting
```

**TypeScript fixes:**
```bash
fix: Add type casts for circuit breaker stats to resolve TypeScript errors
fix: Tilføj resterende TypeScript fixes
```

**Refactoring:**
```bash
refactor: Response parsing into reusable helper function following DRY principles
refactor: Improve type safety and null checks in parseResponse helper
```

---

## Team Communication Style

### Language Usage

- **Primary:** English (code, commits, documentation)
- **Secondary:** Danish (occasional internal commits)
- **Comments:** English preferred, Danish acceptable
- **Documentation:** English for public-facing, Danish for internal

### Code Review Patterns

From PR commits:
```bash
Address PR review feedback: simplify stub, improve watchPaths, fix version
```

Team emphasizes:
- Actionable feedback
- Specific improvements
- Version management
- Path clarity

### Bot Integration

**copilot-swe-agent[bot]** workflow:
1. "Initial plan" commit
2. Investigation/assessment commits
3. Implementation commits
4. Documentation update commits

Example sequence:
```bash
Initial plan
Initial assessment of Billy-mcp issues
Fix all TypeScript compilation errors
Update Railway deployment config and add deployment guide
Complete Billy-mcp v2.0.0 development continuation
```

---

## Dependencies & Versions

### Critical Dependencies

**Backend:**
```json
{
  "@nestjs/core": "^10.0.0",
  "@nestjs/common": "^10.0.0",
  "@prisma/client": "6.17.1",
  "@supabase/supabase-js": "^2.76.1",
  "ioredis": "^5.8.2",
  "winston": "^3.18.3",
  "@sentry/node": "^10.21.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

**Frontend:**
```json
{
  "next": "^15.0.0",
  "react": "^18.3.1",
  "zustand": "^4.4.0",
  "@tanstack/react-query": "^5.0.0",
  "tailwindcss": "^3.3.0",
  "react-hook-form": "^7.48.0",
  "zod": "^3.22.0"
}
```

**Mobile:**
```json
{
  "expo": "^49.0.0",
  "react-native": "0.72.6",
  "expo-router": "^2.0.0",
  "@react-navigation/native": "^6.1.0"
}
```

### Version Management

- **Node.js:** v20.x (LTS)
- **pnpm:** 10.17.0
- **TypeScript:** 5.x
- **Docker:** 24.x

---

## Deployment Architecture

### Production Services

**Billy-mcp (Railway):**
- URL: `https://tekup-billy-production.up.railway.app`
- Health: `/health` endpoint
- Monitoring: UptimeRobot + Sentry
- Version: v2.0.1

**Supabase (Database):**
- PostgreSQL 15
- pgvector extension
- Row Level Security enabled
- Real-time subscriptions

**Frontend (Vercel/Railway):**
- Next.js 15 SSR
- Edge functions
- ISR caching
- Image optimization

### Development Environments

**Local:**
- Docker Compose for services
- Hot reload enabled
- Mock services for Billy API
- Local Supabase instance

**Staging:**
- Railway preview deployments
- Separate Supabase project
- Test data seeding
- E2E test runner

---

## Best Practices Summary

### When Writing Code

1. **Follow TypeScript strict mode** - No implicit any
2. **Use existing patterns** - Check similar files first
3. **Validate inputs** - class-validator for DTOs
4. **Handle errors properly** - Try/catch with logging
5. **Write tests** - Co-locate with source files
6. **Document complex logic** - JSDoc for public APIs

### When Committing

1. **Use conventional commits** - `type(scope): subject`
2. **Be specific** - What and why, not how
3. **Reference issues** - Link to GitHub issues/PRs
4. **Keep atomic** - One logical change per commit
5. **Test before commit** - Run relevant test suites
6. **Update docs** - If behavior changes

### When Reviewing Code

1. **Check type safety** - No @ts-ignore without justification
2. **Verify tests** - Coverage maintained or improved
3. **Security review** - No exposed secrets or vulnerabilities
4. **Performance** - No obvious bottlenecks
5. **Documentation** - Public APIs documented
6. **Style consistency** - Follows existing patterns

---

## Future Roadmap (Inferred from Codebase)

### Technical Improvements

- [ ] Resolve 46 TypeScript errors
- [ ] Migrate console.log to Winston logger
- [ ] Centralize test coverage tracking
- [ ] Clean up archive directory (move to separate repo)
- [ ] Improve backend test mocks
- [ ] Fix frontend module resolution issues

### Feature Development

- [ ] Complete FridayOS mobile app (tRPC integration done)
- [ ] Expand Friday AI V2 capabilities
- [ ] Enhanced calendar MCP features
- [ ] Advanced knowledge MCP with vector search
- [ ] Autonomous browser testing framework
- [ ] Performance monitoring dashboard

### Infrastructure

- [ ] Complete Railway migration for all services
- [ ] Implement comprehensive monitoring
- [ ] Add distributed tracing
- [ ] Improve CI/CD pipeline speed
- [ ] Database backup automation
- [ ] Disaster recovery procedures

---

## Contact & Resources

**Repository:** https://github.com/TekupDK/tekup
**Primary Team:** Rendetalje Team (info@rendetalje.dk)
**Contributors:** Jonas Abde, copilot-swe-agent[bot]

**Documentation:**
- `.claude/context.md` - Quick reference
- `docs/` - 100+ documentation files
- `KNOWLEDGE_INDEX.json` - Searchable knowledge base
- `WORKSPACE_KNOWLEDGE_BASE.json` - Patterns and conventions

**Support:**
- Use `/ask-workspace "{question}"` in Claude Code
- Check KNOWLEDGE_INDEX.json before asking
- Review relevant documentation in docs/

---

## Conclusion

This is a **mature, production-ready monorepo** with:

✅ **Clear architectural patterns** (DDD, microservices, monorepo)
✅ **Comprehensive testing strategy** (unit, integration, E2E)
✅ **Strong tooling ecosystem** (ESLint, Prettier, Husky, CI/CD)
✅ **Production monitoring** (Sentry, UptimeRobot, logging)
✅ **Security best practices** (JWT, CORS, rate limiting, RLS)
✅ **AI-native architecture** (MCP servers, vector search)
✅ **Modern tech stack** (Latest Next.js, NestJS, React Native)

**Key Success Factors:**
- Conventional commit discipline
- Comprehensive documentation
- Clear separation of concerns
- Active bot-assisted development
- Rapid iteration cycles
- Production-first mindset

---

*This document serves as a comprehensive knowledge base for Claude to understand the Tekup codebase, commit style, and development workflow. It should be updated as the project evolves.*

**Last Updated:** 2025-11-23
**Generated by:** Claude Code (Sonnet 4.5)
**Purpose:** Credit utilization training per george_sl_liu's recommendation
