import { env } from './config/env';
import { readSnapshot } from './ingestion/snapshot';
import { readSeedSnapshot } from './ingestion/seed-snapshot';
import { scheduleDailySync } from './scheduling/cron';
import { createContainer } from './di/container';
import { createApp } from './app';

async function bootstrap(): Promise<void> {
  if (env.adminToken === 'change-me') {
    console.warn(
      '[api] ADMIN_TOKEN is unset — using the insecure default. Set it in apps/api/.env for anything beyond local dev.',
    );
  }

  const { store, syncService, tvMazeShowService } = createContainer(env);
  const app = createApp({
    store,
    syncService,
    tvMazeShowService,
    adminToken: env.adminToken,
  });

  // Start serving immediately — /health is always 200, and the two
  // store-backed routes 503 via the readiness gate until warm.
  app.listen(env.port, () => {
    console.log(`[api] listening on :${env.port}`);
  });

  let snapshot = await readSnapshot(env.snapshotPath);
  let source: 'live' | 'seed' = 'live';
  if (!snapshot) {
    snapshot = await readSeedSnapshot(env.seedSnapshotPath);
    source = 'seed';
  }

  if (snapshot) {
    store.replace(snapshot);
    console.log(
      `[api] warm-started from ${source} snapshot: ${snapshot.length} shows`,
    );
    // Not persisted to the live snapshot path here — re-stringifying the
    // full array right after parsing it would double peak memory at boot,
    // the worst possible moment. The daily incremental sync (and
    // /admin/refresh) already write it once they run.
  } else {
    console.log(
      '[api] no snapshot found — starting the initial crawl in the background',
    );
    syncService.refresh();
  }

  scheduleDailySync(syncService, env.syncCronSchedule);
}

bootstrap().catch((err: unknown) => {
  console.error('[api] fatal error during bootstrap:', err);
  process.exit(1);
});
