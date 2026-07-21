import type { ShowDetail } from '../entities/show.entity';
import type { IShowService } from '../services/show-service.interface';

export function createGetShowDetailUseCase(showService: IShowService) {
  return async function getShowDetail(
    id: string | number,
  ): Promise<ShowDetail> {
    if (!id) throw new Error('Show ID is required');
    return showService.getShowById(id);
  };
}

export type GetShowDetailUseCase = ReturnType<
  typeof createGetShowDetailUseCase
>;
