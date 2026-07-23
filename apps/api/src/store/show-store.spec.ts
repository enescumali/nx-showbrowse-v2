import { describe, it, expect } from 'vitest';
import { createShowStore } from './show-store';
import type { Show } from '../types/show.types';

function show(
  id: number | string,
  overrides: Partial<Show> & { genres?: string[] } = {},
): Show {
  return {
    id,
    title: `Show ${id}`,
    showType: 'Scripted',
    overview: '',
    posterUrl: '',
    backdropUrl: '',
    releaseDate: '2020-01-01',
    rating: 5,
    genres: [],
    ...overrides,
  };
}

describe('createShowStore', () => {
  it('starts empty and not ready', () => {
    const store = createShowStore();

    expect(store.getMeta()).toEqual({
      ready: false,
      lastSyncedAt: null,
      totalShows: 0,
      highestShowId: 0,
    });
    expect(store.getAll()).toEqual([]);
    expect(store.getPage({})).toEqual({
      shows: [],
      page: 0,
      pageSize: 250,
      totalShows: 0,
      totalPages: 0,
    });
  });

  it('replace() marks the store ready and computes meta', () => {
    const store = createShowStore();
    store.replace([show(5), show('12'), show(3)]);

    const meta = store.getMeta();
    expect(meta.ready).toBe(true);
    expect(meta.totalShows).toBe(3);
    expect(meta.highestShowId).toBe(12);
    expect(meta.lastSyncedAt).not.toBeNull();
    expect(new Date(meta.lastSyncedAt as string).toString()).not.toBe(
      'Invalid Date',
    );
  });

  it('getByGenre() delegates to groupShowsByGenre', () => {
    const store = createShowStore();
    store.replace([
      show(1, { genres: ['Drama'], rating: 5 }),
      show(2, { genres: ['Drama', 'Comedy'], rating: 9 }),
    ]);

    const groups = store.getByGenre();
    expect(groups.find((g) => g.genre === 'Drama')?.shows.map((s) => s.id)).toEqual([2, 1]); // sorted by rating desc
    expect(groups.find((g) => g.genre === 'Comedy')?.shows.map((s) => s.id)).toEqual([2]);
  });

  it('getByGenre(limit) slices each group without affecting the cached full grouping', () => {
    const store = createShowStore();
    store.replace([
      show(1, { genres: ['Drama'], rating: 5 }),
      show(2, { genres: ['Drama'], rating: 9 }),
      show(3, { genres: ['Drama'], rating: 7 }),
    ]);

    const limited = store.getByGenre(2);
    expect(limited.find((g) => g.genre === 'Drama')?.shows.map((s) => s.id)).toEqual([2, 3]);

    const full = store.getByGenre();
    expect(full.find((g) => g.genre === 'Drama')?.shows.map((s) => s.id)).toEqual([2, 3, 1]);
  });

  it('getGenreNames() returns genre + count with no show payloads', () => {
    const store = createShowStore();
    store.replace([
      show(1, { genres: ['Drama'] }),
      show(2, { genres: ['Drama', 'Comedy'] }),
      show(3, { genres: ['Comedy'] }),
    ]);

    expect(store.getGenreNames()).toEqual([
      { genre: 'Comedy', count: 2 },
      { genre: 'Drama', count: 2 },
    ]);
  });

  describe('getPage', () => {
    const shows = [1, 2, 3, 4, 5].map((id) => show(id));

    it('paginates using page/pageSize', () => {
      const store = createShowStore();
      store.replace(shows);

      expect(
        store.getPage({ page: 0, pageSize: 2 }).shows.map((s) => s.id),
      ).toEqual([1, 2]);
      expect(
        store.getPage({ page: 1, pageSize: 2 }).shows.map((s) => s.id),
      ).toEqual([3, 4]);
      expect(
        store.getPage({ page: 2, pageSize: 2 }).shows.map((s) => s.id),
      ).toEqual([5]);
    });

    it('returns an empty page (not an error) beyond the last page, with correct totals', () => {
      const store = createShowStore();
      store.replace(shows);

      const result = store.getPage({ page: 10, pageSize: 2 });
      expect(result.shows).toEqual([]);
      expect(result.totalShows).toBe(5);
      expect(result.totalPages).toBe(3);
    });

    it('clamps a negative page to 0', () => {
      const store = createShowStore();
      store.replace(shows);

      expect(store.getPage({ page: -5, pageSize: 2 }).page).toBe(0);
    });

    it('clamps pageSize into [1, 250]', () => {
      const store = createShowStore();
      store.replace(shows);

      expect(store.getPage({ pageSize: 0 }).pageSize).toBe(1);
      expect(store.getPage({ pageSize: 9999 }).pageSize).toBe(250);
    });

    it('filters by genre, with totals computed off the filtered set', () => {
      const store = createShowStore();
      store.replace([
        show(1, { genres: ['Drama'] }),
        show(2, { genres: ['Comedy'] }),
        show(3, { genres: ['Drama'] }),
      ]);

      const result = store.getPage({ genre: 'Drama' });
      expect(result.shows.map((s) => s.id)).toEqual([1, 3]);
      expect(result.totalShows).toBe(2);
      expect(result.totalPages).toBe(1);
    });

    it('returns a valid empty result for a genre with no matches', () => {
      const store = createShowStore();
      store.replace([show(1, { genres: ['Drama'] })]);

      const result = store.getPage({ genre: 'Sci-Fi' });
      expect(result.shows).toEqual([]);
      expect(result.totalShows).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('sorts by rating, date, or title', () => {
      const store = createShowStore();
      store.replace([
        show(1, { title: 'Charlie', rating: 5, releaseDate: '2019-01-01' }),
        show(2, { title: 'Alpha', rating: 9, releaseDate: '2021-01-01' }),
        show(3, { title: 'Bravo', rating: 2, releaseDate: '2020-01-01' }),
      ]);

      expect(store.getPage({ sort: 'rating' }).shows.map((s) => s.id)).toEqual([
        2, 1, 3,
      ]);
      expect(store.getPage({ sort: 'date' }).shows.map((s) => s.id)).toEqual([
        2, 3, 1,
      ]);
      expect(store.getPage({ sort: 'title' }).shows.map((s) => s.id)).toEqual([
        2, 3, 1,
      ]);
    });

    it('falls back to insertion order for an invalid/absent sort', () => {
      const store = createShowStore();
      store.replace(shows);

      expect(
        store
          .getPage({ sort: 'not-a-real-option' as never })
          .shows.map((s) => s.id),
      ).toEqual([1, 2, 3, 4, 5]);
      expect(store.getPage({}).shows.map((s) => s.id)).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
