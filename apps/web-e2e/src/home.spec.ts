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

  test('nav links are present', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav.getByRole('link', { name: 'All Shows' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'On TV Today' })).toBeVisible();
  });

  test('a genre row\'s "See all" link navigates to Catalog filtered by that genre', async ({
    page,
  }) => {
    await page.goto('/');
    const dramaHeading = page.getByRole('heading', { name: 'Drama' });
    await expect(dramaHeading).toBeVisible({ timeout: 10_000 });

    const dramaRow = page.locator('section').filter({ has: dramaHeading });
    await dramaRow.getByRole('link', { name: 'See all' }).click();

    await expect(page).toHaveURL(/\/catalog\?genre=Drama/);
    await expect(page.getByText('300 shows total')).toBeVisible({
      timeout: 10_000,
    });
  });
});
