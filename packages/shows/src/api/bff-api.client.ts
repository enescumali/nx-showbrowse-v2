import type { z } from 'zod';
import type { CatalogQuery, IBFFApiClient } from './bff-api-client.interface';
import {
  catalogPageSchema,
  genreGroupListSchema,
  genreSummaryListSchema,
  showDetailSchema,
  showListSchema,
} from './schemas';

export function createBFFApiClient(baseURL: string): IBFFApiClient {
  async function fetchJson<T>(
    path: string,
    schema: z.ZodType<T>,
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

    const data: unknown = await response.json();
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(
        `Unexpected response shape from ${path}: ${result.error.message}`,
      );
    }
    return result.data;
  }

  return {
    getCatalogPage: (query: CatalogQuery) =>
      fetchJson('/shows', catalogPageSchema, {
        page: query.page,
        pageSize: query.pageSize,
        genre: query.genre,
        sort: query.sort,
      }),
    getGenreGroups: (limit?: number) =>
      fetchJson('/genres', genreGroupListSchema, { limit }),
    getGenreNames: () => fetchJson('/genres/names', genreSummaryListSchema),
    getShowById: (id: string | number) =>
      fetchJson(`/shows/${id}`, showDetailSchema),
    searchShows: (query: string) =>
      fetchJson('/search', showListSchema, { q: query }),
    getShowsByCountry: (country: string) =>
      fetchJson(`/schedule/${country}`, showListSchema),
  };
}
