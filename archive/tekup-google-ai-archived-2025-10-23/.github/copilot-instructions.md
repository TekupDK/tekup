## RenOS – Copilot quickstart for AI coding agents

This repo automates Rendetalje.dk operations with a TypeScript backend and React frontend. The AI core follows Intent → Plan → Execute.

Architecture (where to look)
- Intent: `src/agents/intentClassifier.ts` (regex + optional LLM). Example intents: `email.lead`, `calendar.booking`, `analytics.overview`.
- Plan: `src/agents/taskPlanner.ts` outputs `PlannedTask[]` with `type`, `payload`, `blocking`.
- Execute: `src/agents/planExecutor.ts` runs tasks via:
  - Legacy handlers: `src/agents/handlers/*` (default map includes `email.compose`, `email.followup`, `calendar.book`, `calendar.reschedule`).
  - Tool Registry (ADK-style): enable with `new PlanExecutor({}, { useToolRegistry: true })`; resolves tools from `src/tools/registry.ts` and toolsets like `src/tools/toolsets/CalendarToolset` and `LeadToolset`.

Safety rails (must-do)
- Dry run by default: `RUN_MODE=dry-run`. Use `isLiveMode` from `src/config.ts` and never mutate Gmail/Calendar in dry-run.
- Call Google via services only: `src/services/gmailService.ts`, `calendarService.ts`, `googleAuth.ts`. These already guard on `!isLiveMode`.
- Email automation feature flags: `isAutoResponseEnabled()`, `isFollowUpEnabled()`, `isEscalationEnabled()` from `src/config.ts`.

Types, errors, logging
- Shared types in `src/types.ts` (e.g., `AssistantIntent`, `PlannedTask`, `ExecutionResult`).
- Handler contract: `TaskHandler` and `ExecutionAction` in `src/agents/handlers/types.ts`.
- Prefer `src/errors.ts` and `src/logger.ts`. User-facing strings should be Danish.

Database & env
- Prisma schema: `prisma/schema.prisma`. Use `npm run db:push` (dev) and `npm run db:studio`.
- Config validation lives in `src/config.ts` (appConfig, isLiveMode) and `src/env.ts` (Zod; fails fast on invalid prod settings).

Dev/test workflows (PowerShell)
- Run: `npm run dev` (backend), `npm run dev:client` (frontend), `npm run dev:all` (both).
- Build: `npm run build` (backend), `npm run build:client` (frontend).
- Test: `npm run test` or `npm run test:watch` (Vitest; see `tests/*.test.ts`).
- Useful scripts: `npm run verify:google`, `npm run booking:availability`, `npm run booking:next-slot`, `npm run email:pending`/`email:approve`/`email:monitor`, `npm run calendar:sync`.

Patterns to mirror
- Thread-aware email: search existing threads before composing (see `gmailService.ts`).
- PlanExecutor tracing/reflection: `src/agents/executionTracer.ts`, `src/agents/agentReflector.ts` record tool calls and can retry with corrections.
- Keep handlers small and pure; all external I/O goes through service layer.

Adding a new capability
1) Intent: add regex in `intentClassifier.ts` and update `AssistantIntent` in `src/types.ts` if needed.
2) Plan: emit a `PlannedTask` in `taskPlanner.ts` (set `type` to match a handler/tool).
3) Execute: either
   - Add handler file in `src/agents/handlers/` and export from `handlers/index.ts` (no central registry change needed if `type` matches a default key), or
   - Add a tool to a toolset under `src/tools/toolsets/*` and rely on Tool Registry execution.
4) Test in `tests/` (there are existing tests for classifier, planner, executor) and run in dry-run first.

Docs to skim next
- `docs/CALENDAR_BOOKING.md` for booking/availability flows and email slot suggestions.
- `docs/EMAIL_AUTO_RESPONSE.md` for AI reply generation and approval flow.
- `README.md` sections “Arkitektursoverblik” and “Kom godt i gang”.

Tip: If anything involves Gmail/Calendar, double-check `RUN_MODE` and go through `src/services/*`. This is the most common foot-gun in this codebase.