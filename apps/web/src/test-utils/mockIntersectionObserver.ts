import { vi } from 'vitest';

export let latestCallback:
  | ((entries: Array<{ isIntersecting: boolean }>) => void)
  | null = null;

export function setupMockIntersectionObserver() {
  latestCallback = null;
  function MockIntersectionObserver(
    cb: (entries: Array<{ isIntersecting: boolean }>) => void,
  ) {
    latestCallback = cb;
  }

  MockIntersectionObserver.prototype.observe = vi.fn();
  MockIntersectionObserver.prototype.unobserve = vi.fn();
  MockIntersectionObserver.prototype.disconnect = vi.fn();
  // Assign globally for jsdom
  window.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
}
