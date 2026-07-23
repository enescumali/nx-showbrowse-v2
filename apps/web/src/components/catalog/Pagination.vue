<script setup lang="ts">
defineProps<{
  page: number;
  totalPages: number;
  totalShows: number;
  loading: boolean;
}>();

defineEmits<{
  prev: [];
  next: [];
}>();
</script>

<template>
  <div
    class="flex items-center justify-center gap-3 mt-6 flex-wrap rounded-lg bg-card p-3"
  >
    <button
      type="button"
      class="px-3 py-1.5 rounded border border-border text-sm text-text disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand transition-colors"
      :disabled="page === 0 || loading"
      aria-label="Previous page"
      @click="$emit('prev')"
    >
      ‹ Prev
    </button>
    <span class="text-sm text-text-muted" role="status" aria-live="polite">
      <template v-if="loading">Loading…</template>
      <template v-else>{{ page + 1 }} of {{ totalPages }}</template>
    </span>
    <button
      type="button"
      class="px-3 py-1.5 rounded border border-border text-sm text-text disabled:opacity-40 disabled:cursor-not-allowed hover:border-brand transition-colors"
      :disabled="page >= totalPages - 1 || loading"
      aria-label="Next page"
      @click="$emit('next')"
    >
      Next ›
    </button>
    <span v-if="!loading" class="text-sm text-text-subtle">
      {{ totalShows.toLocaleString() }} shows total
    </span>
  </div>
</template>
