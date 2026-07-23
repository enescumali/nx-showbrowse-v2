import { describe, it, expect, vi } from 'vitest';
import { createSearchRoute } from './search.route';
import { mockReq, mockRes } from '../test-utils/mock-http';
import type { IShowService } from '../tvmaze/service';

function makeShowService(overrides: Partial<IShowService> = {}): IShowService {
  return {
    getShowById: vi.fn(),
    searchShows: vi.fn().mockResolvedValue([]),
    getShowsByCountry: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('createSearchRoute', () => {
  it('400s when q is missing or blank', async () => {
    const route = createSearchRoute(makeShowService());
    const res = mockRes();

    await route(mockReq({ query: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);

    const res2 = mockRes();
    await route(mockReq({ query: { q: '   ' } }), res2);
    expect(res2.status).toHaveBeenCalledWith(400);
  });

  it('returns search results on success', async () => {
    const searchShows = vi.fn().mockResolvedValue([{ id: 1, title: 'Batman' }]);
    const route = createSearchRoute(makeShowService({ searchShows }));
    const req = mockReq({ query: { q: 'batman' } });
    const res = mockRes();

    await route(req, res);

    expect(searchShows).toHaveBeenCalledWith('batman');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1, title: 'Batman' }]);
  });

  it('maps a service failure to a 502', async () => {
    const searchShows = vi.fn().mockRejectedValue(new Error('network down'));
    const route = createSearchRoute(makeShowService({ searchShows }));
    const req = mockReq({ query: { q: 'batman' } });
    const res = mockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
  });
});
