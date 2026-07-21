import { ref, onMounted } from 'vue';
import type { ShowDetail } from '@show-browse/shows';
import { injectRequired, SHOWS_USE_CASES_KEY } from '../di/injection-keys';
import { useAsyncState } from './useAsyncState';

export function useShowDetail(id: string | number) {
  const useCases = injectRequired(SHOWS_USE_CASES_KEY, 'ShowsUseCases');
  const { loading, error, run } = useAsyncState();

  const show = ref<ShowDetail | null>(null);

  onMounted(async () => {
    show.value = await run(
      () => useCases.getShowDetail(id),
      'Failed to load show detail',
    );
  });

  return { show, loading, error };
}
