import cron from 'node-cron';
import type { ISyncService } from '../ingestion/sync-service';

/** Thin node-cron wiring — the actual sync-vs-crawl decision and the
 * concurrency guard both live in sync-service.refresh(), which this just
 * calls on a schedule. */
export function scheduleDailySync(
  syncService: ISyncService,
  cronExpression: string,
): void {
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid SYNC_CRON_SCHEDULE: "${cronExpression}"`);
  }
  cron.schedule(cronExpression, () => {
    syncService.refresh();
  });
}
