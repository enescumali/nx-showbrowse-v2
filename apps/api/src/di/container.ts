import { createShowApiClient, createShowService } from '@show-browse/shows';
import { createShowStore } from '../store/show-store';
import { createRateLimiter } from '../ingestion/rate-limiter';
import { createSyncService } from '../ingestion/sync-service';
import type { Env } from '../config/env';

export function createContainer(env: Env) {
  const apiClient = createShowApiClient(env.tvMazeBaseUrl);
  // Live proxy for /shows/:id, /search, /schedule — same tested
  // service/cache layer apps/web already uses, just pointed at TVMaze.
  const tvMazeShowService = createShowService(apiClient);

  const store = createShowStore();
  const rateLimiter = createRateLimiter(env.requestsPerSecond);
  const syncService = createSyncService({
    apiClient,
    rateLimiter,
    store,
    snapshotPath: env.snapshotPath,
  });

  return { store, syncService, tvMazeShowService };
}
