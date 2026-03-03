// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('OrangeHRM Login - Playwright Grid', () => {

  test('should load login page and verify title', async ({ page }) => {
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');

    const title = await page.title();
    console.log(`[${test.info().project.name}] Page Title: ${title}`);

    await expect(page).toHaveTitle(/OrangeHRM/);
  });

  test('should display login form elements', async ({ page }) => {
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');

    const usernameInput = page.locator('input[name="username"]');
    const passwordInput = page.locator('input[name="password"]');
    const loginButton   = page.locator('button[type="submit"]');

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    console.log(`[${test.info().project.name}] Login form elements are visible`);
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');

    await page.fill('input[name="username"]', 'Admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    console.log(`[${test.info().project.name}] Login successful - URL: ${page.url()}`);
    await expect(page).toHaveURL(/dashboard/);
  });

});
