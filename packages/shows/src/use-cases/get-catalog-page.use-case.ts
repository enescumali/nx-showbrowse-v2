import type {
  CatalogQuery,
  CatalogPage,
} from '../api/backend-api-client.interface';
import type { ICatalogService } from '../services/catalog-service.interface';

export function createGetCatalogPageUseCase(
  catalogService: Pick<ICatalogService, 'getCatalogPage'>,
) {
  return async function getCatalogPage(
    query: CatalogQuery,
  ): Promise<CatalogPage> {
    return catalogService.getCatalogPage(query);
  };
}

export type GetCatalogPageUseCase = ReturnType<
  typeof createGetCatalogPageUseCase
>;
