import { vi } from 'vitest';

export function setupMockMatchMedia() {
  window.matchMedia =
    window.matchMedia ||
    vi.fn().mockReturnValue({ matches: false } as MediaQueryList);
}
