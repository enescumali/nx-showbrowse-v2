<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useShowCatalog } from '../composables/useShowCatalog';
import ShowThumbnailGrid from '../components/ShowThumbnailGrid.vue';
import SkeletonBlock from '../components/SkeletonBlock.vue';

const props = defineProps<{ genre: string }>();

const {
  shows,
  page,
  totalShows,
  totalPages,
  genre,
  loading,
  error,
  nextPage,
  prevPage,
  reload,
} = useShowCatalog({ genre: props.genre, sort: 'rating' });

onMounted(() => {
  document.title = `${props.genre} Shows — ShowBrowse`;
});

// The Genre route component is reused across genre-to-genre navigation
// (e.g. via a show detail page's genre chips), so a prop change needs an
// explicit refetch — it won't happen "for free" the way a synchronous
// computed over an already-loaded snapshot used to.
watch(
  () => props.genre,
  (g) => {
    document.title = `${g} Shows — ShowBrowse`;
    genre.value = g;
  },
);
</script>

<template>
  <main class="max-w-[1400px] mx-auto px-4 pb-8">
    <header class="pt-20 mb-8">
      <h1 class="text-3xl font-bold text-[#e5e5e5] m-0">{{ genre }}</h1>
      <p class="text-[#999] text-sm mt-1">
        <template v-if="!loading"
          >{{ totalShows.toLocaleString() }} shows, sorted by rating</template
        >
        <template v-else>Loading…</template>
      </p>
    </header>

    <!-- Initial load -->
    <div v-if="loading && shows.length === 0" aria-busy="true">
      <div
        class="grid gap-6"
        style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))"
      >
        <div v-for="card in 20" :key="card" class="flex flex-col gap-2">
          <SkeletonBlock class="w-full rounded-lg" style="aspect-ratio: 2/3" />
          <SkeletonBlock class="h-3 w-full" />
          <SkeletonBlock class="h-3 w-2/3" />
        </div>
      </div>
    </div>

    <!-- No page has ever loaded successfully -->
    <div
      v-else-if="error && shows.length === 0"
      class="text-center py-12 text-[#E50914]"
      role="alert"
    >
      {{ error }}
      <br />
      <button
        class="mt-4 px-5 py-2 border border-[#E50914] rounded text-[#E50914] bg-transparent cursor-pointer text-sm hover:bg-[#E50914] hover:text-white transition-colors"
        @click="reload"
      >
        Try again
      </button>
    </div>

    <template v-else>
      <!-- A later page failed, but we still have a previous page to show -->
      <div
        v-if="error"
        class="mb-4 rounded border border-[#E50914]/40 bg-[#E50914]/10 text-[#E50914] text-sm px-3 py-2"
        role="alert"
      >
        Couldn't load that page ({{ error }}). Still showing page
        {{ page + 1 }}.
      </div>

      <div
        v-if="shows.length === 0"
        class="text-center py-12 text-[#999] text-lg"
      >
        No {{ genre }} shows found.
      </div>
      <template v-else>
        <ShowThumbnailGrid :shows="shows" />

        <div class="flex items-center justify-center gap-2 mt-8">
          <button
            type="button"
            class="px-3 py-1.5 rounded border border-[#333] text-sm text-[#e5e5e5] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#E50914] transition-colors"
            :disabled="page === 0 || loading"
            aria-label="Previous page"
            @click="prevPage"
          >
            ‹ Prev
          </button>
          <span class="text-sm text-[#b3b3b3]" role="status" aria-live="polite">
            Page {{ page + 1 }} of {{ totalPages }}
          </span>
          <button
            type="button"
            class="px-3 py-1.5 rounded border border-[#333] text-sm text-[#e5e5e5] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#E50914] transition-colors"
            :disabled="page >= totalPages - 1 || loading"
            aria-label="Next page"
            @click="nextPage"
          >
            Next ›
          </button>
        </div>
      </template>
    </template>
  </main>
</template>
