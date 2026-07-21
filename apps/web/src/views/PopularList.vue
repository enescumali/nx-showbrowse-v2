<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useShows } from '../composables/useShows';
import SkeletonBlock from '../components/SkeletonBlock.vue';

const { shows, loading, error, reload } = useShows();

onMounted(() => {
  document.title = 'Popular Shows — ShowBrowse';
});

const ranked = computed(() =>
  [...shows.value]
    .filter((m) => m.rating > 0)
    .sort((a, b) => b.rating - a.rating),
);
</script>

<template>
  <main class="max-w-[1400px] mx-auto px-4 pt-20 pb-8">
    <header class="pt-20 mb-8">
      <h1 class="text-3xl font-bold text-[#e5e5e5] m-0">Popular</h1>
      <p class="text-[#999] text-sm mt-1">Top-rated shows</p>
    </header>

    <div v-if="loading" aria-busy="true" class="flex flex-col gap-3">
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
      <div
        v-if="ranked.length === 0"
        class="text-center py-12 text-[#999] text-lg"
      >
        No rated shows on this page.
      </div>
      <ol v-else class="list-none p-0 m-0 flex flex-col gap-3">
        <li
          v-for="(show, index) in ranked"
          :key="show.id"
          class="flex items-center gap-4 rounded-lg bg-[#1f1f1f] hover:bg-[#2a2a2a] transition-colors p-3 cursor-pointer group"
          @click="$router.push({ name: 'ShowDetail', params: { id: show.id } })"
        >
          <!-- Rank number -->
          <span
            data-testid="rank-number"
            class="text-3xl font-black w-12 text-center shrink-0 leading-none"
            :class="index < 3 ? 'text-[#E50914]' : 'text-[#555]'"
            >{{ index + 1 }}</span
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
    </template>
  </main>
</template>
