import { describe, it, expect, vi } from 'vitest';
import { createGetShowsUseCase } from './get-shows.use-case';
import type { IShowService } from '../services/show-service.interface';
import type { Show, ShowDetail } from '../entities/show.entity';

function createMockService(
  overrides: Partial<IShowService> = {},
): IShowService {
  return {
    getShows: vi.fn().mockResolvedValue([]),
    getShowById: vi.fn().mockResolvedValue({} as ShowDetail),
    searchShows: vi.fn().mockResolvedValue([]),
    getShowsByCountry: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

const mockShow: Show = {
  id: 1,
  title: 'Test Show',
  showType: 'Scripted',
  overview: '',
  posterUrl: '',
  backdropUrl: '',
  releaseDate: '2020-01-01',
  rating: 8,
  genres: ['Drama'],
};

describe('createGetShowsUseCase', () => {
  it('delegates to service and returns shows', async () => {
    const repo = createMockService({
      getShows: vi.fn().mockResolvedValue([mockShow]),
    });
    const result = await createGetShowsUseCase(repo)();
    expect(repo.getShows).toHaveBeenCalled();
    expect(result).toEqual([mockShow]);
  });
});
