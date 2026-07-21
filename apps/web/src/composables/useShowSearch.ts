import { ref } from 'vue';
import type { Show } from '@show-browse/shows';
import { injectRequired, SHOWS_USE_CASES_KEY } from '../di/injection-keys';

export function useShowSearch() {
  const useCases = injectRequired(SHOWS_USE_CASES_KEY, 'ShowsUseCases');
  const searchResults = ref<Show[]>([]);
  const searchLoading = ref(false);
  const searchError = ref<string | null>(null);

  async function search(query: string) {
    if (!query.trim()) {
      searchResults.value = [];
      return;
    }
    searchLoading.value = true;
    searchError.value = null;
    try {
      searchResults.value = await useCases.searchShows(query);
    } catch (err) {
      searchError.value = err instanceof Error ? err.message : 'Search failed';
    } finally {
      searchLoading.value = false;
    }
  }

  return { searchResults, searchLoading, searchError, search };
}
