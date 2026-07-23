import type {
  IBFFApiClient,
  GenreSummary,
} from '../api/bff-api-client.interface';

export function createGetGenreNamesUseCase(
  apiClient: Pick<IBFFApiClient, 'getGenreNames'>,
) {
  return async function getGenreNames(): Promise<GenreSummary[]> {
    return apiClient.getGenreNames();
  };
}

export type GetGenreNamesUseCase = ReturnType<
  typeof createGetGenreNamesUseCase
>;
