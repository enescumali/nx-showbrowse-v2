import type { App } from 'vue';
import {
  createBFFApiClient,
  createGetCatalogPageUseCase,
  createGetGenreGroupsUseCase,
  createGetGenreNamesUseCase,
  createGetShowDetailUseCase,
  createSearchShowsUseCase,
  createGetShowsByCountryUseCase,
} from '@show-browse/shows';
import { SHOWS_USE_CASES_KEY } from './injection-keys';

function getBFFAPIBaseUrl(): string {
  // Points at apps/api (our backend-for-frontend), not TVMaze directly.
  const url = import.meta.env.VITE_BFF_API_BASE_URL;

  if (!url) {
    throw new Error(
      'VITE_BFF_API_BASE_URL is required in production. Set it in your .env file.',
    );
  }

  return url;
}

export const showsPlugin = {
  install(app: App): void {
    const apiClient = createBFFApiClient(getBFFAPIBaseUrl());

    const getCatalogPageUseCase = createGetCatalogPageUseCase(apiClient);
    const getGenreGroupsUseCase = createGetGenreGroupsUseCase(apiClient);
    const getGenreNamesUseCase = createGetGenreNamesUseCase(apiClient);
    const getShowDetailUseCase = createGetShowDetailUseCase(apiClient);
    const searchShowsUseCase = createSearchShowsUseCase(apiClient);
    const getShowsByCountryUseCase = createGetShowsByCountryUseCase(apiClient);

    app.provide(SHOWS_USE_CASES_KEY, {
      getCatalogPage: (query) => getCatalogPageUseCase(query),
      getGenreGroups: (limit) => getGenreGroupsUseCase(limit),
      getGenreNames: () => getGenreNamesUseCase(),
      getShowDetail: (id) => getShowDetailUseCase(id),
      searchShows: (query) => searchShowsUseCase(query),
      getShowsByCountry: (country) => getShowsByCountryUseCase(country),
    });
  },
};
