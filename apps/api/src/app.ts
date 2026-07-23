import express, { type Express } from 'express';
import type { IShowService } from './tvmaze/service';
import type { IShowStore } from './store/show-store';
import type { ISyncService } from './ingestion/sync-service';
import { createReadinessGate } from './middleware/readiness';
import { cors } from './middleware/cors';
import { createHealthRoute } from './routes/health.route';
import {
  createGenresRoute,
  createGenreNamesRoute,
} from './routes/genres.route';
import {
  createListShowsRoute,
  createShowDetailRoute,
} from './routes/shows.route';
import { createSearchRoute } from './routes/search.route';
import { createScheduleRoute } from './routes/schedule.route';
import { createAdminRefreshRoute } from './routes/admin.route';

export interface AppDeps {
  store: IShowStore;
  syncService: ISyncService;
  /** Live TVMaze proxy for detail/search/schedule — not the bulk-crawled data. */
  tvMazeShowService: IShowService;
  adminToken: string;
}

export function createApp(deps: AppDeps): Express {
  const { store, syncService, tvMazeShowService, adminToken } = deps;
  const app = express();
  app.use(cors);

  const readinessGate = createReadinessGate(store);

  app.get('/health', createHealthRoute(store, syncService));
  app.get('/genres', readinessGate, createGenresRoute(store));
  app.get('/genres/names', readinessGate, createGenreNamesRoute(store));
  app.get('/shows', readinessGate, createListShowsRoute(store));
  app.get('/shows/:id', createShowDetailRoute(tvMazeShowService));
  app.get('/search', createSearchRoute(tvMazeShowService));
  app.get('/schedule/:country', createScheduleRoute(tvMazeShowService));
  app.post('/admin/refresh', createAdminRefreshRoute(syncService, adminToken));

  return app;
}
