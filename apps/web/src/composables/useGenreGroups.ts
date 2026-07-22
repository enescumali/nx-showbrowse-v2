import { computed } from 'vue';
import type { Ref } from 'vue';
import type { Show } from '@show-browse/shows';
import { groupShowsByGenre } from '@show-browse/shows';

/** Client-side grouping for small, already-fetched lists — e.g. Today's
 * country schedule. Unrelated to the bulk-crawled catalog: Home/Catalog/
 * Genre use apps/api's own genre-aware endpoints instead, since grouping
 * the full ~89k-show index client-side would be pointless and slow. */
export function useGenreGroups(shows: Ref<Show[]>) {
  const genreGroups = computed(() => groupShowsByGenre(shows.value));

  return { genreGroups };
}
