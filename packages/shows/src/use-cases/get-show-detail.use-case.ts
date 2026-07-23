import type { ShowDetail } from '../types/show.types';
import type { IBFFApiClient } from '../api/bff-api-client.interface';

/** Narrowed to just getShowById so this use-case only depends on the one
 * method it actually calls, not the full IBFFApiClient shape. */
export function createGetShowDetailUseCase(
  apiClient: Pick<IBFFApiClient, 'getShowById'>,
) {
  return async function getShowDetail(
    id: string | number,
  ): Promise<ShowDetail> {
    if (!id) throw new Error('Show ID is required');
    return apiClient.getShowById(id);
  };
}

export type GetShowDetailUseCase = ReturnType<
  typeof createGetShowDetailUseCase
>;
