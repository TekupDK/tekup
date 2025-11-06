# Chat System – Plan

Context: see `docs/CHAT_APPROVALS_SPEC.md` and `docs/FRIDAY_ACTION_ROLLOUT.md`.

## Goals

- Approval flow (low/medium/high risk) with clear UX and guardrails.
- TRPC contracts: `sendMessage → pendingAction`, `dryRunAction`, `executeAction` (with idempotency).
- Observability: audit events for suggested/dry_run/approved/executed/failed.

## Out of scope (for this phase)

- Advanced streaming UX, multi-tenant escalations, cross-account actions.

## Milestones

1. Contracts + server guardrails (zod, roles, rate-limit, allowlist).
2. UI modal + risk badges; dry-run preview.
3. Feature-flag rollout (10% → 50% → 100%).

## Acceptance criteria

- [ ] Actions require matching allowlist entry in ActionCatalog.
- [ ] `dryRunAction` blocks approve on failure.
- [ ] `executeAction` enforces idempotencyKey.
- [ ] Audit logs include conversationId and correlationId.
- [ ] Supabase tabeller (users, conversations, messages, analytics_events, audit_logs) matcher Drizzle-schema inden rollout.

## Risks & mitigations

- Over-execution → idempotency + rate-limit + role checks.
- PII exposure → mask params in UI; logs redact.

## Steps (suggested)

### Phase 1: MVP UI (✅ Completed)

- [x] Build ApprovalModal with risk levels and dry-run view.
- [x] Gate with `FRIDAY_ACTION_SUGGESTIONS` flag (see rollout doc).
- [x] Create SuggestionsBar component with MVP static suggestions.
- [x] Wire suggestions into ChatPanel behind feature flag.
- [x] Export necessary constants from ActionApprovalModal.
- [x] Build and deploy container with all changes.

### Phase 2: Backend & Intelligence (✅ Complete)

- [x] Finalize ActionCatalog schema and validators (`server/action-catalog.ts`).
- [x] Implement `dryRunAction` TRPC endpoint with validation (`server/routers.ts`).
- [x] Implement enhanced `executeAction` TRPC endpoint with idempotency keys (`server/routers.ts`).
- [x] Create idempotency manager with in-memory store and cleanup (`server/idempotency.ts`).
- [x] Implement audit logging for all action lifecycle events (`server/action-audit.ts`).
- [x] Create `getSuggestions` TRPC endpoint with Gemini analysis (`server/routers.ts`).
- [x] Replace static suggestions with AI-powered context-aware suggestions (`client/src/hooks/useActionSuggestions.ts`).

### Phase 3: UI Polish (✅ Completed)

- [x] Add icons to suggestion cards with proper styling and hover states (`client/src/components/SuggestionsBar.tsx`).
- [x] Add loading/refresh animations and skeleton loaders for suggestions (`client/src/components/SuggestionsBar.tsx`).
- [x] Add collapse/expand toggle for suggestions bar (`client/src/components/SuggestionsBar.tsx`).
- [x] Implement keyboard shortcuts for approve/reject (`client/src/components/ActionApprovalModal.tsx` - Ctrl+Enter to approve, Esc to reject).

### Phase 3.5: Production Configuration (✅ Completed)

- [x] Configure all API keys via tekup secret manager (OpenAI, Gemini, Billy, Google Workspace, Supabase).
- [x] Sørg for at `.env.prod` i repo kun er template uden hemmeligheder; deployment læser fra secrets.
- [x] Deploy container med fuld production configuration.
- [x] Verificér at Supabase-tabeller og migrationer er ajour (chat + metrics) og at tjenesterne er operational.

### Phase 4: Rollout (✅ Completed)

**Rate Limiting:**

- [x] Implement in-memory rate limiter with Map storage (`server/rate-limiter.ts`).
- [x] Add rate limiting to `getSuggestions` endpoint (20 requests/minute per user).
- [x] Add rate limiting to `executeAction` endpoint (10 requests/minute per user).
- [x] Implement automatic cleanup for expired rate limit entries.
- [x] Configure rate limits for all critical endpoints (AI_SUGGESTIONS, ACTION_EXECUTION, DRY_RUN, CHAT_MESSAGES).

**Role-Based Access Control:**

- [x] Create RBAC module with 4 roles (owner, admin, user, guest) (`server/rbac.ts`).
- [x] Define action permissions (low-risk: all users, high-risk: admin/owner).
- [x] Integrate permission checks into `executeAction` endpoint.
- [x] Block unauthorized actions with FORBIDDEN errors.
- [x] Special protection for critical actions (create_invoice requires owner role).

**Feature Rollout:**

- [x] Implement gradual rollout system with configurable percentages (`server/feature-rollout.ts`).
- [x] Use consistent hash-based user bucketing (MD5 hash of userId + feature name).
- [x] Configure rollout percentages: ai_suggestions (100%), action_execution (100%), email_automation (50%), invoice_creation (10%).
- [x] Add rollout checks to `getSuggestions` and `executeAction` endpoints.
- [x] Log rollout metrics for monitoring.

**A/B Testing Metrics:**

- [x] Create metrics tracking system (`server/metrics.ts`).
- [x] Track suggestion_shown, suggestion_accepted, suggestion_rejected, action_executed, action_failed events.
- [x] Calculate suggestion acceptance rate, time-to-action, error rates.
- [x] Add metrics endpoints: getMetricsSummary, getUserAcceptanceRate, getRolloutStats, getUserFeatures.
- [x] Integrate metrics tracking into getSuggestions and executeAction.
- [x] Implement automatic cleanup for old metrics (24h retention).

**Testing & Documentation:**

- [x] Create comprehensive test script (`test-phase-4.ps1`).
- [x] Document rate limiting, RBAC, rollout strategy, metrics.
- [x] Update PLAN.md with Phase 4 completion details.
