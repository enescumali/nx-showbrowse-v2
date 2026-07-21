import type { App } from 'vue';
import {
  createShowApiClient,
  createShowService,
  createGetShowsUseCase,
  createGetShowDetailUseCase,
  createSearchShowsUseCase,
  createGetShowsByCountryUseCase,
} from '@show-browse/shows';
import { SHOWS_USE_CASES_KEY } from './injection-keys';

function getBaseUrl(): string {
  // make sure it from env
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
    const apiClient = createShowApiClient(getBaseUrl());
    const showService = createShowService(apiClient);

    const getShowsUseCase = createGetShowsUseCase(showService);
    const getShowDetailUseCase = createGetShowDetailUseCase(showService);
    const searchShowsUseCase = createSearchShowsUseCase(showService);
    const getShowsByCountryUseCase =
      createGetShowsByCountryUseCase(showService);

    app.provide(SHOWS_USE_CASES_KEY, {
      getShows: (page) => getShowsUseCase(page),
      getShowDetail: (id) => getShowDetailUseCase(id),
      searchShows: (query) => searchShowsUseCase(query),
      getShowsByCountry: (country) => getShowsByCountryUseCase(country),
    });
  },
};
