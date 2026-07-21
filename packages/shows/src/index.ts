// Entities
export type { Show, ShowDetail, CastMember } from './entities/show.entity';

// Repository interface
export type { IShowService } from './services/show-service.interface';

// Service factory
export { createShowService } from './services/show.service';

// API client
export { createShowApiClient } from './api/show-api.client';
export type { IShowApiClient } from './api/show-api-client.interface';

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

// Use case types
export type { GetShowsUseCase } from './use-cases/get-shows.use-case';
export type { GetShowDetailUseCase } from './use-cases/get-show-detail.use-case';
export type { SearchShowsUseCase } from './use-cases/search-shows.use-case';
export type { GetShowsByCountryUseCase } from './use-cases/get-shows-by-country.use-case';

// Utils
export { groupShowsByGenre } from './utils/group-shows-by-genre';
