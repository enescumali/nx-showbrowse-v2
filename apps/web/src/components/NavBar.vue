<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { RouterLink, useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const searchOpen = ref(false);
const menuOpen = ref(false);
const inputValue = ref((route.query.q as string) ?? '');
const inputEl = ref<HTMLInputElement | null>(null);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Keep inputValue in sync with URL (browser back/forward)
watch(
  () => route.query.q,
  (q) => {
    inputValue.value = (q as string) ?? '';
    searchOpen.value = Boolean(q);
  },
);

// Close search panel when leaving Home
watch(
  () => route.name,
  (name) => {
    if (name !== 'Home') {
      inputValue.value = '';
      searchOpen.value = false;
    }
  },
);

async function openSearch() {
  searchOpen.value = true;
  await nextTick();
  inputEl.value?.focus();
}

function closeSearch() {
  searchOpen.value = false;
  inputValue.value = '';
  if (route.name === 'Home' && route.query.q) {
    router.replace({ name: 'Home' });
  }
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const q = inputValue.value.trim();

    router.push({ name: 'Home', query: q ? { q } : undefined });
  }, 300);
}

function onMobileSearch() {
  const q = inputValue.value.trim();
  if (!q) return;

  menuOpen.value = false;

  router.push({ name: 'Home', query: q ? { q } : undefined });
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeSearch();
}

