import type { Show, ShowDetail } from '../entities/show.entity';
import type {
  CatalogQuery,
  CatalogPage,
  GenreGroup,
  GenreSummary,
} from '../api/backend-api-client.interface';

/** Same shape as IBackendApiClient — apps/api already returns domain-shaped
 * data, so there's no raw-shape mapping left to do here, only the caching
 * layer (mirrors how IShowService sits on top of IShowApiClient). */
export interface ICatalogService {
  getCatalogPage(query: CatalogQuery): Promise<CatalogPage>;
  getGenreGroups(limit?: number): Promise<GenreGroup[]>;
  getGenreNames(): Promise<GenreSummary[]>;
  getShowById(id: string | number): Promise<ShowDetail>;
  searchShows(query: string): Promise<Show[]>;
  getShowsByCountry(country: string): Promise<Show[]>;
}
