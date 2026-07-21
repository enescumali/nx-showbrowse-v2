<script setup lang="ts">
import type { Show } from '@show-browse/shows';
import { RouterLink } from 'vue-router';

const props = defineProps<{ show: Show; countryLabel?: string }>();

const detailRoute = (id: number | string) => ({
  name: 'ShowDetail',
  params: { id },
});
</script>

<template>
  <div
    class="relative w-full overflow-hidden mb-10 group"
    style="min-height: 480px; margin-top: -1px"
  >
    <!-- Background image -->
    <div class="absolute inset-0">
      <img
        v-if="show.backdropUrl || show.posterUrl"
        :src="show.backdropUrl || show.posterUrl"
        :alt="show.title"
        class="w-full h-full object-cover object-center transition-transform duration-700 ease-in-out group-hover:scale-105"
      />
      <div v-else class="w-full h-full bg-[#2a2a2a]" />
    </div>

    <!-- Gradient overlay -->
    <div
      class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"
    />
    <div
      class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
    />

    <!-- Content -->
    <div
      class="relative z-10 flex flex-col justify-end h-full p-8 pt-20"
      style="min-height: 480px"
    >
      <div class="max-w-xl">
        <p
          v-if="countryLabel"
          class="text-xs font-semibold uppercase tracking-widest text-[#E50914] mb-2"
        >
          On TV today in {{ countryLabel }}
        </p>
        <h2
          class="text-4xl font-bold text-white mb-3 leading-tight drop-shadow-lg"
        >
          {{ show.title }}
        </h2>

        <div class="flex items-center gap-4 mb-3 flex-wrap">
          <span
            class="flex items-center gap-1 text-yellow-400 font-semibold text-sm"
          >
            ⭐ {{ show.rating.toFixed(1) }}
          </span>
          <span v-if="show.releaseDate" class="text-[#999] text-sm">{{
            // only first 4 digits for year
            show.releaseDate.slice(0, 4)
          }}</span>
          <span
            v-for="genre in show.genres"
            :key="genre"
            class="px-2 py-0.5 rounded-full bg-white/10 text-[#ccc] text-xs border border-white/20"
            >{{ genre }}</span
          >
        </div>

        <p
          v-if="show.overview"
          class="text-[#b3b3b3] text-sm leading-relaxed line-clamp-3 mb-5"
        >
          {{ show.overview }}
        </p>

        <RouterLink
          :to="detailRoute(show.id)"
          class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E50914] text-white font-semibold text-sm transition-all duration-200 hover:bg-[#b20710] hover:scale-105 shadow-lg no-underline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="w-3.5 h-3.5"
            aria-hidden="true"
          >
            <path
              d="M3 2.75a.75.75 0 0 1 1.15-.634l9 5.25a.75.75 0 0 1 0 1.268l-9 5.25A.75.75 0 0 1 3 13.25v-10.5Z"
            />
          </svg>
          View Details
        </RouterLink>
      </div>
    </div>
  </div>
</template>
