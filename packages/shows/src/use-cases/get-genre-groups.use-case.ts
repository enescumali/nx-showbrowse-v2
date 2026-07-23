import type {
  IBFFApiClient,
  GenreGroup,
} from '../api/bff-api-client.interface';

export function createGetGenreGroupsUseCase(
  apiClient: Pick<IBFFApiClient, 'getGenreGroups'>,
) {
  return async function getGenreGroups(limit?: number): Promise<GenreGroup[]> {
    return apiClient.getGenreGroups(limit);
  };
}

export type GetGenreGroupsUseCase = ReturnType<
  typeof createGetGenreGroupsUseCase
>;
