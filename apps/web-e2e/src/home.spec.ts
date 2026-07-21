import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('shows genre carousels after loading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
    // Wait for shows to load (carousels appear)
    await expect(page.getByRole('heading', { name: /Drama/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('hero banner is visible', async ({ page }) => {
    await page.goto('/');
    // Hero banner contains a "View Details" RouterLink
    await expect(
      page.getByRole('link', { name: /View Details/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('nav links are present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Drama' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Comedy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Popular' })).toBeVisible();
  });
});
