import { describe, it, expect, vi } from 'vitest';
import { createAdminRefreshRoute } from './admin.route';
import { mockReq, mockRes } from '../test-utils/mock-http';
import type { ISyncService } from '../ingestion/sync-service';

function makeSyncService(overrides: Partial<ISyncService> = {}): ISyncService {
  return {
    getStatus: vi.fn().mockReturnValue('idle'),
    runFullCrawl: vi.fn(),
    runIncrementalSync: vi.fn(),
    refresh: vi.fn().mockReturnValue({ started: true, status: 'crawling' }),
    ...overrides,
  };
}

describe('createAdminRefreshRoute', () => {
  it('401s when the admin token header is missing or wrong', () => {
    const route = createAdminRefreshRoute(makeSyncService(), 'secret');

    const res1 = mockRes();
    route(mockReq({ header: vi.fn().mockReturnValue(undefined) }), res1);
    expect(res1.status).toHaveBeenCalledWith(401);

    const res2 = mockRes();
    route(mockReq({ header: vi.fn().mockReturnValue('wrong') }), res2);
    expect(res2.status).toHaveBeenCalledWith(401);
  });

  it('202s and triggers refresh() when the token matches and a run was started', () => {
    const refresh = vi.fn().mockReturnValue({ started: true, status: 'crawling' });
    const route = createAdminRefreshRoute(makeSyncService({ refresh }), 'secret');
    const req = mockReq({ header: vi.fn().mockReturnValue('secret') });
    const res = mockRes();

    route(req, res);

    expect(refresh).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ started: true, status: 'crawling' });
  });

  it('409s when a refresh is already in flight', () => {
    const refresh = vi.fn().mockReturnValue({ started: false, status: 'crawling' });
    const route = createAdminRefreshRoute(makeSyncService({ refresh }), 'secret');
    const req = mockReq({ header: vi.fn().mockReturnValue('secret') });
    const res = mockRes();

    route(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});
