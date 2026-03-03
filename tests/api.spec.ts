import { test, expect } from '@playwright/test';

test.describe('API smoke tests', () => {
  test('Playwright API endpoint returns 200', async ({ request }) => {
    const response = await request.get('https://playwright.dev/');
    expect(response.status()).toBe(200);
  });
});