function onBlur() {
  // Small delay so clicking the ✕ button registers before the input closes
  setTimeout(() => {
    if (!inputValue.value.trim()) closeSearch();
  }, 150);
}
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 bg-[#141414] border-b border-[#222]"
    aria-label="Main navigation"
  >
    <div class="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-4">
      <!-- Logo -->
      <RouterLink
        :to="{ name: 'Home' }"
        class="text-[#E50914] font-black text-xl tracking-widest uppercase no-underline shrink-0"
        aria-label="Home"
        @click="
          () => {
            closeMenu();
            closeSearch();
          }
        "
        >ShowBrowse</RouterLink
      >

      <!-- Desktop nav links -->
      <div class="hidden md:flex items-center gap-5 shrink-0">
        <RouterLink
          :to="{ name: 'Home' }"
          class="text-[#e5e5e5] text-sm font-medium no-underline transition-colors hover:text-white relative nav-link"
          exact-active-class="nav-link--active"
          @click="closeSearch"
          >Home</RouterLink
        >
        <RouterLink
          :to="{ name: 'Genre', params: { genre: 'Drama' } }"
          class="text-[#e5e5e5] text-sm font-medium no-underline transition-colors hover:text-white relative nav-link"
          active-class="nav-link--active"
          >Drama</RouterLink
        >
        <RouterLink
          :to="{ name: 'Genre', params: { genre: 'Comedy' } }"
          class="text-[#e5e5e5] text-sm font-medium no-underline transition-colors hover:text-white relative nav-link"
          active-class="nav-link--active"
          >Comedy</RouterLink
        >
        <RouterLink
          :to="{ name: 'Genre', params: { genre: 'Crime' } }"
          class="text-[#e5e5e5] text-sm font-medium no-underline transition-colors hover:text-white relative nav-link"
          active-class="nav-link--active"
          >Crime</RouterLink
        >
        <RouterLink
          to="/popular"
          class="text-[#e5e5e5] text-sm font-medium no-underline transition-colors hover:text-white relative nav-link"
          active-class="nav-link--active"
          >Popular</RouterLink
        >
        <RouterLink
          to="/today"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold no-underline border transition-colors"
          :class="
            route.name === 'Today'
              ? 'bg-[#E50914] text-white border-[#E50914]'
              : 'bg-[#E50914]/10 text-[#E50914] border-[#E50914]/40 hover:bg-[#E50914]/20'
          "
          >On TV Today</RouterLink
        >
      </div>

      <!-- Search (collapsible, Netflix-style) — desktop only in top bar -->
      <div class="ml-auto hidden md:flex items-center">
        <!-- Expanded search input -->
        <div
          v-if="searchOpen"
          class="flex items-center border border-[#333] rounded bg-[#2a2a2a] px-3 py-1.5 gap-2 transition-colors focus-within:border-[#E50914]"
        >
          <svg
            class="w-4 h-4 text-white shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref="inputEl"
            v-model="inputValue"
            type="search"
            placeholder="Search titles"
            class="bg-transparent border-none outline-none text-white text-sm w-36 sm:w-52 placeholder-[#999] [&::-webkit-search-cancel-button]:hidden"
            aria-label="Search shows"
            @input="onInput"
            @keydown="onKeydown"
            @blur="onBlur"
          />
          <button
            class="bg-transparent border-none text-[#999] cursor-pointer text-xs leading-none hover:text-white ml-1"
            @click="closeSearch"
            aria-label="Close search"
          >
            ✕
          </button>
        </div>

        <!-- Search icon button (collapsed) -->
        <button
          v-else
          class="bg-transparent border-none text-white cursor-pointer p-1 hover:text-[#ccc] transition-colors"
          aria-label="Open search"
          @click="openSearch"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      </div>

      <!-- Hamburger button (mobile only) -->
      <button
        class="md:hidden bg-transparent border-none text-white cursor-pointer p-1 ml-auto hover:text-[#ccc] transition-colors"
        :aria-expanded="menuOpen"
        aria-controls="mobile-menu"
        aria-label="Toggle menu"
        @click="toggleMenu"
      >
        <svg
          v-if="!menuOpen"
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg
          v-else
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Overlay for mobile menu -->
    <div
      v-if="menuOpen"
      class="fixed inset-0 z-40 bg-black/40 md:hidden"
      @click="closeMenu"
      aria-hidden="true"
    ></div>
    <!-- Mobile menu -->
    <div
      v-if="menuOpen"
      id="mobile-menu"
      class="md:hidden bg-[#1f1f1f] border-t border-[#222] px-4 py-3 flex flex-col gap-1 z-50 fixed top-14 left-0 right-0"
      style="max-width: 100vw"
    >
      <!-- Search inside mobile menu -->
      <div
        class="flex items-center border border-[#333] rounded bg-[#2a2a2a] px-3 py-1.5 gap-2 mb-2 transition-colors focus-within:border-[#E50914]"
      >
        <input
          v-model="inputValue"
          type="search"
          placeholder="Search titles"
          class="bg-transparent border-none outline-none text-white text-sm flex-1 placeholder-[#999] [&::-webkit-search-cancel-button]:hidden"
          aria-label="Search shows"
          @keydown.enter="onMobileSearch"
          @keydown.esc="closeMenu"
        />
        <button
          class="bg-[#E50914] text-white text-xs font-semibold px-3 py-1 rounded shrink-0 hover:bg-[#c40812] transition-colors"
          aria-label="Search"
          @click="onMobileSearch"
        >
          Search
        </button>
      </div>

      <RouterLink
        :to="{ name: 'Home' }"
        class="text-[#e5e5e5] text-sm font-medium no-underline py-2.5 border-b border-[#2a2a2a] hover:text-white transition-colors"
        exact-active-class="text-white font-bold"
        @click="
          () => {
            closeMenu();
            closeSearch();
          }
        "
        >Home</RouterLink
      >
      <RouterLink
        :to="{ name: 'Genre', params: { genre: 'Drama' } }"
        class="text-[#e5e5e5] text-sm font-medium no-underline py-2.5 border-b border-[#2a2a2a] hover:text-white transition-colors"
        active-class="text-white font-bold"
        @click="closeMenu"
        >Drama</RouterLink
      >
      <RouterLink
        :to="{ name: 'Genre', params: { genre: 'Comedy' } }"
        class="text-[#e5e5e5] text-sm font-medium no-underline py-2.5 border-b border-[#2a2a2a] hover:text-white transition-colors"
        active-class="text-white font-bold"
        @click="closeMenu"
        >Comedy</RouterLink
      >
      <RouterLink
        :to="{ name: 'Genre', params: { genre: 'Crime' } }"
        class="text-[#e5e5e5] text-sm font-medium no-underline py-2.5 border-b border-[#2a2a2a] hover:text-white transition-colors"
        active-class="text-white font-bold"
        @click="closeMenu"
        >Crime</RouterLink
      >
      <RouterLink
        to="/popular"
        class="text-[#e5e5e5] text-sm font-medium no-underline py-2.5 border-b border-[#2a2a2a] hover:text-white transition-colors"
        active-class="text-white font-bold"
        @click="closeMenu"
        >Popular</RouterLink
      >
      <RouterLink
        to="/today"
        class="self-start mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold no-underline border bg-[#E50914]/10 text-[#E50914] border-[#E50914]/40"
        active-class="bg-[#E50914] text-white border-[#E50914]"
        @click="closeMenu"
        >On TV Today</RouterLink
      >
    </div>
  </nav>
</template>

<style scoped>
.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 2px;
  background: #e50914;
  transform: scaleX(0);
  transition: transform 0.2s ease;
}
.nav-link:hover::after {
  transform: scaleX(1);
}
.nav-link--active {
  color: #ffffff;
  font-weight: 700;
}
.nav-link--active::after {
  transform: scaleX(1);
}
</style>
