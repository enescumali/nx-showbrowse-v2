<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';
import type { Show } from '@show-browse/shows';
import ShowThumbnail from './ShowThumbnail.vue';

defineProps<{ genre: string; shows: Show[]; seeAllTo?: RouteLocationRaw }>();

const track = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateScrollState() {
  const el = track.value;
  if (!el) return;
  canScrollLeft.value = el.scrollLeft > 0;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
}

function scroll(direction: 'left' | 'right') {
  if (!track.value) return;
  const amount = track.value.clientWidth * 0.75;
  track.value.scrollBy({
    left: direction === 'right' ? amount : -amount,
    behavior: 'smooth',
  });
}

let ro: ResizeObserver | null = null;

onMounted(() => {
  const el = track.value;
  if (!el) return;
  el.addEventListener('scroll', updateScrollState, { passive: true });
  ro = new ResizeObserver(updateScrollState);
  ro.observe(el);
  updateScrollState();
});

onUnmounted(() => {
  track.value?.removeEventListener('scroll', updateScrollState);
  ro?.disconnect();
});
</script>

<template>
  <section class="mb-10">
    <div class="flex items-center justify-between mb-3 px-1">
      <h2 class="text-lg font-semibold text-text m-0">{{ genre }}</h2>
      <RouterLink
        v-if="seeAllTo"
        :to="seeAllTo"
        class="text-sm text-brand-text no-underline hover:underline shrink-0"
        >See all ›</RouterLink
      >
    </div>
    <div class="relative">
      <!-- Left arrow -->
      <button
        v-if="canScrollLeft"
        class="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-surface to-transparent text-text cursor-pointer border-none"
        aria-label="Scroll left"
        @click="scroll('left')"
      >
        ‹
      </button>

      <!-- Scrollable track -->
      <div
        ref="track"
        class="flex gap-3 overflow-x-auto scroll-smooth pb-2"
        style="scrollbar-width: none; -ms-overflow-style: none"
      >
        <div v-for="show in shows" :key="show.id" class="flex-none w-36">
          <ShowThumbnail :show="show" />
        </div>
      </div>

      <!-- Right arrow -->
      <button
        v-if="canScrollRight"
        class="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-surface to-transparent text-text cursor-pointer border-none"
        aria-label="Scroll right"
        @click="scroll('right')"
      >
        ›
      </button>
    </div>
  </section>
</template>

<style scoped>
div::-webkit-scrollbar {
  display: none;
}
</style>
