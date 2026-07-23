import type { Show, ShowDetail } from '../entities/show.entity';
import type {
  IBackendApiClient,
  CatalogQuery,
  CatalogPage,
  GenreGroup,
  GenreSummary,
} from '../api/backend-api-client.interface';
import type { ICatalogService } from './catalog-service.interface';

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

export function createCatalogService(
  apiClient: IBackendApiClient,
): ICatalogService {
  const catalogCache = createCache<CatalogPage>();
  const genreGroupsCache = createCache<GenreGroup[]>();
  const genreNamesCache = createCache<GenreSummary[]>();
  const detailCache = createCache<ShowDetail>();
  const countryCache = createCache<Show[]>();

  return {
    async getCatalogPage(query: CatalogQuery): Promise<CatalogPage> {
      const key = JSON.stringify(query);
      const cached = catalogCache.get(key);
      if (cached) return cached;

      const result = await apiClient.getCatalogPage(query);
      catalogCache.set(key, result);
      return result;
    },

    async getGenreGroups(limit?: number): Promise<GenreGroup[]> {
      const key = `limit:${limit ?? 'default'}`;
      const cached = genreGroupsCache.get(key);
      if (cached) return cached;

      const result = await apiClient.getGenreGroups(limit);
      genreGroupsCache.set(key, result);
      return result;
    },

    async getGenreNames(): Promise<GenreSummary[]> {
      const cached = genreNamesCache.get('names');
      if (cached) return cached;

      const result = await apiClient.getGenreNames();
      genreNamesCache.set('names', result);
      return result;
    },

    async getShowById(id: string | number): Promise<ShowDetail> {
      const key = `detail:${id}`;
      const cached = detailCache.get(key);
      if (cached) return cached;

      const result = await apiClient.getShowById(id);
      detailCache.set(key, result);
      return result;
    },

    async searchShows(query: string): Promise<Show[]> {
      return apiClient.searchShows(query);
    },

    async getShowsByCountry(country: string): Promise<Show[]> {
      const key = `country:${country}`;
      const cached = countryCache.get(key);
      if (cached) return cached;

      const result = await apiClient.getShowsByCountry(country);
      countryCache.set(key, result);
      return result;
    },
  };
}
