// Types
export type { Show, ShowDetail, CastMember } from './types/show.types';

// Utils
export { groupShowsByGenre } from './utils/group-shows-by-genre';

// API client (apps/api-facing — used by apps/web)
export { createBFFApiClient } from './api/bff-api.client';
export type {
  IBFFApiClient,
  CatalogSort,
  CatalogQuery,
  CatalogPage,
  GenreGroup,
  GenreSummary,
} from './api/bff-api-client.interface';

// Use case factories
export { createGetShowDetailUseCase } from './use-cases/get-show-detail.use-case';
export { createSearchShowsUseCase } from './use-cases/search-shows.use-case';
export { createGetShowsByCountryUseCase } from './use-cases/get-shows-by-country.use-case';
export { createGetCatalogPageUseCase } from './use-cases/get-catalog-page.use-case';
export { createGetGenreGroupsUseCase } from './use-cases/get-genre-groups.use-case';
export { createGetGenreNamesUseCase } from './use-cases/get-genre-names.use-case';

// Use case types
export type { GetShowDetailUseCase } from './use-cases/get-show-detail.use-case';
export type { SearchShowsUseCase } from './use-cases/search-shows.use-case';
export type { GetShowsByCountryUseCase } from './use-cases/get-shows-by-country.use-case';
export type { GetCatalogPageUseCase } from './use-cases/get-catalog-page.use-case';
export type { GetGenreGroupsUseCase } from './use-cases/get-genre-groups.use-case';
export type { GetGenreNamesUseCase } from './use-cases/get-genre-names.use-case';
