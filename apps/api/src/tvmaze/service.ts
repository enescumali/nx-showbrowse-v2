import type { Show, ShowDetail } from '../types/show.types';
import type { IShowApiClient } from './client';
import { mapShowToDomain, mapShowWithCastToDomain } from './mapper';

/** Backs apps/api's three live-proxy routes (/shows/:id, /search,
 * /schedule/:country) only — the bulk-crawled index goes through the raw
 * IShowApiClient directly (ingestion/crawl-shows.ts), bypassing this cache,
 * since each page is only ever fetched once per crawl anyway. That's why
 * there's no getShows(page) here, unlike the raw client. */
export interface IShowService {
  getShowById(id: string | number): Promise<ShowDetail>;
  searchShows(query: string): Promise<Show[]>;
  getShowsByCountry(country: string): Promise<Show[]>;
}

const CACHE_TTL_MS =
  typeof process !== 'undefined' && process.env && process.env.CACHE_TTL_MS
    ? parseInt(process.env.CACHE_TTL_MS, 10)
    : 5 * 60 * 1000;

function createCache<T>() {
  const store = new Map<string, { data: T; expiresAt: number }>();

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (entry && entry.expiresAt > Date.now()) return entry.data;

      store.delete(key);
      return undefined;
    },
    set(key: string, data: T): void {
      store.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    },
  };
}

export function createShowService(apiClient: IShowApiClient): IShowService {
  const detailCache = createCache<ShowDetail>();
  const countryCache = createCache<Show[]>();

  return {
    async getShowById(id: string | number): Promise<ShowDetail> {
      const key = `detail:${id}`;
      const cached = detailCache.get(key);

      if (cached) return cached;

      const show = await apiClient.getShowById(id);
      const result = mapShowWithCastToDomain(show);

      detailCache.set(key, result);
      return result;
    },

    async searchShows(query: string): Promise<Show[]> {
      const results = await apiClient.searchShows(query);
      return results.map((r) => mapShowToDomain(r.show));
    },

    async getShowsByCountry(country: string): Promise<Show[]> {
      const key = `country:${country}`;
      const cached = countryCache.get(key);

      if (cached) return cached;

      const episodes = await apiClient.getSchedule(country);
      // Use a Set to avoid duplicate shows, as multiple episodes of the
      // same show can appear in the schedule.
      const seen = new Set<number>();
      const shows: Show[] = [];

      for (const episode of episodes) {
        if (!seen.has(episode.show.id)) {
          seen.add(episode.show.id);
          shows.push(mapShowToDomain(episode.show));
        }
      }
      countryCache.set(key, shows);
      return shows;
    },
  };
}
