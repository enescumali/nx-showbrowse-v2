import type { Show } from '../entities/show.entity';
import type { ICatalogService } from '../services/catalog-service.interface';

/** Narrowed to just searchShows so this use-case only depends on the one
 * method it actually calls, not the full ICatalogService shape. */
export function createSearchShowsUseCase(
  showService: Pick<ICatalogService, 'searchShows'>,
) {
  return async function searchShows(query: string): Promise<Show[]> {
    if (!query.trim()) return [];
    return showService.searchShows(query.trim());
  };
}

export type SearchShowsUseCase = ReturnType<typeof createSearchShowsUseCase>;
