import type { ShowDetail } from '../entities/show.entity';
import type { IShowService } from '../services/show-service.interface';

/** Narrowed to just getShowById so this use-case can be reused against any
 * service that offers it — e.g. apps/web's ICatalogService (backend-backed)
 * as well as the TVMaze-facing IShowService apps/api uses internally. */
export function createGetShowDetailUseCase(
  showService: Pick<IShowService, 'getShowById'>,
) {
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
