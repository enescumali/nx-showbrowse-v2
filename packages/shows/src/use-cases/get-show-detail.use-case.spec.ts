import { describe, it, expect, vi } from 'vitest';
import { createGetShowDetailUseCase } from './get-show-detail.use-case';
import type { ICatalogService } from '../services/catalog-service.interface';
import type { Show, ShowDetail } from '../entities/show.entity';

function createMockService(
  overrides: Partial<Pick<ICatalogService, 'getShowById'>> = {},
): Pick<ICatalogService, 'getShowById'> {
  return {
    getShowById: vi.fn().mockResolvedValue({} as ShowDetail),
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

describe('createGetShowDetailUseCase', () => {
  it('delegates to repository with the given id', async () => {
    const detail: ShowDetail = { ...mockShow, runtime: 45, cast: [] };
    const repo = createMockService({
      getShowById: vi.fn().mockResolvedValue(detail),
    });
    const result = await createGetShowDetailUseCase(repo)(42);
    expect(repo.getShowById).toHaveBeenCalledWith(42);
    expect(result).toBe(detail);
  });

  it('throws when id is falsy', async () => {
    const useCase = createGetShowDetailUseCase(createMockService());
    await expect(useCase('')).rejects.toThrow('Show ID is required');
    await expect(useCase(0)).rejects.toThrow('Show ID is required');
  });
});
