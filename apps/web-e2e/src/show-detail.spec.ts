import { test, expect } from '@playwright/test';

test.describe('Show detail', () => {
  test('clicking a thumbnail opens the quick-view panel, not a full navigation', async ({
    page,
  }) => {
    await page.goto('/');
    const firstThumbnail = page.getByTestId('show-thumbnail').first();
    await expect(firstThumbnail).toBeVisible({ timeout: 10_000 });
    await firstThumbnail.click();

    await expect(page).toHaveURL(/[?&]show=\d+/);
    await expect(page).not.toHaveURL(/\/shows\/\d+/);

    const dialog = page.getByRole('dialog', { name: /quick view/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading').first()).toBeVisible({
      timeout: 8_000,
    });
  });

  test('the quick-view panel\'s "View full page" link opens the real detail page', async ({
    page,
  }) => {
    await page.goto('/');
    const firstThumbnail = page.getByTestId('show-thumbnail').first();
    await expect(firstThumbnail).toBeVisible({ timeout: 10_000 });
    await firstThumbnail.click();

    const dialog = page.getByRole('dialog', { name: /quick view/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('link', { name: /View full page/ }).click();

    await page.waitForURL(/\/shows\/\d+$/, { timeout: 8_000 });
    await expect(page.getByRole('heading').first()).toBeVisible({
      timeout: 8_000,
    });
  });

  test('Escape closes the quick-view panel and clears the query', async ({
    page,
  }) => {
    await page.goto('/');
    const firstThumbnail = page.getByTestId('show-thumbnail').first();
    await expect(firstThumbnail).toBeVisible({ timeout: 10_000 });
    await firstThumbnail.click();

    const dialog = page.getByRole('dialog', { name: /quick view/i });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(page).not.toHaveURL(/[?&]show=/);
  });

  test('renders as a bottom sheet on mobile and a side panel on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const firstThumbnail = page.getByTestId('show-thumbnail').first();
    await expect(firstThumbnail).toBeVisible({ timeout: 10_000 });
    await firstThumbnail.click();

    const dialog = page.getByRole('dialog', { name: /quick view/i });
    await expect(dialog).toBeVisible();
    let box = await dialog.boundingBox();
    expect(box?.width).toBeGreaterThan(350); // near-full mobile width
    expect(box?.y).toBeGreaterThan(200); // anchored toward the bottom

    await page.setViewportSize({ width: 1280, height: 800 });
    box = await dialog.boundingBox();
    expect(box?.width).toBeLessThan(600); // a side panel, not full-width
    expect(box?.x).toBeGreaterThan(600); // anchored to the right
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
