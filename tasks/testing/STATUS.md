# Testing – Status

**Last Updated**: 2025-11-05

## Current Phase: Maintenance

Status: ✅ CSS import stubbing fixed, Vitest passing locally

## Progress

### Core Test Infrastructure ✅ Complete

- [x] Vitest configured with CSS mock plugin
- [x] Playwright setup for E2E tests
- [x] Dev login flow for authenticated tests
- [ ] CI integration (needs verification)

### Coverage Status 🟡 Partial

- [x] Basic API smoke tests exist
- [ ] Chat feature tests (skipped until feature complete)
- [ ] Limited unit test coverage on routers
- [ ] No E2E tests for action approval flow
- [x] Email attachments E2E test passing
- [x] Email error UI test skipped (needs component test instead)

## Known Issues

### Email Error UI Test (2025-11-05)

**Status**: ⏭️ Skipped (needs refactoring)

**Problem**: E2E test `rate-limit-ui.spec.ts` cannot reliably trigger error state

- React Query caching prevents network interception from working
- Global rate limit state disables queries before error UI renders
- Timing issues with route.intercept() after page navigation

**Solution**: Convert to component test

- Use Vitest + React Testing Library instead of Playwright
- Mock tRPC queries directly to return error states
- Test UI rendering in isolation without browser overhead
- **Priority**: Low (error UI works in production, just not testable in E2E)

## New Task: Action Approval Flow Tests (2025-11-05)

Status: ⏳ Not Started

### Unit Tests (Vitest)

- [ ] Test `executeAction` happy path
- [ ] Test idempotency checks
- [ ] Test audit logging
- [ ] Test feature flag gating
- [ ] Test RBAC enforcement
- [ ] Test error cases
- [ ] Achieve >80% coverage on action routes

### E2E Tests (Playwright)

- [ ] Test pending action modal display
- [ ] Test approve/reject flows
- [ ] Test "always approve" checkbox
- [ ] Test auto-approve for low-risk actions
- [ ] Test high-risk actions always show modal
- [ ] Test action preview/impact/risk display
- [ ] Ensure no flaky tests (10/10 pass rate)

## Blockers

None currently.

## Next Steps

1. Create test fixtures for action scenarios
2. Write unit tests for `chat.executeAction`
3. Build Playwright page objects for action modal
4. Run tests in CI and verify stability
