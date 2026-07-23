<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';

onMounted(() => {
  document.title = 'Not Found — ShowBrowse';
});
</script>

<template>
  <main id="main-content" tabindex="-1" class="max-w-4xl mx-auto px-4 pt-32 pb-8 text-center">
    <p class="text-6xl mb-4">🎬</p>
    <h1 class="text-3xl font-bold text-text mb-2">Show not found</h1>
    <p class="text-text-subtle mb-8">
      The show you're looking for doesn't exist or may have been removed.
    </p>
    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand text-white font-semibold text-sm hover:bg-brand-hover transition-colors no-underline"
    >
      ← Back to Home
    </RouterLink>
  </main>
</template>
