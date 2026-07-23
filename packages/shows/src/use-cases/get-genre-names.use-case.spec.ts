import { describe, it, expect, vi } from 'vitest';
import { createGetGenreNamesUseCase } from './get-genre-names.use-case';
import type { GenreSummary } from '../api/bff-api-client.interface';

describe('createGetGenreNamesUseCase', () => {
  it('delegates to the API client', async () => {
    const names: GenreSummary[] = [{ genre: 'Drama', count: 10 }];
    const apiClient = { getGenreNames: vi.fn().mockResolvedValue(names) };

    const result = await createGetGenreNamesUseCase(apiClient)();

    expect(apiClient.getGenreNames).toHaveBeenCalled();
    expect(result).toBe(names);
  });
});
