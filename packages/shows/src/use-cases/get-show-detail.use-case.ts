import type { ShowDetail } from '../entities/show.entity';
import type { ICatalogService } from '../services/catalog-service.interface';

/** Narrowed to just getShowById so this use-case only depends on the one
 * method it actually calls, not the full ICatalogService shape. */
export function createGetShowDetailUseCase(
  showService: Pick<ICatalogService, 'getShowById'>,
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
