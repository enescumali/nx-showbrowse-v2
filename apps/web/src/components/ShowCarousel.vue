<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { Show } from '@show-browse/shows';
import ShowThumbnail from './ShowThumbnail.vue';

defineProps<{ genre: string; shows: Show[] }>();

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
    <h2 class="text-lg font-semibold text-[#e5e5e5] mb-3 px-1">{{ genre }}</h2>
    <div class="relative">
      <!-- Left arrow -->
      <button
        v-if="canScrollLeft"
        class="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-[#141414] to-transparent text-[#e5e5e5] cursor-pointer border-none"
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
        class="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-[#141414] to-transparent text-[#e5e5e5] cursor-pointer border-none"
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
