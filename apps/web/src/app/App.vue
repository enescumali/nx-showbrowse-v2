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
  <NavBar />
  <ErrorBoundary>
    <RouterView />
  </ErrorBoundary>
  <ShowQuickView v-if="activeShowId" :key="activeShowId" :id="activeShowId" />
</template>
