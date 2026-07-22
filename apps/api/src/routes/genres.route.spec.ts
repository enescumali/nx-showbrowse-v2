import { describe, it, expect, vi } from 'vitest';
import { createGenresRoute, createGenreNamesRoute } from './genres.route';
import { mockReq, mockRes } from '../test-utils/mock-http';
import type { IShowStore } from '../store/show-store';
import type { Show } from '@show-browse/shows';

function show(id: number, genres: string[]): Show {
  return {
    id,
    title: `Show ${id}`,
    showType: '',
    overview: '',
    posterUrl: '',
    backdropUrl: '',
    releaseDate: '',
    rating: 5,
    genres,
  };
}

function makeStore(overrides: Partial<IShowStore> = {}): IShowStore {
  return {
    replace: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    getByGenre: vi.fn().mockReturnValue([]),
    getGenreNames: vi.fn().mockReturnValue([]),
    getPage: vi.fn(),
    getMeta: vi.fn(),
    ...overrides,
  };
}

describe('createGenresRoute', () => {
  it('shapes getByGenre() into { genre, shows } objects, defaulting the limit to 20', () => {
    const getByGenre = vi.fn().mockReturnValue([
      ['Drama', [show(1, ['Drama'])]],
      ['Comedy', [show(2, ['Comedy'])]],
    ]);
    const route = createGenresRoute(makeStore({ getByGenre }));
    const req = mockReq();
    const res = mockRes();

    route(req, res);

    expect(getByGenre).toHaveBeenCalledWith(20);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { genre: 'Drama', shows: [show(1, ['Drama'])] },
      { genre: 'Comedy', shows: [show(2, ['Comedy'])] },
    ]);
  });

  it('passes an explicit limit through to getByGenre()', () => {
    const getByGenre = vi.fn().mockReturnValue([]);
    const route = createGenresRoute(makeStore({ getByGenre }));
    const req = mockReq({ query: { limit: '5' } });
    const res = mockRes();

    route(req, res);

    expect(getByGenre).toHaveBeenCalledWith(5);
  });

  it('400s on a non-integer or non-positive limit', () => {
    const route = createGenresRoute(makeStore());

    const res1 = mockRes();
    route(mockReq({ query: { limit: 'abc' } }), res1);
    expect(res1.status).toHaveBeenCalledWith(400);

    const res2 = mockRes();
    route(mockReq({ query: { limit: '0' } }), res2);
    expect(res2.status).toHaveBeenCalledWith(400);
  });
});

describe('createGenreNamesRoute', () => {
  it('returns store.getGenreNames() as-is', () => {
    const getGenreNames = vi.fn().mockReturnValue([
      { genre: 'Drama', count: 10 },
      { genre: 'Comedy', count: 4 },
    ]);
    const route = createGenreNamesRoute(makeStore({ getGenreNames }));
    const req = mockReq();
    const res = mockRes();

    route(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { genre: 'Drama', count: 10 },
      { genre: 'Comedy', count: 4 },
    ]);
  });
});
