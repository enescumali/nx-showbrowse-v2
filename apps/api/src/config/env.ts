import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url)); // apps/api/src/config
const appRoot = join(currentDir, '..', '..'); // apps/api

// Loaded here (this module's own top-level code, before any process.env
// reads below) rather than in main.ts, since ESM hoists imports — a
// loadEnvFile() call in main.ts would run after other modules' top-level
// `process.env` reads, too late to matter. This file has no other local
// imports, so there's no hoisting-order hazard here.
try {
  process.loadEnvFile(join(appRoot, '.env'));
} catch {
  // No .env file present locally — fall back to process.env / defaults below.
}

export interface Env {
  port: number;
  tvMazeBaseUrl: string;
  adminToken: string;
  syncCronSchedule: string;
  requestsPerSecond: number;
  snapshotPath: string;
}

function readEnv(): Env {
  return {
    port: Number(process.env.PORT ?? 4300),
    tvMazeBaseUrl: process.env.TVMAZE_BASE_URL ?? 'https://api.tvmaze.com',
    adminToken: process.env.ADMIN_TOKEN ?? 'change-me',
    syncCronSchedule: process.env.SYNC_CRON_SCHEDULE ?? '0 3 * * *',
    requestsPerSecond: Number(process.env.REQUESTS_PER_SECOND ?? 1.8),
    snapshotPath:
      process.env.SNAPSHOT_PATH ?? join(appRoot, 'data', 'shows-snapshot.json'),
  };
}

export const env = readEnv();
