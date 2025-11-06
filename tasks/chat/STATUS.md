# Chat System — Status & Checklist

Dato: 4. november 2025
Owner: Product/Engineering
Status: [~] In progress (Phase 2 complete, Phase 3 UI polish in progress)

## Milestones

### Phase 1: MVP UI (✅ Completed)

- [x] Build ApprovalModal with risk levels and dry-run view
- [x] Gate with `FRIDAY_ACTION_SUGGESTIONS` flag (see rollout doc)
- [x] Create SuggestionsBar component with MVP static suggestions
- [x] Wire suggestions into ChatPanel behind feature flag
- [x] Export necessary constants from ActionApprovalModal
- [x] Build and deploy container with all changes

### Phase 2: Backend & Intelligence (✅ Complete)

- [x] Finalize ActionCatalog schema and validators (`server/action-catalog.ts`)
- [x] Implement `dryRunAction` TRPC endpoint with validation (`server/routers.ts`)
- [x] Implement enhanced `executeAction` TRPC endpoint with idempotency keys (`server/routers.ts`)
- [x] Create idempotency manager with in-memory store and cleanup (`server/idempotency.ts`)
- [x] Implement audit logging for all action lifecycle events (`server/action-audit.ts`)
- [x] Create `getSuggestions` TRPC endpoint with Gemini analysis (`server/routers.ts`)
- [x] Replace static suggestions with AI-powered context-aware suggestions (`client/src/hooks/useActionSuggestions.ts`)
- [ ] Add server-side rate limiting and role checks (deferred to Phase 4)

### Phase 3: UI Polish (🔄 In Progress)

- [x] Add icons to suggestion cards with proper styling and hover states (`client/src/components/SuggestionsBar.tsx`)
- [ ] Add loading/refresh animations for suggestions (next)
- [ ] Add collapse/expand toggle for suggestions bar
- [ ] Implement keyboard shortcuts for approve/reject

### Phase 4: Rollout (⏳ Pending)

- [ ] Implement remaining server endpoints and tests
- [ ] Canary + policy gate green
- [ ] A/B test with 10% of users
- [ ] Gradual rollout: 10% → 50% → 100%

## Acceptance Criteria

- [x] Actions require matching allowlist entry in ActionCatalog
- [x] `dryRunAction` blocks approve on failure
- [x] `executeAction` enforces idempotencyKey
- [x] Audit logs include conversationId and correlationId
- [ ] Rate limiting and role checks enforced server-side
- [ ] Keyboard shortcuts functional
- [ ] Collapse/expand UX smooth and accessible

## Risks & Mitigations

- Over-execution → idempotency + rate-limit + role checks
- PII exposure → mask params in UI; logs redact
- AI suggestion quality → monitor accuracy, add feedback loop in Phase 4

## Notes

- AI suggestions powered by Gemini (context-aware, real-time).
- Feature flag `FRIDAY_ACTION_SUGGESTIONS` controls visibility.
- Phase 3 focus: polish UX with animations, collapse, keyboard shortcuts.
