import { ref, onMounted } from 'vue';
import type { GenreSummary } from '@show-browse/shows';
import { injectRequired, SHOWS_USE_CASES_KEY } from '../di/injection-keys';
import { useAsyncState } from './useAsyncState';

/** Genre names + counts only — no Show payloads — for NavBar's nav links
 * and Catalog's genre filter dropdown. */
export function useGenreNames() {
  const useCases = injectRequired(SHOWS_USE_CASES_KEY, 'ShowsUseCases');
  const { loading, error, run } = useAsyncState();

  const genreNames = ref<GenreSummary[]>([]);

  async function load() {
    const result = await run(
      () => useCases.getGenreNames(),
      'Failed to load genres',
    );
    if (result !== null) {
      genreNames.value = result;
    }
  }

  onMounted(() => load());

  return { genreNames, loading, error, reload: load };
}
