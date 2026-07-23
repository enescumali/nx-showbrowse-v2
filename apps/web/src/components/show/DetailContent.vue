<script setup lang="ts">
import type { ShowDetail } from '@show-browse/shows';

defineProps<{
  show: ShowDetail;
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      class="w-full min-h-[220px] bg-cover bg-center rounded-xl flex items-end p-6 bg-card-alt mb-2"
      :style="
        show.backdropUrl ? `background-image: url(${show.backdropUrl})` : ''
      "
    >
      <img
        v-if="show.posterUrl"
        :src="show.posterUrl"
        :alt="show.title"
        class="w-28 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
      />
    </div>

    <div class="flex flex-col gap-4">
      <h1 class="text-3xl font-bold text-text">{{ show.title }}</h1>

      <div class="flex flex-wrap gap-4 text-text-muted text-sm">
        <span>⭐ {{ show.rating.toFixed(1) }}</span>
        <span>{{ show.releaseDate }}</span>
        <span v-if="show.runtime">{{ show.runtime }} min</span>
      </div>

      <div class="flex flex-wrap gap-2">
        <RouterLink
          v-for="genre in show.genres"
          :key="genre"
          :to="{ name: 'Catalog', query: { genre } }"
          class="px-3 py-1 rounded-full bg-brand text-white text-xs hover:bg-brand-hover transition-colors no-underline cursor-pointer"
        >
          {{ genre }}
        </RouterLink>
      </div>

      <p v-if="show.overview" class="text-text-muted leading-7">
        {{ show.overview }}
      </p>

      <section v-if="show.cast?.length">
        <h2 class="text-xl font-semibold text-text mb-4">Cast</h2>
        <ul class="flex flex-wrap gap-4 list-none p-0 m-0">
          <li
            v-for="member in show.cast"
            :key="member.id"
            class="flex items-center gap-2 w-40"
          >
            <img
              v-if="member.profileUrl"
              :src="member.profileUrl"
              :alt="member.name"
              class="w-12 h-12 rounded-full object-cover"
              loading="lazy"
            />
            <div class="flex flex-col text-xs text-text-muted">
              <strong class="text-text">{{ member.name }}</strong>
              <span>{{ member.character }}</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
