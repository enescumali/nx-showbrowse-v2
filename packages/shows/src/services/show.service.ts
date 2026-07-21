import type { Show, ShowDetail } from '../entities/show.entity';
import type { IShowService } from './show-service.interface';
import type { IShowApiClient } from '../api/show-api-client.interface';
import {
  mapShowToDomain,
  mapShowWithCastToDomain,
} from '../mappers/show.mapper';

// Read cache TTL from environment variable if available, fallback to 5 min
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
  const showsCache = createCache<Show[]>();
  const detailCache = createCache<ShowDetail>();
  const countryCache = createCache<Show[]>();

  return {
    async getShows(page = 0): Promise<Show[]> {
      const cacheKey = `shows:${page}`;
      const cached = showsCache.get(cacheKey);
      if (cached) return cached;

      // Check for ?delay param in the URL to enable
      // artificial delay for testing
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.searchParams.has('delay')) {
          const ms = parseInt(url.searchParams.get('delay') || '3000', 10);
          if (!isNaN(ms) && ms > 0) {
            await new Promise((r) => setTimeout(r, ms));
          }
        }
      }

      const shows = await apiClient.getShows(page);
      const result = shows.map(mapShowToDomain);
      showsCache.set(cacheKey, result);
      return result;
    },

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
      // Use a Set to avoid duplicate shows
      // as multiple episodes of the same show can be in the schedule
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
