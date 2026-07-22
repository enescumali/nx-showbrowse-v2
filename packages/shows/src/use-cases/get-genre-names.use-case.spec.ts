import { describe, it, expect, vi } from 'vitest';
import { createGetGenreNamesUseCase } from './get-genre-names.use-case';
import type { GenreSummary } from '../api/backend-api-client.interface';

describe('createGetGenreNamesUseCase', () => {
  it('delegates to the catalog service', async () => {
    const names: GenreSummary[] = [{ genre: 'Drama', count: 10 }];
    const catalogService = { getGenreNames: vi.fn().mockResolvedValue(names) };

    const result = await createGetGenreNamesUseCase(catalogService)();

    expect(catalogService.getGenreNames).toHaveBeenCalled();
    expect(result).toBe(names);
  });
});
