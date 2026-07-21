import type {
  TvMazeShow,
  TvMazeShowWithCast,
  TvMazeSearchResult,
  TvMazeScheduleEpisode,
} from './tvmaze.types';

export interface IShowApiClient {
  getShows(page: number): Promise<TvMazeShow[]>;
  getShowById(id: string | number): Promise<TvMazeShowWithCast>;
  searchShows(query: string): Promise<TvMazeSearchResult[]>;
  getSchedule(country: string): Promise<TvMazeScheduleEpisode[]>;
}
