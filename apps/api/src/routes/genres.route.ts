import type { Request, Response } from 'express';
import type { IShowStore } from '../store/show-store';
import { parseIntParam } from '../utils/param';

const DEFAULT_GENRE_LIMIT = 20;

/** Shows-per-genre, capped by `limit` (default 20) — Home only ever needs
 * a curated top-N per genre for its carousels, not the full ~25k-show
 * Drama group. Use GET /shows?genre=X for an exhaustive, paginated view. */
export function createGenresRoute(store: IShowStore) {
  return function genresRoute(req: Request, res: Response): void {
    const limit = parseIntParam(req.query.limit);
    if (Number.isNaN(limit) || (limit !== undefined && limit < 1)) {
      res.status(400).json({ error: 'limit must be a positive integer' });
      return;
    }

    const groups = store
      .getByGenre(limit ?? DEFAULT_GENRE_LIMIT)
      .map(([genre, shows]) => ({ genre, shows }));
    res.status(200).json(groups);
  };
}

/** Genre names + counts only, no show payloads — cheap enough for NavBar
 * to call on every page load. */
export function createGenreNamesRoute(store: IShowStore) {
  return function genreNamesRoute(_req: Request, res: Response): void {
    res.status(200).json(store.getGenreNames());
  };
}
