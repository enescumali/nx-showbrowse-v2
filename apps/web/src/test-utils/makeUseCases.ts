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
    getShows: vi.fn().mockResolvedValue([]),
    getShowDetail: vi.fn().mockResolvedValue(mockDetail),
    searchShows: vi.fn().mockResolvedValue([]),
    getShowsByCountry: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}
