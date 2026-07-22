import type { Request, Response, NextFunction } from 'express';

/** apps/web (a different origin/port) calls this API from the browser —
 * without these headers the browser blocks every response before
 * JavaScript ever sees it (curl/server-to-server calls are unaffected,
 * which is why this wasn't caught until a real browser exercised it).
 * No cookies/credentials are involved, so a permissive origin is fine. */
export function cors(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}
