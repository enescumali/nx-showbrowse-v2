import { vi } from 'vitest';
import type { Request, Response } from 'express';

export function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    query: {},
    params: {},
    header: vi.fn().mockReturnValue(undefined),
    ...overrides,
  } as unknown as Request;
}

export interface MockRes extends Response {
  statusCode: number;
  jsonBody: unknown;
}

export function mockRes(): MockRes {
  const res = { statusCode: 200, jsonBody: undefined } as MockRes;
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  }) as unknown as MockRes['status'];
  res.json = vi.fn().mockImplementation((body: unknown) => {
    res.jsonBody = body;
    return res;
  }) as unknown as MockRes['json'];
  return res;
}
