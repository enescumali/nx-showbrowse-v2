import type { Show } from '../types/show.types';
import type { IBFFApiClient } from '../api/bff-api-client.interface';

/** Narrowed to just getShowsByCountry so this use-case only depends on the
 * one method it actually calls, not the full IBFFApiClient shape. */
export function createGetShowsByCountryUseCase(
  apiClient: Pick<IBFFApiClient, 'getShowsByCountry'>,
) {
  return async function getShowsByCountry(country: string): Promise<Show[]> {
    if (!country.trim()) throw new Error('Country code must not be empty');
    return apiClient.getShowsByCountry(country);
  };
}

export type GetShowsByCountryUseCase = ReturnType<
  typeof createGetShowsByCountryUseCase
>;
