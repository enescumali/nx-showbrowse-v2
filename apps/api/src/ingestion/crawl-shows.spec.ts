import { describe, it, expect, vi } from 'vitest';
import { crawlShows } from './crawl-shows';
import type { IShowApiClient } from '../tvmaze/client';
import type { RateLimiter } from './rate-limiter';

function rawShow(id: number) {
  return {
    id,
    name: `Show ${id}`,
    type: 'Scripted',
    genres: ['Drama'],
    status: 'Running',
    runtime: 30,
    premiered: '2020-01-01',
    image: null,
    summary: null,
    rating: { average: 7 },
  };
}

function createMockApiClient(
  overrides: Partial<IShowApiClient> = {},
): IShowApiClient {
  return {
    getShows: vi.fn().mockResolvedValue([]),
    getShowById: vi.fn(),
    searchShows: vi.fn().mockResolvedValue([]),
    getSchedule: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

const passthroughRateLimiter: RateLimiter = { schedule: (fn) => fn() };

describe('crawlShows', () => {
  it('walks pages starting at startPage until a 404, mapping each page to domain shows', async () => {
    const getShows = vi.fn((page: number) => {
      if (page === 0) return Promise.resolve([rawShow(1), rawShow(2)]);
      if (page === 1) return Promise.resolve([rawShow(3)]);
      return Promise.reject(new Error('[404] Not Found'));
    });
    const apiClient = createMockApiClient({ getShows });

    const result = await crawlShows({
      apiClient,
      rateLimiter: passthroughRateLimiter,
    });

    expect(result.shows.map((s) => s.id)).toEqual([1, 2, 3]);
    expect(result.lastPage).toBe(1);
    expect(getShows).toHaveBeenCalledTimes(3); // page 0, 1, then 2 which 404s
  });

  it('resumes from startPage instead of 0', async () => {
    const getShows = vi.fn((page: number) => {
      if (page === 7) return Promise.resolve([rawShow(1800)]);
      return Promise.reject(new Error('[404] Not Found'));
    });
    const apiClient = createMockApiClient({ getShows });

    const result = await crawlShows({
      apiClient,
      rateLimiter: passthroughRateLimiter,
      startPage: 7,
    });

    expect(result.shows.map((s) => s.id)).toEqual([1800]);
    expect(result.lastPage).toBe(7);
    expect(getShows).toHaveBeenCalledWith(7);
    expect(getShows).not.toHaveBeenCalledWith(0);
  });

  it('returns an empty result with lastPage = startPage - 1 when the very first page 404s', async () => {
    const getShows = vi.fn().mockRejectedValue(new Error('[404] Not Found'));
    const apiClient = createMockApiClient({ getShows });

    const result = await crawlShows({
      apiClient,
      rateLimiter: passthroughRateLimiter,
    });

    expect(result.shows).toEqual([]);
    expect(result.lastPage).toBe(-1);
  });

  it('backs off and retries on 429, then succeeds', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const getShows = vi.fn((page: number) => {
      if (page > 0) return Promise.reject(new Error('[404] Not Found'));
      calls++;
      if (calls < 2)
        return Promise.reject(new Error('[429] Too Many Requests'));
      return Promise.resolve([rawShow(1)]);
    });
    const apiClient = createMockApiClient({ getShows });

    const promise = crawlShows({
      apiClient,
      rateLimiter: passthroughRateLimiter,
      maxRetriesOn429: 3,
    });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.shows.map((s) => s.id)).toEqual([1]);
    expect(calls).toBe(2);
    vi.useRealTimers();
  });

  it('throws after exhausting 429 retries', async () => {
    vi.useFakeTimers();
    const getShows = vi
      .fn()
      .mockRejectedValue(new Error('[429] Too Many Requests'));
    const apiClient = createMockApiClient({ getShows });

    const promise = crawlShows({
      apiClient,
      rateLimiter: passthroughRateLimiter,
      maxRetriesOn429: 2,
    });
    const expectation = expect(promise).rejects.toThrow('[429]');
    await vi.runAllTimersAsync();
    await expectation;

    expect(getShows).toHaveBeenCalledTimes(3); // initial + 2 retries
    vi.useRealTimers();
  });

  it('rethrows a non-404/429 error immediately without retrying', async () => {
    const getShows = vi.fn().mockRejectedValue(new Error('[500] Server Error'));
    const apiClient = createMockApiClient({ getShows });

    await expect(
      crawlShows({ apiClient, rateLimiter: passthroughRateLimiter }),
    ).rejects.toThrow('[500]');
    expect(getShows).toHaveBeenCalledTimes(1);
  });
});
