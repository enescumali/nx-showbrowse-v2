// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { useShowCatalog } from './useShowCatalog';
import { makeUseCases } from '../test-utils/makeUseCases';
import { mountComposable } from '../test-utils/mountComposable';
import { makeShow } from '../test-utils/makeShow';

const page0Show = makeShow({ id: 1, title: 'Page 0 Show', genres: ['Drama'] });
const page1Show = makeShow({ id: 2, title: 'Page 1 Show', genres: ['Comedy'] });

describe('useShowCatalog', () => {
  it('loads page 0 on mount', async () => {
    const useCases = makeUseCases({
      getShows: vi.fn().mockResolvedValue([page0Show]),
    });

    const { shows, page } = mountComposable(useShowCatalog, useCases);
    await flushPromises();

    expect(useCases.getShows).toHaveBeenCalledWith(0);
    expect(shows.value).toEqual([page0Show]);
    expect(page.value).toBe(0);
  });

  it('nextPage fetches the following page', async () => {
    const getShows = vi
      .fn()
      .mockResolvedValueOnce([page0Show])
      .mockResolvedValueOnce([page1Show]);
    const useCases = makeUseCases({ getShows });

    const { shows, page, nextPage } = mountComposable(
      useShowCatalog,
      useCases,
    );
    await flushPromises();

    nextPage();
    await flushPromises();

    expect(getShows).toHaveBeenCalledWith(1);
    expect(shows.value).toEqual([page1Show]);
    expect(page.value).toBe(1);
  });

  it('keeps the last successful page visible when a page fails to load, and continues forward on retry', async () => {
    const getShows = vi
      .fn()
      .mockResolvedValueOnce([page0Show]) // initial load: page 0
      .mockRejectedValueOnce(new Error('[404] Not Found')) // nextPage: page 1 fails
      .mockResolvedValueOnce([page1Show]); // nextPage again: page 2 succeeds
    const useCases = makeUseCases({ getShows });

    const { shows, page, error, nextPage } = mountComposable(
      useShowCatalog,
      useCases,
    );
    await flushPromises();

    nextPage();
    await flushPromises();

    expect(shows.value).toEqual([page0Show]);
    expect(page.value).toBe(0);
    expect(error.value).toBe('[404] Not Found');

    nextPage();
    await flushPromises();

    expect(getShows).toHaveBeenNthCalledWith(3, 2);
    expect(shows.value).toEqual([page1Show]);
    expect(page.value).toBe(2);
  });

  it('prevPage is a no-op at page 0', async () => {
    const getShows = vi.fn().mockResolvedValue([page0Show]);
    const useCases = makeUseCases({ getShows });

    const { prevPage } = mountComposable(useShowCatalog, useCases);
    await flushPromises();

    prevPage();
    await flushPromises();

    expect(getShows).toHaveBeenCalledTimes(1);
  });

  it('goToPage jumps directly to the requested page', async () => {
    const getShows = vi
      .fn()
      .mockResolvedValueOnce([page0Show])
      .mockResolvedValueOnce([page1Show]);
    const useCases = makeUseCases({ getShows });

    const { shows, page, goToPage } = mountComposable(
      useShowCatalog,
      useCases,
    );
    await flushPromises();

    goToPage(7);
    await flushPromises();

    expect(getShows).toHaveBeenCalledWith(7);
    expect(shows.value).toEqual([page1Show]);
    expect(page.value).toBe(7);
  });
});
