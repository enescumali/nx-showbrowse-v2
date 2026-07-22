import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';

const API_PORT = 4300;
const WEB_PORT = 4200;
const SNAPSHOT_PATH = resolve(__dirname, 'fixtures/shows-snapshot.json');

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // Always a fresh instance warm-started from the committed fixture —
      // never reused, so a stray already-running dev apps/api (real
      // crawled data) can't silently make assertions non-deterministic.
      // A port conflict with a manually-running instance fails loudly
      // instead.
      command: `npx tsx --tsconfig ${resolve(__dirname, '../api/tsconfig.json')} ${resolve(__dirname, '../api/src/main.ts')}`,
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        PORT: String(API_PORT),
        SNAPSHOT_PATH,
      },
    },
    {
      command: `npx vite --config ${resolve(__dirname, '../web/vite.config.mts')} --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_API_BASE_URL: `http://localhost:${API_PORT}`,
      },
    },
  ],
});
