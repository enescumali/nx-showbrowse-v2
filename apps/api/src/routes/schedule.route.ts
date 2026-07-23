import type { Request, Response } from 'express';
import type { IShowService } from '../tvmaze/service';
import { paramToString } from '../utils/param';

/** Proxied live — TVMaze's daily schedule is inherently a live query, not
 * something worth bulk-crawling. */
export function createScheduleRoute(showService: IShowService) {
  return async function scheduleRoute(
    req: Request,
    res: Response,
  ): Promise<void> {
    const country = paramToString(req.params.country);
    if (!country) {
      res.status(400).json({ error: 'Country code must not be empty' });
      return;
    }

    try {
      const results = await showService.getShowsByCountry(country);
      res.status(200).json(results);
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Failed to load schedule',
      });
    }
  };
}
