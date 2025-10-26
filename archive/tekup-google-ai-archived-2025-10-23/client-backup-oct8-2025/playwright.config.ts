import { defineConfig, devices } from '@playwright/test';

/**
 * RenOS Playwright Configuration
 * Visual regression + E2E testing for production-grade UI stability
 */
export default defineConfig({
    testDir: './tests/e2e',

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI */
    workers: process.env.CI ? 1 : undefined,

    /* Reporter to use */
    reporter: [
        ['html'],
        ['list'],
        ['json', { outputFile: 'test-results/results.json' }]
    ],

    /* Shared settings for all the projects below */
    use: {
        /* Base URL to use in actions like `await page.goto('/')` */
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video on failure */
        video: 'retain-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 900 } // Standard desktop
            },
        },

        // Firefox and webkit commented out - install with: npx playwright install firefox webkit
        // {
        //   name: 'firefox',
        //   use: { 
        //     ...devices['Desktop Firefox'],
        //     viewport: { width: 1440, height: 900 }
        //   },
        // },

        // {
        //   name: 'webkit',
        //   use: { 
        //     ...devices['Desktop Safari'],
        //     viewport: { width: 1440, height: 900 }
        //   },
        // },

        /* Mobile viewports */
        {
            name: 'mobile-chrome',
            use: {
                ...devices['Pixel 5'],
                viewport: { width: 390, height: 844 }
            },
        },

        // Mobile safari commented out - requires webkit
        // {
        //   name: 'mobile-safari',
        //   use: { 
        //     ...devices['iPhone 12'],
        //     viewport: { width: 390, height: 844 }
        //   },
        // },

        /* Tablet */
        {
            name: 'tablet',
            use: {
                ...devices['iPad Pro'],
                viewport: { width: 1024, height: 768 }
            },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
