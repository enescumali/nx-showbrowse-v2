import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/**
 * Drives the show quick-view panel via a `?show=` query param on whatever
 * page is currently active, rather than a separate route — so the
 * background page (Catalog, Home, Today) stays mounted, its filters/
 * scroll/pagination state untouched, while the panel overlays it.
 * A `/catalog?show=5` link is itself shareable and opens the panel on cold
 * load for free, since `activeShowId` just reads the current route's query.
 * The browser's own back button also closes the panel for free, since
 * that's just popstate changing the reactive route underneath us.
 */
export function useQuickView() {
  const route = useRoute();
  const router = useRouter();

  const activeShowId = computed(() => {
    const id = route.query.show;
    return typeof id === 'string' ? id : null;
  });

  function openShow(id: number | string, showJson?: string) {
    return router.push({
      query: { ...route.query, show: String(id) },
      state: showJson ? { showJson } : undefined,
    });
  }

  function closeShow() {
    const query = { ...route.query };
    delete query.show;
    return router.replace({ query });
  }

  return { activeShowId, openShow, closeShow };
}
