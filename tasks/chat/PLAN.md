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

- [ ] Finalize ActionCatalog schema and validators.
- [ ] Implement server endpoints and tests.
- [ ] Build ApprovalModal with risk levels and dry-run view.
- [ ] Gate with `FRIDAY_ACTION_SUGGESTIONS` flag (see rollout doc).
- [ ] Canary + policy gate green.
