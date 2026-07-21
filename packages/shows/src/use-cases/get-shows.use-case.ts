import type { Show } from '../entities/show.entity';
import type { IShowService } from '../services/show-service.interface';

export function createGetShowsUseCase(showService: IShowService) {
  return async function getShows(): Promise<Show[]> {
    return showService.getShows();
  };
}

export type GetShowsUseCase = ReturnType<typeof createGetShowsUseCase>;
