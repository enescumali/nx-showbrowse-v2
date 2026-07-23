<script setup lang="ts">
import type { Show } from '@show-browse/shows';
import ShowThumbnail from './Thumbnail.vue';

defineProps<{ shows: Show[] }>();
</script>

<template>
  <section
    class="grid gap-6"
    style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))"
    aria-label="Show list"
  >
    <ShowThumbnail v-for="show in shows" :key="show.id" :show="show" />
  </section>
</template>

