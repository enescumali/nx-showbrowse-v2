import type { Show, ShowDetail } from '../entities/show.entity';

export type CatalogSort = 'rating' | 'date' | 'title';

export interface CatalogQuery {
  page?: number;
  pageSize?: number;
  genre?: string;
  sort?: CatalogSort;
}

export interface CatalogPage {
  shows: Show[];
  page: number;
  pageSize: number;
  totalShows: number;
  totalPages: number;
}

export interface GenreGroup {
  genre: string;
  shows: Show[];
}

export interface GenreSummary {
  genre: string;
  count: number;
}

/** Talks to apps/api (our own backend-for-frontend), not TVMaze directly.
 * Responses are already domain-shaped — apps/api mapped them during
 * ingestion — so unlike IShowApiClient there's no TVMaze-shape mapping
 * needed on this side. */
export interface IBackendApiClient {
  getCatalogPage(query: CatalogQuery): Promise<CatalogPage>;
  getGenreGroups(limit?: number): Promise<GenreGroup[]>;
  getGenreNames(): Promise<GenreSummary[]>;
  getShowById(id: string | number): Promise<ShowDetail>;
  searchShows(query: string): Promise<Show[]>;
  getShowsByCountry(country: string): Promise<Show[]>;
}
