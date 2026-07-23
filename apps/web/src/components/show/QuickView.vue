<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useShowDetail } from '../../composables/useShowDetail';
import { useQuickView } from '../../composables/useQuickView';
import SkeletonBlock from '../SkeletonBlock.vue';
import ShowDetailContent from './DetailContent.vue';

// One instance per show id — App.vue mounts this with :key="id", so
// switching shows while the panel is open re-fetches cleanly via a normal
// component remount rather than a manual id-watcher.
const props = defineProps<{ id: string }>();
const { closeShow } = useQuickView();

const { show, loading, error } = useShowDetail(props.id);

const dialogLabel = computed(() =>
  show.value ? `${show.value.title} — quick view` : 'Show quick view',
);

const panelEl = ref<HTMLElement | null>(null);
// Gates the internal v-if so the close (Escape/backdrop/✕) plays a leave
// transition before the panel actually unmounts and the URL changes —
// simpler than lifting the open/close animation into a parent-level
// v-if, which Vue's <Transition> can't intercept on its own.
const closing = ref(false);

let previouslyFocused: HTMLElement | null = null;

function requestClose() {
  closing.value = true;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// App.vue makes the rest of the page `inert` while this is open, so Tab
// naturally has nowhere else to go — this just closes the loop at the
// panel's own edges instead of escaping into the (inert, but still
// technically present) browser chrome.
function trapFocus(e: KeyboardEvent) {
  if (e.key !== 'Tab' || !panelEl.value) return;

  const focusable =
    panelEl.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') requestClose();
  else trapFocus(e);
}

onMounted(() => {
  previouslyFocused = document.activeElement as HTMLElement | null;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKeydown);
  panelEl.value?.focus();
});

onUnmounted(() => {
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onKeydown);
  previouslyFocused?.focus();
});

function afterLeave() {
  document.body.style.overflow = '';
  closeShow();
}
</script>

<template>
  <Transition name="qv-backdrop" appear>
    <div
      v-if="!closing"
      class="fixed inset-0 z-[90] bg-black/50"
      aria-hidden="true"
      @click="requestClose"
    />
  </Transition>
  <Transition name="qv-panel" appear @after-leave="afterLeave">
    <div
      v-if="!closing"
      ref="panelEl"
      role="dialog"
      aria-modal="true"
      :aria-label="dialogLabel"
      tabindex="-1"
      class="fixed z-[91] bg-surface shadow-xl overflow-y-auto outline-none inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:max-h-none md:w-full md:max-w-md md:rounded-t-none"
    >
      <div
        class="flex items-center justify-between px-4 py-3 border-b border-edge sticky top-0 bg-surface z-10"
      >
        <RouterLink
          :to="{ name: 'ShowDetail', params: { id } }"
          class="text-sm text-brand-text no-underline hover:underline"
        >
          View full page ›
        </RouterLink>
        <button
          type="button"
          class="bg-transparent border-none text-text cursor-pointer p-1 hover:text-text-muted transition-colors"
          aria-label="Close"
          @click="requestClose"
        >
          ✕
        </button>
      </div>

      <div class="p-4">
        <div v-if="loading && !show" aria-busy="true">
          <SkeletonBlock class="w-full min-h-[180px] mb-4 rounded-xl" />
          <SkeletonBlock class="h-6 w-2/3 mb-3" />
          <SkeletonBlock class="h-4 w-full mb-2" />
          <SkeletonBlock class="h-4 w-3/4" />
        </div>

        <div
          v-else-if="error"
          class="text-center py-8 text-brand-text"
          role="alert"
        >
          {{ error }}
        </div>

        <ShowDetailContent v-else-if="show" :show="show" />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.qv-backdrop-enter-active,
.qv-backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.qv-backdrop-enter-from,
.qv-backdrop-leave-to {
  opacity: 0;
}

.qv-panel-enter-active,
.qv-panel-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.qv-panel-enter-from,
.qv-panel-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .qv-panel-enter-from,
  .qv-panel-leave-to {
    transform: translateX(100%);
  }
}
</style>
