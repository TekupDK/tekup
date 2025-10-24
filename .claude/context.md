# Tekup Portfolio - Claude Code Context

## Architecture Overview

This is a **monorepo workspace** containing the entire Tekup business platform.

### Repository Structure
```
C:/Users/Jonas-dev/tekup/          # Main repo (github.com/TekupDK/tekup)
├── apps/
│   ├── production/                 # Live services
│   │   ├── tekup-billy/           # Billy.dk accounting MCP
│   │   ├── tekup-database/        # Centralized Prisma ORM
│   │   └── tekup-vault/           # AI knowledge base MCP
│   ├── rendetalje/                # Main development (NOT a submodule!)
│   │   └── services/
│   │       ├── backend-nestjs/    # NestJS API
│   │       ├── frontend-nextjs/   # Next.js UI
│   │       ├── mobile/            # React Native app
│   │       └── shared/            # Shared library
│   └── web/
│       └── tekup-cloud-dashboard/ # [SUBMODULE]
├── services/
│   ├── tekup-ai/                  # [SUBMODULE] AI services
│   └── tekup-gmail-services/      # [SUBMODULE] Email automation
└── tekup-secrets/                 # [SUBMODULE] Private secrets
```

## Key Files & Entry Points

**Backend:**
- Entry: `apps/rendetalje/services/backend-nestjs/src/main.ts`
- Config: `apps/rendetalje/services/backend-nestjs/src/config/configuration.ts`
- Database: Uses SupabaseService (NOT PrismaService currently)

**Frontend:**
- Entry: `apps/rendetalje/services/frontend-nextjs/src/app/layout.tsx`
- Config: `apps/rendetalje/services/frontend-nextjs/next.config.js`
- Stores: Zustand in `src/store/`

**Mobile:**
- Entry: `apps/rendetalje/services/mobile/App.tsx`
- Config: `apps/rendetalje/services/mobile/app.json`

## Common Issues & Solutions

### TypeScript Errors
- **Current status:** 46 errors remaining (see TYPESCRIPT_FIX_STATUS.md)
- **Primary cause:** Prisma schema mismatch (@tekup/database)
- **Workaround:** @ts-ignore annotations applied
- **Permanent fix:** Update Prisma schema or use Supabase directly

### Testing
- **Backend:** Jest unit tests (some failing - mock setup issues)
- **Frontend:** Jest + React Testing Library (module resolution issues)
- **E2E:** Playwright (mostly working)
- **Shared:** 32/32 tests passing ✅

### Database
- **Development:** Supabase (direct client)
- **ORM:** Prisma via @tekup/database (type issues)
- **Recommendation:** Use SupabaseService for now

### Git Workflow
- **Main branch:** master
- **Feature branches:** claude/* prefix
- **Commit style:** Conventional commits (feat:, fix:, docs:, etc.)
- **Submodules:** 4 active (tekup-ai, tekup-gmail, secrets, dashboard)

## Code Conventions

- **TypeScript:** Strict mode enabled
- **Formatting:** Prettier (format on save)
- **Linting:** ESLint with NestJS/React configs
- **Imports:** Use absolute paths with @ aliases
- **Tests:** Co-located with source (*.spec.ts, *.test.tsx)

## Before Making Changes

1. Search KNOWLEDGE_INDEX.json for relevant docs
2. Check TYPESCRIPT_FIX_STATUS.md if touching types
3. Check GIT_STATUS_REPORT.json for branch status
4. Read WORKSPACE_KNOWLEDGE_BASE.json for patterns

## When You Need Help

Use `/ask-workspace "{question}"` command to search workspace knowledge before asking user.

## Current Focus

- **Active branch:** claude/implement-momentary-feature-011CUSDGPgNNv8NS6psNVgfx
- **Main task:** TypeScript error resolution (46 remaining)
- **Recent work:** Test modernization + service refactoring
- **Next:** Fix Priority 1 TypeScript errors (see REMAINING_TYPESCRIPT_ERRORS.json)
