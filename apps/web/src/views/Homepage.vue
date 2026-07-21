<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useShows } from '../composables/useShows';
import { useShowSearch } from '../composables/useShowSearch';
import { useGenreGroups } from '../composables/useGenreGroups';
import HeroBanner from '../components/HeroBanner.vue';
import ShowCarousel from '../components/ShowCarousel.vue';
import ShowThumbnailGrid from '../components/ShowThumbnailGrid.vue';
import SkeletonBlock from '../components/SkeletonBlock.vue';

const route = useRoute();
const { shows, loading, error, reload } = useShows();

onMounted(() => {
  document.title = 'ShowBrowse — Home';
});

const { searchResults, searchLoading, searchError, search } = useShowSearch();
const { genreGroups } = useGenreGroups(shows);

const top10 = computed(() =>
  [...shows.value]
    .filter((m) => m.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10),
);

const featuredShow = computed(() => {
  if (!top10.value.length) return null;
  return top10.value[Math.floor(Math.random() * top10.value.length)];
});

const searchQuery = computed(() => (route.query.q as string) ?? '');
const isSearchMode = computed(() => searchQuery.value.trim().length > 0);

watch(searchQuery, (q) => search(q), { immediate: true });
</script>

<template>
  <main class="max-w-[1400px] mx-auto px-4 pt-20 pb-8">
    <!-- Search mode -->
    <template v-if="isSearchMode">
      <h1 class="text-2xl font-bold text-[#e5e5e5] mb-6">
        Search results for "{{ searchQuery }}"
      </h1>
      <div
        v-if="searchLoading"
        class="text-center py-12 text-[#999] text-lg"
        role="status"
        aria-live="polite"
      >
        Searching…
      </div>
      <div
        v-else-if="searchError"
        class="text-center py-12 text-[#E50914] text-lg"
        role="alert"
      >
        {{ searchError }}
      </div>
      <div
        v-else-if="searchResults.length === 0"
        class="text-center py-12 text-[#999] text-lg"
      >
        No results for "{{ searchQuery }}"
      </div>
      <ShowThumbnailGrid v-else :shows="searchResults" />
    </template>

    <!-- Browse mode: genre carousels -->
    <template v-else>
      <div v-if="loading" aria-busy="true">
        <!-- Hero skeleton -->
        <SkeletonBlock
          class="w-full mb-10 rounded-none"
          style="min-height: 480px"
        />
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
        class="text-center py-12 text-[#E50914] text-lg"
        role="alert"
      >
        {{ error }}
        <br />
        <button
          class="mt-4 px-5 py-2 border border-[#E50914] rounded text-[#E50914] bg-transparent cursor-pointer text-sm hover:bg-[#E50914] hover:text-white transition-colors"
          @click="reload()"
        >
          Try again
        </button>
      </div>
      <template v-else>
        <HeroBanner v-if="featuredShow" :show="featuredShow" />

        <ShowCarousel
          v-if="top10.length > 0"
          genre="⭐ Top 10 by Rating"
          :shows="top10"
        />

        <ShowCarousel
          v-for="[genre, shows] in genreGroups"
          :key="genre"
          :genre="genre"
          :shows="shows"
        />
      </template>
    </template>
  </main>
</template>
