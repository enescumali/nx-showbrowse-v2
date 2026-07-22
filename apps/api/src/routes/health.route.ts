import type { Request, Response } from 'express';
import type { IShowStore } from '../store/show-store';
import type { ISyncService } from '../ingestion/sync-service';

/** Always 200 — liveness, not readiness. A monitor hitting this shouldn't
 * flap during the first multi-minute cold crawl; use `ready` for that. */
export function createHealthRoute(store: IShowStore, syncService: ISyncService) {
  return function healthRoute(_req: Request, res: Response): void {
    const meta = store.getMeta();
    res.status(200).json({
      status: 'ok',
      ready: meta.ready,
      lastSyncedAt: meta.lastSyncedAt,
      totalShows: meta.totalShows,
      syncStatus: syncService.getStatus(),
    });
  };
}
