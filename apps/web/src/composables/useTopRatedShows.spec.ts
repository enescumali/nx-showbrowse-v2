// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { useTopRatedShows } from './useTopRatedShows';
import { makeUseCases } from '../test-utils/makeUseCases';
import { mountComposable } from '../test-utils/mountComposable';
import { makeShow } from '../test-utils/makeShow';

describe('useTopRatedShows', () => {
  it('requests a rating-sorted first page with the given limit', async () => {
    const topShow = makeShow({ id: 1, title: 'Top Show', genres: ['Drama'] });
    const getCatalogPage = vi.fn().mockResolvedValue({
      shows: [topShow],
      page: 0,
      pageSize: 5,
      totalShows: 1,
      totalPages: 1,
    });
    const useCases = makeUseCases({ getCatalogPage });

    const { shows, loading } = mountComposable(useTopRatedShows, useCases, 5);
    expect(loading.value).toBe(true);
    await flushPromises();

    expect(getCatalogPage).toHaveBeenCalledWith({
      sort: 'rating',
      pageSize: 5,
      page: 0,
    });
    expect(shows.value).toEqual([topShow]);
  });

  it('defaults the limit to 10', async () => {
    const useCases = makeUseCases();
    mountComposable(useTopRatedShows, useCases);
    await flushPromises();

    expect(useCases.getCatalogPage).toHaveBeenCalledWith({
      sort: 'rating',
      pageSize: 10,
      page: 0,
    });
  });

  it('sets error on failure', async () => {
    const useCases = makeUseCases({
      getCatalogPage: vi.fn().mockRejectedValue(new Error('boom')),
    });

    const { error, shows } = mountComposable(useTopRatedShows, useCases);
    await flushPromises();

    expect(error.value).toBe('boom');
    expect(shows.value).toEqual([]);
  });
});
