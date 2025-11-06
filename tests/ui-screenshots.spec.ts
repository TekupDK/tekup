import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";

async function devLogin(page: import("@playwright/test").Page) {
  // Use the existing dev-login endpoint to set session
  await page.goto(`${BASE}/api/auth/login`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
}

async function safeClick(
  page: any,
  locator: import("@playwright/test").Locator
) {
  const count = await locator.count();
  if (count > 0) {
    await locator
      .first()
      .click({ timeout: 2000 })
      .catch(() => {});
  }
}

test.describe("UI Screenshots (@screens)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await devLogin(page);
  });

  test("Email: list and (optional) thread open", async ({ page }) => {
    // Navigate to Email tab if tabs exist
    const tabByRole = page.getByRole("tab", { name: /^Email$/i });
    if ((await tabByRole.count()) > 0) {
      await tabByRole
        .first()
        .click()
        .catch(() => {});
    } else {
      const linkByText = page.getByText(/^Email$/);
      if ((await linkByText.count()) > 0) {
        await linkByText
          .first()
          .click()
          .catch(() => {});
      }
    }

    // Wait for UI to settle and capture list
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "docs/screenshots/email/list_loaded.png",
      fullPage: true,
    });

    // Try to open the first thread/card if present and capture
    const firstCardButton = page.locator("main button");
    await safeClick(page, firstCardButton);

    // Fallback to any clickable card-like div
    if ((await firstCardButton.count()) === 0) {
      const firstClickable = page.locator(
        'main [role="button"], main .cursor-pointer'
      );
      await safeClick(page, firstClickable);
    }

    await page.waitForTimeout(600);
    await page.screenshot({
      path: "docs/screenshots/email/thread_open.png",
      fullPage: true,
    });
  });

  test("Chat: list and (optional) conversation open", async ({ page }) => {
    // Try dedicated chat route first
    let onChat = false;
    try {
      await page.goto(`${BASE}/chat`, { waitUntil: "load" });
      onChat = page.url().includes("/chat");
    } catch {}

    // If no dedicated route, try clicking a Chat nav item if it exists
    if (!onChat) {
      const chatNav = page.getByRole("link", { name: /^Chat$/i });
      if ((await chatNav.count()) > 0) {
        await chatNav
          .first()
          .click()
          .catch(() => {});
        onChat = true;
      }
    }

    // Always capture a screenshot of whatever is visible as chat list state
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "docs/screenshots/chat/list_loaded.png",
      fullPage: true,
    });

    // Try to select first conversation if present
    const convoButtons = page.locator(
      "[data-testid=conversation-item], .convo, .conversation, button"
    );
    await safeClick(page, convoButtons);
    await page.waitForTimeout(600);
    await page.screenshot({
      path: "docs/screenshots/chat/conversation_open.png",
      fullPage: true,
    });
  });
});
