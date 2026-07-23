import type { Show } from '../types/show.types';

export interface GenreGroup {
  genre: string;
  shows: Show[];
}

export function groupShowsByGenre(shows: Show[]): GenreGroup[] {
  const map = new Map<string, Show[]>();

  for (const show of shows) {
    if (show.genres.length === 0) {
      const group = map.get('Other') ?? [];
      group.push(show);
      map.set('Other', group);
    } else {
      for (const genre of show.genres) {
        const group = map.get(genre) ?? [];
        group.push(show);
        map.set(genre, group);
      }
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([genre, grouped]) => ({
      genre,
      shows: [...grouped].sort((a, b) => b.rating - a.rating),
    }));
}
