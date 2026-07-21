import type { Show } from '../entities/show.entity';
import type { IShowService } from '../services/show-service.interface';

export function createGetShowsUseCase(showService: IShowService) {
  return async function getShows(page = 0): Promise<Show[]> {
    return showService.getShows(page);
  };
}

export type GetShowsUseCase = ReturnType<typeof createGetShowsUseCase>;
