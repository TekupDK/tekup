# RenOS – AI Agent Development Guide

## 🎯 Project Overview

RenOS is a complete AI operating system for Rendetalje.dk (Danish cleaning company), automating email handling, calendar management, lead conversion, and customer service. Built as a monorepo with TypeScript backend + React frontend.

**Key Architectural Principle:** Intent → Plan → Execute
- `IntentClassifier` analyzes incoming messages (email.lead, calendar.booking, etc.)
- `TaskPlanner` converts intents into actionable `PlannedTask[]` arrays
- `PlanExecutor` uses modular `handlers/` to execute tasks via Gmail/Calendar APIs

## 🏗️ Critical Architecture Patterns

### 1. Dry-Run Safety System
**ALWAYS respect `RUN_MODE` environment variable:**
- `dry-run` (default): Logs actions but never sends emails or creates calendar events
- `live`: Actually executes Google API calls

Check `isLiveMode` from `src/config.ts` before any mutations. See `src/services/gmailService.ts` for examples.

### 2. Handler Registry Pattern
New automation workflows go in `src/agents/handlers/`. Each handler:
- Takes a `PlannedTask` with typed payload
- Returns `ExecutionAction` with status (queued/success/failed)
- Registers in `planExecutor.ts` defaultHandlers map
- Example: `emailComposeHandler.ts`, `calendarBookHandler.ts`

### 3. Google Service Layer
All Google API interactions centralized in `src/services/`:
- `gmailService.ts`: Thread-aware email sending, message listing
- `calendarService.ts`: Booking with conflict detection, availability checks
- `googleAuth.ts`: Domain-wide delegation setup

**Never call Google APIs directly** – always use service layer abstractions.

### 4. Prisma Database Schema
Customer/Lead/Booking models in `prisma/schema.prisma`. Key relationships:
- `Customer` ↔ `Lead` (one-to-many via customerId)
- `Lead` ↔ `Booking` (one-to-many)
- `EmailResponse` tracks auto-generated replies with status (pending/sent/approved/rejected)

Run `npm run db:push` after schema changes, `npm run db:studio` for GUI exploration.

## 🚀 Essential Developer Workflows

### Start Development
```powershell
# Backend only (port 3000)
npm run dev

# Frontend only (port 5173 with API proxy)
npm run dev:client

# Both simultaneously (recommended)
npm run dev:all
```

### Critical CLI Tools (see package.json scripts)
```powershell
# Lead monitoring (parses Leadmail.no emails)
npm run leads:check          # Manual check
npm run leads:monitor        # Start cron job

# Email auto-response (Gemini AI-powered)
npm run email:pending        # List pending responses
npm run email:approve <id>   # Manual approval
npm run email:monitor        # Auto-send approved

# Calendar management
npm run booking:next-slot 120  # Find next free 120-min slot
npm run booking:availability 2025-10-15  # Check specific date

# Database tools
npm run db:studio            # Visual database explorer
npm run db:migrate           # Run migrations (production)
npm run db:push              # Push schema (development)

# Google verification
npm run verify:google        # Test API setup
```

### Testing Philosophy
- Unit tests in `tests/` with Vitest
- Run `npm test` (all) or `npm run test:watch` (watch mode)
- Gmail/Calendar tests use mocked services (see `tests/` for examples)
- **Always test in dry-run mode first** before switching to live

## 🔐 Environment Configuration

### Critical Variables (see `.env.example`)
```ini
RUN_MODE=dry-run                    # NEVER commit with 'live'
DATABASE_URL=postgresql://...       # Required for Prisma
GEMINI_KEY=...                      # AI email generation
GOOGLE_PRIVATE_KEY="-----BEGIN..." # Service account (escape \n)
GOOGLE_IMPERSONATED_USER=info@...  # Domain-wide delegation user
```

**Validation:** `src/env.ts` uses Zod schemas. App crashes immediately on invalid config.

## 📝 Code Conventions

### File Organization
```
src/
├── agents/           # AI core (intent, planning, execution)
│   └── handlers/    # Modular task executors (add new here)
├── services/        # Google/external API abstractions
├── tools/           # CLI utilities (monitoring, management)
├── api/             # Dashboard REST endpoints
├── routes/          # Express routes (chat, health)
├── types.ts         # Shared TypeScript interfaces
└── config.ts        # Environment parsing + validation
```

### TypeScript Types
- Use interfaces from `src/types.ts` (AssistantIntent, PlannedTask, etc.)
- Handler payload types in `src/agents/handlers/types.ts`
- Always export types for cross-module reuse

### Error Handling
- Use custom errors from `src/errors.ts` (ValidationError, IntegrationError)
- Log with `logger` from `src/logger.ts` (Pino structured logging)
- **Never expose raw errors to users** – sanitize in `middleware/errorHandler.ts`

### Danish Language Consistency
- User-facing messages MUST be in Danish (email templates, error messages)
- Code comments can be English
- Variable names in English (taskType, not opgaveType)

## 🔄 Adding New Features

### Example: New Intent Type
1. Add intent to `AssistantIntent` union in `src/types.ts`
2. Add keyword patterns in `src/agents/IntentClassifier.ts`
3. Implement planner method in `src/agents/taskPlanner.ts`
4. Create handler in `src/agents/handlers/yourHandler.ts`
5. Register handler in `src/agents/planExecutor.ts`
6. Add tests in `tests/agents/`

### Example: New CLI Tool
```typescript
// src/tools/yourTool.ts
import { gmailService } from "../services/gmailService";

async function main() {
  const command = process.argv[2];
  // Implement your tool logic
}

main().catch(console.error);
```

Add script to `package.json`:
```json
"your:tool": "ts-node src/tools/yourTool.ts"
```

## 🚨 Common Pitfalls

1. **Forgetting dry-run mode:** Always test with `RUN_MODE=dry-run` first
2. **Direct API calls:** Use service layer (gmailService, calendarService)
3. **Hardcoded emails:** Use `DEFAULT_EMAIL_FROM` from config
4. **Missing Prisma generation:** Run `npx prisma generate` after schema changes
5. **Thread-less emails:** Always check for existing threads before composing (see `gmailService.searchThreadsByEmail`)

## 📚 Key Documentation Files

- `README.md`: User-facing overview, installation, API reference
- `docs/EMAIL_AUTO_RESPONSE.md`: Gemini AI email system architecture
- `docs/CALENDAR_BOOKING.md`: Booking workflow with slot availability
- `docs/LEAD_MONITORING.md`: Leadmail.no parsing system
- `DEPLOYMENT.md`: Production deployment guide (Render.com)
- `SECURITY.md`: Security best practices, penetration test results

## 🎯 Quick Wins for New Contributors

- Add new keyword patterns to IntentClassifier for better classification
- Create handler for new task type (e.g., invoice generation)
- Improve email templates in `src/services/emailResponseGenerator.ts`
- Add new CLI tool to package.json scripts
- Write tests for existing untested handlers

---

**Remember:** This is a production system handling real customer communication. Always verify in dry-run mode, write tests, and document your changes.