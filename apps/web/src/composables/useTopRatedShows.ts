import { ref, onMounted } from 'vue';
import type { Show } from '@show-browse/shows';
import { injectRequired, SHOWS_USE_CASES_KEY } from '../di/injection-keys';
import { useAsyncState } from './useAsyncState';

/** A real global top-N by rating (via getCatalogPage), for Home's
 * hero/top-10 row — not a client-derived slice of a partial snapshot. */
export function useTopRatedShows(limit = 10) {
  const useCases = injectRequired(SHOWS_USE_CASES_KEY, 'ShowsUseCases');
  const { loading, error, run } = useAsyncState();

  const shows = ref<Show[]>([]);

  async function load() {
    const result = await run(
      () =>
        useCases
          .getCatalogPage({ sort: 'rating', pageSize: limit, page: 0 })
          .then((page) => page.shows),
      'Failed to load top-rated shows',
    );
    if (result !== null) {
      shows.value = result;
    }
  }

  onMounted(() => load());

  return { shows, loading, error, reload: load };
}
