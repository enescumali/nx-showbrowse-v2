<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useShowCatalog } from '../composables/useShowCatalog';
import { useGenreNames } from '../composables/useGenreNames';
import ShowThumbnailGrid from '../components/ShowThumbnailGrid.vue';
import SkeletonBlock from '../components/SkeletonBlock.vue';
import type { CatalogSort } from '@show-browse/shows';

const route = useRoute();
const router = useRouter();

function toSort(value: unknown): CatalogSort | '' {
  return value === 'rating' || value === 'date' || value === 'title'
    ? value
    : '';
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250];
const DEFAULT_PAGE_SIZE = 250;

function toPageSize(value: unknown): number {
  const parsed = Number(value);
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

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
  <main id="main-content" tabindex="-1" class="max-w-[1400px] mx-auto px-4 pt-20 pb-8">
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-text m-0">All Shows</h1>
      <p class="text-text-subtle text-sm mt-1">
        Browse the full TVMaze catalog, filtered and sorted across the entire
        dataset.
      </p>
    </header>

    <div class="flex flex-wrap items-center gap-3 mb-6 rounded-lg bg-card p-3">
      <label class="flex items-center gap-2 text-sm text-text-muted">
        Genre
        <select
          v-model="genre"
          class="bg-card-alt text-text text-sm rounded border border-border px-2 py-1"
        >
          <option value="">All genres</option>
          <option v-for="g in genreNames" :key="g.genre" :value="g.genre">
            {{ g.genre }} ({{ g.count }})
          </option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm text-text-muted">
        Sort by
        <select
          v-model="sort"
          class="bg-card-alt text-text text-sm rounded border border-border px-2 py-1"
        >
          <option value="">Default order</option>
          <option value="rating">Rating (high to low)</option>
          <option value="date">Release date (newest first)</option>
          <option value="title">Title (A–Z)</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm text-text-muted">
        Per page
        <select
          v-model.number="requestedPageSize"
          class="bg-card-alt text-text text-sm rounded border border-border px-2 py-1"
        >
          <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
      </label>
    </div>

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

        <div
          class="flex items-center justify-center gap-3 mt-6 flex-wrap rounded-lg bg-card p-3"
        >
          <button
            type="button"
            class="px-3 py-1.5 rounded border border-border text-sm text-text disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand transition-colors"
            :disabled="page === 0 || loading"
            aria-label="Previous page"
            @click="prevPage"
          >
            ‹ Prev
          </button>
          <span
            class="text-sm text-text-muted"
            role="status"
            aria-live="polite"
          >
            <template v-if="loading">Loading…</template>
            <template v-else>{{ page + 1 }} of {{ totalPages }}</template>
          </span>
          <button
            type="button"
            class="px-3 py-1.5 rounded border border-border text-sm text-text disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand transition-colors"
            :disabled="page >= totalPages - 1 || loading"
            aria-label="Next page"
            @click="nextPage"
          >
            Next ›
          </button>
          <span v-if="!loading" class="text-sm text-text-subtle">
            {{ totalShows.toLocaleString() }} shows total
          </span>
        </div>
      </template>
    </template>
  </main>
</template>
