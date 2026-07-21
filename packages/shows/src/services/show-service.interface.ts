import type { Show, ShowDetail } from '../entities/show.entity';

export interface IShowService {
  getShows(): Promise<Show[]>;
  getShowById(id: string | number): Promise<ShowDetail>;
  searchShows(query: string): Promise<Show[]>;
  getShowsByCountry(country: string): Promise<Show[]>;
}
