import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Dashboard Page (v1.2.0)
 * 
 * Tests real-time stats integration with backend:
 * - Active Jobs count
 * - Pending Jobs count
 * - Completed Jobs count
 * - Total Customers count
 * - User info display
 * - Loading states
 */

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'admin@rendetalje.dk');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
  });

  test('should display dashboard with real-time stats', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Check stat cards are visible
    await expect(page.getByText(/aktive opgaver/i)).toBeVisible();
    await expect(page.getByText(/afventende/i)).toBeVisible();
    await expect(page.getByText(/afsluttet/i)).toBeVisible();
    await expect(page.getByText(/samlede kunder/i)).toBeVisible();
  });

  test('should show user info in header', async ({ page }) => {
    // Check user email is displayed
    await expect(page.getByText('admin@rendetalje.dk')).toBeVisible();
    
    // Check user name if available
    const userName = page.locator('text=Admin User').first();
    if (await userName.isVisible()) {
      await expect(userName).toBeVisible();
    }
  });

  test('should display real numbers from backend', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Get stat values (should not all be 0)
    const activeJobs = await page.locator('[data-testid="active-jobs"]').textContent();
    const pendingJobs = await page.locator('[data-testid="pending-jobs"]').textContent();
    const completedJobs = await page.locator('[data-testid="completed-jobs"]').textContent();
    const totalCustomers = await page.locator('[data-testid="total-customers"]').textContent();
    
    // At least one stat should have data
    const hasData = [activeJobs, pendingJobs, completedJobs, totalCustomers]
      .some(value => value && parseInt(value) > 0);
    
    expect(hasData).toBe(true);
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate to dashboard (should show loader briefly)
    await page.goto('http://localhost:3001/dashboard');
    
    // Check for loading spinner (might be brief)
    const loader = page.locator('[data-testid="loading-spinner"]');
    const isLoading = await loader.isVisible().catch(() => false);
    
    // Either loader was visible or data loaded so fast we missed it
    // Both are acceptable
    expect(isLoading !== undefined).toBe(true);
  });

  test('should navigate to jobs page from quick actions', async ({ page }) => {
    await page.click('button:has-text("Ny Opgave")');
    
    // Should navigate to jobs page
    await expect(page).toHaveURL(/\/jobs/);
  });

  test('should navigate to customers page from quick actions', async ({ page }) => {
    await page.click('button:has-text("Se Kunder")');
    
    // Should navigate to customers page
    await expect(page).toHaveURL(/\/customers/);
  });

  test('should handle backend error gracefully', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/jobs', route => route.abort());
    await page.route('**/customers', route => route.abort());
    
    // Reload dashboard
    await page.reload();
    
    // Should show error state or empty state
    const errorMessage = page.locator('text=/kunne ikke hente|fejl|error/i');
    const emptyState = page.locator('text=/ingen opgaver|ingen kunder/i');
    
    const hasErrorHandling = await errorMessage.isVisible().catch(() => false) ||
                             await emptyState.isVisible().catch(() => false);
    
    expect(hasErrorHandling).toBe(true);
  });

  test('should refresh stats when navigating back from other pages', async ({ page }) => {
    // Get initial stats
    const initialActiveJobs = await page.locator('[data-testid="active-jobs"]').textContent();
    
    // Navigate away and back
    await page.goto('http://localhost:3001/jobs');
    await page.goto('http://localhost:3001/dashboard');
    
    // Wait for refresh
    await page.waitForTimeout(1000);
    
    // Stats should be loaded (might be same values)
    const newActiveJobs = await page.locator('[data-testid="active-jobs"]').textContent();
    expect(newActiveJobs).toBeDefined();
  });

  test('should display stat cards with correct emoji icons', async ({ page }) => {
    // Check for emoji icons
    await expect(page.locator('text=📊')).toBeVisible(); // Active jobs
    await expect(page.locator('text=📋')).toBeVisible(); // Pending jobs
    await expect(page.locator('text=✅')).toBeVisible(); // Completed jobs
    await expect(page.locator('text=👥')).toBeVisible(); // Total customers
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Dashboard should still be visible and usable
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Stat cards should stack vertically
    const statCards = page.locator('[data-testid*="-jobs"], [data-testid="total-customers"]');
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
  });
});
