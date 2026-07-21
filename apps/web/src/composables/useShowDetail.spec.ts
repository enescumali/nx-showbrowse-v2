// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { useShowDetail } from './useShowDetail';
import { mountComposable } from '../test-utils/mountComposable';
import { makeUseCases, mockDetail } from '../test-utils/makeUseCases';

describe('useShowDetail', () => {
  it('fetches show detail on mount', async () => {
    const useCases = makeUseCases();
    const { show, loading } = mountComposable(useShowDetail, useCases, 42);

    expect(loading.value).toBe(true);
    await flushPromises();

    expect(useCases.getShowDetail).toHaveBeenCalledWith(42);
    expect(show.value).toEqual(mockDetail);
    expect(loading.value).toBe(false);
  });

  it('sets error when fetch fails', async () => {
    const useCases = makeUseCases({
      getShowDetail: vi.fn().mockRejectedValue(new Error('Not found')),
    });

    const { error, show, loading } = mountComposable(
      useShowDetail,
      useCases,
      99,
    );

    await flushPromises();
    expect(error.value).toBe('Not found');
    expect(show.value).toBeNull();
    expect(loading.value).toBe(false);
  });

  it('accepts a string id', async () => {
    const useCases = makeUseCases();

    mountComposable(useShowDetail, useCases, '42');

    await flushPromises();
    expect(useCases.getShowDetail).toHaveBeenCalledWith('42');
  });
});
