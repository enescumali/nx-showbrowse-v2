import type { App } from 'vue';
import {
  createBackendApiClient,
  createCatalogService,
  createGetCatalogPageUseCase,
  createGetGenreGroupsUseCase,
  createGetGenreNamesUseCase,
  createGetShowDetailUseCase,
  createSearchShowsUseCase,
  createGetShowsByCountryUseCase,
} from '@show-browse/shows';
import { SHOWS_USE_CASES_KEY } from './injection-keys';

function getBaseUrl(): string {
  // Points at apps/api (our backend-for-frontend), not TVMaze directly.
  const url = import.meta.env.VITE_API_BASE_URL;

  if (!url) {
    throw new Error(
      'VITE_API_BASE_URL is required in production. Set it in your .env file.',
    );
  }

  return url;
}

export const showsPlugin = {
  install(app: App): void {
    const apiClient = createBackendApiClient(getBaseUrl());
    const catalogService = createCatalogService(apiClient);

    const getCatalogPageUseCase = createGetCatalogPageUseCase(catalogService);
    const getGenreGroupsUseCase = createGetGenreGroupsUseCase(catalogService);
    const getGenreNamesUseCase = createGetGenreNamesUseCase(catalogService);
    const getShowDetailUseCase = createGetShowDetailUseCase(catalogService);
    const searchShowsUseCase = createSearchShowsUseCase(catalogService);
    const getShowsByCountryUseCase =
      createGetShowsByCountryUseCase(catalogService);

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
