import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page loads and passes basic a11y', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/TekUp/i);

  // Visual snapshot (stable after initial baseline)
  await expect(page).toHaveScreenshot('home.png', { maxDiffPixels: 200 });

  // Accessibility scan
  const axe = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['color-contrast']); // adjust to your design system
  const results = await axe.analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
});
