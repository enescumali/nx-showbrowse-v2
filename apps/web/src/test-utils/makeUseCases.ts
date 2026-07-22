import { vi } from 'vitest';
import type { ShowsUseCases } from '../di/injection-keys';
import type { ShowDetail } from '@show-browse/shows';

// Default mock detail for use in tests
export const mockDetail: ShowDetail = {
  id: 42,
  title: 'Test Show',
  showType: 'Scripted',
  overview: 'A great show.',
  posterUrl: '',
  backdropUrl: '',
  releaseDate: '2020-01-01',
  rating: 8.5,
  genres: ['Drama'],
  runtime: 60,
  cast: [],
};

export function makeUseCases(
  overrides: Partial<ShowsUseCases> = {},
): ShowsUseCases {
  return {
    getCatalogPage: vi
      .fn()
      .mockResolvedValue({ shows: [], page: 0, pageSize: 250, totalShows: 0, totalPages: 0 }),
    getGenreGroups: vi.fn().mockResolvedValue([]),
    getGenreNames: vi.fn().mockResolvedValue([]),
    getShowDetail: vi.fn().mockResolvedValue(mockDetail),
    searchShows: vi.fn().mockResolvedValue([]),
    getShowsByCountry: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}
