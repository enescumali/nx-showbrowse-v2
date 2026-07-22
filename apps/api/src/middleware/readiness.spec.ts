import { describe, it, expect, vi } from 'vitest';
import { createReadinessGate } from './readiness';
import { mockReq, mockRes } from '../test-utils/mock-http';
import type { IShowStore } from '../store/show-store';

function makeStore(ready: boolean): IShowStore {
  return {
    replace: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    getByGenre: vi.fn().mockReturnValue([]),
    getGenreNames: vi.fn().mockReturnValue([]),
    getPage: vi.fn(),
    getMeta: vi.fn().mockReturnValue({
      ready,
      lastSyncedAt: null,
      totalShows: 0,
      highestShowId: 0,
    }),
  };
}

describe('createReadinessGate', () => {
  it('calls next() when the store is ready', () => {
    const gate = createReadinessGate(makeStore(true));
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    gate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responds 503 without calling next() when the store is not ready', () => {
    const gate = createReadinessGate(makeStore(false));
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    gate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });
});
