import type {
  TvMazeShow,
  TvMazeShowWithCast,
  TvMazeSearchResult,
  TvMazeScheduleEpisode,
} from './types';

/** apps/api's own TVMaze integration — independent of packages/shows, which
 * only ever knows about apps/api's HTTP contract, never TVMaze's. */
export interface IShowApiClient {
  getShows(page: number): Promise<TvMazeShow[]>;
  getShowById(id: string | number): Promise<TvMazeShowWithCast>;
  searchShows(query: string): Promise<TvMazeSearchResult[]>;
  getSchedule(country: string): Promise<TvMazeScheduleEpisode[]>;
}

export function createShowApiClient(baseURL: string): IShowApiClient {
  async function fetchJson<T>(
    path: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const url = new URL(path, baseURL);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url.toString()).catch(() => {
      throw new Error('Unable to connect. Check your internet connection.');
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message: string =
        (data as { message?: string })?.message ??
        response.statusText ??
        'Unknown error';
      throw new Error(`[${response.status}] ${message}`);
    }

    return response.json() as Promise<T>;
  }

  return {
    getShows: (page: number) => fetchJson<TvMazeShow[]>('/shows', { page }),
    getShowById: (id: string | number) =>
      fetchJson<TvMazeShowWithCast>(`/shows/${id}`, { embed: 'cast' }),
    searchShows: (query: string) =>
      fetchJson<TvMazeSearchResult[]>('/search/shows', { q: query }),
    getSchedule: (country: string) =>
      fetchJson<TvMazeScheduleEpisode[]>('/schedule', { country }),
  };
}
