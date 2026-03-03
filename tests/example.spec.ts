import { test, expect } from '@playwright/test';

test.describe('Playwright home page', () => {
  test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('get started link navigates to installation docs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Get started' }).click();
    await expect(page).toHaveURL(/.*intro/);
  });

  test('docs link is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Docs' })).toBeVisible();
  });
});
