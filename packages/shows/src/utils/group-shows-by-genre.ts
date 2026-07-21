import type { Show } from '../entities/show.entity';

export function groupShowsByGenre(shows: Show[]): [string, Show[]][] {
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
    .map(([genre, grouped]) => [
      genre,
      [...grouped].sort((a, b) => b.rating - a.rating),
    ]);
}
