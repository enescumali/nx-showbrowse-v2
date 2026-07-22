import { describe, it, expect, vi } from 'vitest';
import { createHealthRoute } from './health.route';
import { mockReq, mockRes } from '../test-utils/mock-http';
import type { IShowStore } from '../store/show-store';
import type { ISyncService, SyncStatus } from '../ingestion/sync-service';

function makeStore(
  overrides: Partial<ReturnType<IShowStore['getMeta']>> = {},
): IShowStore {
  return {
    replace: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    getByGenre: vi.fn().mockReturnValue([]),
    getGenreNames: vi.fn().mockReturnValue([]),
    getPage: vi.fn(),
    getMeta: vi.fn().mockReturnValue({
      ready: false,
      lastSyncedAt: null,
      totalShows: 0,
      highestShowId: 0,
      ...overrides,
    }),
  };
}

function makeSyncService(status: SyncStatus): ISyncService {
  return {
    getStatus: vi.fn().mockReturnValue(status),
    runFullCrawl: vi.fn(),
    runIncrementalSync: vi.fn(),
    refresh: vi.fn(),
  };
}

describe('createHealthRoute', () => {
  it('always responds 200, even when not ready', () => {
    const route = createHealthRoute(
      makeStore({ ready: false }),
      makeSyncService('crawling'),
    );
    const req = mockReq();
    const res = mockRes();

    route(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'ok',
      ready: false,
      lastSyncedAt: null,
      totalShows: 0,
      syncStatus: 'crawling',
    });
  });

  it('reports readiness and meta once populated', () => {
    const route = createHealthRoute(
      makeStore({
        ready: true,
        lastSyncedAt: '2026-01-01T00:00:00.000Z',
        totalShows: 42,
      }),
      makeSyncService('idle'),
    );
    const req = mockReq();
    const res = mockRes();

    route(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ready: true,
        totalShows: 42,
        syncStatus: 'idle',
      }),
    );
  });
});
