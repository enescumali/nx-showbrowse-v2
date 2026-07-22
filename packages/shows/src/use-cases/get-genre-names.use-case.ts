import type { GenreSummary } from '../api/backend-api-client.interface';
import type { ICatalogService } from '../services/catalog-service.interface';

export function createGetGenreNamesUseCase(
  catalogService: Pick<ICatalogService, 'getGenreNames'>,
) {
  return async function getGenreNames(): Promise<GenreSummary[]> {
    return catalogService.getGenreNames();
  };
}

export type GetGenreNamesUseCase = ReturnType<
  typeof createGetGenreNamesUseCase
>;
