// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

function mockSystemPrefersDark(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches } as MediaQueryList);
}

// The composable's theme ref and its DOM-syncing effect live at module
// scope (a deliberate singleton, so every consumer shares one theme) —
// each test needs a fresh module instance to observe a clean init.
async function freshUseTheme() {
  vi.resetModules();
  return import('./useTheme');
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to light when there is no saved preference and the system prefers light', async () => {
    mockSystemPrefersDark(false);
    const { useTheme } = await freshUseTheme();

    const { theme } = useTheme();

    expect(theme.value).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('defaults to dark when there is no saved preference and the system prefers dark', async () => {
    mockSystemPrefersDark(true);
    const { useTheme } = await freshUseTheme();

    const { theme } = useTheme();

    expect(theme.value).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('prefers a saved theme over the system preference', async () => {
    localStorage.setItem('showbrowse-theme', 'dark');
    mockSystemPrefersDark(false);
    const { useTheme } = await freshUseTheme();

    expect(useTheme().theme.value).toBe('dark');
  });

  it('toggleTheme flips the theme, updates the DOM class, and persists it', async () => {
    mockSystemPrefersDark(false);
    const { useTheme } = await freshUseTheme();
    const { theme, toggleTheme } = useTheme();

    toggleTheme();

    expect(theme.value).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('showbrowse-theme')).toBe('dark');

    toggleTheme();

    expect(theme.value).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('showbrowse-theme')).toBe('light');
  });

  it('shares state across every call — it is a single app-wide toggle', async () => {
    mockSystemPrefersDark(false);
    const { useTheme } = await freshUseTheme();
    const a = useTheme();
    const b = useTheme();

    a.toggleTheme();

    expect(b.theme.value).toBe('dark');
  });
});
