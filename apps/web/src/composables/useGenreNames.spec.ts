// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { useGenreNames } from './useGenreNames';
import { makeUseCases } from '../test-utils/makeUseCases';
import { mountComposable } from '../test-utils/mountComposable';

describe('useGenreNames', () => {
  it('loads genre names on mount', async () => {
    const names = [
      { genre: 'Drama', count: 10 },
      { genre: 'Comedy', count: 4 },
    ];
    const useCases = makeUseCases({
      getGenreNames: vi.fn().mockResolvedValue(names),
    });

    const { genreNames, loading } = mountComposable(useGenreNames, useCases);
    expect(loading.value).toBe(true);
    await flushPromises();

    expect(useCases.getGenreNames).toHaveBeenCalled();
    expect(genreNames.value).toEqual(names);
    expect(loading.value).toBe(false);
  });

  it('sets error on failure', async () => {
    const useCases = makeUseCases({
      getGenreNames: vi.fn().mockRejectedValue(new Error('boom')),
    });

    const { error, genreNames } = mountComposable(useGenreNames, useCases);
    await flushPromises();

    expect(error.value).toBe('boom');
    expect(genreNames.value).toEqual([]);
  });
});
