<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import ErrorBoundary from '../components/ErrorBoundary.vue';
import ShowQuickView from '../components/ShowQuickView.vue';
import { useQuickView } from '../composables/useQuickView';

const { activeShowId } = useQuickView();
</script>

<template>
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded focus:bg-brand focus:text-white focus:no-underline"
  >
    Skip to main content
  </a>
  <!-- inert while the quick-view panel is open — makes the dimmed
       background fully unreachable to keyboard/AT, not just visually
       de-emphasized, without hand-rolling aria-hidden + tabindex on
       every descendant. -->
  <div :inert="!!activeShowId">
    <NavBar />
    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
  </div>
  <ShowQuickView v-if="activeShowId" :key="activeShowId" :id="activeShowId" />
</template>
