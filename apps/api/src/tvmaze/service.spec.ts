import { describe, it, expect, vi } from 'vitest';
import { createShowService } from './service';
import type { IShowApiClient } from './client';
import type { TvMazeShow, TvMazeShowWithCast } from './types';

function makeRawShow(id: number): TvMazeShow {
  return {
    id,
    name: `Show ${id}`,
    type: 'Scripted',
    genres: ['Drama'],
    status: 'Ended',
    runtime: 45,
    premiered: '2020-01-01',
    image: null,
    summary: null,
    rating: { average: 7 },
  };
}

function makeRawShowWithCast(id: number): TvMazeShowWithCast {
  return { ...makeRawShow(id), _embedded: { cast: [] } };
}

function createMockApiClient(
  overrides: Partial<IShowApiClient> = {},
): IShowApiClient {
  return {
    getShows: vi.fn().mockResolvedValue([]),
    getShowById: vi.fn(),
    searchShows: vi.fn().mockResolvedValue([]),
    getSchedule: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('createShowService', () => {
  it('caches getShowById per id', async () => {
    const getShowById = vi.fn().mockResolvedValue(makeRawShowWithCast(1));
    const service = createShowService(createMockApiClient({ getShowById }));

    await service.getShowById(1);
    await service.getShowById(1);
    await service.getShowById(2);

    expect(getShowById).toHaveBeenCalledTimes(2);
  });

  it('maps the raw show into a domain ShowDetail', async () => {
    const getShowById = vi.fn().mockResolvedValue(makeRawShowWithCast(1));
    const service = createShowService(createMockApiClient({ getShowById }));

    const result = await service.getShowById(1);

    expect(result).toEqual({
      id: 1,
      title: 'Show 1',
      showType: 'Scripted',
      overview: '',
      posterUrl: '',
      backdropUrl: '',
      releaseDate: '2020-01-01',
      rating: 7,
      genres: ['Drama'],
      runtime: 45,
      cast: [],
    });
  });

  it('does not cache searchShows', async () => {
    const searchShows = vi
      .fn()
      .mockResolvedValue([{ score: 1, show: makeRawShow(1) }]);
    const service = createShowService(createMockApiClient({ searchShows }));

    await service.searchShows('batman');
    await service.searchShows('batman');

    expect(searchShows).toHaveBeenCalledTimes(2);
  });

  it('maps search results into domain shows', async () => {
    const searchShows = vi
      .fn()
      .mockResolvedValue([{ score: 1, show: makeRawShow(1) }]);
    const service = createShowService(createMockApiClient({ searchShows }));

    const result = await service.searchShows('batman');

    expect(result).toEqual([
      {
        id: 1,
        title: 'Show 1',
        showType: 'Scripted',
        overview: '',
        posterUrl: '',
        backdropUrl: '',
        releaseDate: '2020-01-01',
        rating: 7,
        genres: ['Drama'],
      },
    ]);
  });

  it('caches getShowsByCountry per country', async () => {
    const getSchedule = vi
      .fn()
      .mockResolvedValue([{ id: 100, name: 'Ep 1', show: makeRawShow(1) }]);
    const service = createShowService(createMockApiClient({ getSchedule }));

    await service.getShowsByCountry('US');
    await service.getShowsByCountry('US');
    await service.getShowsByCountry('CA');

    expect(getSchedule).toHaveBeenCalledTimes(2);
  });

  it('deduplicates shows that appear in multiple schedule episodes', async () => {
    const getSchedule = vi.fn().mockResolvedValue([
      { id: 100, name: 'Ep 1', show: makeRawShow(1) },
      { id: 101, name: 'Ep 2', show: makeRawShow(1) },
      { id: 102, name: 'Ep 3', show: makeRawShow(2) },
    ]);
    const service = createShowService(createMockApiClient({ getSchedule }));

    const result = await service.getShowsByCountry('US');

    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual([1, 2]);
  });
});
