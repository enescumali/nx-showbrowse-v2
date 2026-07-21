// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { useShows } from './useShows';
import { makeUseCases } from '../test-utils/makeUseCases';
import { mountComposable } from '../test-utils/mountComposable';
import { makeShow } from '../test-utils/makeShow';

const mockShow = makeShow({ id: 1, title: 'Test Show', genres: ['Drama'] });

describe('useShows', () => {
  it('loads shows on mount', async () => {
    const useCases = makeUseCases({
      getShows: vi.fn().mockResolvedValue([mockShow]),
    });

    const { shows, loading } = mountComposable(useShows, useCases);

    expect(loading.value).toBe(true);

    await flushPromises();

    expect(useCases.getShows).toHaveBeenCalled();
    expect(shows.value).toEqual([mockShow]);
    expect(loading.value).toBe(false);
  });

  it('sets error on failure', async () => {
    const useCases = makeUseCases({
      getShows: vi.fn().mockRejectedValue(new Error('API error')),
    });

    const { error, loading } = mountComposable(useShows, useCases);

    await flushPromises();

    expect(error.value).toBe('API error');
    expect(loading.value).toBe(false);
  });

  it('reload re-fetches shows', async () => {
    const updatedShow = { ...mockShow, id: 2 };
    const getShows = vi
      .fn()
      .mockResolvedValueOnce([mockShow])
      .mockResolvedValueOnce([updatedShow]);

    const useCases = makeUseCases({ getShows });
    const { reload, shows } = mountComposable(useShows, useCases);

    await reload();

    expect(getShows).toHaveBeenCalledTimes(2);
    expect(shows.value).toEqual([updatedShow]);
  });
});
