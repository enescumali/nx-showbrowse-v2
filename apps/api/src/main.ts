import { env } from './config/env';
import { readSnapshot, writeSnapshot } from './ingestion/snapshot';
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
    // Ephemeral-disk hosts have no live snapshot yet on a fresh container —
    // persist the seed to the live path so a restart within this same
    // container's lifetime (and the daily incremental sync) build on it
    // instead of re-reading the seed every time.
    if (source === 'seed') {
      await writeSnapshot(env.snapshotPath, snapshot).catch((err: unknown) => {
        console.error('[api] failed to persist seed to the live path:', err);
      });
    }
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
