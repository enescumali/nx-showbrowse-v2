<script setup lang="ts">
import { computed, onMounted } from 'vue';
import type { Show } from '@show-browse/shows';
import { useShows } from '../composables/useShows';
import ShowCarousel from '../components/ShowCarousel.vue';
import SkeletonBlock from '../components/SkeletonBlock.vue';

const props = defineProps<{ genre: string }>();

const { shows, loading, error, reload } = useShows();

onMounted(() => {
  document.title = `${props.genre} Shows — ShowBrowse`;
});

const genreShows = computed<Show[]>(() =>
  shows.value.filter((m) => m.genres.includes(props.genre)),
);

const top10 = computed<Show[]>(() =>
  [...genreShows.value]
    .filter((m) => m.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10),
);
</script>

<template>
  <main class="max-w-[1400px] mx-auto px-4 pb-8">
    <header class="pt-20 mb-8">
      <h1 class="text-3xl font-bold text-[#e5e5e5] m-0">{{ genre }}</h1>
      <p class="text-[#999] text-sm mt-1">{{ genre }} shows</p>
    </header>

    <div v-if="loading" aria-busy="true">
      <div v-for="row in 2" :key="row" class="mb-8">
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
      <div
        v-if="genreShows.length === 0"
        class="text-center py-12 text-[#999] text-lg"
      >
        No {{ genre }} shows on this page.
      </div>
      <template v-else>
        <ShowCarousel
          v-if="top10.length > 0"
          :genre="`⭐ Top ${genre} Shows`"
          :shows="top10"
        />
        <!-- List all shows alphabetically except top 10 -->
        <section class="mt-10">
          <h2 class="text-2xl font-semibold text-[#e5e5e5] mb-6">
            All {{ genre }} Shows
          </h2>
          <div
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            <template
              v-for="show in genreShows
                .filter((s) => !top10.some((t) => t.id === s.id))
                .slice()
                .sort((a, b) => a.title.localeCompare(b.title))"
              :key="show.id"
            >
              <RouterLink
                :to="{ name: 'ShowDetail', params: { id: show.id } }"
                class="block bg-[#1f1f1f] rounded-lg overflow-hidden shadow hover:scale-[1.03] transition-transform cursor-pointer no-underline"
              >
                <img
                  v-if="show.posterUrl"
                  :src="show.posterUrl"
                  :alt="show.title"
                  class="w-full aspect-[2/3] object-cover rounded-t-lg"
                  loading="lazy"
                />
                <div class="p-3">
                  <h3
                    class="text-base font-semibold text-[#e5e5e5] mb-1 truncate"
                  >
                    {{ show.title }}
                  </h3>
                  <div class="text-xs text-[#b3b3b3] flex items-center gap-2">
                    <span>⭐ {{ show.rating.toFixed(1) }}</span>
                    <span>{{ show.releaseDate }}</span>
                  </div>
                </div>
              </RouterLink>
            </template>
          </div>
        </section>
      </template>
    </template>
  </main>
</template>
