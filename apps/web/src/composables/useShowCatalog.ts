import { ref, onMounted, watch } from 'vue';
import type { Show, CatalogSort } from '@show-browse/shows';
import { injectRequired, SHOWS_USE_CASES_KEY } from '../di/injection-keys';
import { useAsyncState } from './useAsyncState';

export interface UseShowCatalogOptions {
  genre?: string;
  sort?: CatalogSort;
  pageSize?: number;
  initialPage?: number;
}

/**
 * Backed by apps/api's globally paginated/filtered/sorted /shows endpoint —
 * unlike the old TVMaze-direct version, a page beyond the end is just a
 * normal empty result with a correct totalPages, never a 404, so there's
 * no need to track an "attempted" page separately from the displayed one.
 * A failed request simply leaves the previously-loaded page on screen with
 * `error` set, and retrying (Next/Prev/reload) re-requests the same target.
 */
export function useShowCatalog(opts: UseShowCatalogOptions = {}) {
  const useCases = injectRequired(SHOWS_USE_CASES_KEY, 'ShowsUseCases');
  const { loading, error, run } = useAsyncState();

  const genre = ref(opts.genre ?? '');
  // '' (unset) is a valid, bindable <select> value — converted to
  // undefined only at the API-call boundary, same as genre.
  const sort = ref<CatalogSort | ''>(opts.sort ?? '');
  const requestedPageSize = opts.pageSize;

  const shows = ref<Show[]>([]);
  const page = ref(opts.initialPage ?? 0);
  const pageSize = ref(opts.pageSize ?? 0);
  const totalShows = ref(0);
  const totalPages = ref(0);

  async function load(targetPage: number) {
    const result = await run(
      () =>
        useCases.getCatalogPage({
          page: targetPage,
          pageSize: requestedPageSize,
          genre: genre.value || undefined,
          sort: sort.value || undefined,
        }),
      'Failed to load shows',
    );
    if (result !== null) {
      shows.value = result.shows;
      page.value = result.page;
      pageSize.value = result.pageSize;
      totalShows.value = result.totalShows;
      totalPages.value = result.totalPages;
    }
  }

  function nextPage() {
    if (page.value >= totalPages.value - 1) return;
    load(page.value + 1);
  }

  function prevPage() {
    if (page.value === 0) return;
    load(page.value - 1);
  }

  function goToPage(target: number) {
    if (target < 0) return;
    load(target);
  }

  function reload() {
    load(page.value);
  }

  // Changing genre/sort restarts browsing from page 0 — a page number
  // valid under the old filter may not exist under the new one.
  watch([genre, sort], () => load(0));

  onMounted(() => load(page.value));

  return {
    shows,
    page,
    pageSize,
    totalShows,
    totalPages,
    genre,
    sort,
    loading,
    error,
    nextPage,
    prevPage,
    goToPage,
    reload,
  };
}
