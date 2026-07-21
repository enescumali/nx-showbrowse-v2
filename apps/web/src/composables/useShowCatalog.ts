import { ref, onMounted } from 'vue';
import type { Show } from '@show-browse/shows';
import { injectRequired, SHOWS_USE_CASES_KEY } from '../di/injection-keys';
import { useAsyncState } from './useAsyncState';

/**
 * Paginated browsing over the full TVMaze show index.
 *
 * `cursor` tracks the last *attempted* page and always moves on next/prev,
 * while `shows`/`page` only update on a successful fetch. That way a single
 * 404 on a sparse index gap (TVMaze pages aren't perfectly contiguous)
 * doesn't blank the grid — it just leaves the last good page on screen and
 * surfaces an inline error, and clicking next/prev again continues walking
 * the real index instead of retrying the same failing page forever.
 */
export function useShowCatalog(initialPage = 0) {
  const useCases = injectRequired(SHOWS_USE_CASES_KEY, 'ShowsUseCases');
  const { loading, error, run } = useAsyncState();

  const page = ref(initialPage);
  const shows = ref<Show[]>([]);
  let cursor = initialPage;

  async function load(target: number) {
    cursor = target;
    const result = await run(
      () => useCases.getShows(target),
      'Failed to load shows',
    );
    if (result !== null) {
      shows.value = result;
      page.value = target;
    }
  }

  function nextPage() {
    load(cursor + 1);
  }

  function prevPage() {
    if (cursor === 0) return;
    load(cursor - 1);
  }

  function goToPage(target: number) {
    if (target < 0) return;
    load(target);
  }

  function reload() {
    load(cursor);
  }

  onMounted(() => load(initialPage));

  return { shows, page, loading, error, nextPage, prevPage, goToPage, reload };
}
