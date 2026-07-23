<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';

const error = ref<Error | null>(null);

onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err));
  console.error('[ErrorBoundary]', error.value);
  // Returning false stops the error from propagating further up the tree
  return false;
});
</script>

<template>
  <div
    v-if="error"
    class="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4"
    role="alert"
  >
    <p class="text-brand-text text-xl font-semibold">Something went wrong</p>
    <p class="text-text-subtle text-sm text-center max-w-md">
      An unexpected error occurred. We are working on it!
    </p>
  </div>
  <slot v-else />
</template>
