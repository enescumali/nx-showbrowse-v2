export interface Show {
  id: string | number;
  title: string;
  showType: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  rating: number;
  genres: string[];
}

export interface ShowDetail extends Show {
  runtime: number;
  cast: CastMember[];
}

export interface CastMember {
  id: string | number;
  name: string;
  character: string;
  profileUrl: string;
}
