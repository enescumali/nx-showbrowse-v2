// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import type { Show } from '@show-browse/shows';
import { useShowSearch } from './useShowSearch';
import { makeUseCases } from '../test-utils/makeUseCases';
import { mountComposable } from '../test-utils/mountComposable';
import { makeShow } from '../test-utils/makeShow';

const mockShow = makeShow({ id: 1, title: 'Test Show', genres: ['Drama'] });

describe('useShowSearch', () => {
  it('calls searchShows and sets results for a valid query', async () => {
    const useCases = makeUseCases({
      searchShows: vi.fn().mockResolvedValue([mockShow]),
    });

    const { search, searchResults } = mountComposable(useShowSearch, useCases);

    await search('batman');

    expect(useCases.searchShows).toHaveBeenCalledWith('batman');
    expect(searchResults.value).toEqual([mockShow]);
  });

  it('does not call searchShows for an empty query', async () => {
    const useCases = makeUseCases();
    const { search, searchResults } = mountComposable(useShowSearch, useCases);

    await search('');

    expect(useCases.searchShows).not.toHaveBeenCalled();
    expect(searchResults.value).toEqual([]);
  });

  it('does not call searchShows for a blank/whitespace query', async () => {
    const useCases = makeUseCases();
    const { search } = mountComposable(useShowSearch, useCases);

    await search('   ');
    expect(useCases.searchShows).not.toHaveBeenCalled();
  });

  it('sets error on failure', async () => {
    const useCases = makeUseCases({
      searchShows: vi.fn().mockRejectedValue(new Error('Network error')),
    });

    const { search, searchError } = mountComposable(useShowSearch, useCases);

    await search('batman');

    expect(searchError.value).toBe('Network error');
  });

  it('clears results when called with empty string', async () => {
    const useCases = makeUseCases({
      searchShows: vi.fn().mockResolvedValue([mockShow]),
    });

    const { search, searchResults } = mountComposable(useShowSearch, useCases);

    await search('batman');

    expect(searchResults.value).toEqual([mockShow]);

    await search('');
    expect(searchResults.value).toEqual([]);
  });
});
