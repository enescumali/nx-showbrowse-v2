import { describe, it, expect, vi } from 'vitest';
import { createGetCatalogPageUseCase } from './get-catalog-page.use-case';
import type { CatalogPage } from '../api/bff-api-client.interface';

describe('createGetCatalogPageUseCase', () => {
  it('delegates to the API client with the given query', async () => {
    const page: CatalogPage = {
      shows: [],
      page: 2,
      pageSize: 50,
      totalShows: 0,
      totalPages: 0,
    };
    const apiClient = { getCatalogPage: vi.fn().mockResolvedValue(page) };

    const result = await createGetCatalogPageUseCase(apiClient)({
      page: 2,
      pageSize: 50,
      genre: 'Drama',
      sort: 'rating',
    });

    expect(apiClient.getCatalogPage).toHaveBeenCalledWith({
      page: 2,
      pageSize: 50,
      genre: 'Drama',
      sort: 'rating',
    });
    expect(result).toBe(page);
  });
});
