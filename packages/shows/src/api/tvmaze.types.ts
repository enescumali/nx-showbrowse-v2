export interface TvMazeImage {
  medium: string;
  original: string;
}

export interface TvMazeShow {
  id: number;
  name: string;
  type: string;
  genres: string[];
  status: string;
  runtime: number | null;
  premiered: string | null;
  image: TvMazeImage | null;
  summary: string | null;
  rating: { average: number | null };
}

export interface TvMazeCastPerson {
  id: number;
  name: string;
  image: TvMazeImage | null;
}

export interface TvMazeCastMember {
  person: TvMazeCastPerson;
  character: { id: number; name: string };
}

export interface TvMazeShowWithCast extends TvMazeShow {
  _embedded?: { cast: TvMazeCastMember[] };
}

export interface TvMazeSearchResult {
  score: number;
  show: TvMazeShow;
}

export interface TvMazeScheduleEpisode {
  id: number;
  name: string;
  show: TvMazeShow;
}
