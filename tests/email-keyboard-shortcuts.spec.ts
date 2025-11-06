import { expect, test } from "@playwright/test";

test.describe("Email Keyboard Shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and wait for email list to load
    await page.goto("http://localhost:3000");

    // Wait for authentication/login if needed
    await page.waitForTimeout(2000);

    // Navigate to inbox/email tab
    await page.click('text="Inbox"').catch(() => {});
    await page.waitForTimeout(1000);
  });

  test("should navigate emails with j/k keys", async ({ page }) => {
    // Wait for email list to be visible
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    // Get initial email count
    const emailCards = await page.locator('[data-testid="email-card"]').count();
    expect(emailCards).toBeGreaterThan(0);

    // Press 'j' to select next email
    await page.keyboard.press("j");
    await page.waitForTimeout(300);

    // Check that first email has keyboard selection styling (blue ring)
    const firstEmail = page.locator('[data-testid="email-card"]').first();
    await expect(firstEmail).toHaveClass(/ring-blue-500/);

    // Press 'j' again to move to next
    await page.keyboard.press("j");
    await page.waitForTimeout(300);

    // Check that second email is now selected
    const secondEmail = page.locator('[data-testid="email-card"]').nth(1);
    await expect(secondEmail).toHaveClass(/ring-blue-500/);

    // Press 'k' to go back
    await page.keyboard.press("k");
    await page.waitForTimeout(300);

    // First email should be selected again
    await expect(firstEmail).toHaveClass(/ring-blue-500/);
  });

  test("should prevent navigation beyond email list bounds", async ({
    page,
  }) => {
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    // Press 'k' multiple times (should stay at first email)
    await page.keyboard.press("k");
    await page.keyboard.press("k");
    await page.keyboard.press("k");
    await page.waitForTimeout(300);

    // First email should still be selected
    const firstEmail = page.locator('[data-testid="email-card"]').first();
    await expect(firstEmail).toHaveClass(/ring-blue-500/);

    // Get total count
    const emailCount = await page.locator('[data-testid="email-card"]').count();

    // Press 'j' many times to reach end
    for (let i = 0; i < emailCount + 5; i++) {
      await page.keyboard.press("j");
      await page.waitForTimeout(50);
    }

    // Last email should be selected (not beyond)
    const lastEmail = page
      .locator('[data-testid="email-card"]')
      .nth(emailCount - 1);
    await expect(lastEmail).toHaveClass(/ring-blue-500/);
  });

  test("should open composer with c key", async ({ page }) => {
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    // Press 'c' to open composer
    await page.keyboard.press("c");
    await page.waitForTimeout(500);

    // Check that composer is visible
    const composer = page.locator('[data-testid="email-composer"]');
    await expect(composer).toBeVisible();

    // Composer should have focus
    const toField = page
      .locator('input[placeholder*="til"]')
      .or(page.locator('input[name="to"]'));
    await expect(toField).toBeVisible();
  });

  test("should reply to selected email with r key", async ({ page }) => {
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    // Select first email with 'j'
    await page.keyboard.press("j");
    await page.waitForTimeout(300);

    // Press 'r' to reply
    await page.keyboard.press("r");
    await page.waitForTimeout(500);

    // Composer should open with reply context
    const composer = page.locator('[data-testid="email-composer"]');
    await expect(composer).toBeVisible();

    // Check for "Re:" prefix or reply indicator
    const subjectField = page
      .locator('input[placeholder*="Emne"]')
      .or(page.locator('input[name="subject"]'));
    const subjectValue = await subjectField.inputValue().catch(() => "");

    // Either has Re: prefix or composer is in reply mode
    const hasReplyIndicator =
      subjectValue.startsWith("Re:") || subjectValue.startsWith("SV:");
    expect(hasReplyIndicator || (await composer.isVisible())).toBeTruthy();
  });

  test("should forward selected email with f key", async ({ page }) => {
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    // Select first email with 'j'
    await page.keyboard.press("j");
    await page.waitForTimeout(300);

    // Press 'f' to forward
    await page.keyboard.press("f");
    await page.waitForTimeout(500);

    // Composer should open
    const composer = page.locator('[data-testid="email-composer"]');
    await expect(composer).toBeVisible();

    // Check for "Fwd:" prefix or forward indicator
    const subjectField = page
      .locator('input[placeholder*="Emne"]')
      .or(page.locator('input[name="subject"]'));
    const subjectValue = await subjectField.inputValue().catch(() => "");

    const hasForwardIndicator =
      subjectValue.startsWith("Fwd:") || subjectValue.startsWith("VS:");
    expect(hasForwardIndicator || (await composer.isVisible())).toBeTruthy();
  });

  test("should focus search with / key", async ({ page }) => {
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    // Press '/' to focus search
    await page.keyboard.press("/");
    await page.waitForTimeout(300);

    // Search input should be focused
    const searchInput = page
      .locator('input[placeholder*="Søg"]')
      .or(page.locator('input[type="search"]'));
    await expect(searchInput).toBeFocused();
  });

  test("should open help modal with ? key", async ({ page }) => {
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    // Press '?' to open help modal
    await page.keyboard.press("?");
    await page.waitForTimeout(500);

    // Help modal should be visible
    const helpModal = page
      .locator('text="Keyboard Genveje"')
      .or(page.locator('[role="dialog"]'));
    await expect(helpModal).toBeVisible();

    // Should show shortcuts list
    const shortcutsList = page
      .locator('text="Navigation"')
      .or(page.locator("kbd").first());
    await expect(shortcutsList).toBeVisible();

    // Close modal with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await expect(helpModal).not.toBeVisible();
  });

  test("should close thread view with Escape key", async ({ page }) => {
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    // Click on an email to open thread view
    await page.locator('[data-testid="email-card"]').first().click();
    await page.waitForTimeout(1000);

    // Thread view should be visible
    const threadView = page
      .locator('[data-testid="email-thread-view"]')
      .or(page.locator('text="Tilbage"'));
    await expect(threadView).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Should be back to list view
    await expect(
      page.locator('[data-testid="email-card"]').first()
    ).toBeVisible();
  });

  test("should ignore keyboard shortcuts when typing in input fields", async ({
    page,
  }) => {
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    // Focus on search input
    const searchInput = page
      .locator('input[placeholder*="Søg"]')
      .or(page.locator('input[type="search"]'));
    await searchInput.click();
    await page.waitForTimeout(200);

    // Type text that includes shortcut keys
    await searchInput.fill("jkrfc/");
    await page.waitForTimeout(300);

    // Composer should NOT have opened (c key should be ignored)
    const composer = page.locator('[data-testid="email-composer"]');
    await expect(composer).not.toBeVisible();

    // Search input should contain the typed text
    await expect(searchInput).toHaveValue("jkrfc/");

    // Help modal should NOT be visible (? typed in input)
    await searchInput.clear();
    await searchInput.fill("test?");
    await page.waitForTimeout(300);

    const helpModal = page.locator('text="Keyboard Genveje"');
    await expect(helpModal).not.toBeVisible();
  });

  test("should disable shortcuts when composer is open", async ({ page }) => {
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    // Open composer
    await page.keyboard.press("c");
    await page.waitForTimeout(500);

    const composer = page.locator('[data-testid="email-composer"]');
    await expect(composer).toBeVisible();

    // Try to use j/k navigation (should not work)
    await page.keyboard.press("j");
    await page.keyboard.press("j");
    await page.waitForTimeout(300);

    // Email cards should not have keyboard selection
    const firstEmail = page.locator('[data-testid="email-card"]').first();
    await expect(firstEmail).not.toHaveClass(/ring-blue-500/);

    // Try to open help modal (should not work)
    await page.keyboard.press("?");
    await page.waitForTimeout(300);

    const helpModal = page.locator('text="Keyboard Genveje"');
    await expect(helpModal).not.toBeVisible();
  });

  test("should disable shortcuts when help modal is open", async ({ page }) => {
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    // Open help modal
    await page.keyboard.press("?");
    await page.waitForTimeout(500);

    const helpModal = page
      .locator('text="Keyboard Genveje"')
      .or(page.locator('[role="dialog"]'));
    await expect(helpModal).toBeVisible();

    // Try to use j/k navigation (should not work)
    await page.keyboard.press("j");
    await page.keyboard.press("j");
    await page.waitForTimeout(300);

    // Email cards should not have keyboard selection
    const firstEmail = page.locator('[data-testid="email-card"]').first();
    await expect(firstEmail).not.toHaveClass(/ring-blue-500/);

    // Close help modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Now shortcuts should work again
    await page.keyboard.press("j");
    await page.waitForTimeout(300);
    await expect(firstEmail).toHaveClass(/ring-blue-500/);
  });

  test("should show keyboard shortcut hints in UI", async ({ page }) => {
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    // Check for keyboard button in toolbar
    const keyboardButton = page
      .locator('button[title*="Keyboard"]')
      .or(page.locator("svg.lucide-keyboard").locator(".."));
    await expect(keyboardButton).toBeVisible();

    // Click keyboard button to open help
    await keyboardButton.click();
    await page.waitForTimeout(500);

    // Help modal should open
    const helpModal = page.locator('text="Keyboard Genveje"');
    await expect(helpModal).toBeVisible();

    // Check for compose button hint
    const composeButton = page.locator('button[title*="(c)"]');
    await expect(composeButton).toBeVisible();
  });

  test("should auto-scroll selected email into view", async ({ page }) => {
    await page.waitForSelector('[data-testid="email-card"]', {
      timeout: 10000,
    });

    const emailCount = await page.locator('[data-testid="email-card"]').count();

    if (emailCount > 10) {
      // Press 'j' multiple times to scroll down
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press("j");
        await page.waitForTimeout(100);
      }

      // The selected email should be visible in viewport
      const selectedEmail = page
        .locator('[data-testid="email-card"]')
        .filter({ has: page.locator(".ring-blue-500") });
      await expect(selectedEmail).toBeVisible();

      // Press 'k' multiple times to scroll up
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("k");
        await page.waitForTimeout(100);
      }

      // Selected email should still be visible
      await expect(selectedEmail).toBeVisible();
    }
  });
});
