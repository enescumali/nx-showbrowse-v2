<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';

onMounted(() => {
  document.title = 'Not Found — ShowBrowse';
});
</script>

<template>
  <main class="max-w-4xl mx-auto px-4 pt-32 pb-8 text-center">
    <p class="text-6xl mb-4">🎬</p>
    <h1 class="text-3xl font-bold text-[#e5e5e5] mb-2">Show not found</h1>
    <p class="text-[#999] mb-8">
      The show you're looking for doesn't exist or may have been removed.
    </p>
    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E50914] text-white font-semibold text-sm hover:bg-[#b20710] transition-colors no-underline"
    >
      ← Back to Home
    </RouterLink>
  </main>
</template>
