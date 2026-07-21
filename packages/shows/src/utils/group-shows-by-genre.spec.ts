import { describe, it, expect } from 'vitest';
import { groupShowsByGenre } from './group-shows-by-genre';
import type { Show } from '../entities/show.entity';

function makeShow(
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

describe('groupShowsByGenre', () => {
  it('returns an empty list when there are no shows', () => {
    expect(groupShowsByGenre([])).toEqual([]);
  });

  it('groups shows by genre', () => {
    const map = Object.fromEntries(
      groupShowsByGenre([
        makeShow({ id: 1, genres: ['Drama'] }),
        makeShow({ id: 2, genres: ['Drama'] }),
        makeShow({ id: 3, genres: ['Comedy'] }),
      ]),
    );
    expect(map['Drama']).toHaveLength(2);
    expect(map['Comedy']).toHaveLength(1);
  });

  it('places shows with no genres under "Other"', () => {
    const map = Object.fromEntries(
      groupShowsByGenre([makeShow({ id: 1, genres: [] })]),
    );
    expect(map['Other']).toHaveLength(1);
  });

  it('a show with multiple genres appears in each genre group', () => {
    const map = Object.fromEntries(
      groupShowsByGenre([makeShow({ id: 1, genres: ['Drama', 'Crime'] })]),
    );
    expect(map['Drama']).toHaveLength(1);
    expect(map['Crime']).toHaveLength(1);
  });

  it('sorts genre groups alphabetically', () => {
    const keys = groupShowsByGenre([
      makeShow({ id: 1, genres: ['Thriller'] }),
      makeShow({ id: 2, genres: ['Action'] }),
      makeShow({ id: 3, genres: ['Comedy'] }),
    ]).map(([genre]) => genre);
    expect(keys).toEqual(['Action', 'Comedy', 'Thriller']);
  });

  it('"Other" sorts among genres alphabetically', () => {
    const keys = groupShowsByGenre([
      makeShow({ id: 1, genres: [] }),
      makeShow({ id: 2, genres: ['Action'] }),
    ]).map(([genre]) => genre);
    expect(keys).toEqual(['Action', 'Other']);
  });

  it('sorts shows within each genre by rating descending', () => {
    const map = Object.fromEntries(
      groupShowsByGenre([
        makeShow({ id: 1, genres: ['Drama'], rating: 6 }),
        makeShow({ id: 2, genres: ['Drama'], rating: 9 }),
        makeShow({ id: 3, genres: ['Drama'], rating: 7.5 }),
      ]),
    );
    expect(map['Drama'].map((s) => s.rating)).toEqual([9, 7.5, 6]);
  });
});
