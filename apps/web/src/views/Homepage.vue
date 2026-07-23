<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useShowSearch } from '../composables/useShowSearch';
import { useGenreCarousels } from '../composables/useGenreCarousels';
import { useTopRatedShows } from '../composables/useTopRatedShows';
import ShowCarousel from '../components/show/Carousel.vue';
import ShowThumbnailGrid from '../components/show/ThumbnailGrid.vue';
import SkeletonBlock from '../components/SkeletonBlock.vue';

const route = useRoute();

onMounted(() => {
  document.title = 'ShowBrowse — Home';
});

const { searchResults, searchLoading, searchError, search } = useShowSearch();

// Real, globally-computed data from apps/api — not a client-side slice of
// a single bounded TVMaze page.
const {
  genreGroups,
  loading: genresLoading,
  error: genresError,
  reload: reloadGenres,
} = useGenreCarousels(20);
const {
  shows: topRated,
  loading: topRatedLoading,
  error: topRatedError,
  reload: reloadTopRated,
} = useTopRatedShows(10);

const loading = computed(() => genresLoading.value || topRatedLoading.value);
const error = computed(() => genresError.value || topRatedError.value);
function reload() {
  reloadGenres();
  reloadTopRated();
}

const searchQuery = computed(() => (route.query.q as string) ?? '');
const isSearchMode = computed(() => searchQuery.value.trim().length > 0);

watch(searchQuery, (q) => search(q), { immediate: true });
</script>

<template>
  <main
    id="main-content"
    tabindex="-1"
    class="max-w-[1400px] mx-auto px-4 pt-20 pb-8"
  >
    <!-- Search mode -->
    <template v-if="isSearchMode">
      <h1 class="text-2xl font-bold text-text mb-6">
        Search results for "{{ searchQuery }}"
      </h1>
      <div
        v-if="searchLoading"
        class="text-center py-12 text-text-subtle text-lg"
        role="status"
        aria-live="polite"
      >
        Searching…
      </div>
      <div
        v-else-if="searchError"
        class="text-center py-12 text-brand-text text-lg"
        role="alert"
      >
        {{ searchError }}
      </div>
      <div
        v-else-if="searchResults.length === 0"
        class="text-center py-12 text-text-subtle text-lg"
      >
        No results for "{{ searchQuery }}"
      </div>
      <ShowThumbnailGrid v-else :shows="searchResults" />
    </template>

    <!-- Browse mode: genre carousels -->
    <template v-else>
      <div v-if="loading" aria-busy="true">
        <!-- Carousel skeletons -->
        <div v-for="row in 4" :key="row" class="mb-8">
          <SkeletonBlock class="h-5 w-40 mb-3 rounded" />
          <div class="flex gap-3 overflow-hidden">
            <div
              v-for="card in 8"
              :key="card"
              class="shrink-0 w-36 flex flex-col gap-2"
            >
              <SkeletonBlock
                class="w-full rounded-lg"
                style="aspect-ratio: 2/3"
              />
              <SkeletonBlock class="h-3 w-full" />
              <SkeletonBlock class="h-3 w-2/3" />
            </div>
          </div>
        </div>
      </div>
      <div
        v-else-if="error"
        class="text-center py-12 text-brand-text text-lg"
        role="alert"
      >
        {{ error }}
        <br />
        <button
          class="mt-4 px-5 py-2 border border-brand rounded text-brand-text bg-transparent cursor-pointer text-sm hover:bg-brand hover:text-white transition-colors"
          @click="reload()"
        >
          Try again
        </button>
      </div>
      <template v-else>
        <ShowCarousel
          v-if="topRated.length > 0"
          genre="⭐ Top 10 by Rating"
          :shows="topRated"
          :see-all-to="{ name: 'Catalog', query: { sort: 'rating' } }"
        />

        <ShowCarousel
          v-for="{ genre, shows } in genreGroups"
          :key="genre"
          :genre="genre"
          :shows="shows"
          :see-all-to="{ name: 'Catalog', query: { genre } }"
        />
      </template>
    </template>
  </main>
</template>
