import { env } from './config/env';
import { readSnapshot } from './ingestion/snapshot';
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

  const snapshot = await readSnapshot(env.snapshotPath);
  if (snapshot) {
    store.replace(snapshot);
    console.log(`[api] warm-started from snapshot: ${snapshot.length} shows`);
  } else {
    console.log('[api] no snapshot found — starting the initial crawl in the background');
    syncService.refresh();
  }

  scheduleDailySync(syncService, env.syncCronSchedule);
}

bootstrap().catch((err: unknown) => {
  console.error('[api] fatal error during bootstrap:', err);
  process.exit(1);
});
