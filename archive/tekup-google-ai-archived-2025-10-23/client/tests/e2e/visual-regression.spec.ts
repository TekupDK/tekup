import { test, expect, Page } from '@playwright/test';

/**
 * Stabilize page rendering for pixel-perfect screenshots
 * Disables animations and ensures consistent font rendering
 */
async function stabilizePage(page: Page) {
    await page.addStyleTag({
        content: `
      *, *::before, *::after {
        animation-duration: 0.001s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001s !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
      html {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `
    });
}

test.describe('Visual Regression: Dashboard', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test.beforeEach(async ({ page }) => {
        await stabilizePage(page);
    });

    test('dashboard layout is pixel-stable', async ({ page }) => {
        await page.goto('/');

        // Wait for critical content
        await page.waitForSelector('text=Oversigt', { timeout: 10000 });

        // Wait for any pending animations
        await page.waitForTimeout(500);

        // Take full dashboard screenshot
        await expect(page).toHaveScreenshot('dashboard-full.png', {
            maxDiffPixelRatio: 0.002, // 0.2% tolerance (~2px per 1000px)
            animations: 'disabled',
            fullPage: true,
            mask: [
                page.locator('[data-time]'), // Mask dynamic time displays
                page.locator('.toast'), // Mask toast notifications
                page.locator('[data-testid="dynamic-date"]'), // Mask dates
            ]
        });
    });

    test('dashboard cards spacing follows design tokens', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.stat-card', { timeout: 10000 });

        const cards = await page.locator('.stat-card').all();
        expect(cards.length).toBeGreaterThan(0);

        // Take screenshot of card grid
        const cardGrid = page.locator('.grid').first();
        await expect(cardGrid).toHaveScreenshot('dashboard-cards-grid.png', {
            maxDiffPixelRatio: 0.002,
            animations: 'disabled',
        });
    });

    test('responsive layout at tablet size', async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.goto('/');
        await page.waitForSelector('text=Oversigt', { timeout: 10000 });

        await expect(page).toHaveScreenshot('dashboard-tablet.png', {
            maxDiffPixelRatio: 0.003, // Slightly higher tolerance for responsive
            animations: 'disabled',
            fullPage: true,
        });
    });

    test('mobile layout at 390px width', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await page.waitForSelector('text=Oversigt', { timeout: 10000 });

        await expect(page).toHaveScreenshot('dashboard-mobile.png', {
            maxDiffPixelRatio: 0.003,
            animations: 'disabled',
            fullPage: true,
        });
    });
});

test.describe('Visual Regression: Legal Pages', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test.beforeEach(async ({ page }) => {
        await stabilizePage(page);
    });

    test('terms page layout stable', async ({ page }) => {
        await page.goto('/vilkaar');
        await page.waitForSelector('text=Vilkår og Betingelser', { timeout: 10000 });

        await expect(page).toHaveScreenshot('terms-page.png', {
            maxDiffPixelRatio: 0.002,
            animations: 'disabled',
            fullPage: true,
        });
    });

    test('privacy page layout stable', async ({ page }) => {
        await page.goto('/privatlivspolitik');
        await page.waitForSelector('text=Privatlivspolitik', { timeout: 10000 });

        await expect(page).toHaveScreenshot('privacy-page.png', {
            maxDiffPixelRatio: 0.002,
            animations: 'disabled',
            fullPage: true,
        });
    });
});

test.describe('Visual Regression: Navigation', () => {
    test('all critical routes load without layout shift', async ({ page }) => {
        await stabilizePage(page);

        const routes = [
            { path: '/', selector: 'text=Oversigt' },
            { path: '/customers', selector: 'text=Kunder' },
            { path: '/leads', selector: 'text=Leads' },
            { path: '/bookings', selector: 'text=Bookinger' },
        ];

        for (const route of routes) {
            await page.goto(route.path);
            await page.waitForSelector(route.selector, { timeout: 10000 });
            await page.waitForTimeout(300); // Let layout stabilize

            const routeName = route.path === '/' ? 'home' : route.path.replace('/', '');
            await expect(page).toHaveScreenshot(`${routeName}-route.png`, {
                maxDiffPixelRatio: 0.002,
                animations: 'disabled',
            });
        }
    });
});
