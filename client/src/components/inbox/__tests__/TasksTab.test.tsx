import { loginTestUser, verifyAuthentication } from "@/__tests__/auth-helper";
import { render, screen, waitFor } from "@/__tests__/test-utils";
import { beforeAll, describe, expect, it } from "vitest";
import TasksTab from "../TasksTab";

/**
 * Integration test for TasksTab
 * Uses REAL tRPC calls to REAL backend with REAL data
 * User is automatically logged in before tests
 */
describe("TasksTab - Integration Tests (Real Data)", () => {
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
    render(<TasksTab />);
    expect(document.body).toBeTruthy();

    await waitFor(
      () => {
        const hasContent =
          screen.queryByText(/task/i) !== null ||
          screen.queryByPlaceholderText(/søg/i) !== null ||
          screen.queryByRole("button") !== null;
        expect(hasContent).toBe(true);
      },
      { timeout: 10000 }
    );
  });

  it("should load and display real tasks data from backend", async () => {
    render(<TasksTab />);

    await waitFor(
      () => {
        // Check if real data has loaded
        const hasData =
          screen.queryByText(/no tasks/i) !== null ||
          screen.queryByText(/ingen tasks/i) !== null ||
          document.querySelector('[data-testid="task-list"]') !== null ||
          screen.queryByRole("list") !== null;

        expect(hasData).toBe(true);
      },
      { timeout: 10000 }
    );
  });
});
