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

### Phase 2: Backend & Intelligence (🔄 In Progress)
- [ ] Finalize ActionCatalog schema and validators.
- [ ] Implement `dryRunAction` TRPC endpoint with validation.
- [ ] Implement `executeAction` TRPC endpoint with idempotency keys.
- [ ] Add server-side rate limiting and role checks.
- [ ] Replace static suggestions with Gemini-based context-aware suggestions.
- [ ] Implement audit logging (shown/approved/rejected/executed/failed events).

### Phase 3: UI Polish (📋 Planned)
- [ ] Add icons to suggestion cards (reuse from ActionApprovalModal).
- [ ] Add loading/refresh animations for suggestions.
- [ ] Add collapse/expand toggle for suggestions bar.
- [ ] Implement keyboard shortcuts for approve/reject.

### Phase 4: Rollout (⏳ Pending)
- [ ] Implement server endpoints and tests.
- [ ] Canary + policy gate green.
- [ ] A/B test with 10% of users.
- [ ] Gradual rollout: 10% → 50% → 100%.
