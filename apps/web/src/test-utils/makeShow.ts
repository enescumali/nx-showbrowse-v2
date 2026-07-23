import type { Show } from '@show-browse/shows';

/**
 * Creates a mock Show object for testing.
 * @param overrides - Properties to override in the mock Show
 */
export function makeShow(
  overrides: Partial<Show> & { id: number; genres: string[] },
): Show {
  return {
    title: `Show ${overrides.id}`,
    showType: 'Scripted',
    overview: '',
    posterUrl: '',
    backdropUrl: '',
    releaseDate: '',
    rating: 7,
    ...overrides,
  };
}
