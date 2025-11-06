import { expect, test } from "@playwright/test";

const base = process.env.E2E_BASE_URL || "http://localhost:3000";

// Helper: perform test-mode login to set cookie on the base URL domain
async function testModeLogin(page: any) {
  const url = `${base}/api/auth/login?mode=test`;
  const res = await page.goto(url, { waitUntil: "networkidle" });
  expect(res?.ok(), "login endpoint should respond OK").toBeTruthy();
}

test.describe("UI Smoke", () => {
  test("loads app and shows Email tab after test login", async ({ page }) => {
    await testModeLogin(page);

    await page.goto(base, { waitUntil: "networkidle" });

    // Expect brand header
    await expect(page.getByText("Friday")).toBeVisible();

    // Expect Inbox panel tabs to contain Email label
    await expect(page.getByRole("tab", { name: "Email" })).toBeVisible();
  });
});
