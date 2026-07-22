import { ref, onMounted } from 'vue';
import type { GenreGroup } from '@show-browse/shows';
import { injectRequired, SHOWS_USE_CASES_KEY } from '../di/injection-keys';
import { useAsyncState } from './useAsyncState';

/** Genre rows for Home's carousels — a bounded top-N per genre computed by
 * apps/api across the *entire* catalog, not a client-side slice of a
 * partial snapshot. */
export function useGenreCarousels(limit = 20) {
  const useCases = injectRequired(SHOWS_USE_CASES_KEY, 'ShowsUseCases');
  const { loading, error, run } = useAsyncState();

  const genreGroups = ref<GenreGroup[]>([]);

  async function load() {
    const result = await run(
      () => useCases.getGenreGroups(limit),
      'Failed to load genres',
    );
    if (result !== null) {
      genreGroups.value = result;
    }
  }

  onMounted(() => load());

  return { genreGroups, loading, error, reload: load };
}
