import type { Show } from '@show-browse/shows';
import { groupShowsByGenre } from '@show-browse/shows';

export type SortOption = 'rating' | 'date' | 'title';

export interface GetPageQuery {
  page?: number;
  pageSize?: number;
  genre?: string;
  sort?: SortOption;
}

export interface GetPageResult {
  shows: Show[];
  page: number;
  pageSize: number;
  totalShows: number;
  totalPages: number;
}

export interface ShowStoreMeta {
  ready: boolean;
  lastSyncedAt: string | null;
  totalShows: number;
  highestShowId: number;
}

export interface GenreSummary {
  genre: string;
  count: number;
}

export interface IShowStore {
  /** Atomic swap — never called until a crawl fully succeeds, so a failed
   * refresh never corrupts what's being served. */
  replace(shows: Show[]): void;
  getAll(): Show[];
  /** limit slices each genre's shows (already rating-sorted); omit for the full group. */
  getByGenre(limit?: number): [string, Show[]][];
  /** Genre names + counts only, no show payloads — cheap even with many genres. */
  getGenreNames(): GenreSummary[];
  getPage(query: GetPageQuery): GetPageResult;
  getMeta(): ShowStoreMeta;
}

const DEFAULT_PAGE_SIZE = 250;
const MAX_PAGE_SIZE = 250;
const MIN_PAGE_SIZE = 1;
const SORT_OPTIONS: SortOption[] = ['rating', 'date', 'title'];

function isSortOption(value: unknown): value is SortOption {
  return SORT_OPTIONS.includes(value as SortOption);
}

/** Unrecognized/absent sort falls back to the store's natural order rather
 * than erroring — same permissive convention apps/web's Catalog page uses. */
function sortShows(shows: Show[], sort?: SortOption): Show[] {
  if (!isSortOption(sort)) return shows;
  const sorted = [...shows];
  switch (sort) {
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'date':
      return sorted.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export function createShowStore(): IShowStore {
  let shows: Show[] = [];
  // Cached once per replace() rather than recomputed per request — genre
  // grouping over ~89k shows isn't free, and /genres + /genres/names both
  // hit this now.
  let genreGroups: [string, Show[]][] = [];
  let meta: ShowStoreMeta = {
    ready: false,
    lastSyncedAt: null,
    totalShows: 0,
    highestShowId: 0,
  };

  return {
    replace(next: Show[]): void {
      shows = next;
      genreGroups = groupShowsByGenre(shows);
      const highestShowId = shows.reduce(
        (max, s) => Math.max(max, Number(s.id) || 0),
        0,
      );
      meta = {
        ready: true,
        lastSyncedAt: new Date().toISOString(),
        totalShows: shows.length,
        highestShowId,
      };
    },

    getAll(): Show[] {
      return shows;
    },

    getByGenre(limit?: number): [string, Show[]][] {
      if (limit === undefined) return genreGroups;
      return genreGroups.map(([genre, list]) => [genre, list.slice(0, limit)]);
    },

    getGenreNames(): GenreSummary[] {
      return genreGroups.map(([genre, list]) => ({ genre, count: list.length }));
    },

    getPage(query: GetPageQuery): GetPageResult {
      const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(MIN_PAGE_SIZE, query.pageSize ?? DEFAULT_PAGE_SIZE),
      );
      const page = Math.max(0, query.page ?? 0);

      const filtered = query.genre
        ? shows.filter((s) => s.genres.includes(query.genre as string))
        : shows;
      const sorted = sortShows(filtered, query.sort);

      const totalShows = sorted.length;
      const totalPages = Math.ceil(totalShows / pageSize);
      const start = page * pageSize;

      return {
        shows: sorted.slice(start, start + pageSize),
        page,
        pageSize,
        totalShows,
        totalPages,
      };
    },

    getMeta(): ShowStoreMeta {
      return meta;
    },
  };
}
