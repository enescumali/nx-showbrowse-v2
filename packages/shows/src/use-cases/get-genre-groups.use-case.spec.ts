import { describe, it, expect, vi } from 'vitest';
import { createGetGenreGroupsUseCase } from './get-genre-groups.use-case';
import type { GenreGroup } from '../api/backend-api-client.interface';

describe('createGetGenreGroupsUseCase', () => {
  it('delegates to the catalog service with the given limit', async () => {
    const groups: GenreGroup[] = [{ genre: 'Drama', shows: [] }];
    const catalogService = { getGenreGroups: vi.fn().mockResolvedValue(groups) };

    const result = await createGetGenreGroupsUseCase(catalogService)(20);

    expect(catalogService.getGenreGroups).toHaveBeenCalledWith(20);
    expect(result).toBe(groups);
  });

  it('works with no limit', async () => {
    const catalogService = { getGenreGroups: vi.fn().mockResolvedValue([]) };

    await createGetGenreGroupsUseCase(catalogService)();

    expect(catalogService.getGenreGroups).toHaveBeenCalledWith(undefined);
  });
});
