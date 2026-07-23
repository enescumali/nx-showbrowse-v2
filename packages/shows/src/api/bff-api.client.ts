import type { Show, ShowDetail } from '../types/show.types';
import type {
  IBFFApiClient,
  CatalogQuery,
  CatalogPage,
  GenreGroup,
  GenreSummary,
} from './bff-api-client.interface';

export function createBFFApiClient(baseURL: string): IBFFApiClient {
  async function fetchJson<T>(
    path: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const url = new URL(path, baseURL);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        // optional (genre/sort/pageSize/limit) — omit rather than send "undefined".
        if (value === undefined) continue;
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url.toString()).catch(() => {
      throw new Error('Unable to connect. Check your internet connection.');
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message: string =
        (data as { error?: string })?.error ??
        response.statusText ??
        'Unknown error';
      throw new Error(`[${response.status}] ${message}`);
    }

    return response.json() as Promise<T>;
  }

  return {
    getCatalogPage: (query: CatalogQuery) =>
      fetchJson<CatalogPage>('/shows', {
        page: query.page,
        pageSize: query.pageSize,
        genre: query.genre,
        sort: query.sort,
      }),
    getGenreGroups: (limit?: number) =>
      fetchJson<GenreGroup[]>('/genres', { limit }),
    getGenreNames: () => fetchJson<GenreSummary[]>('/genres/names'),
    getShowById: (id: string | number) => fetchJson<ShowDetail>(`/shows/${id}`),
    searchShows: (query: string) => fetchJson<Show[]>('/search', { q: query }),
    getShowsByCountry: (country: string) =>
      fetchJson<Show[]>(`/schedule/${country}`),
  };
}
