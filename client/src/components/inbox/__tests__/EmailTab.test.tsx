import { loginTestUser, verifyAuthentication } from "@/__tests__/auth-helper";
import { render, screen, waitFor } from "@/__tests__/test-utils";
import { beforeAll, describe, expect, it } from "vitest";
import EmailTab from "../EmailTab";

/**
 * Integration test for EmailTab
 * Uses REAL tRPC calls to REAL backend with REAL data
 *
 * REQUIREMENTS:
 * - Backend server must be running on http://localhost:3000
 * - Database must be accessible and contain real data
 * - User must be logged in (auto-login via dev endpoint)
 */
describe("EmailTab - Integration Tests (Real Data)", () => {
  // Login before running tests
  beforeAll(async () => {
    const backendUrl = process.env.VITE_API_URL || "http://localhost:3000";

    // Verify backend is accessible
    try {
      const response = await fetch(`${backendUrl}/api/trpc`, {
        method: "GET",
      });
      if (response.status >= 500) {
        throw new Error(`Backend server error at ${backendUrl}`);
      }
    } catch (error: any) {
      if (error.message.includes("server error")) {
        throw error;
      }
      console.warn(
        `⚠️ Backend might not be running at ${backendUrl}. Tests may fail.`
      );
      console.warn(`   Start backend with: pnpm dev`);
    }

    // Login test user
    await loginTestUser();

    // Verify authentication worked
    const isAuthenticated = await verifyAuthentication();
    if (!isAuthenticated) {
      console.warn("⚠️ Authentication failed - tests may fail");
    }
  });

  it("should render without crashing with real data", async () => {
    render(<EmailTab />);

    // Component should render
    expect(document.body).toBeTruthy();

    // Wait for real data to load from backend
    await waitFor(
      () => {
        // Look for any email-related UI elements that appear after data loads
        const hasContent =
          screen.queryByText(/email/i) !== null ||
          screen.queryByText(/inbox/i) !== null ||
          screen.queryByRole("button") !== null;
        expect(hasContent).toBe(true);
      },
      { timeout: 10000 } // Allow time for real API call
    );
  });

  it("should load and display real email data from backend", async () => {
    render(<EmailTab />);

    await waitFor(
      () => {
        // Check if real data has loaded (could be empty state or email list)
        const hasData =
          screen.queryByText(/no emails/i) !== null ||
          screen.queryByText(/ingen emails/i) !== null ||
          document.querySelector('[data-testid="email-list"]') !== null ||
          screen.queryByRole("list") !== null;

        expect(hasData).toBe(true);
      },
      { timeout: 10000 }
    );
  });
});
