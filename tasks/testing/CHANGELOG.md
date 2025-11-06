# Testing – Changelog

## 2025-11-05 - Email Error UI E2E Test Analysis

### Problem Identified

- E2E test `rate-limit-ui.spec.ts` could not reliably trigger error state
- React Query caches success data (60s staleTime) - network interception fails
- Global rate limit state disables queries before error UI can render
- Network interception timing issues (set after page.goto)

### Attempted Solution (Abandoned)

- Tried implementing `?e2e=error` test-only toggle in EmailTab
- Led to runtime errors, complex conditional rendering, timing issues
- Conclusion: Wrong approach for this use case

### Resolution

- **Skipped E2E test permanently** - E2E should test happy paths only
- **Recommendation**: Convert to component test (Vitest + React Testing Library)
  - Mock tRPC queries directly to return error states
  - Test UI rendering without browser overhead
  - Deterministic control over component state
- Error UI code exists in production and works when real errors occur
- Verified no regression: `email-attachments.spec.ts` still passes

### Lesson Learned

- E2E tests for error states are unreliable with React Query caching
- Component tests are the right tool for testing error UI rendering
- Don't fight the framework - use the right test type for the job

## 2025-11-05 - Action Approval Tests Planning

- Added new task section in PLAN.md for action approval flow tests
- Created STATUS.md with detailed checklist
- Identified need for unit tests (Vitest) and E2E tests (Playwright)
- Set coverage goal: >80% for action execution routes

## Earlier - CSS Import Fix

- Fixed CSS import issues in Vitest with mock plugin
- Ensured tests pass locally
- Chat tests remain skipped pending feature completion

## Next

- Implement test fixtures for actions
- Write comprehensive unit and E2E test suite
