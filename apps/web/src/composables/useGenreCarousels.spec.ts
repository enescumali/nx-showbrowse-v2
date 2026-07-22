// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { useGenreCarousels } from './useGenreCarousels';
import { makeUseCases } from '../test-utils/makeUseCases';
import { mountComposable } from '../test-utils/mountComposable';

describe('useGenreCarousels', () => {
  it('loads genre groups on mount with the given limit', async () => {
    const groups = [{ genre: 'Drama', shows: [] }];
    const useCases = makeUseCases({
      getGenreGroups: vi.fn().mockResolvedValue(groups),
    });

    const { genreGroups, loading } = mountComposable(
      useGenreCarousels,
      useCases,
      5,
    );
    expect(loading.value).toBe(true);
    await flushPromises();

    expect(useCases.getGenreGroups).toHaveBeenCalledWith(5);
    expect(genreGroups.value).toEqual(groups);
    expect(loading.value).toBe(false);
  });

  it('defaults the limit to 20', async () => {
    const useCases = makeUseCases();
    mountComposable(useGenreCarousels, useCases);
    await flushPromises();

    expect(useCases.getGenreGroups).toHaveBeenCalledWith(20);
  });

  it('sets error on failure', async () => {
    const useCases = makeUseCases({
      getGenreGroups: vi.fn().mockRejectedValue(new Error('boom')),
    });

    const { error, genreGroups } = mountComposable(useGenreCarousels, useCases);
    await flushPromises();

    expect(error.value).toBe('boom');
    expect(genreGroups.value).toEqual([]);
  });

  it('reload() re-fetches', async () => {
    const useCases = makeUseCases();
    const { reload } = mountComposable(useGenreCarousels, useCases);
    await flushPromises();

    reload();
    await flushPromises();

    expect(useCases.getGenreGroups).toHaveBeenCalledTimes(2);
  });
});
