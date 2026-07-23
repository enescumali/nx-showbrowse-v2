import type { IShowApiClient } from '../tvmaze/client';
import type { Show } from '../types/show.types';
import { mapShowToDomain } from '../tvmaze/mapper';
import type { RateLimiter } from './rate-limiter';

export interface CrawlOptions {
  apiClient: IShowApiClient;
  rateLimiter: RateLimiter;
  startPage?: number;
  maxRetriesOn429?: number;
}

export interface CrawlResult {
  shows: Show[];
  lastPage: number;
}

const BACKOFF_MS = [2000, 4000, 8000];

function isNotFound(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith('[404]');
}

function isRateLimited(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith('[429]');
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPageWithRetry(
  apiClient: IShowApiClient,
  rateLimiter: RateLimiter,
  page: number,
  maxRetriesOn429: number,
): Promise<Show[] | null> {
  for (let attempt = 0; attempt <= maxRetriesOn429; attempt++) {
    try {
      const raw = await rateLimiter.schedule(() => apiClient.getShows(page));
      return raw.map(mapShowToDomain);
    } catch (err) {
      if (isNotFound(err)) return null;

      const isLastAttempt = attempt === maxRetriesOn429;
      if (isRateLimited(err) && !isLastAttempt) {
        await wait(BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]);
        continue;
      }
      throw err;
    }
  }
  // Unreachable: every branch above returns or throws.
  return null;
}

/**
 * Walks TVMaze's `/shows` index starting at `startPage`, stopping cleanly
 * on the first 404 (an unknown total page count is normal for this API —
 * see apps/web's useShowCatalog.ts for the same pattern used client-side).
 * A 429 backs off and retries the same page before giving up.
 */
export async function crawlShows(opts: CrawlOptions): Promise<CrawlResult> {
  const { apiClient, rateLimiter, startPage = 0, maxRetriesOn429 = 3 } = opts;
  const shows: Show[] = [];
  let lastPage = startPage - 1;

  for (let page = startPage; ; page++) {
    const pageShows = await fetchPageWithRetry(
      apiClient,
      rateLimiter,
      page,
      maxRetriesOn429,
    );
    if (pageShows === null) break;
    shows.push(...pageShows);
    lastPage = page;
  }

  return { shows, lastPage };
}
