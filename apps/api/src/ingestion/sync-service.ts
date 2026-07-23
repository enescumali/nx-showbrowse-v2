import type { IShowApiClient } from '../tvmaze/client';
import type { IShowStore } from '../store/show-store';
import type { RateLimiter } from './rate-limiter';
import { crawlShows } from './crawl-shows';
import { computeResumePage, mergeShowsById } from './merge-shows';
import { writeSnapshot } from './snapshot';

export type SyncStatus = 'idle' | 'crawling' | 'error';

export interface ISyncService {
  getStatus(): SyncStatus;
  runFullCrawl(): Promise<void>;
  runIncrementalSync(): Promise<void>;
  /** The one guarded entry point boot, the daily cron job, and
   * POST /admin/refresh all call through. Fires the crawl in the
   * background and returns immediately; a second call while one is
   * already in flight is a no-op. */
  refresh(): { started: boolean; status: SyncStatus };
}

export interface SyncServiceDeps {
  apiClient: IShowApiClient;
  rateLimiter: RateLimiter;
  store: IShowStore;
  snapshotPath: string;
  maxRetriesOn429?: number;
}

export function createSyncService(deps: SyncServiceDeps): ISyncService {
  const { apiClient, rateLimiter, store, snapshotPath, maxRetriesOn429 } = deps;
  let status: SyncStatus = 'idle';

  async function runFullCrawl(): Promise<void> {
    const { shows } = await crawlShows({
      apiClient,
      rateLimiter,
      startPage: 0,
      maxRetriesOn429,
    });
    store.replace(shows);
    await writeSnapshot(snapshotPath, store.getAll());
  }

  async function runIncrementalSync(): Promise<void> {
    const startPage = computeResumePage(store.getMeta().highestShowId);
    const { shows: incoming } = await crawlShows({
      apiClient,
      rateLimiter,
      startPage,
      maxRetriesOn429,
    });
    store.replace(mergeShowsById(store.getAll(), incoming));
    await writeSnapshot(snapshotPath, store.getAll());
  }

  function refresh(): { started: boolean; status: SyncStatus } {
    if (status === 'crawling') {
      return { started: false, status };
    }
    status = 'crawling';
    const run = store.getMeta().ready ? runIncrementalSync() : runFullCrawl();
    run
      .then(() => {
        status = 'idle';
      })
      .catch((err: unknown) => {
        status = 'error';
        console.error('[sync-service] refresh failed:', err);
      });
    return { started: true, status };
  }

  return { getStatus: () => status, runFullCrawl, runIncrementalSync, refresh };
}
