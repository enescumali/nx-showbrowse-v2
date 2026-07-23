import type { Show } from '../types/show.types';
import type { IBFFApiClient } from '../api/bff-api-client.interface';

/** Narrowed to just searchShows so this use-case only depends on the one
 * method it actually calls, not the full IBFFApiClient shape. */
export function createSearchShowsUseCase(
  apiClient: Pick<IBFFApiClient, 'searchShows'>,
) {
  return async function searchShows(query: string): Promise<Show[]> {
    if (!query.trim()) return [];
    return apiClient.searchShows(query.trim());
  };
}

export type SearchShowsUseCase = ReturnType<typeof createSearchShowsUseCase>;
