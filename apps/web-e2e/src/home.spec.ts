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
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link', { name: 'Popular' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'All Shows' })).toBeVisible();

    // Genre links are generated dynamically from the loaded shows rather
    // than a fixed list, so assert on presence/count, not specific names.
    const genreLinks = nav.locator('a[href^="/genre/"]');
    await expect(genreLinks.first()).toBeVisible({ timeout: 10_000 });
    expect(await genreLinks.count()).toBeGreaterThan(0);
  });
});
