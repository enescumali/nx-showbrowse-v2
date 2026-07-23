import type { Show } from '../entities/show.entity';
import type { ICatalogService } from '../services/catalog-service.interface';

/** Narrowed to just getShowsByCountry so this use-case only depends on the
 * one method it actually calls, not the full ICatalogService shape. */
export function createGetShowsByCountryUseCase(
  showService: Pick<ICatalogService, 'getShowsByCountry'>,
) {
  return async function getShowsByCountry(country: string): Promise<Show[]> {
    if (!country.trim()) throw new Error('Country code must not be empty');
    return showService.getShowsByCountry(country);
  };
}

export type GetShowsByCountryUseCase = ReturnType<
  typeof createGetShowsByCountryUseCase
>;
