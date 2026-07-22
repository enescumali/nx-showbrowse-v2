import type { Request, Response } from 'express';
import type { IShowService } from '@show-browse/shows';
import { paramToString } from '../utils/param';

/** Proxied live — TVMaze's daily schedule is inherently a live query, not
 * something worth bulk-crawling. */
export function createScheduleRoute(showService: IShowService) {
  return async function scheduleRoute(req: Request, res: Response): Promise<void> {
    try {
      const results = await showService.getShowsByCountry(
        paramToString(req.params.country),
      );
      res.status(200).json(results);
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Failed to load schedule',
      });
    }
  };
}
