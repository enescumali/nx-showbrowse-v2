import type { Show } from '../entities/show.entity';
import type { IShowService } from '../services/show-service.interface';

export function createGetShowsByCountryUseCase(showService: IShowService) {
  return async function getShowsByCountry(country: string): Promise<Show[]> {
    if (!country.trim()) throw new Error('Country code must not be empty');
    return showService.getShowsByCountry(country);
  };
}

export type GetShowsByCountryUseCase = ReturnType<
  typeof createGetShowsByCountryUseCase
>;
