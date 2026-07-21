// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import type { Show } from '@show-browse/shows';
import { useCountryShows } from './useCountryShows';
import { makeUseCases } from '../test-utils/makeUseCases';
import { mountComposable } from '../test-utils/mountComposable';
import { makeShow } from '../test-utils/makeShow';

const mockShow = makeShow({ id: 1, title: 'Test Show', genres: ['Drama'] });

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock);
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
});

describe('useCountryShows', () => {
  it('loads shows for a given country', async () => {
    const useCases = makeUseCases({
      getShowsByCountry: vi.fn().mockResolvedValue([mockShow]),
    });

    const { selectedCountry, countryShows } = mountComposable(
      useCountryShows,
      useCases,
    );

    selectedCountry.value = 'US';
    await flushPromises();

    expect(useCases.getShowsByCountry).toHaveBeenCalledWith('US');
    expect(countryShows.value).toEqual([mockShow]);
  });

  it('clears shows when country is set to empty string', async () => {
    const useCases = makeUseCases({
      getShowsByCountry: vi.fn().mockResolvedValue([mockShow]),
    });

    const { selectedCountry, countryShows } = mountComposable(
      useCountryShows,
      useCases,
    );

    selectedCountry.value = 'US';
    await flushPromises();

    selectedCountry.value = '';
    await flushPromises();

    expect(countryShows.value).toEqual([]);
    expect(useCases.getShowsByCountry).toHaveBeenCalledTimes(1);
  });

  it('sets countryError on failure', async () => {
    const useCases = makeUseCases({
      getShowsByCountry: vi.fn().mockRejectedValue(new Error('API error')),
    });

    const { selectedCountry, countryError, countryShows } = mountComposable(
      useCountryShows,
      useCases,
    );

    selectedCountry.value = 'US';
    await flushPromises();

    expect(countryError.value).toBe('API error');
    expect(countryShows.value).toEqual([]);
  });

  it('manages countryLoading state during fetch', async () => {
    let resolve!: (v: Show[]) => void;
    const pending = new Promise<Show[]>((res) => {
      resolve = res;
    });

    const useCases = makeUseCases({
      getShowsByCountry: vi.fn().mockReturnValue(pending),
    });

    const { selectedCountry, countryLoading } = mountComposable(
      useCountryShows,
      useCases,
    );

    selectedCountry.value = 'US';
    await flushPromises();

    expect(countryLoading.value).toBe(true);
    resolve([mockShow]);

    await flushPromises();
    expect(countryLoading.value).toBe(false);
  });

  it('persists selected country to localStorage', async () => {
    const useCases = makeUseCases();
    const { selectedCountry } = mountComposable(useCountryShows, useCases);
    selectedCountry.value = 'TR';

    await flushPromises();

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'show-browse:selected-country',
      'TR',
    );
  });
});
