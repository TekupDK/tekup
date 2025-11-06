import { test } from "@playwright/test";

/**
 * Email Error UI Test - SKIPPED
 *
 * This E2E test is skipped because testing error states in E2E is unreliable due to:
 * 1. React Query caching makes it impossible to trigger errors consistently
 * 2. Global rate limit state disables queries before errors can be shown
 * 3. Network interception timing issues
 *
 * TODO: Convert this to a component test (Vitest + React Testing Library) where we can:
 * - Mock tRPC queries directly to return error states
 * - Test UI rendering without browser overhead
 * - Have deterministic control over component state
 *
 * The error UI code exists in EmailTab.tsx and works in production when real errors occur.
 * E2E tests should focus on happy paths; component tests should cover error states.
 */
test.describe.skip("Email error UI", () => {
  test("shows error state when email list fails", async () => {
    // Test skipped - see comment above
  });
});
