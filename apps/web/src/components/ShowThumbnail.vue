<script setup lang="ts">
import type { Show } from '@show-browse/shows';
import { useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{ show: Show }>();
const router = useRouter();

const href = router.resolve({
  name: 'ShowDetail',
  params: { id: props.show.id },
}).href;

function navigate(e: MouseEvent) {
  // Let the browser handle ctrl/cmd/shift/middle-click (open in new tab etc.)
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0)
    return;
  e.preventDefault();
  router.push({
    name: 'ShowDetail',
    params: { id: props.show.id },
    state: { showJson: JSON.stringify(props.show) },
  });
}

const wrapperRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (!wrapperRef.value) return;
  observer = new window.IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        isVisible.value = true;
        observer?.disconnect();
      }
    },
    { rootMargin: '200px' },
  );
  observer.observe(wrapperRef.value);
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>

<template>
  <a
    :href="href"
    @click="navigate"
    data-testid="show-thumbnail"
    class="cursor-pointer rounded-lg overflow-hidden bg-card flex flex-col transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.6)] focus-visible:-translate-y-1 focus-visible:shadow-[0_8px_24px_rgba(0,0,0,0.6)] focus-visible:outline-2 focus-visible:outline-brand no-underline"
    :aria-label="`View details for ${show.title}`"
  >
    <div class="aspect-[2/3] bg-card-alt overflow-hidden" ref="wrapperRef">
      <img
        v-if="show.posterUrl && isVisible"
        :src="show.posterUrl"
        :alt="show.title"
        class="w-full h-full object-cover block"
        loading="lazy"
      />

      <!-- Show a loading placeholder only if the image exists but is not yet visible (lazy loading in progress) -->
      <div
        v-else-if="show.posterUrl && !isVisible"
        class="w-full h-full flex items-center justify-center text-text-faint text-sm"
      >
        Loading...
      </div>
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-text-faint text-sm"
      >
        No Image
      </div>
    </div>
    <div class="p-3 flex flex-col gap-1">
      <h3 class="text-[0.95rem] font-semibold truncate text-text m-0">
        {{ show.title }}
      </h3>
      <p class="text-xs text-text-subtle m-0">{{ show.releaseDate }}</p>
      <span class="text-xs text-brand font-medium"
        >⭐ {{ show.rating.toFixed(1) }}</span
      >
    </div>
  </a>
</template>
