# Testing – Plan

Context: Vitest + Playwright; CSS import stubbing for `streamdown`/`katex` fixed in `vitest.config.ts`.

## Goals

- Stable unit/integration tests (Vitest) and optional UI screenshots (Playwright).

## Acceptance criteria

- [ ] Vitest runs green locally and in CI.
- [ ] Playwright `test:screens` runs against dev with dev-login, produces PNGs.

## Steps (suggested)

- [ ] Maintain CSS stubs and deps inline in `vitest.config.ts`.
- [ ] Keep chat tests skipped until Chat feature is ready.
- [ ] Add a minimal health/spec for API smoke tests.

## New Tasks

### Action Approval Flow Test Coverage

**Context**: The action approval pipeline (`chat.executeAction`, idempotency checks, audit logging, feature flags) has limited test coverage. Need comprehensive unit and E2E tests.

**Goals - Unit Tests (Vitest)**:

- [ ] Test `executeAction` with valid action ID and params
- [ ] Test idempotency: duplicate action ID should not re-execute
- [ ] Test audit logging: verify `action_audit_log` entries
- [ ] Test feature flag gating (e.g., action disabled for user)
- [ ] Test RBAC: non-owner cannot execute admin-only actions
- [ ] Test error handling: invalid action ID, missing params
- [ ] Mock DB calls and verify correct inserts/updates

**Goals - E2E Tests (Playwright)**:

- [ ] Test pending action modal appears after AI suggests action
- [ ] Test "Approve" button executes action and shows success toast
- [ ] Test "Reject" button dismisses modal without executing
- [ ] Test "Always approve this action" checkbox persists preference
- [ ] Test auto-approve: low-risk action with preference enabled skips modal
- [ ] Test high-risk action always shows modal (even with auto-approve)
- [ ] Test action preview/impact/risk levels display correctly

**Acceptance Criteria**:

- [ ] Unit test coverage > 80% for `chat.executeAction` route
- [ ] E2E tests pass locally and in CI
- [ ] Tests use fixtures for predictable action scenarios
- [ ] No flaky tests (runs pass consistently 10/10 times)
- [ ] Test data cleanup between runs (no DB pollution)
