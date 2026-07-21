import { describe, it, expect, vi } from 'vitest';
import { createShowService } from './show.service';
import type { IShowApiClient } from '../api/show-api-client.interface';
import type { TvMazeShow } from '../api/tvmaze.types';

function makeRawShow(id: number): TvMazeShow {
  return {
    id,
    name: `Show ${id}`,
    type: 'Scripted',
    genres: ['Drama'],
    status: 'Running',
    runtime: 30,
    premiered: '2020-01-01',
    image: null,
    summary: null,
    rating: { average: 7 },
  };
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

describe('createShowService getShows', () => {
  it('defaults to page 0', async () => {
    const getShows = vi.fn().mockResolvedValue([makeRawShow(1)]);
    const service = createShowService(createMockApiClient({ getShows }));

    await service.getShows();

    expect(getShows).toHaveBeenCalledWith(0);
  });

  it('fetches the requested page from the API client', async () => {
    const getShows = vi.fn().mockResolvedValue([makeRawShow(1)]);
    const service = createShowService(createMockApiClient({ getShows }));

    await service.getShows(3);

    expect(getShows).toHaveBeenCalledWith(3);
  });

  it('caches each page independently', async () => {
    const getShows = vi
      .fn()
      .mockResolvedValueOnce([makeRawShow(1)])
      .mockResolvedValueOnce([makeRawShow(2)]);
    const service = createShowService(createMockApiClient({ getShows }));

    const page0First = await service.getShows(0);
    const page1 = await service.getShows(1);
    const page0Second = await service.getShows(0);

    expect(getShows).toHaveBeenCalledTimes(2);
    expect(page0First[0].id).toBe(1);
    expect(page1[0].id).toBe(2);
    expect(page0Second).toEqual(page0First);
  });
});
