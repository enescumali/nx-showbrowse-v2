<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useShowCatalog } from '../composables/useShowCatalog';
import ShowThumbnailGrid from '../components/ShowThumbnailGrid.vue';
import SkeletonBlock from '../components/SkeletonBlock.vue';

const route = useRoute();
const router = useRouter();

const SORT_OPTIONS = ['none', 'rating', 'date', 'title'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];
function toSortOption(value: unknown): SortOption {
  return SORT_OPTIONS.includes(value as SortOption)
    ? (value as SortOption)
    : 'none';
}

const initialPage = Number(route.query.page) || 0;
const { shows, page, loading, error, nextPage, prevPage, goToPage, reload } =
  useShowCatalog(initialPage);

onMounted(() => {
  document.title = 'All Shows — ShowBrowse';
});

// Genre filter and sort are intentionally page-local: they only ever
// reorder/filter the shows already loaded on the current page, never
// trigger a refetch. Grouping by genre needs the full catalog to be known
// up front, which pagination can't give us without reshuffling content the
// user is already looking at — see README for the full rationale.
const selectedGenre = ref((route.query.genre as string) ?? '');
const sortOption = ref<SortOption>(toSortOption(route.query.sort));

// Keep the URL in sync with page/genre/sort (deep links, back/forward,
// shareable filtered/sorted views)
watch([page, selectedGenre, sortOption], () => {
  const query: Record<string, string> = {};
  if (page.value) query.page = String(page.value);
  if (selectedGenre.value) query.genre = selectedGenre.value;
  if (sortOption.value !== 'none') query.sort = sortOption.value;
  router.replace({ query });
});

watch(
  () => route.query,
  (q) => {
    const targetPage = Number(q.page) || 0;
    if (targetPage !== page.value) goToPage(targetPage);

    const targetGenre = typeof q.genre === 'string' ? q.genre : '';
    if (targetGenre !== selectedGenre.value) selectedGenre.value = targetGenre;

    const targetSort = toSortOption(q.sort);
    if (targetSort !== sortOption.value) sortOption.value = targetSort;
  },
);

const jumpInput = ref('');
function submitJump() {
  const target = Number(jumpInput.value);
  if (!Number.isFinite(target) || target < 0) return;
  goToPage(Math.floor(target));
  jumpInput.value = '';
}

const availableGenres = computed(() => {
  const set = new Set<string>();
  for (const show of shows.value) {
    for (const genre of show.genres) set.add(genre);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
});

watch(shows, () => {
  if (
    selectedGenre.value &&
    !availableGenres.value.includes(selectedGenre.value)
  ) {
    selectedGenre.value = '';
  }
});

const visibleShows = computed(() => {
  let result = shows.value;
  if (selectedGenre.value) {
    result = result.filter((s) => s.genres.includes(selectedGenre.value));
  }
  switch (sortOption.value) {
    case 'rating':
      return [...result].sort((a, b) => b.rating - a.rating);
    case 'date':
      return [...result].sort((a, b) =>
        b.releaseDate.localeCompare(a.releaseDate),
      );
    case 'title':
      return [...result].sort((a, b) => a.title.localeCompare(b.title));
    default:
      return result;
  }
});
</script>

<template>
  <main class="max-w-[1400px] mx-auto px-4 pt-20 pb-8">
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-[#e5e5e5] m-0">All Shows</h1>
      <p class="text-[#999] text-sm mt-1">
        Browse the full TVMaze catalog, one page at a time.
      </p>
    </header>

    <div
      class="flex flex-wrap items-center gap-3 mb-6 rounded-lg bg-[#1f1f1f] p-3"
    >
      <label class="flex items-center gap-2 text-sm text-[#b3b3b3]">
        Genre
        <select
          v-model="selectedGenre"
          class="bg-[#2a2a2a] text-[#e5e5e5] text-sm rounded border border-[#333] px-2 py-1"
        >
          <option value="">All genres</option>
          <option
            v-for="genre in availableGenres"
            :key="genre"
            :value="genre"
          >
            {{ genre }}
          </option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm text-[#b3b3b3]">
        Sort by
        <select
          v-model="sortOption"
          class="bg-[#2a2a2a] text-[#e5e5e5] text-sm rounded border border-[#333] px-2 py-1"
        >
          <option value="none">Default order</option>
          <option value="rating">Rating (high to low)</option>
          <option value="date">Release date (newest first)</option>
          <option value="title">Title (A–Z)</option>
        </select>
      </label>

      <p class="text-xs text-[#777] ml-auto">
        Genre filter and sort apply only to the shows currently loaded on
        this page.
      </p>
    </div>

    <div class="flex items-center justify-between gap-4 mb-6 flex-wrap">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded border border-[#333] text-sm text-[#e5e5e5] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#E50914] transition-colors"
          :disabled="page === 0 || loading"
          aria-label="Previous page"
          @click="prevPage"
        >
          ‹ Prev
        </button>
        <span class="text-sm text-[#b3b3b3] min-w-40" role="status" aria-live="polite">
          <template v-if="loading">Loading…</template>
          <template v-else
            >Page {{ page + 1 }} — {{ visibleShows.length }} shows
            shown</template
          >
        </span>
        <button
          type="button"
          class="px-3 py-1.5 rounded border border-[#333] text-sm text-[#e5e5e5] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#E50914] transition-colors"
          :disabled="loading"
          aria-label="Next page"
          @click="nextPage"
        >
          Next ›
        </button>
      </div>

      <form class="flex items-center gap-2" @submit.prevent="submitJump">
        <label class="text-sm text-[#999]" for="jump-to-page"
          >Jump to page</label
        >
        <input
          id="jump-to-page"
          v-model="jumpInput"
          type="number"
          min="0"
          class="w-20 bg-[#2a2a2a] text-[#e5e5e5] text-sm rounded border border-[#333] px-2 py-1"
        />
        <button
          type="submit"
          class="px-3 py-1.5 rounded border border-[#333] text-sm text-[#e5e5e5] hover:border-[#E50914] transition-colors"
        >
          Go
        </button>
      </form>
    </div>

    <!-- Initial load -->
    <div v-if="loading && shows.length === 0" aria-busy="true">
      <div
        class="grid gap-6"
        style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))"
      >
        <div v-for="card in 20" :key="card" class="flex flex-col gap-2">
          <SkeletonBlock
            class="w-full rounded-lg"
            style="aspect-ratio: 2/3"
          />
          <SkeletonBlock class="h-3 w-full" />
          <SkeletonBlock class="h-3 w-2/3" />
        </div>
      </div>
    </div>

    <!-- No page has ever loaded successfully -->
    <div
      v-else-if="error && shows.length === 0"
      class="text-center py-6 text-[#E50914]"
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
        v-if="visibleShows.length === 0"
        class="text-center py-12 text-[#999] text-lg"
      >
        No shows match the selected genre on this page.
      </div>
      <ShowThumbnailGrid v-else :shows="visibleShows" />
    </template>
  </main>
</template>
