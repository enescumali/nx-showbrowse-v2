import type { Request, Response, NextFunction } from 'express';
import type { IShowStore } from '../store/show-store';

/** Gates only the crawled-data routes (/genres, /shows). The live TVMaze
 * proxy routes (/shows/:id, /search, /schedule) don't depend on the store
 * and are never gated. */
export function createReadinessGate(store: IShowStore) {
  return function readinessGate(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    if (!store.getMeta().ready) {
      res.status(503).json({ error: 'Service is warming up, try again shortly.' });
      return;
    }
    next();
  };
}
