import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Authentication Flow
 * 
 * Covers:
 * - User login with valid credentials
 * - User registration with validation
 * - Session persistence
 * - Logout functionality
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/RenOS/i);
    await expect(page.getByRole('heading', { name: /log ind/i })).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.getByRole('button', { name: /log ind/i }).click();
    
    // Expect validation messages
    await expect(page.getByText(/e-mail er påkrævet/i)).toBeVisible();
    await expect(page.getByText(/adgangskode er påkrævet/i)).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByLabel(/e-mail/i).fill('invalid-email');
    await page.getByLabel(/adgangskode/i).fill('password123');
    await page.getByRole('button', { name: /log ind/i }).click();
    
    await expect(page.getByText(/ugyldig e-mail/i)).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill in login form
    await page.getByLabel(/e-mail/i).fill('owner@example.com');
    await page.getByLabel(/adgangskode/i).fill('securePassword123');
    await page.getByRole('button', { name: /log ind/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Should show user menu
    await expect(page.getByRole('button', { name: /bruger menu/i })).toBeVisible();
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login first
    await page.getByLabel(/e-mail/i).fill('owner@example.com');
    await page.getByLabel(/adgangskode/i).fill('securePassword123');
    await page.getByRole('button', { name: /log ind/i }).click();
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Reload page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('button', { name: /bruger menu/i })).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel(/e-mail/i).fill('owner@example.com');
    await page.getByLabel(/adgangskode/i).fill('securePassword123');
    await page.getByRole('button', { name: /log ind/i }).click();
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Click logout
    await page.getByRole('button', { name: /bruger menu/i }).click();
    await page.getByRole('menuitem', { name: /log ud/i }).click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: /log ind/i })).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.getByRole('link', { name: /opret konto/i }).click();
    
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: /opret konto/i })).toBeVisible();
  });

  test('should register new user with validation', async ({ page }) => {
    await page.goto('/register');
    
    // Fill registration form
    await page.getByLabel(/navn/i).fill('Test User');
    await page.getByLabel(/e-mail/i).fill('newuser@example.com');
    await page.getByLabel(/adgangskode/i).fill('securePassword123');
    await page.getByLabel(/bekræft adgangskode/i).fill('securePassword123');
    
    await page.getByRole('button', { name: /opret konto/i }).click();
    
    // Should redirect to onboarding or dashboard
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/);
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/register');
    
    await page.getByLabel(/navn/i).fill('Test User');
    await page.getByLabel(/e-mail/i).fill('newuser@example.com');
    await page.getByLabel(/adgangskode/i).fill('password123');
    await page.getByLabel(/bekræft adgangskode/i).fill('different456');
    
    await page.getByRole('button', { name: /opret konto/i }).click();
    
    await expect(page.getByText(/adgangskoder matcher ikke/i)).toBeVisible();
  });
});
