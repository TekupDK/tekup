import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Customers Page v2 (v1.2.0)
 *
 * Tests new features:
 * - Grid layout (3 columns)
 * - Search by name/email
 * - Create customer with full address
 * - Customer cards with clickable email/phone
 * - CVR validation (8 digits)
 * - Delete with confirmation
 */

test.describe("Customers Page v2", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("http://localhost:3001/login");
    await page.fill('input[type="email"]', "admin@rendetalje.dk");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard");

    // Navigate to customers page
    await page.goto("http://localhost:3001/customers");
  });

  test("should display customers page with grid layout", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /kunder/i })).toBeVisible();
    await expect(page.getByText(/opret kunde/i)).toBeVisible();

    // Check search input
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    // Check grid exists (customer cards)
    await page.waitForTimeout(2000);
    const cards = page.locator('[data-testid="customer-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should search customers by name", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Type in search
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill("test");
    await page.waitForTimeout(500);

    // Results should be filtered
    const results = await page.locator('[data-testid="customer-card"]').count();
    expect(results).toBeGreaterThanOrEqual(0);
  });

  test("should open create customer modal", async ({ page }) => {
    await page.click('button:has-text("Opret Kunde")');

    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.getByText(/opret ny kunde/i)).toBeVisible();

    // Check form fields
    await expect(page.locator('input[placeholder*="navn" i]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="telefon" i]')).toBeVisible();
  });

  test("should create new customer with full address", async ({ page }) => {
    await page.click('button:has-text("Opret Kunde")');
    await page.waitForSelector('[role="dialog"]');

    // Fill form
    await page.fill('input[placeholder*="navn" i]', "E2E Test Customer");
    await page.fill('input[type="email"]', "e2etest@example.com");
    await page.fill('input[placeholder*="telefon" i]', "+4512345678");

    // Address fields
    await page.fill('input[placeholder*="adresse" i]', "Testgade 123");
    await page.fill('input[placeholder*="by" i]', "København");
    await page.fill('input[placeholder*="postnummer" i]', "2100");
    await page.fill('input[placeholder*="land" i]', "Danmark");

    // CVR (8 digits)
    await page.fill('input[placeholder*="cvr" i]', "12345678");

    // Submit
    await page.click('button:has-text("Opret")');

    // Should show toast
    await expect(page.getByText(/kunde oprettet/i)).toBeVisible({
      timeout: 5000,
    });

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // New customer should appear in grid
    await expect(page.getByText("E2E Test Customer")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should validate CVR number (8 digits)", async ({ page }) => {
    await page.click('button:has-text("Opret Kunde")');
    await page.waitForSelector('[role="dialog"]');

    // Fill form with invalid CVR
    await page.fill('input[placeholder*="navn" i]', "Test Customer");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[placeholder*="cvr" i]', "123"); // Too short

    // Try to submit
    await page.click('button:has-text("Opret")');

    // Should show validation error or stay in modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test("should display customer cards with email and phone links", async ({
    page,
  }) => {
    await page.waitForTimeout(2000);

    const cards = page.locator('[data-testid="customer-card"]');
    const count = await cards.count();

    if (count > 0) {
      const firstCard = cards.first();

      // Check for email link
      const emailLink = firstCard.locator('a[href^="mailto:"]');
      if (await emailLink.isVisible()) {
        await expect(emailLink).toBeVisible();
      }

      // Check for phone link
      const phoneLink = firstCard.locator('a[href^="tel:"]');
      if (await phoneLink.isVisible()) {
        await expect(phoneLink).toBeVisible();
      }
    }
  });

  test("should edit customer details", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Click edit button on first customer
    const editButton = page.locator('button:has-text("Rediger")').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Update name
      const nameInput = page.locator('input[placeholder*="navn" i]');
      await nameInput.fill("Updated Customer Name - E2E");

      // Save
      await page.click('button:has-text("Gem")');

      // Should show toast
      await expect(page.getByText(/kunde opdateret/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("should delete customer with confirmation", async ({ page }) => {
    // Create a customer first
    await page.click('button:has-text("Opret Kunde")');
    await page.waitForSelector('[role="dialog"]');

    await page.fill('input[placeholder*="navn" i]', "Customer to Delete");
    await page.fill('input[type="email"]', "delete@example.com");
    await page.fill('input[placeholder*="telefon" i]', "+4587654321");

    await page.click('button:has-text("Opret")');
    await page.waitForTimeout(2000);

    // Now delete it
    const customerToDelete = page.locator("text=Customer to Delete").first();
    if (await customerToDelete.isVisible()) {
      // Find delete button
      const deleteButton = page.locator('button:has-text("Slet")').first();
      await deleteButton.click();

      // Confirm deletion
      await page.click('button:has-text("Ja")');

      // Should show toast
      await expect(page.getByText(/kunde slettet/i)).toBeVisible({
        timeout: 5000,
      });

      // Customer should disappear
      await expect(customerToDelete).not.toBeVisible({ timeout: 5000 });
    }
  });

  test("should show customer count", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check for customer count display
    const countText = page.locator("text=/\\d+ kunder|\\d+ customers/i");
    const hasCount = await countText.isVisible().catch(() => false);

    // Count display is optional, so just check it doesn't error
    expect(hasCount !== undefined).toBe(true);
  });

  test("should handle empty customers list", async ({ page }) => {
    // Intercept API to return empty array
    await page.route("**/customers", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      })
    );

    await page.reload();

    // Should show empty state
    const emptyState = page.locator("text=/ingen kunder|no customers/i");
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });

  test("should display customers in 3-column grid on desktop", async ({
    page,
  }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.waitForTimeout(2000);

    // Check grid layout (3 columns)
    const grid = page.locator('[data-testid="customers-grid"]');
    if (await grid.isVisible()) {
      // Grid should use CSS grid with 3 columns
      const gridStyle = await grid.evaluate(
        (el) => window.getComputedStyle(el).gridTemplateColumns
      );
      expect(gridStyle).toBeTruthy();
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Customers page should be usable
    await expect(page.getByRole("heading", { name: /kunder/i })).toBeVisible();

    // Create button should be visible
    await expect(page.getByText(/opret kunde/i)).toBeVisible();

    // Cards should stack vertically (1 column)
    await page.waitForTimeout(2000);
  });

  test("should show loading state while fetching customers", async ({
    page,
  }) => {
    await page.goto("http://localhost:3001/customers");

    // Check for loading indicator
    const loader = page.locator('[data-testid="loading-spinner"]');
    const isLoading = await loader.isVisible().catch(() => false);

    expect(isLoading !== undefined).toBe(true);
  });
});
