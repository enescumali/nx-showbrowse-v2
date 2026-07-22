// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { useShowCatalog } from './useShowCatalog';
import { makeUseCases } from '../test-utils/makeUseCases';
import { mountComposable } from '../test-utils/mountComposable';
import { makeShow } from '../test-utils/makeShow';
import type { CatalogPage, Show } from '@show-browse/shows';

function page(
  shows: Show[],
  pageNum: number,
  totalPages: number,
  totalShows = shows.length,
): CatalogPage {
  return { shows, page: pageNum, pageSize: 250, totalShows, totalPages };
}

describe('useShowCatalog', () => {
  it('loads page 0 on mount', async () => {
    const show1 = makeShow({ id: 1, genres: ['Drama'] });
    const getCatalogPage = vi.fn().mockResolvedValue(page([show1], 0, 3, 500));
    const useCases = makeUseCases({ getCatalogPage });

    const {
      shows,
      page: pageRef,
      totalPages,
      totalShows,
    } = mountComposable(useShowCatalog, useCases);
    await flushPromises();

    expect(getCatalogPage).toHaveBeenCalledWith({
      page: 0,
      pageSize: undefined,
      genre: undefined,
      sort: undefined,
    });
    expect(shows.value).toEqual([show1]);
    expect(pageRef.value).toBe(0);
    expect(totalPages.value).toBe(3);
    expect(totalShows.value).toBe(500);
  });

  it('seeds genre/sort/pageSize/initialPage from options', async () => {
    const getCatalogPage = vi.fn().mockResolvedValue(page([], 2, 5));
    const useCases = makeUseCases({ getCatalogPage });

    mountComposable(useShowCatalog, useCases, {
      genre: 'Drama',
      sort: 'rating',
      pageSize: 24,
      initialPage: 2,
    });
    await flushPromises();

    expect(getCatalogPage).toHaveBeenCalledWith({
      page: 2,
      pageSize: 24,
      genre: 'Drama',
      sort: 'rating',
    });
  });

  it('tracks the server-confirmed pageSize (for rank/position math in views)', async () => {
    const getCatalogPage = vi
      .fn()
      .mockResolvedValue({ shows: [], page: 0, pageSize: 100, totalShows: 3, totalPages: 1 });
    const useCases = makeUseCases({ getCatalogPage });

    const { pageSize } = mountComposable(useShowCatalog, useCases, {
      pageSize: 100,
    });
    await flushPromises();

    expect(pageSize.value).toBe(100);
  });

  it('nextPage/prevPage are bounded by totalPages, no probing needed', async () => {
    const getCatalogPage = vi
      .fn()
      .mockResolvedValueOnce(page([], 0, 2))
      .mockResolvedValueOnce(page([], 1, 2))
      .mockResolvedValueOnce(page([], 0, 2));
    const useCases = makeUseCases({ getCatalogPage });

    const {
      page: pageRef,
      nextPage,
      prevPage,
      totalPages,
    } = mountComposable(useShowCatalog, useCases);
    await flushPromises();
    expect(totalPages.value).toBe(2);

    nextPage();
    await flushPromises();
    expect(pageRef.value).toBe(1);
    expect(getCatalogPage).toHaveBeenCalledTimes(2);

    // Already on the last page — no-op, no extra request.
    nextPage();
    await flushPromises();
    expect(getCatalogPage).toHaveBeenCalledTimes(2);

    prevPage();
    await flushPromises();
    expect(getCatalogPage).toHaveBeenCalledTimes(3);
  });

  it('prevPage is a no-op at page 0', async () => {
    const getCatalogPage = vi.fn().mockResolvedValue(page([], 0, 1));
    const useCases = makeUseCases({ getCatalogPage });

    const { prevPage } = mountComposable(useShowCatalog, useCases);
    await flushPromises();

    prevPage();
    await flushPromises();

    expect(getCatalogPage).toHaveBeenCalledTimes(1);
  });

  it('goToPage jumps directly to the requested page', async () => {
    const getCatalogPage = vi.fn().mockResolvedValue(page([], 7, 20));
    const useCases = makeUseCases({ getCatalogPage });

    const { goToPage, page: pageRef } = mountComposable(
      useShowCatalog,
      useCases,
    );
    await flushPromises();

    goToPage(7);
    await flushPromises();

    expect(getCatalogPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 7 }),
    );
    expect(pageRef.value).toBe(7);
  });

  it('changing genre resets to page 0 and refetches with the new filter', async () => {
    const getCatalogPage = vi
      .fn()
      .mockResolvedValueOnce(page([], 0, 5))
      .mockResolvedValueOnce(page([], 3, 5))
      .mockResolvedValueOnce(page([], 0, 2));
    const useCases = makeUseCases({ getCatalogPage });

    const { goToPage, genre, page: pageRef } = mountComposable(
      useShowCatalog,
      useCases,
    );
    await flushPromises();

    goToPage(3);
    await flushPromises();
    expect(pageRef.value).toBe(3);

    genre.value = 'Drama';
    await flushPromises();

    expect(pageRef.value).toBe(0);
    expect(getCatalogPage).toHaveBeenLastCalledWith({
      page: 0,
      pageSize: undefined,
      genre: 'Drama',
      sort: undefined,
    });
  });

  it('changing sort resets to page 0 and refetches', async () => {
    const getCatalogPage = vi
      .fn()
      .mockResolvedValueOnce(page([], 0, 5))
      .mockResolvedValueOnce(page([], 2, 5))
      .mockResolvedValueOnce(page([], 0, 5));
    const useCases = makeUseCases({ getCatalogPage });

    const { goToPage, sort, page: pageRef } = mountComposable(
      useShowCatalog,
      useCases,
    );
    await flushPromises();

    goToPage(2);
    await flushPromises();

    sort.value = 'title';
    await flushPromises();

    expect(pageRef.value).toBe(0);
    expect(getCatalogPage).toHaveBeenLastCalledWith({
      page: 0,
      pageSize: undefined,
      genre: undefined,
      sort: 'title',
    });
  });

  it('keeps the last successful page visible when a later request fails', async () => {
    const show1 = makeShow({ id: 1, genres: ['Drama'] });
    const getCatalogPage = vi
      .fn()
      .mockResolvedValueOnce(page([show1], 0, 2))
      .mockRejectedValueOnce(new Error('network down'));
    const useCases = makeUseCases({ getCatalogPage });

    const {
      shows,
      page: pageRef,
      error,
      nextPage,
    } = mountComposable(useShowCatalog, useCases);
    await flushPromises();

    nextPage();
    await flushPromises();

    expect(shows.value).toEqual([show1]);
    expect(pageRef.value).toBe(0);
    expect(error.value).toBe('network down');
  });

  it('reload() re-requests the current page', async () => {
    const getCatalogPage = vi.fn().mockResolvedValue(page([], 0, 1));
    const useCases = makeUseCases({ getCatalogPage });

    const { reload } = mountComposable(useShowCatalog, useCases);
    await flushPromises();

    reload();
    await flushPromises();

    expect(getCatalogPage).toHaveBeenCalledTimes(2);
  });
});
