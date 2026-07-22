import { test, expect } from '@playwright/test';

// Fixture facts (see apps/web-e2e/fixtures/generate-snapshot.ts):
// 600 shows total (-> 3 pages @ 250/page). Genres: Drama (300, 2 pages),
// Comedy (150), Action (100), Sci-Fi (50). Rating and title both sort in
// id order (id=1 is the highest-rated show and sorts first alphabetically).

test.describe('Catalog', () => {
  test('loads page 1 of 3 with all 600 shows by default', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByRole('heading', { name: 'All Shows' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Page 1 of 3 — 600 shows total')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('next/prev walk real pages and update the URL', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/Page 1 of 3/)).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText(/Page 2 of 3/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/page=1/);

    await page.getByRole('button', { name: 'Previous page' }).click();
    await expect(page.getByText(/Page 1 of 3/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).not.toHaveURL(/page=/);
  });

  test('next is disabled on the last page', async ({ page }) => {
    await page.goto('/catalog?page=2');
    await expect(page.getByText(/Page 3 of 3/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole('button', { name: 'Next page' }),
    ).toBeDisabled();
  });

  test('jump-to-page input navigates directly', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/Page 1 of 3/)).toBeVisible({
      timeout: 10_000,
    });

    await page.getByLabel('Jump to page').fill('2');
    await page.getByRole('button', { name: 'Go' }).click();

    await expect(page.getByText(/Page 3 of 3/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/page=2/);
  });

  test('genre filter is a real global refetch — totals reflect the whole genre, not just the current page', async ({
    page,
  }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/Page 1 of 3/)).toBeVisible({
      timeout: 10_000,
    });

    await page.getByLabel('Genre').selectOption('Drama');

    await expect(page.getByText('Page 1 of 2 — 300 shows total')).toBeVisible({
      timeout: 10_000,
    });
    expect(page.url()).toContain('genre=Drama');
  });

  test('changing genre resets back to page 1', async ({ page }) => {
    await page.goto('/catalog?page=2');
    await expect(page.getByText(/Page 3 of 3/)).toBeVisible({
      timeout: 10_000,
    });

    await page.getByLabel('Genre').selectOption('Comedy');

    await expect(page.getByText('Page 1 of 1 — 150 shows total')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).not.toHaveURL(/page=/);
  });

  test('sort by rating reflects the full dataset (highest-rated show first)', async ({
    page,
  }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/Page 1 of 3/)).toBeVisible({
      timeout: 10_000,
    });

    await page.getByLabel('Sort by').selectOption('rating');
    await expect(page).toHaveURL(/sort=rating/);

    await expect(
      page.getByRole('heading', { name: 'Fixture Show 001', level: 3 }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('sort by title puts Fixture Show 001 first', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/Page 1 of 3/)).toBeVisible({
      timeout: 10_000,
    });

    await page.getByLabel('Sort by').selectOption('title');
    await expect(page).toHaveURL(/sort=title/);

    await expect(
      page.getByRole('heading', { name: 'Fixture Show 001', level: 3 }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('direct link to a deep page loads that page', async ({ page }) => {
    await page.goto('/catalog?page=2');
    await expect(page.getByText(/Page 3 of 3/)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('a shared link restores page, genre, and sort together', async ({
    page,
  }) => {
    await page.goto('/catalog?page=1&genre=Drama&sort=title');

    await expect(page.getByLabel('Genre')).toHaveValue('Drama');
    await expect(page.getByLabel('Sort by')).toHaveValue('title');
    await expect(page.getByText('Page 2 of 2 — 300 shows total')).toBeVisible({
      timeout: 10_000,
    });
  });
});
