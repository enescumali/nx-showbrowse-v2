import { describe, it, expect, vi } from 'vitest';
import { createListShowsRoute, createShowDetailRoute } from './shows.route';
import { mockReq, mockRes } from '../test-utils/mock-http';
import type { IShowStore } from '../store/show-store';
import type { IShowService } from '../tvmaze/service';

function makeStore(overrides: Partial<IShowStore> = {}): IShowStore {
  return {
    replace: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    getByGenre: vi.fn().mockReturnValue([]),
    getGenreNames: vi.fn().mockReturnValue([]),
    getPage: vi.fn().mockReturnValue({
      shows: [],
      page: 0,
      pageSize: 250,
      totalShows: 0,
      totalPages: 0,
    }),
    getMeta: vi.fn().mockReturnValue({
      ready: true,
      lastSyncedAt: null,
      totalShows: 0,
      highestShowId: 0,
    }),
    ...overrides,
  };
}

describe('createListShowsRoute', () => {
  it('passes parsed query params through to store.getPage', () => {
    const getPage = vi.fn().mockReturnValue({
      shows: [],
      page: 2,
      pageSize: 50,
      totalShows: 0,
      totalPages: 0,
    });
    const route = createListShowsRoute(makeStore({ getPage }));
    const req = mockReq({
      query: { page: '2', pageSize: '50', genre: 'Drama', sort: 'rating' },
    });
    const res = mockRes();

    route(req, res);

    expect(getPage).toHaveBeenCalledWith({
      page: 2,
      pageSize: 50,
      genre: 'Drama',
      sort: 'rating',
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('omits page/pageSize/genre/sort from the query when not provided', () => {
    const getPage = vi.fn().mockReturnValue({
      shows: [],
      page: 0,
      pageSize: 250,
      totalShows: 0,
      totalPages: 0,
    });
    const route = createListShowsRoute(makeStore({ getPage }));
    const req = mockReq({ query: {} });
    const res = mockRes();

    route(req, res);

    expect(getPage).toHaveBeenCalledWith({
      page: undefined,
      pageSize: undefined,
      genre: undefined,
      sort: undefined,
    });
  });

  it('400s on a non-integer page', () => {
    const route = createListShowsRoute(makeStore());
    const req = mockReq({ query: { page: 'abc' } });
    const res = mockRes();

    route(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400s on a negative page', () => {
    const route = createListShowsRoute(makeStore());
    const req = mockReq({ query: { page: '-1' } });
    const res = mockRes();

    route(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400s on a non-integer pageSize', () => {
    const route = createListShowsRoute(makeStore());
    const req = mockReq({ query: { pageSize: 'lots' } });
    const res = mockRes();

    route(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

function makeShowService(overrides: Partial<IShowService> = {}): IShowService {
  return {
    getShowById: vi.fn(),
    searchShows: vi.fn().mockResolvedValue([]),
    getShowsByCountry: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('createShowDetailRoute', () => {
  it('returns the show on success', async () => {
    const getShowById = vi.fn().mockResolvedValue({ id: 1, title: 'X' });
    const route = createShowDetailRoute(makeShowService({ getShowById }));
    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await route(req, res);

    expect(getShowById).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: 1, title: 'X' });
  });

  it('maps a [404] service error to a 404 response', async () => {
    const getShowById = vi.fn().mockRejectedValue(new Error('[404] Not Found'));
    const route = createShowDetailRoute(makeShowService({ getShowById }));
    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('maps any other error to a 502', async () => {
    const getShowById = vi.fn().mockRejectedValue(new Error('network down'));
    const route = createShowDetailRoute(makeShowService({ getShowById }));
    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
  });

  it('400s on a missing id without calling the service', async () => {
    const getShowById = vi.fn();
    const route = createShowDetailRoute(makeShowService({ getShowById }));
    const req = mockReq({ params: {} });
    const res = mockRes();

    await route(req, res);

    expect(getShowById).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
