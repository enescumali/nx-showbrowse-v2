import { ref, watchEffect, type Ref } from 'vue';

const STORAGE_KEY = 'showbrowse-theme';
type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

// Module-level singleton — every component sharing this composable reads/
// writes the same theme. Built lazily on first use (rather than at import
// time) so merely importing this module never touches matchMedia/the DOM.
let theme: Ref<Theme> | null = null;

function getTheme(): Ref<Theme> {
  if (theme) return theme;

  theme = ref<Theme>(getInitialTheme());
  watchEffect(
    () => {
      document.documentElement.classList.toggle(
        'dark',
        theme!.value === 'dark',
      );
      localStorage.setItem(STORAGE_KEY, theme!.value);
    },
    { flush: 'sync' },
  );
  return theme;
}

export function useTheme() {
  const themeRef = getTheme();

  function toggleTheme() {
    themeRef.value = themeRef.value === 'dark' ? 'light' : 'dark';
  }

  return { theme: themeRef, toggleTheme };
}
