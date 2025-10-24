import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Job Management Workflow
 *
 * Covers:
 * - Job creation with all required fields
 * - Job list viewing and filtering
 * - Job details viewing
 * - Job status updates
 * - Job deletion
 */

test.describe("Job Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test (v1.2.0 credentials)
    await page.goto("http://localhost:3001/login");
    await page.fill('input[type="email"]', "admin@rendetalje.dk");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to jobs page
    await page.goto("http://localhost:3001/jobs");
    await expect(page).toHaveURL(/\/jobs/);
  });

  test("should display jobs list page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /jobs/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /opret job/i })
    ).toBeVisible();
  });

  test("should open job creation modal", async ({ page }) => {
    await page.getByRole("button", { name: /opret job/i }).click();

    await expect(
      page.getByRole("dialog", { name: /opret job/i })
    ).toBeVisible();
    await expect(page.getByLabel(/jobtype/i)).toBeVisible();
    await expect(page.getByLabel(/kunde/i)).toBeVisible();
  });

  test("should create new window cleaning job", async ({ page }) => {
    await page.getByRole("button", { name: /opret job/i }).click();

    // Fill job form
    await page.getByLabel(/jobtype/i).selectOption("window");
    await page.getByLabel(/kunde/i).selectOption({ index: 1 }); // Select first customer
    await page.getByLabel(/adresse/i).fill("Testgade 123, 1234 København");
    await page.getByLabel(/beskrivelse/i).fill("Vinduespudsning på 3. sal");
    await page.getByLabel(/estimeret tid/i).fill("2");
    await page.getByLabel(/pris/i).fill("500");

    await page.getByRole("button", { name: /gem job/i }).click();

    // Should show success message
    await expect(page.getByText(/job oprettet/i)).toBeVisible();

    // Should close modal
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Should show new job in list
    await expect(page.getByText(/vinduespudsning/i)).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.getByRole("button", { name: /opret job/i }).click();

    // Try to submit without filling required fields
    await page.getByRole("button", { name: /gem job/i }).click();

    // Should show validation errors
    await expect(page.getByText(/jobtype er påkrævet/i)).toBeVisible();
    await expect(page.getByText(/kunde er påkrævet/i)).toBeVisible();
    await expect(page.getByText(/adresse er påkrævet/i)).toBeVisible();
  });

  test("should filter jobs by status", async ({ page }) => {
    // Select "Pending" status filter
    await page.getByLabel(/status/i).selectOption("pending");

    // Should only show pending jobs
    await expect(page.getByTestId("job-status-pending")).toBeVisible();
    await expect(page.getByTestId("job-status-completed")).not.toBeVisible();
  });

  test("should search jobs by customer name", async ({ page }) => {
    await page.getByPlaceholder(/søg efter kunde/i).fill("Hansen");
    await page.getByRole("button", { name: /søg/i }).click();

    // Should show filtered results
    await expect(page.getByText(/hansen/i)).toBeVisible();
  });

  test("should view job details", async ({ page }) => {
    // Click on first job in list
    await page.getByRole("row").nth(1).click();

    // Should navigate to job details page
    await expect(page).toHaveURL(/\/jobs\/[a-f0-9-]+/);

    // Should show job information
    await expect(
      page.getByRole("heading", { name: /job detaljer/i })
    ).toBeVisible();
    await expect(page.getByText(/status:/i)).toBeVisible();
    await expect(page.getByText(/kunde:/i)).toBeVisible();
  });

  test("should update job status to in-progress", async ({ page }) => {
    await page.getByRole("row").nth(1).click();

    // Open status dropdown
    await page.getByRole("button", { name: /opdater status/i }).click();
    await page.getByRole("menuitem", { name: /i gang/i }).click();

    // Should show success message
    await expect(page.getByText(/status opdateret/i)).toBeVisible();

    // Should update status badge
    await expect(page.getByTestId("job-status-badge")).toHaveText(/i gang/i);
  });

  test("should assign employee to job", async ({ page }) => {
    await page.getByRole("row").nth(1).click();

    // Open employee assignment
    await page.getByRole("button", { name: /tildel medarbejder/i }).click();

    // Select employee
    await page.getByRole("combobox").selectOption({ index: 1 });
    await page.getByRole("button", { name: /gem/i }).click();

    // Should show assigned employee
    await expect(page.getByText(/medarbejder:/i)).toBeVisible();
  });

  test("should delete job with confirmation", async ({ page }) => {
    await page.getByRole("row").nth(1).click();

    // Click delete button
    await page.getByRole("button", { name: /slet job/i }).click();

    // Should show confirmation dialog
    await expect(
      page.getByRole("dialog", { name: /bekræft sletning/i })
    ).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: /ja, slet/i }).click();

    // Should redirect to jobs list
    await expect(page).toHaveURL(/\/jobs$/);

    // Should show success message
    await expect(page.getByText(/job slettet/i)).toBeVisible();
  });

  test("should cancel job deletion", async ({ page }) => {
    await page.getByRole("row").nth(1).click();

    // Click delete button
    await page.getByRole("button", { name: /slet job/i }).click();

    // Cancel deletion
    await page.getByRole("button", { name: /annuller/i }).click();

    // Should stay on job details page
    await expect(page).toHaveURL(/\/jobs\/[a-f0-9-]+/);
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
