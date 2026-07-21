import { ref, watch } from 'vue';
import { injectRequired, SHOWS_USE_CASES_KEY } from '../di/injection-keys';
import { useAsyncState } from './useAsyncState';
import { DEFAULT_COUNTRY } from '../config/countries';
import type { Show } from '@show-browse/shows';

export function useCountryShows() {
  const useCases = injectRequired(SHOWS_USE_CASES_KEY, 'ShowsUseCases');
  const { loading: countryLoading, error: countryError, run } = useAsyncState();

  const STORAGE_KEY = 'show-browse:selected-country';
  const storedCountry = localStorage.getItem(STORAGE_KEY);
  const selectedCountry = ref(storedCountry ?? DEFAULT_COUNTRY);
  const countryShows = ref<Show[]>([]);

  async function loadCountryShows(country: string) {
    if (!country) {
      countryShows.value = [];
      countryError.value = null;
      return;
    }
    const result = await run(
      () => useCases.getShowsByCountry(country),
      'Failed to load shows',
    );
    countryShows.value = result ?? [];
  }

  watch(selectedCountry, (country) => {
    localStorage.setItem(STORAGE_KEY, country);
    loadCountryShows(country);
  });

  return {
    selectedCountry,
    countryShows,
    countryLoading,
    countryError,
    loadCountryShows,
  };
}
