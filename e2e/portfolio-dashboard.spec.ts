import { test, expect } from '@playwright/test';

test.describe('Portfolio Dashboard', () => {
  test('homepage loads with welcome screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Welcome to AstraDeFi')).toBeVisible();
    await expect(page.getByText('View Demo')).toBeVisible();
  });

  test('demo mode shows portfolio data', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /view demo/i }).click();

    // Portfolio summary should appear with the total value
    await expect(page.locator('.text-5xl')).toBeVisible({ timeout: 5000 });

    // Demo mode badge should be visible
    await expect(page.getByText('Demo Mode')).toBeVisible();
  });

  test('chart time range switching', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /view demo/i }).click();

    // Wait for chart to appear
    await expect(page.getByText('Portfolio Value')).toBeVisible({ timeout: 5000 });

    // Click through time periods
    for (const period of ['7D', '30D', '90D', '1Y']) {
      await page.getByRole('button', { name: period }).click();
      // Chart section should still be visible (no crash)
      await expect(page.getByText('Portfolio Value')).toBeVisible();
    }
  });

  test('asset list filtering by chain', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /view demo/i }).click();

    // Wait for assets to load
    await expect(page.getByText('Your Positions')).toBeVisible({ timeout: 5000 });

    // Select a chain filter
    const chainSelect = page.locator('select').first();
    const options = await chainSelect.locator('option').allTextContents();

    // If there are chain options beyond "All Chains", select one
    if (options.length > 1) {
      await chainSelect.selectOption({ index: 1 });
      // The positions badge should update
      await expect(page.getByText('Your Positions')).toBeVisible();

      // Reset to all
      await chainSelect.selectOption('all');
    }
  });

  test('chain breakdown renders', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /view demo/i }).click();

    // Chain breakdown section should appear
    await expect(page.getByText('Chain Distribution')).toBeVisible({ timeout: 5000 });
  });

  test('exit demo returns to welcome screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /view demo/i }).click();
    await expect(page.getByText('Demo Mode')).toBeVisible();

    await page.getByRole('button', { name: /exit demo/i }).click();
    await expect(page.getByText('Welcome to AstraDeFi')).toBeVisible();
  });
});
