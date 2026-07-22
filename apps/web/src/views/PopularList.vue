<script setup lang="ts">
import { onMounted } from 'vue';
import { useShowCatalog } from '../composables/useShowCatalog';
import SkeletonBlock from '../components/SkeletonBlock.vue';

const {
  shows,
  page,
  pageSize,
  totalShows,
  totalPages,
  loading,
  error,
  nextPage,
  prevPage,
  reload,
} = useShowCatalog({ sort: 'rating' });

onMounted(() => {
  document.title = 'Popular Shows — ShowBrowse';
});
</script>

<template>
  <main class="max-w-[1400px] mx-auto px-4 pt-20 pb-8">
    <header class="pt-20 mb-8">
      <h1 class="text-3xl font-bold text-[#e5e5e5] m-0">Popular</h1>
      <p class="text-[#999] text-sm mt-1">
        <template v-if="!loading"
          >Top-rated shows, {{ totalShows.toLocaleString() }} total</template
        >
        <template v-else>Loading…</template>
      </p>
    </header>

    <div
      v-if="loading && shows.length === 0"
      aria-busy="true"
      class="flex flex-col gap-3"
    >
      <div
        v-for="i in 10"
        :key="i"
        class="flex items-center gap-4 rounded-lg bg-[#1f1f1f] p-3"
      >
        <SkeletonBlock class="w-12 h-9 shrink-0" />
        <SkeletonBlock
          class="w-14 shrink-0 rounded"
          style="aspect-ratio: 2/3"
        />
        <div class="flex flex-col gap-2 flex-1 min-w-0">
          <SkeletonBlock class="h-4 w-3/4" />
          <SkeletonBlock class="h-3 w-1/2" />
        </div>
      </div>
    </div>
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
        No rated shows found.
      </div>
      <template v-else>
        <ol class="list-none p-0 m-0 flex flex-col gap-3">
          <li
            v-for="(show, index) in shows"
            :key="show.id"
            class="flex items-center gap-4 rounded-lg bg-[#1f1f1f] hover:bg-[#2a2a2a] transition-colors p-3 cursor-pointer group"
            @click="
              $router.push({ name: 'ShowDetail', params: { id: show.id } })
            "
          >
            <!-- Rank number -->
            <span
              data-testid="rank-number"
              class="text-3xl font-black w-12 text-center shrink-0 leading-none"
              :class="
                page * pageSize + index < 3 ? 'text-[#E50914]' : 'text-[#555]'
              "
              >{{ page * pageSize + index + 1 }}</span
            >

            <!-- Thumbnail -->
            <div class="w-14 shrink-0">
              <div class="aspect-[2/3] rounded overflow-hidden bg-[#2a2a2a]">
                <img
                  v-if="show.posterUrl"
                  :src="show.posterUrl"
                  :alt="show.title"
                  class="w-full h-full object-cover block"
                  loading="lazy"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-[#777] text-xs"
                >
                  N/A
                </div>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <h2
                class="text-[#e5e5e5] font-semibold text-base m-0 truncate group-hover:text-white transition-colors"
              >
                {{ show.title }}
              </h2>
              <div class="flex items-center gap-3 mt-1 flex-wrap">
                <span class="text-yellow-400 text-sm font-semibold"
                  >⭐ {{ show.rating.toFixed(1) }}</span
                >
                <span v-if="show.releaseDate" class="text-[#999] text-sm">{{
                  show.releaseDate.slice(0, 4)
                }}</span>
                <span
                  v-for="genre in show.genres.slice(0, 2)"
                  :key="genre"
                  class="px-2 py-0.5 rounded-full bg-[#333] text-[#b3b3b3] text-xs"
                  >{{ genre }}</span
                >
              </div>
            </div>

            <!-- Arrow indicator -->
            <span
              class="text-[#555] group-hover:text-[#E50914] transition-colors text-xl shrink-0"
              >›</span
            >
          </li>
        </ol>

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
