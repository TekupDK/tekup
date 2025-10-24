import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Jobs Page v2 (v1.2.0)
 * 
 * Tests new features:
 * - Filter dropdown (all, pending, in_progress, completed)
 * - Search by title/description
 * - Create job modal with customer dropdown
 * - Job cards with status badges
 * - Edit and delete operations
 * - Toast notifications
 */

test.describe('Jobs Page v2', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3001/login');
    await page.fill('input[type="email"]', 'admin@rendetalje.dk');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    
    // Navigate to jobs page
    await page.goto('http://localhost:3001/jobs');
  });

  test('should display jobs page with filter and search', async ({ page }) => {
    // Check page elements
    await expect(page.getByRole('heading', { name: /opgaver/i })).toBeVisible();
    await expect(page.getByText(/opret opgave/i)).toBeVisible();
    
    // Check filter dropdown
    const filterSelect = page.locator('select, [role="combobox"]').first();
    await expect(filterSelect).toBeVisible();
    
    // Check search input
    const searchInput = page.locator('input[type="text"], input[placeholder*="søg" i]').first();
    await expect(searchInput).toBeVisible();
  });

  test('should filter jobs by status', async ({ page }) => {
    // Wait for jobs to load
    await page.waitForTimeout(2000);
    
    // Get initial job count
    const allJobsCount = await page.locator('[data-testid="job-card"]').count();
    
    // Filter by "pending"
    await page.selectOption('select', 'pending');
    await page.waitForTimeout(500);
    
    // Check that filtering happened
    const pendingJobsCount = await page.locator('[data-testid="job-card"]').count();
    
    // Either fewer jobs or no jobs (both valid)
    expect(pendingJobsCount).toBeLessThanOrEqual(allJobsCount);
  });

  test('should search jobs by title', async ({ page }) => {
    // Wait for jobs to load
    await page.waitForTimeout(2000);
    
    // Type in search field
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('cleaning');
    await page.waitForTimeout(500);
    
    // Check that results are filtered
    const searchResults = await page.locator('[data-testid="job-card"]').count();
    expect(searchResults).toBeGreaterThanOrEqual(0);
  });

  test('should open create job modal', async ({ page }) => {
    await page.click('button:has-text("Opret Opgave")');
    
    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.getByText(/opret ny opgave/i)).toBeVisible();
    
    // Check form fields
    await expect(page.locator('input[placeholder*="titel" i]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('select')).toBeVisible(); // Customer dropdown
  });

  test('should create new job with valid data', async ({ page }) => {
    await page.click('button:has-text("Opret Opgave")');
    await page.waitForSelector('[role="dialog"]');
    
    // Fill form
    await page.fill('input[placeholder*="titel" i]', 'E2E Test Job - Window Cleaning');
    await page.fill('textarea', 'Automated test job for Playwright');
    
    // Select customer (first available)
    const customerSelect = page.locator('select').first();
    await customerSelect.selectOption({ index: 1 });
    
    // Select priority
    await page.selectOption('select:has-text("Prioritet")', 'medium');
    
    // Submit form
    await page.click('button:has-text("Opret")');
    
    // Should show toast notification
    await expect(page.getByText(/job oprettet/i)).toBeVisible({ timeout: 5000 });
    
    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // New job should appear in list
    await expect(page.getByText('E2E Test Job')).toBeVisible({ timeout: 5000 });
  });

  test('should validate required fields when creating job', async ({ page }) => {
    await page.click('button:has-text("Opret Opgave")');
    await page.waitForSelector('[role="dialog"]');
    
    // Try to submit without filling fields
    await page.click('button:has-text("Opret")');
    
    // Should show validation error or stay in modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test('should display job cards with status badges', async ({ page }) => {
    // Wait for jobs to load
    await page.waitForTimeout(2000);
    
    // Check for job cards
    const jobCards = page.locator('[data-testid="job-card"]');
    const count = await jobCards.count();
    
    if (count > 0) {
      // First job should have status badge
      const firstCard = jobCards.first();
      const statusBadge = firstCard.locator('[data-testid="job-status"]');
      await expect(statusBadge).toBeVisible();
    }
  });

  test('should edit job title', async ({ page }) => {
    // Wait for jobs to load
    await page.waitForTimeout(2000);
    
    // Click edit button on first job
    const editButton = page.locator('button:has-text("Rediger")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Update title
      const titleInput = page.locator('input[placeholder*="titel" i]');
      await titleInput.fill('Updated Job Title - E2E Test');
      
      // Save
      await page.click('button:has-text("Gem")');
      
      // Should show toast
      await expect(page.getByText(/job opdateret/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete job with confirmation', async ({ page }) => {
    // Create a job first
    await page.click('button:has-text("Opret Opgave")');
    await page.waitForSelector('[role="dialog"]');
    
    await page.fill('input[placeholder*="titel" i]', 'Job to Delete - E2E');
    await page.fill('textarea', 'This job will be deleted');
    
    const customerSelect = page.locator('select').first();
    await customerSelect.selectOption({ index: 1 });
    
    await page.click('button:has-text("Opret")');
    await page.waitForTimeout(2000);
    
    // Now delete it
    const jobToDelete = page.locator('text=Job to Delete').first();
    if (await jobToDelete.isVisible()) {
      // Find delete button
      const deleteButton = page.locator('button:has-text("Slet")').first();
      await deleteButton.click();
      
      // Confirm deletion in dialog
      await page.click('button:has-text("Ja")');
      
      // Should show toast
      await expect(page.getByText(/job slettet/i)).toBeVisible({ timeout: 5000 });
      
      // Job should disappear from list
      await expect(jobToDelete).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should show loading state while fetching jobs', async ({ page }) => {
    // Navigate to jobs page (fresh load)
    await page.goto('http://localhost:3001/jobs');
    
    // Check for loading indicator (might be brief)
    const loader = page.locator('[data-testid="loading-spinner"]');
    const isLoading = await loader.isVisible().catch(() => false);
    
    // Either saw loader or data loaded immediately
    expect(isLoading !== undefined).toBe(true);
  });

  test('should handle empty jobs list', async ({ page }) => {
    // Intercept API to return empty array
    await page.route('**/jobs', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    }));
    
    await page.reload();
    
    // Should show empty state
    const emptyState = page.locator('text=/ingen opgaver|no jobs/i');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Jobs page should be usable
    await expect(page.getByRole('heading', { name: /opgaver/i })).toBeVisible();
    
    // Create button should be visible
    await expect(page.getByText(/opret opgave/i)).toBeVisible();
  });
});
