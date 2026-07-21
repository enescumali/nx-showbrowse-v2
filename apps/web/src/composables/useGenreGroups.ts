import { computed } from 'vue';
import type { Ref } from 'vue';
import type { Show } from '@show-browse/shows';
import { groupShowsByGenre } from '@show-browse/shows';

export function useGenreGroups(shows: Ref<Show[]>) {
  const genreGroups = computed(() => groupShowsByGenre(shows.value));

  return { genreGroups };
}
