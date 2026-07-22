import type { GenreGroup } from '../api/backend-api-client.interface';
import type { ICatalogService } from '../services/catalog-service.interface';

export function createGetGenreGroupsUseCase(
  catalogService: Pick<ICatalogService, 'getGenreGroups'>,
) {
  return async function getGenreGroups(limit?: number): Promise<GenreGroup[]> {
    return catalogService.getGenreGroups(limit);
  };
}

export type GetGenreGroupsUseCase = ReturnType<
  typeof createGetGenreGroupsUseCase
>;
