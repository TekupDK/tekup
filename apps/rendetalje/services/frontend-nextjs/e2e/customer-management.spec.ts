import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Customer Management
 *
 * Covers:
 * - Customer list viewing
 * - Customer creation with validation
 * - Customer details viewing
 * - Customer information updates
 * - Customer deletion
 */

test.describe("Customer Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as owner
    await page.goto("/");
    await page.getByLabel(/e-mail/i).fill("owner@example.com");
    await page.getByLabel(/adgangskode/i).fill("securePassword123");
    await page.getByRole("button", { name: /log ind/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to customers page
    await page.getByRole("link", { name: /kunder/i }).click();
    await expect(page).toHaveURL(/\/customers/);
  });

  test("should display customers list page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /kunder/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /tilføj kunde/i })
    ).toBeVisible();
  });

  test("should open customer creation modal", async ({ page }) => {
    await page.getByRole("button", { name: /tilføj kunde/i }).click();

    await expect(
      page.getByRole("dialog", { name: /tilføj kunde/i })
    ).toBeVisible();
    await expect(page.getByLabel(/navn/i)).toBeVisible();
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
  });

  test("should create new customer with all details", async ({ page }) => {
    await page.getByRole("button", { name: /tilføj kunde/i }).click();

    // Fill customer form
    await page.getByLabel(/navn/i).fill("Lars Hansen");
    await page.getByLabel(/e-mail/i).fill("lars@example.com");
    await page.getByLabel(/telefon/i).fill("20304050");
    await page.getByLabel(/adresse/i).fill("Nørregade 10");
    await page.getByLabel(/postnummer/i).fill("1234");
    await page.getByLabel(/by/i).fill("København");
    await page.getByLabel(/cvr/i).fill("12345678");

    await page.getByRole("button", { name: /gem kunde/i }).click();

    // Should show success message
    await expect(page.getByText(/kunde oprettet/i)).toBeVisible();

    // Should show new customer in list
    await expect(page.getByText("Lars Hansen")).toBeVisible();
  });

  test("should validate email format", async ({ page }) => {
    await page.getByRole("button", { name: /tilføj kunde/i }).click();

    await page.getByLabel(/navn/i).fill("Test Customer");
    await page.getByLabel(/e-mail/i).fill("invalid-email");

    await page.getByRole("button", { name: /gem kunde/i }).click();

    await expect(page.getByText(/ugyldig e-mail/i)).toBeVisible();
  });

  test("should validate phone number format", async ({ page }) => {
    await page.getByRole("button", { name: /tilføj kunde/i }).click();

    await page.getByLabel(/navn/i).fill("Test Customer");
    await page.getByLabel(/telefon/i).fill("123"); // Too short

    await page.getByRole("button", { name: /gem kunde/i }).click();

    await expect(page.getByText(/ugyldigt telefonnummer/i)).toBeVisible();
  });

  test("should validate postal code format", async ({ page }) => {
    await page.getByRole("button", { name: /tilføj kunde/i }).click();

    await page.getByLabel(/navn/i).fill("Test Customer");
    await page.getByLabel(/postnummer/i).fill("12345"); // Too long

    await page.getByRole("button", { name: /gem kunde/i }).click();

    await expect(page.getByText(/ugyldigt postnummer/i)).toBeVisible();
  });

  test("should search customers by name", async ({ page }) => {
    await page.getByPlaceholder(/søg efter kunde/i).fill("Hansen");

    // Should filter results
    await expect(page.getByText(/hansen/i)).toBeVisible();
  });

  test("should filter customers by type", async ({ page }) => {
    await page.getByLabel(/kundetype/i).selectOption("business");

    // Should show only business customers
    await expect(page.getByTestId("customer-type-business")).toBeVisible();
    await expect(page.getByTestId("customer-type-private")).not.toBeVisible();
  });

  test("should view customer details", async ({ page }) => {
    // Click on first customer
    await page.getByRole("row").nth(1).click();

    // Should navigate to customer details
    await expect(page).toHaveURL(/\/customers\/[a-f0-9-]+/);

    // Should show customer information
    await expect(
      page.getByRole("heading", { name: /kunde detaljer/i })
    ).toBeVisible();
    await expect(page.getByText(/kontaktinformation/i)).toBeVisible();
  });

  test("should edit customer information", async ({ page }) => {
    await page.getByRole("row").nth(1).click();

    // Click edit button
    await page.getByRole("button", { name: /rediger/i }).click();

    // Update customer name
    await page.getByLabel(/navn/i).fill("Updated Name");
    await page.getByRole("button", { name: /gem ændringer/i }).click();

    // Should show success message
    await expect(page.getByText(/kunde opdateret/i)).toBeVisible();

    // Should show updated name
    await expect(page.getByText("Updated Name")).toBeVisible();
  });

  test("should view customer job history", async ({ page }) => {
    await page.getByRole("row").nth(1).click();

    // Click on jobs tab
    await page.getByRole("tab", { name: /jobs/i }).click();

    // Should show job history
    await expect(
      page.getByRole("heading", { name: /job historik/i })
    ).toBeVisible();
    await expect(page.getByTestId("job-list")).toBeVisible();
  });

  test("should delete customer with confirmation", async ({ page }) => {
    await page.getByRole("row").nth(1).click();

    // Click delete button
    await page.getByRole("button", { name: /slet kunde/i }).click();

    // Should show confirmation dialog
    await expect(
      page.getByRole("dialog", { name: /bekræft sletning/i })
    ).toBeVisible();
    await expect(page.getByText(/vil du slette denne kunde/i)).toBeVisible();

    // Confirm deletion
    await page.getByRole("button", { name: /ja, slet/i }).click();

    // Should redirect to customers list
    await expect(page).toHaveURL(/\/customers$/);

    // Should show success message
    await expect(page.getByText(/kunde slettet/i)).toBeVisible();
  });

  test("should export customers to CSV", async ({ page }) => {
    // Start download listener
    const downloadPromise = page.waitForEvent("download");

    await page.getByRole("button", { name: /eksporter/i }).click();
    await page.getByRole("menuitem", { name: /csv/i }).click();

    // Wait for download
    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toMatch(/customers.*\.csv/i);
  });
});
