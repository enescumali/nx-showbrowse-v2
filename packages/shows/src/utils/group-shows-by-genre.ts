import type { Show } from '../types/show.types';
import type { GenreGroup } from '../api/bff-api-client.interface';

// Same { genre, shows } shape apps/api's own genre grouping sends over the
// wire for Home's carousels (see apps/api/src/routes/genres.route.ts) — so
// Today's client-side grouping and Home's server-side grouping look
// identical to whatever renders them, even though the two are independent
// implementations (apps/web has no access to apps/api's server-only code).
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
