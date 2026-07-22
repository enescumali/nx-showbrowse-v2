import type { Show } from '../entities/show.entity';
import type { IShowService } from '../services/show-service.interface';

/** Narrowed to just getShowsByCountry — reusable against ICatalogService too. */
export function createGetShowsByCountryUseCase(
  showService: Pick<IShowService, 'getShowsByCountry'>,
) {
  return async function getShowsByCountry(country: string): Promise<Show[]> {
    if (!country.trim()) throw new Error('Country code must not be empty');
    return showService.getShowsByCountry(country);
  };
}

export type GetShowsByCountryUseCase = ReturnType<
  typeof createGetShowsByCountryUseCase
>;
