<script setup lang="ts">
import { computed } from 'vue';
import type { CatalogSort, GenreSummary } from '@show-browse/shows';
import { SORT_OPTIONS, PAGE_SIZE_OPTIONS } from '../../config';

const props = defineProps<{
  genre: string;
  sort: CatalogSort | '';
  pageSize: number;
  genreNames: GenreSummary[];
}>();

const emit = defineEmits<{
  'update:genre': [value: string];
  'update:sort': [value: CatalogSort | ''];
  'update:pageSize': [value: number];
}>();

const genreModel = computed({
  get: () => props.genre,
  set: (value: string) => emit('update:genre', value),
});

const sortModel = computed({
  get: () => props.sort,
  set: (value: CatalogSort | '') => emit('update:sort', value),
});

const pageSizeModel = computed({
  get: () => props.pageSize,
  set: (value: number) => emit('update:pageSize', value),
});
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 mb-6 rounded-lg bg-card p-3">
    <label class="flex items-center gap-2 text-sm text-text-muted">
      <span class="w-16 shrink-0">Genre</span>
      <select
        v-model="genreModel"
        class="bg-card-alt text-text text-sm rounded border border-border px-2 py-1"
      >
        <option value="">All genres</option>
        <option v-for="g in genreNames" :key="g.genre" :value="g.genre">
          {{ g.genre }} ({{ g.count }})
        </option>
      </select>
    </label>

    <label class="flex items-center gap-2 text-sm text-text-muted">
      <span class="w-16 shrink-0">Sort by</span>
      <select
        v-model="sortModel"
        class="bg-card-alt text-text text-sm rounded border border-border px-2 py-1"
      >
        <option value="">Default order</option>
        <option
          v-for="opt in SORT_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </label>

    <label class="flex items-center gap-2 text-sm text-text-muted">
      <span class="w-16 shrink-0">Per page</span>
      <select
        v-model.number="pageSizeModel"
        class="bg-card-alt text-text text-sm rounded border border-border px-2 py-1"
      >
        <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">
          {{ size }}
        </option>
      </select>
    </label>
  </div>
</template>
