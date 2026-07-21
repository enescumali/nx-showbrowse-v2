import { describe, it, expect, vi } from 'vitest';
import { createSearchShowsUseCase } from './search-shows.use-case';
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

describe('createSearchShowsUseCase', () => {
  it('delegates to repository with trimmed query', async () => {
    const repo = createMockService({
      searchShows: vi.fn().mockResolvedValue([mockShow]),
    });
    const result = await createSearchShowsUseCase(repo)('  breaking bad  ');
    expect(repo.searchShows).toHaveBeenCalledWith('breaking bad');
    expect(result).toEqual([mockShow]);
  });

  it('returns empty array and does not call repository for blank query', async () => {
    const repo = createMockService();
    const result = await createSearchShowsUseCase(repo)('   ');
    expect(result).toEqual([]);
    expect(repo.searchShows).not.toHaveBeenCalled();
  });

  it('returns empty array for empty string', async () => {
    const repo = createMockService();
    const result = await createSearchShowsUseCase(repo)('');
    expect(result).toEqual([]);
    expect(repo.searchShows).not.toHaveBeenCalled();
  });
});
