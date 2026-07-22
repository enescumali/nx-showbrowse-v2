import { describe, it, expect, vi } from 'vitest';
import { cors } from './cors';
import { mockReq, mockRes } from '../test-utils/mock-http';

describe('cors', () => {
  it('sets permissive CORS headers and calls next() for a normal request', () => {
    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    res.setHeader = vi.fn();
    const next = vi.fn();

    cors(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      '*',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      expect.stringContaining('GET'),
    );
    expect(next).toHaveBeenCalled();
  });

  it('short-circuits an OPTIONS preflight with 204 and does not call next()', () => {
    const req = mockReq({ method: 'OPTIONS' });
    const res = mockRes();
    res.setHeader = vi.fn();
    res.sendStatus = vi.fn();
    const next = vi.fn();

    cors(req, res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalled();
  });
});
