import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('drama route loads genre page', async ({ page }) => {
    await page.goto('/genre/Drama');
    await expect(page.getByRole('heading', { name: 'Drama' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('genre page paginates for a genre with more than one page', async ({
    page,
  }) => {
    // Fixture: Drama has 300 shows -> 2 pages @ 250/page.
    await page.goto('/genre/Drama');
    await expect(page.getByRole('heading', { name: 'Drama' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('300 shows, sorted by rating')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Page 1 of 2')).toBeVisible();

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('Page 2 of 2')).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole('button', { name: 'Next page' }),
    ).toBeDisabled();
  });

  test('navigating between genres via the nav bar refetches instead of showing stale data', async ({
    page,
  }) => {
    await page.goto('/genre/Drama');
    await expect(page.getByRole('heading', { name: 'Drama' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('300 shows, sorted by rating')).toBeVisible({
      timeout: 10_000,
    });

    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Comedy' })
      .click();

    await expect(page.getByRole('heading', { name: 'Comedy' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('150 shows, sorted by rating')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('popular route loads ranked list', async ({ page }) => {
    await page.goto('/popular');
    await expect(page.getByRole('heading', { name: 'Popular' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('rank-number').first()).toBeVisible({
      timeout: 8_000,
    });
  });

  test('popular list paginates with continuous rank numbers', async ({
    page,
  }) => {
    await page.goto('/popular');
    await expect(page.getByText('Page 1 of 3')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('rank-number').first()).toHaveText('1');

    await page.getByRole('button', { name: 'Next page' }).click();

    await expect(page.getByText('Page 2 of 3')).toBeVisible({
      timeout: 10_000,
    });
    // page index 1 * pageSize 250 + 0 + 1
    await expect(page.getByTestId('rank-number').first()).toHaveText('251');
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
