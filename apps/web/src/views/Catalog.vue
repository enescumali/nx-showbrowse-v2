<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useShowCatalog } from '../composables/useShowCatalog';
import { useGenreNames } from '../composables/useGenreNames';
import ShowThumbnailGrid from '../components/show/ThumbnailGrid.vue';
import SkeletonBlock from '../components/SkeletonBlock.vue';
import CatalogFilters from '../components/catalog/Filters.vue';
import CatalogPagination from '../components/catalog/Pagination.vue';
import { toSort, toPageSize } from '../utils';
import { DEFAULT_PAGE_SIZE } from '../config';

const route = useRoute();
const router = useRouter();

const {
  shows,
  page,
  totalShows,
  totalPages,
  genre,
  sort,
  requestedPageSize,
  loading,
  error,
  nextPage,
  prevPage,
  goToPage,
  reload,
} = useShowCatalog({
  initialPage: Number(route.query.page) || 0,
  genre: typeof route.query.genre === 'string' ? route.query.genre : '',
  sort: toSort(route.query.sort) || undefined,
  pageSize: toPageSize(route.query.pageSize),
});

const { genreNames } = useGenreNames();

onMounted(() => {
  document.title = 'All Shows — ShowBrowse';
});

// Keep the URL in sync with page/genre/sort (deep links, back/forward,
// shareable filtered/sorted views) — genre/sort now trigger a real,
// global refetch via useShowCatalog, not a local re-render.
watch([page, genre, sort, requestedPageSize], () => {
  const query: Record<string, string> = {};
  if (page.value) query.page = String(page.value);
  if (genre.value) query.genre = genre.value;
  if (sort.value) query.sort = sort.value;
  if (
    requestedPageSize.value &&
    requestedPageSize.value !== DEFAULT_PAGE_SIZE
  ) {
    query.pageSize = String(requestedPageSize.value);
  }
  router.replace({ query });
});

watch(
  () => route.query,
  (q) => {
    const targetPage = Number(q.page) || 0;
    if (targetPage !== page.value) goToPage(targetPage);

    const targetGenre = typeof q.genre === 'string' ? q.genre : '';
    if (targetGenre !== genre.value) genre.value = targetGenre;

    const targetSort = toSort(q.sort);
    if (targetSort !== sort.value) sort.value = targetSort;

    const targetPageSize = toPageSize(q.pageSize);
    if (targetPageSize !== requestedPageSize.value) {
      requestedPageSize.value = targetPageSize;
    }
  },
);
</script>

<template>
  <main
    id="main-content"
    tabindex="-1"
    class="max-w-[1400px] mx-auto px-4 pt-20 pb-8"
  >
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-text m-0">All Shows</h1>
      <p class="text-text-subtle text-sm mt-1">
        Browse the full TVMaze catalog, filtered and sorted across the entire
        dataset.
      </p>
    </header>

    <CatalogFilters
      v-model:genre="genre"
      v-model:sort="sort"
      v-model:page-size="requestedPageSize"
      :genre-names="genreNames"
    />

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
      class="text-center py-6 text-brand-text"
      role="alert"
    >
      {{ error }}
      <br />
      <button
        class="mt-4 px-5 py-2 border border-brand rounded text-brand-text bg-transparent cursor-pointer text-sm hover:bg-brand hover:text-white transition-colors"
        @click="reload"
      >
        Try again
      </button>
    </div>

    <template v-else>
      <!-- A later page failed, but we still have a previous page to show -->
      <div
        v-if="error"
        class="mb-4 rounded border border-brand/40 bg-brand/10 text-brand-text text-sm px-3 py-2"
        role="alert"
      >
        Couldn't load that page ({{ error }}). Still showing page
        {{ page + 1 }}.
      </div>

      <div
        v-if="shows.length === 0"
        class="text-center py-12 text-text-subtle text-lg"
      >
        No shows found for the selected genre.
      </div>
      <template v-else>
        <ShowThumbnailGrid :shows="shows" />

        <CatalogPagination
          :page="page"
          :total-pages="totalPages"
          :total-shows="totalShows"
          :loading="loading"
          @prev="prevPage"
          @next="nextPage"
        />
      </template>
    </template>
  </main>
</template>
