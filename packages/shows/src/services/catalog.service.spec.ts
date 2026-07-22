import { describe, it, expect, vi } from 'vitest';
import { createCatalogService } from './catalog.service';
import type { IBackendApiClient } from '../api/backend-api-client.interface';
import type { Show, ShowDetail } from '../entities/show.entity';

function makeShow(id: number): Show {
  return {
    id,
    title: `Show ${id}`,
    showType: 'Scripted',
    overview: '',
    posterUrl: '',
    backdropUrl: '',
    releaseDate: '2020-01-01',
    rating: 7,
    genres: ['Drama'],
  };
}

function createMockApiClient(
  overrides: Partial<IBackendApiClient> = {},
): IBackendApiClient {
  return {
    getCatalogPage: vi.fn().mockResolvedValue({
      shows: [],
      page: 0,
      pageSize: 250,
      totalShows: 0,
      totalPages: 0,
    }),
    getGenreGroups: vi.fn().mockResolvedValue([]),
    getGenreNames: vi.fn().mockResolvedValue([]),
    getShowById: vi.fn(),
    searchShows: vi.fn().mockResolvedValue([]),
    getShowsByCountry: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('createCatalogService', () => {
  it('caches getCatalogPage results per distinct query', async () => {
    const getCatalogPage = vi
      .fn()
      .mockResolvedValueOnce({
        shows: [makeShow(1)],
        page: 0,
        pageSize: 250,
        totalShows: 1,
        totalPages: 1,
      })
      .mockResolvedValueOnce({
        shows: [makeShow(2)],
        page: 1,
        pageSize: 250,
        totalShows: 1,
        totalPages: 1,
      });
    const service = createCatalogService(
      createMockApiClient({ getCatalogPage }),
    );

    const page0First = await service.getCatalogPage({ page: 0 });
    const page1 = await service.getCatalogPage({ page: 1 });
    const page0Second = await service.getCatalogPage({ page: 0 });

    expect(getCatalogPage).toHaveBeenCalledTimes(2);
    expect(page0First.shows[0].id).toBe(1);
    expect(page1.shows[0].id).toBe(2);
    expect(page0Second).toEqual(page0First);
  });

  it('caches getGenreGroups per limit', async () => {
    const getGenreGroups = vi
      .fn()
      .mockResolvedValueOnce([{ genre: 'Drama', shows: [makeShow(1)] }])
      .mockResolvedValueOnce([
        { genre: 'Drama', shows: [makeShow(1), makeShow(2)] },
      ]);
    const service = createCatalogService(
      createMockApiClient({ getGenreGroups }),
    );

    await service.getGenreGroups(5);
    await service.getGenreGroups(10);
    await service.getGenreGroups(5);

    expect(getGenreGroups).toHaveBeenCalledTimes(2);
  });

  it('caches getGenreNames', async () => {
    const getGenreNames = vi
      .fn()
      .mockResolvedValue([{ genre: 'Drama', count: 10 }]);
    const service = createCatalogService(
      createMockApiClient({ getGenreNames }),
    );

    await service.getGenreNames();
    await service.getGenreNames();

    expect(getGenreNames).toHaveBeenCalledTimes(1);
  });

  it('caches getShowById per id', async () => {
    const detail = { id: 1, title: 'X' } as unknown as ShowDetail;
    const getShowById = vi.fn().mockResolvedValue(detail);
    const service = createCatalogService(createMockApiClient({ getShowById }));

    await service.getShowById(1);
    await service.getShowById(1);
    await service.getShowById(2);

    expect(getShowById).toHaveBeenCalledTimes(2);
  });

  it('does not cache searchShows', async () => {
    const searchShows = vi.fn().mockResolvedValue([makeShow(1)]);
    const service = createCatalogService(createMockApiClient({ searchShows }));

    await service.searchShows('batman');
    await service.searchShows('batman');

    expect(searchShows).toHaveBeenCalledTimes(2);
  });

  it('caches getShowsByCountry per country', async () => {
    const getShowsByCountry = vi.fn().mockResolvedValue([makeShow(1)]);
    const service = createCatalogService(
      createMockApiClient({ getShowsByCountry }),
    );

    await service.getShowsByCountry('US');
    await service.getShowsByCountry('US');
    await service.getShowsByCountry('CA');

    expect(getShowsByCountry).toHaveBeenCalledTimes(2);
  });
});
