import { describe, it, expect, vi } from 'vitest';
import { createGetShowsByCountryUseCase } from './get-shows-by-country.use-case';
import type { IBFFApiClient } from '../api/bff-api-client.interface';
import type { Show } from '../types/show.types';

function createMockService(
  overrides: Partial<Pick<IBFFApiClient, 'getShowsByCountry'>> = {},
): Pick<IBFFApiClient, 'getShowsByCountry'> {
  return {
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

describe('createGetShowsByCountryUseCase', () => {
  it('delegates to repository with the given country', async () => {
    const repo = createMockService({
      getShowsByCountry: vi.fn().mockResolvedValue([mockShow]),
    });
    const result = await createGetShowsByCountryUseCase(repo)('US');
    expect(repo.getShowsByCountry).toHaveBeenCalledWith('US');
    expect(result).toEqual([mockShow]);
  });

  it('throws for empty country code', async () => {
    const useCase = createGetShowsByCountryUseCase(createMockService());
    await expect(useCase('')).rejects.toThrow('Country code must not be empty');
    await expect(useCase('  ')).rejects.toThrow(
      'Country code must not be empty',
    );
  });
});
