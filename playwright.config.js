// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Grid Config - Chromium & Firefox
 * Pastikan Docker sudah running: docker-compose up -d
 */
module.exports = defineConfig({
  testDir: './',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  projects: [
    {
      name: 'chromium-grid',
      use: {
        ...devices['Desktop Chrome'],
        connectOptions: {
          wsEndpoint: 'ws://localhost:3001',
        },
      },
    },
    {
      name: 'firefox-grid',
      use: {
        ...devices['Desktop Firefox'],
        connectOptions: {
          wsEndpoint: 'ws://localhost:3002',
        },
      },
    },
  ],
});
