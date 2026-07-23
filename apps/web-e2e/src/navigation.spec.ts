import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('today route loads country schedule', async ({ page }) => {
    await page.goto('/today');
    await expect(
      page.getByRole('heading', { name: /On TV Today/i }),
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test('unknown route redirects to not found', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.getByText(/not found/i)).toBeVisible({ timeout: 5_000 });
  });
});
