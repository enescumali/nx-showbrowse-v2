// Entities
export type { Show, ShowDetail, CastMember } from './entities/show.entity';

// Repository interface
export type { IShowService } from './services/show-service.interface';

// Service factory
export { createShowService } from './services/show.service';

// API client (TVMaze-facing — used internally by apps/api)
export { createShowApiClient } from './api/show-api.client';
export type { IShowApiClient } from './api/show-api-client.interface';

// API client (apps/api-facing — used by apps/web)
export { createBackendApiClient } from './api/backend-api.client';
export type {
  IBackendApiClient,
  CatalogSort,
  CatalogQuery,
  CatalogPage,
  GenreGroup,
  GenreSummary,
} from './api/backend-api-client.interface';

// Catalog service (caches IBackendApiClient calls)
export { createCatalogService } from './services/catalog.service';
export type { ICatalogService } from './services/catalog-service.interface';

// Mappers
export {
  mapShowToDomain,
  mapCastMemberToDomain,
  mapShowWithCastToDomain,
} from './mappers/show.mapper';

// Use case factories
export { createGetShowsUseCase } from './use-cases/get-shows.use-case';
export { createGetShowDetailUseCase } from './use-cases/get-show-detail.use-case';
export { createSearchShowsUseCase } from './use-cases/search-shows.use-case';
export { createGetShowsByCountryUseCase } from './use-cases/get-shows-by-country.use-case';
export { createGetCatalogPageUseCase } from './use-cases/get-catalog-page.use-case';
export { createGetGenreGroupsUseCase } from './use-cases/get-genre-groups.use-case';
export { createGetGenreNamesUseCase } from './use-cases/get-genre-names.use-case';

// Use case types
export type { GetShowsUseCase } from './use-cases/get-shows.use-case';
export type { GetShowDetailUseCase } from './use-cases/get-show-detail.use-case';
export type { SearchShowsUseCase } from './use-cases/search-shows.use-case';
export type { GetShowsByCountryUseCase } from './use-cases/get-shows-by-country.use-case';
export type { GetCatalogPageUseCase } from './use-cases/get-catalog-page.use-case';
export type { GetGenreGroupsUseCase } from './use-cases/get-genre-groups.use-case';
export type { GetGenreNamesUseCase } from './use-cases/get-genre-names.use-case';

// Utils
export { groupShowsByGenre } from './utils/group-shows-by-genre';
