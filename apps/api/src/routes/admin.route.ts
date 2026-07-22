import type { Request, Response } from 'express';
import type { ISyncService } from '../ingestion/sync-service';

/** Guarded by a shared-secret header — a multi-minute outbound crawl
 * shouldn't be triggerable by anyone who finds the URL. */
export function createAdminRefreshRoute(
  syncService: ISyncService,
  adminToken: string,
) {
  return function adminRefreshRoute(req: Request, res: Response): void {
    if (req.header('X-Admin-Token') !== adminToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const result = syncService.refresh();
    res.status(result.started ? 202 : 409).json(result);
  };
}
