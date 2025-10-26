import { test, expect } from '@playwright/test';

test.describe('FoodTruck OS - POS Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/auth/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user', name: 'Test User' },
          token: 'mock-token'
        })
      });
    });

    await page.goto('/');
  });

  test('should complete full POS transaction workflow', async ({ page }) => {
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('FoodTruck OS');

    // Navigate to POS interface (should be default)
    await expect(page.locator('text=POS Kasse')).toBeVisible();

    // Add items to cart
    await page.click('text=Burger');
    await page.click('text=Pommes Frites');

    // Verify cart contents
    await expect(page.locator('text=Kurv')).toBeVisible();
    await expect(page.locator('text=Burger')).toBeVisible();
    await expect(page.locator('text=Pommes Frites')).toBeVisible();

    // Check total calculation with Danish VAT
    await expect(page.locator('text=Total:')).toBeVisible();
    await expect(page.locator('text=Moms (25%):')).toBeVisible();

    // Process payment with Dankort
    await page.click('text=Dankort');

    // Should show success message
    await expect(page.locator('text=Salg gennemført!')).toBeVisible({ timeout: 5000 });

    // Cart should be empty after successful payment
    await expect(page.locator('text=Kurven er tom')).toBeVisible();
  });

  test('should handle quantity updates correctly', async ({ page }) => {
    await page.goto('/');

    // Add burger to cart
    await page.click('text=Burger');

    // Increase quantity
    await page.click('button:has-text("+")');
    await expect(page.locator('input[value="2"]')).toBeVisible();

    // Decrease quantity
    await page.click('button:has-text("-")');
    await expect(page.locator('input[value="1"]')).toBeVisible();

    // Decrease to zero should remove item
    await page.click('button:has-text("-")');
    await expect(page.locator('text=Kurven er tom')).toBeVisible();
  });

  test('should filter menu items by category', async ({ page }) => {
    await page.goto('/');

    // Test category filtering
    await page.click('text=Main');
    await expect(page.locator('text=Burger')).toBeVisible();

    await page.click('text=Sides');
    await expect(page.locator('text=Pommes Frites')).toBeVisible();

    await page.click('text=Alle');
    await expect(page.locator('text=Burger')).toBeVisible();
    await expect(page.locator('text=Pommes Frites')).toBeVisible();
  });

  test('should navigate between different sections', async ({ page }) => {
    await page.goto('/');

    // Navigate to Menu Management
    await page.click('text=Menu Styring');
    await expect(page.locator('text=Menu')).toBeVisible();

    // Navigate to Compliance
    await page.click('text=Compliance');
    await expect(page.locator('text=Compliance')).toBeVisible();

    // Navigate to Analytics
    await page.click('text=Analyser');
    await expect(page.locator('text=Analytics')).toBeVisible();

    // Back to POS
    await page.click('text=POS Kasse');
    await expect(page.locator('text=Menu')).toBeVisible();
  });

  test('should handle different payment methods', async ({ page }) => {
    await page.goto('/');

    // Add item to cart
    await page.click('text=Burger');

    // Test MobilePay
    await page.click('text=MobilePay');
    await expect(page.locator('text=Salg gennemført!')).toBeVisible({ timeout: 5000 });

    // Add another item
    await page.click('text=Pommes Frites');

    // Test Cash payment
    await page.click('text=Kontant');
    await expect(page.locator('text=Salg gennemført!')).toBeVisible({ timeout: 5000 });
  });
});
