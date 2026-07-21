import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('drama route loads genre page', async ({ page }) => {
    await page.goto('/genre/Drama');
    await expect(page.getByRole('heading', { name: 'Drama' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('popular route loads ranked list', async ({ page }) => {
    await page.goto('/popular');
    await expect(page.getByRole('heading', { name: 'Popular' })).toBeVisible({
      timeout: 10_000,
    });
    // Ranked list — first rank number
    await expect(page.getByTestId('rank-number').first()).toBeVisible({
      timeout: 8_000,
    });
  });

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
