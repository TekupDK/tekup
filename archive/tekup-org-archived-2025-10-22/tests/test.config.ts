import { defineConfig } from '@playwright/test';
import { config } from 'dotenv';

// Load environment variables
config();

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'foodtruck-os',
      testDir: './e2e/foodtruck-os',
      use: {
        baseURL: 'http://localhost:3050',
      },
    },
    {
      name: 'rendetalje-os',
      testDir: './e2e/rendetalje-os',
      use: {
        baseURL: 'http://localhost:3051',
      },
    },
    {
      name: 'essenza-pro',
      testDir: './e2e/essenza-pro',
      use: {
        baseURL: 'http://localhost:3052',
      },
    },
    {
      name: 'mcp-studio',
      testDir: './e2e/mcp-studio',
      use: {
        baseURL: 'http://localhost:3053',
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm run dev:foodtruck-os-frontend',
      port: 3050,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm run dev:rendetalje-os-frontend',
      port: 3051,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm run dev:essenza-pro-frontend',
      port: 3052,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm run dev:mcp-studio-frontend',
      port: 3053,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
