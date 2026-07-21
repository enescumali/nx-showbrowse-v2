import { test, expect } from '@playwright/test';

test.describe('Show detail', () => {
  test('navigates to detail page from home', async ({ page }) => {
    await page.goto('/');
    // Wait for shows to load then click the first show thumbnail
    const firstThumbnail = page.getByTestId('show-thumbnail').first();
    await expect(firstThumbnail).toBeVisible({ timeout: 10_000 });
    await firstThumbnail.click();
    await page.waitForURL(/\/shows\/\d+/, { timeout: 8_000 });
    await expect(page.getByRole('heading').first()).toBeVisible({
      timeout: 8_000,
    });
  });

  test('direct URL loads show detail', async ({ page }) => {
    // TVMaze id=1 is "Under the Dome" — stable fixture
    await page.goto('/shows/1');
    await expect(page.getByRole('heading').first()).toBeVisible({
      timeout: 8_000,
    });
  });

  test('unknown show id redirects to not found', async ({ page }) => {
    await page.goto('/shows/999999999');
    await expect(page.getByText(/not found/i)).toBeVisible({ timeout: 8_000 });
  });
});
