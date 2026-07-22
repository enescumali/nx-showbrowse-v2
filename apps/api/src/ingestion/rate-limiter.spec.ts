import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter } from './rate-limiter';

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('spaces scheduled calls apart by 1000/requestsPerSecond ms', async () => {
    const limiter = createRateLimiter(2); // 500ms apart
    const calledAt: number[] = [];

    const p1 = limiter.schedule(async () => {
      calledAt.push(Date.now());
    });
    const p2 = limiter.schedule(async () => {
      calledAt.push(Date.now());
    });
    const p3 = limiter.schedule(async () => {
      calledAt.push(Date.now());
    });

    await vi.runAllTimersAsync();
    await Promise.all([p1, p2, p3]);

    expect(calledAt).toHaveLength(3);
    expect(calledAt[1] - calledAt[0]).toBeGreaterThanOrEqual(500);
    expect(calledAt[2] - calledAt[1]).toBeGreaterThanOrEqual(500);
  });

  it('runs a single call immediately with no delay', async () => {
    const limiter = createRateLimiter(2);
    const start = Date.now();
    let calledAt = 0;

    const p = limiter.schedule(async () => {
      calledAt = Date.now();
    });
    await vi.runAllTimersAsync();
    await p;

    expect(calledAt - start).toBeLessThan(50);
  });

  it('propagates rejection from the scheduled function', async () => {
    const limiter = createRateLimiter(10);
    const p = limiter.schedule(async () => {
      throw new Error('boom');
    });
    const expectation = expect(p).rejects.toThrow('boom');

    await vi.runAllTimersAsync();
    await expectation;
  });
});
