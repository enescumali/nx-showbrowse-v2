import { test, expect } from '@playwright/test';

test.describe('Catalog', () => {
  test('loads page 0 by default', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByRole('heading', { name: 'All Shows' })).toBeVisible(
      { timeout: 10_000 },
    );
    await expect(page.getByText(/Page 1 —/)).toBeVisible({ timeout: 10_000 });
  });

  test('next/prev walk real TVMaze pages and update the URL', async ({
    page,
  }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/Page 1 —/)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText(/Page 2 —/)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/page=1/);

    await page.getByRole('button', { name: 'Previous page' }).click();
    await expect(page.getByText(/Page 1 —/)).toBeVisible({ timeout: 10_000 });
    await expect(page).not.toHaveURL(/page=/);
  });

  test('jump-to-page input navigates directly', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/Page 1 —/)).toBeVisible({ timeout: 10_000 });

    await page.getByLabel('Jump to page').fill('2');
    await page.getByRole('button', { name: 'Go' }).click();

    await expect(page.getByText(/Page 3 —/)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/page=2/);
  });

  test('genre filter only affects the current page and updates the URL', async ({
    page,
  }) => {
    await page.goto('/catalog?page=0');
    await expect(page.getByText(/Page 1 —/)).toBeVisible({ timeout: 10_000 });

    const genreSelect = page.getByLabel('Genre');
    const options = await genreSelect.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(1);

    const firstRealGenre = options[1];
    await genreSelect.selectOption(firstRealGenre);
    // Filtering re-renders synchronously from already-loaded data — no spinner
    await expect(page.getByText(/Page 1 —/)).toBeVisible();
    expect(page.url()).toContain(
      `genre=${encodeURIComponent(firstRealGenre)}`,
    );
  });

  test('sort by rating reorders the current page and updates the URL', async ({
    page,
  }) => {
    await page.goto('/catalog');
    await expect(page.getByText(/Page 1 —/)).toBeVisible({ timeout: 10_000 });

    await page.getByLabel('Sort by').selectOption('rating');
    await expect(page).toHaveURL(/sort=rating/);

    const ratings = (
      await page.getByTestId('show-thumbnail').locator('span').allTextContents()
    )
      .map((t) => parseFloat(t.replace('⭐', '').trim()))
      .filter((n) => !Number.isNaN(n));

    expect(ratings.length).toBeGreaterThan(1);
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i - 1]).toBeGreaterThanOrEqual(ratings[i]);
    }
  });

  test('direct link to a deep page loads that page', async ({ page }) => {
    await page.goto('/catalog?page=2');
    await expect(page.getByText(/Page 3 —/)).toBeVisible({ timeout: 10_000 });
  });

  test('a shared link restores page, genre, and sort together', async ({
    page,
  }) => {
    await page.goto('/catalog?page=1');
    await expect(page.getByText(/Page 2 —/)).toBeVisible({ timeout: 10_000 });
    const options = await page
      .getByLabel('Genre')
      .locator('option')
      .allTextContents();
    const genre = options[1];

    await page.goto(
      `/catalog?page=1&genre=${encodeURIComponent(genre)}&sort=title`,
    );
    await expect(page.getByText(/Page 2 —/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel('Genre')).toHaveValue(genre);
    await expect(page.getByLabel('Sort by')).toHaveValue('title');
  });
});
