import { describe, it, expect, vi } from 'vitest';
import { createGetCatalogPageUseCase } from './get-catalog-page.use-case';
import type { CatalogPage } from '../api/backend-api-client.interface';

describe('createGetCatalogPageUseCase', () => {
  it('delegates to the catalog service with the given query', async () => {
    const page: CatalogPage = {
      shows: [],
      page: 2,
      pageSize: 50,
      totalShows: 0,
      totalPages: 0,
    };
    const catalogService = { getCatalogPage: vi.fn().mockResolvedValue(page) };

    const result = await createGetCatalogPageUseCase(catalogService)({
      page: 2,
      pageSize: 50,
      genre: 'Drama',
      sort: 'rating',
    });

    expect(catalogService.getCatalogPage).toHaveBeenCalledWith({
      page: 2,
      pageSize: 50,
      genre: 'Drama',
      sort: 'rating',
    });
    expect(result).toBe(page);
  });
});
