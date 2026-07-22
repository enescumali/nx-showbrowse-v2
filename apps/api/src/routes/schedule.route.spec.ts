import { describe, it, expect, vi } from 'vitest';
import { createScheduleRoute } from './schedule.route';
import { mockReq, mockRes } from '../test-utils/mock-http';
import type { IShowService } from '@show-browse/shows';

function makeShowService(overrides: Partial<IShowService> = {}): IShowService {
  return {
    getShows: vi.fn().mockResolvedValue([]),
    getShowById: vi.fn(),
    searchShows: vi.fn().mockResolvedValue([]),
    getShowsByCountry: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('createScheduleRoute', () => {
  it('returns schedule results for the requested country', async () => {
    const getShowsByCountry = vi
      .fn()
      .mockResolvedValue([{ id: 1, title: 'X' }]);
    const route = createScheduleRoute(makeShowService({ getShowsByCountry }));
    const req = mockReq({ params: { country: 'US' } });
    const res = mockRes();

    await route(req, res);

    expect(getShowsByCountry).toHaveBeenCalledWith('US');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1, title: 'X' }]);
  });

  it('maps a service failure to a 502', async () => {
    const getShowsByCountry = vi
      .fn()
      .mockRejectedValue(new Error('network down'));
    const route = createScheduleRoute(makeShowService({ getShowsByCountry }));
    const req = mockReq({ params: { country: 'US' } });
    const res = mockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
  });
});
