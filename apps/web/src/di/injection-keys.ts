import type { InjectionKey } from 'vue';
import { inject } from 'vue';
import type {
  Show,
  ShowDetail,
  CatalogQuery,
  CatalogPage,
  GenreGroup,
  GenreSummary,
} from '@show-browse/shows';

export interface ShowsUseCases {
  getCatalogPage(query: CatalogQuery): Promise<CatalogPage>;
  getGenreGroups(limit?: number): Promise<GenreGroup[]>;
  getGenreNames(): Promise<GenreSummary[]>;
  getShowDetail(id: string | number): Promise<ShowDetail>;
  searchShows(query: string): Promise<Show[]>;
  getShowsByCountry(country: string): Promise<Show[]>;
}

export const SHOWS_USE_CASES_KEY: InjectionKey<ShowsUseCases> =
  Symbol('ShowsUseCases');

/** Typed inject that throws at runtime if the plugin was not installed. */
export function injectRequired<T>(key: InjectionKey<T>, name: string): T {
  const value = inject(key);
  if (value === undefined) {
    throw new Error(
      `"${name}" was not provided. Did you call app.use(showsPlugin)?`,
    );
  }
  return value;
}
