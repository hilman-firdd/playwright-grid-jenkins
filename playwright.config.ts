import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for grid-based parallel execution with Jenkins CI.
 *
 * Sharding: set SHARD and TOTAL_SHARDS env vars to split tests across Jenkins agents.
 * Example: SHARD=1 TOTAL_SHARDS=3 npx playwright test
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in parallel */
  fullyParallel: true,

  /* Fail the build if any test.only was accidentally left in source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI */
  retries: process.env.CI ? 2 : 0,

  /* Limit parallel workers on CI to avoid overloading agents */
  workers: process.env.CI ? 2 : undefined,

  /* Reporter: use HTML report + JUnit XML for Jenkins */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['list'],
  ],

  use: {
    /* Base URL – override via BASE_URL env var */
    baseURL: process.env.BASE_URL || 'https://playwright.dev',

    /* Collect traces on first retry for debugging */
    trace: 'on-first-retry',

    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',

    /* Connect to a remote Selenium/Playwright Grid when GRID_URL is set */
    ...(process.env.GRID_URL
      ? {
          connectOptions: {
            wsEndpoint: process.env.GRID_URL,
          },
        }
      : {}),
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Mobile viewports */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Output folder for test artifacts (screenshots, videos, traces) */
  outputDir: 'test-results/',
});
