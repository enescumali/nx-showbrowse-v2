<script setup lang="ts">
import { onMounted } from 'vue';
import { useCountryShows } from '../composables/useCountryShows';
import { useGenreGroups } from '../composables/useGenreGroups';
import { COUNTRIES } from '../config/countries';
import ShowCarousel from '../components/ShowCarousel.vue';

const {
  selectedCountry,
  countryShows,
  countryLoading,
  countryError,
  loadCountryShows,
} = useCountryShows();
const { genreGroups } = useGenreGroups(countryShows);

onMounted(() => {
  document.title = 'On TV Today — ShowBrowse';
  loadCountryShows(selectedCountry.value);
});
</script>

<template>
  <main class="max-w-[1400px] mx-auto px-4 pb-8">
    <header class="pt-20 mb-8 flex flex-col sm:flex-row sm:items-end gap-4">
      <div>
        <h1 class="text-3xl font-bold text-[#e5e5e5] m-0">On TV Today</h1>
        <p class="text-[#999] text-sm mt-1">
          What's airing on broadcast &amp; cable TV today
        </p>
      </div>

      <div class="flex items-center gap-3 sm:ml-auto">
        <label
          for="today-country-select"
          class="text-[#999] text-sm whitespace-nowrap"
          >Country</label
        >
        <select
          id="today-country-select"
          v-model="selectedCountry"
          class="py-1.5 px-3 border border-[#333] rounded bg-[#2a2a2a] text-[#e5e5e5] text-sm outline-none cursor-pointer transition-colors focus:border-[#E50914] hover:border-[#E50914]"
          aria-label="Select country"
        >
          <option value="">Select a country</option>
          <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">
            {{ c.label }}
          </option>
        </select>
      </div>
    </header>

    <div
      v-if="countryLoading"
      class="text-center py-12 text-[#999] text-lg"
      role="status"
      aria-live="polite"
    >
      Loading schedule…
    </div>

    <div
      v-else-if="countryError"
      class="text-center py-12 text-[#E50914] text-lg"
      role="alert"
    >
      {{ countryError }}
    </div>

    <div
      v-else-if="countryShows.length === 0"
      class="text-center py-12 text-[#999] text-lg"
    >
      No shows found for today's schedule.
    </div>

    <template v-else>
      <ShowCarousel
        v-for="[genre, shows] in genreGroups"
        :key="genre"
        :genre="genre"
        :shows="shows"
      />
    </template>
  </main>
</template>
