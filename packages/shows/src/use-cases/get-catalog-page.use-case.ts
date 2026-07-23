import type {
  IBFFApiClient,
  CatalogQuery,
  CatalogPage,
} from '../api/bff-api-client.interface';

export function createGetCatalogPageUseCase(
  apiClient: Pick<IBFFApiClient, 'getCatalogPage'>,
) {
  return async function getCatalogPage(
    query: CatalogQuery,
  ): Promise<CatalogPage> {
    return apiClient.getCatalogPage(query);
  };
}

export type GetCatalogPageUseCase = ReturnType<
  typeof createGetCatalogPageUseCase
>;
