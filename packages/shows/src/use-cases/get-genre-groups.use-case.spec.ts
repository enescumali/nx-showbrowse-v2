import { describe, it, expect, vi } from 'vitest';
import { createGetGenreGroupsUseCase } from './get-genre-groups.use-case';
import type { GenreGroup } from '../api/bff-api-client.interface';

describe('createGetGenreGroupsUseCase', () => {
  it('delegates to the API client with the given limit', async () => {
    const groups: GenreGroup[] = [{ genre: 'Drama', shows: [] }];
    const apiClient = {
      getGenreGroups: vi.fn().mockResolvedValue(groups),
    };

    const result = await createGetGenreGroupsUseCase(apiClient)(20);

    expect(apiClient.getGenreGroups).toHaveBeenCalledWith(20);
    expect(result).toBe(groups);
  });

  it('works with no limit', async () => {
    const apiClient = { getGenreGroups: vi.fn().mockResolvedValue([]) };

    await createGetGenreGroupsUseCase(apiClient)();

    expect(apiClient.getGenreGroups).toHaveBeenCalledWith(undefined);
  });
});
