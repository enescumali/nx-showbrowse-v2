import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test('desktop search shows results', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Open search').click();
    await page.getByLabel('Search shows').fill('breaking bad');
    // Wait for debounce + API response
    await expect(page.getByText(/Search results for/i)).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.url()).toContain('q=breaking');
  });

  test('search query is in the URL', async ({ page }) => {
    await page.goto('/?q=batman');
    await expect(page.getByText(/Search results for "batman"/i)).toBeVisible({
      timeout: 8_000,
    });
  });

  test('empty search returns to browse mode', async ({ page }) => {
    await page.goto('/?q=batman');
    await expect(page.getByText(/Search results for/i)).toBeVisible({
      timeout: 8_000,
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Drama/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
