<script setup lang="ts">
import { watchEffect, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Show } from '@show-browse/shows';
import { useShowDetail } from '../composables/useShowDetail';
import SkeletonBlock from '../components/SkeletonBlock.vue';

const props = defineProps<{ id: string }>();
const router = useRouter();

// Optimistic data passed via router state when navigating from a thumbnail
const optimistic = window.history.state?.showJson
  ? (JSON.parse(window.history.state.showJson as string) as Show)
  : null;

const { show, loading, error } = useShowDetail(props.id);

watchEffect(() => {
  document.title =
    (show.value ?? optimistic)
      ? `${(show.value ?? optimistic)!.title} — ShowBrowse`
      : 'ShowBrowse';
});

watch(error, (msg) => {
  if (msg?.startsWith('[404]')) {
    router.replace({ name: 'NotFound' });
  }
});
</script>

<template>
  <main class="max-w-4xl mx-auto px-4 pt-20 pb-6">
    <button
      class="border border-[#E50914] text-[#E50914] bg-transparent px-4 py-1.5 rounded cursor-pointer text-sm mb-6 transition-colors hover:bg-[#E50914] hover:text-white"
      @click="router.back()"
      aria-label="Go back"
    >
      ← Back
    </button>

    <!-- Skeleton (initial load with no optimistic data) -->
    <div v-if="loading && !show && !optimistic" aria-busy="true">
      <SkeletonBlock class="w-full min-h-[220px] mb-4 rounded-xl" />
      <SkeletonBlock class="h-8 w-2/3 mb-3" />
      <div class="flex gap-3 mb-3">
        <SkeletonBlock class="h-4 w-16" />
        <SkeletonBlock class="h-4 w-20" />
        <SkeletonBlock class="h-4 w-14" />
      </div>
      <div class="flex gap-2 mb-4">
        <SkeletonBlock class="h-6 w-16 rounded-full" />
        <SkeletonBlock class="h-6 w-20 rounded-full" />
      </div>
      <SkeletonBlock class="h-4 w-full mb-2" />
      <SkeletonBlock class="h-4 w-full mb-2" />
      <SkeletonBlock class="h-4 w-3/4 mb-6" />
      <SkeletonBlock class="h-6 w-24 mb-4" />
      <div class="flex flex-wrap gap-4">
        <div v-for="i in 6" :key="i" class="flex items-center gap-2 w-40">
          <SkeletonBlock class="w-12 h-12 rounded-full shrink-0" />
          <div class="flex flex-col gap-1 flex-1">
            <SkeletonBlock class="h-3 w-full" />
            <SkeletonBlock class="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="text-center py-12 text-[#E50914]"
      role="alert"
    >
      {{ error }}
      <br />
      <button
        class="mt-4 px-5 py-2 border border-[#E50914] rounded text-[#E50914] bg-transparent cursor-pointer text-sm hover:bg-[#E50914] hover:text-white transition-colors"
        @click="router.back()"
      >
        Go back
      </button>
    </div>

    <!-- Full detail once loaded -->
    <article v-else-if="show" class="flex flex-col gap-4">
      <div
        class="w-full min-h-[220px] bg-cover bg-center rounded-xl flex items-end p-6 bg-[#2a2a2a] mb-2"
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
        <h1 class="text-3xl font-bold text-[#e5e5e5]">{{ show.title }}</h1>

        <div class="flex flex-wrap gap-4 text-[#b3b3b3] text-sm">
          <span>⭐ {{ show.rating.toFixed(1) }}</span>
          <span>{{ show.releaseDate }}</span>
          <span v-if="show.runtime">{{ show.runtime }} min</span>
        </div>

        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="genre in show.genres"
            :key="genre"
            :to="{ name: 'Genre', params: { genre } }"
            class="px-3 py-1 rounded-full bg-[#E50914] text-white text-xs hover:bg-[#b20710] transition-colors no-underline cursor-pointer"
          >
            {{ genre }}
          </RouterLink>
        </div>

        <p class="text-[#b3b3b3] leading-7">{{ show.overview }}</p>

        <section v-if="show.cast?.length">
          <h2 class="text-xl font-semibold text-[#e5e5e5] mb-4">Cast</h2>
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
              <div class="flex flex-col text-xs text-[#b3b3b3]">
                <strong class="text-[#e5e5e5]">{{ member.name }}</strong>
                <span>{{ member.character }}</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </article>

    <!-- Optimistic: show partial data from thumbnail while full detail loads -->
    <article v-else-if="optimistic" class="flex flex-col gap-4">
      <div
        class="w-full min-h-[220px] bg-cover bg-center rounded-xl flex items-end p-6 bg-[#2a2a2a] mb-2"
        :style="
          optimistic.posterUrl
            ? `background-image: url(${optimistic.posterUrl})`
            : ''
        "
      >
        <img
          v-if="optimistic.posterUrl"
          :src="optimistic.posterUrl"
          :alt="optimistic.title"
          class="w-28 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
        />
      </div>

      <div class="flex flex-col gap-4">
        <h1 class="text-3xl font-bold text-[#e5e5e5]">
          {{ optimistic.title }}
        </h1>

        <div class="flex flex-wrap gap-4 text-[#b3b3b3] text-sm">
          <span>⭐ {{ optimistic.rating.toFixed(1) }}</span>
          <span>{{ optimistic.releaseDate }}</span>
        </div>

        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="genre in optimistic.genres"
            :key="genre"
            :to="{ name: 'Genre', params: { genre } }"
            class="px-3 py-1 rounded-full bg-[#E50914] text-white text-xs hover:bg-[#b20710] transition-colors no-underline cursor-pointer"
          >
            {{ genre }}
          </RouterLink>
        </div>

        <p v-if="optimistic.overview" class="text-[#b3b3b3] leading-7">
          {{ optimistic.overview }}
        </p>

        <div>
          <SkeletonBlock class="h-6 w-24 mb-4" />
          <div class="flex flex-wrap gap-4">
            <div v-for="i in 4" :key="i" class="flex items-center gap-2 w-40">
              <SkeletonBlock class="w-12 h-12 rounded-full shrink-0" />
              <div class="flex flex-col gap-1 flex-1">
                <SkeletonBlock class="h-3 w-full" />
                <SkeletonBlock class="h-3 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  </main>
</template>
