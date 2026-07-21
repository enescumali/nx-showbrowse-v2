import type { Show, ShowDetail, CastMember } from '../entities/show.entity';
import type { TvMazeShow, TvMazeShowWithCast, TvMazeCastMember } from '../api/tvmaze.types';

export function mapShowToDomain(raw: TvMazeShow): Show {
  return {
    id: raw.id,
    title: raw.name,
    showType: raw.type ?? '',
    overview: raw.summary?.replace(/<[^>]*>/g, '') ?? '',
    posterUrl: raw.image?.medium ?? '',
    backdropUrl: raw.image?.original ?? '',
    releaseDate: raw.premiered ?? '',
    rating: raw.rating.average ?? 0,
    genres: raw.genres ?? [],
  };
}

export function mapCastMemberToDomain(raw: TvMazeCastMember): CastMember {
  return {
    id: raw.person.id,
    name: raw.person.name,
    character: raw.character.name,
    profileUrl: raw.person.image?.medium ?? '',
  };
}

export function mapShowWithCastToDomain(raw: TvMazeShowWithCast): ShowDetail {
  return {
    ...mapShowToDomain(raw),
    runtime: raw.runtime ?? 0,
    cast: (raw._embedded?.cast ?? []).map(mapCastMemberToDomain),
  };
}
