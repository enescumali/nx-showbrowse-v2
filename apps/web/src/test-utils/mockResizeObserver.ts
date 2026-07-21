import { vi } from 'vitest';

export function setupMockResizeObserver() {
  const observe = vi.fn();
  const unobserve = vi.fn();
  const disconnect = vi.fn();
  function ResizeObserverMock() {
    return { observe, unobserve, disconnect };
  }
  window.ResizeObserver = window.ResizeObserver || ResizeObserverMock;
  return { observe, unobserve, disconnect };
}
