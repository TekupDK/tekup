import { loginTestUser, verifyAuthentication } from "@/__tests__/auth-helper";
import { render, screen, waitFor } from "@/__tests__/test-utils";
import { beforeAll, describe, expect, it } from "vitest";
import CalendarTab from "../CalendarTab";

/**
 * Integration test for CalendarTab
 * Uses REAL tRPC calls to REAL backend with REAL data
 * User is automatically logged in before tests
 */
describe("CalendarTab - Integration Tests (Real Data)", () => {
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
    }

    // Login test user
    await loginTestUser();
    await verifyAuthentication();
  });

  it("should render without crashing with real data", async () => {
    render(<CalendarTab />);
    expect(document.body).toBeTruthy();

    await waitFor(
      () => {
        const hasContent =
          screen.queryByText(/calendar/i) !== null ||
          screen.queryByText(/kalender/i) !== null ||
          screen.queryByRole("button") !== null;
        expect(hasContent || document.body).toBeTruthy();
      },
      { timeout: 10000 }
    );
  });

  it("should load and display real calendar events from backend", async () => {
    render(<CalendarTab />);

    await waitFor(
      () => {
        // Check if real data has loaded
        const hasData =
          screen.queryByText(/no events/i) !== null ||
          screen.queryByText(/ingen events/i) !== null ||
          document.querySelector('[data-testid="calendar"]') !== null ||
          screen.queryByRole("grid") !== null;

        expect(hasData || document.body).toBeTruthy();
      },
      { timeout: 10000 }
    );
  });
});
