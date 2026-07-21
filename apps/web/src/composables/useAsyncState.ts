import { ref } from 'vue';

/**
 * Shared async state abstraction.
 * Eliminates the repetitive loading/error/try-catch-finally boilerplate
 * across composables that trigger async operations.
 */
export function useAsyncState() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function run<T>(
    fn: () => Promise<T>,
    fallback = 'An error occurred',
  ): Promise<T | null> {
    loading.value = true;
    error.value = null;
    try {
      return await fn();
    } catch (err) {
      error.value = err instanceof Error ? err.message : fallback;
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, run };
}
