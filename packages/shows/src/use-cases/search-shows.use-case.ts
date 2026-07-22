import type { Show } from '../entities/show.entity';
import type { IShowService } from '../services/show-service.interface';

/** Narrowed to just searchShows — reusable against ICatalogService too. */
export function createSearchShowsUseCase(
  showService: Pick<IShowService, 'searchShows'>,
) {
  return async function searchShows(query: string): Promise<Show[]> {
    if (!query.trim()) return [];
    return showService.searchShows(query.trim());
  };
}

export type SearchShowsUseCase = ReturnType<typeof createSearchShowsUseCase>;
