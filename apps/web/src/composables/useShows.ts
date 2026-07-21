import { ref, onMounted } from 'vue';
import type { Show } from '@show-browse/shows';
import { injectRequired, SHOWS_USE_CASES_KEY } from '../di/injection-keys';
import { useAsyncState } from './useAsyncState';

export function useShows() {
  const useCases = injectRequired(SHOWS_USE_CASES_KEY, 'ShowsUseCases');
  const { loading, error, run } = useAsyncState();

  const shows = ref<Show[]>([]);

  async function load() {
    const result = await run(() => useCases.getShows(), 'Failed to load shows');
    if (result !== null) {
      shows.value = result;
    }
  }

  onMounted(() => load());

  return { shows, loading, error, reload: load };
}
