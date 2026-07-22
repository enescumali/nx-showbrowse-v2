export interface RateLimiter {
  schedule<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Sequential spacer: each scheduled call runs no sooner than
 * `1000 / requestsPerSecond` ms after the previous one, regardless of when
 * `schedule` is called. Used to stay safely under TVMaze's documented
 * ~20 calls/10s per IP limit during a crawl.
 */
export function createRateLimiter(requestsPerSecond: number): RateLimiter {
  const intervalMs = 1000 / requestsPerSecond;
  let nextAvailableAt = 0;

  return {
    schedule<T>(fn: () => Promise<T>): Promise<T> {
      const now = Date.now();
      const runAt = Math.max(now, nextAvailableAt);
      nextAvailableAt = runAt + intervalMs;
      const delay = runAt - now;

      return new Promise<T>((resolve, reject) => {
        setTimeout(() => {
          fn().then(resolve, reject);
        }, delay);
      });
    },
  };
}
