<script setup lang="ts">
import { watchEffect, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useShowDetail } from '../composables/useShowDetail';
import SkeletonBlock from '../components/SkeletonBlock.vue';
import ShowDetailContent from '../components/show/DetailContent.vue';

const props = defineProps<{ id: string }>();
const router = useRouter();

const { show, loading, error } = useShowDetail(props.id);

watchEffect(() => {
  document.title = show.value
    ? `${show.value.title} — ShowBrowse`
    : 'ShowBrowse';
});

watch(error, (msg) => {
  if (msg?.startsWith('[404]')) {
    router.replace({ name: 'NotFound' });
  }
});
</script>

<template>
  <main
    id="main-content"
    tabindex="-1"
    class="max-w-4xl mx-auto px-4 pt-20 pb-6"
  >
    <button
      class="border border-brand text-brand-text bg-transparent px-4 py-1.5 rounded cursor-pointer text-sm mb-6 transition-colors hover:bg-brand hover:text-white"
      @click="router.back()"
      aria-label="Go back"
    >
      ← Back
    </button>

    <div v-if="loading && !show" aria-busy="true">
      <SkeletonBlock class="w-full min-h-[220px] mb-4 rounded-xl" />
      <SkeletonBlock class="h-8 w-2/3 mb-3" />
      <div class="flex gap-3 mb-3">
        <SkeletonBlock class="h-4 w-16" />
        <SkeletonBlock class="h-4 w-20" />
        <SkeletonBlock class="h-4 w-14" />
      </div>
      <div class="flex gap-2 mb-4">
        <SkeletonBlock class="h-6 w-16 rounded-full" />
        <SkeletonBlock class="h-6 w-20 rounded-full" />
      </div>
      <SkeletonBlock class="h-4 w-full mb-2" />
      <SkeletonBlock class="h-4 w-full mb-2" />
      <SkeletonBlock class="h-4 w-3/4 mb-6" />
      <SkeletonBlock class="h-6 w-24 mb-4" />
      <div class="flex flex-wrap gap-4">
        <div v-for="i in 6" :key="i" class="flex items-center gap-2 w-40">
          <SkeletonBlock class="w-12 h-12 rounded-full shrink-0" />
          <div class="flex flex-col gap-1 flex-1">
            <SkeletonBlock class="h-3 w-full" />
            <SkeletonBlock class="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="text-center py-12 text-brand-text"
      role="alert"
    >
      {{ error }}
      <br />
      <button
        class="mt-4 px-5 py-2 border border-brand rounded text-brand-text bg-transparent cursor-pointer text-sm hover:bg-brand hover:text-white transition-colors"
        @click="router.back()"
      >
        Go back
      </button>
    </div>

    <ShowDetailContent v-else-if="show" :show="show" />
  </main>
</template>
