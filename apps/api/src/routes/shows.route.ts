import type { Request, Response } from 'express';
import type { IShowService } from '../tvmaze/service';
import type { IShowStore, SortOption } from '../store/show-store';
import { paramToString, parseIntParam } from '../utils/param';

export function createListShowsRoute(store: IShowStore) {
  return function listShowsRoute(req: Request, res: Response): void {
    const page = parseIntParam(req.query.page);
    if (Number.isNaN(page) || (page !== undefined && page < 0)) {
      res.status(400).json({ error: 'page must be a non-negative integer' });
      return;
    }

    const pageSize = parseIntParam(req.query.pageSize);
    if (Number.isNaN(pageSize)) {
      res.status(400).json({ error: 'pageSize must be an integer' });
      return;
    }

    const result = store.getPage({
      page,
      pageSize,
      genre: typeof req.query.genre === 'string' ? req.query.genre : undefined,
      sort:
        typeof req.query.sort === 'string'
          ? (req.query.sort as SortOption)
          : undefined,
    });
    res.status(200).json(result);
  };
}

/** Show detail (with cast) isn't bulk-crawled — embedding cast for every
 * show in the index would multiply the crawl by ~1 request per show and
 * blow the rate limit for no benefit, since detail views are comparatively
 * rare. Proxied live to TVMaze instead, reusing the existing tested
 * IShowService (per-id TTL cache included). */
export function createShowDetailRoute(showService: IShowService) {
  return async function showDetailRoute(
    req: Request,
    res: Response,
  ): Promise<void> {
    const id = paramToString(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Show ID is required' });
      return;
    }

    try {
      const show = await showService.getShowById(id);
      res.status(200).json(show);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load show';
      res
        .status(message.startsWith('[404]') ? 404 : 502)
        .json({ error: message });
    }
  };
}
