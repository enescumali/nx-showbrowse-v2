import type { Request, Response } from 'express';
import type { IShowService } from '@show-browse/shows';

/** Proxied live to TVMaze — their fuzzy search is the whole point, not
 * something worth reimplementing over the bulk-crawled index. */
export function createSearchRoute(showService: IShowService) {
  return async function searchRoute(
    req: Request,
    res: Response,
  ): Promise<void> {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    if (!q.trim()) {
      res.status(400).json({ error: 'q is required' });
      return;
    }
    try {
      const results = await showService.searchShows(q);
      res.status(200).json(results);
    } catch (err) {
      res
        .status(502)
        .json({ error: err instanceof Error ? err.message : 'Search failed' });
    }
  };
}
