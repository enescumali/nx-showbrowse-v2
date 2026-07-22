import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: 'packages/shows/vite.config.ts',
    test: {
      name: 'shows',
      include: ['src/**/*.spec.ts'],
      root: './packages/shows',
    },
  },
  {
    extends: 'apps/web/vite.config.mts',
    test: {
      name: 'web',
      include: ['src/**/*.spec.ts'],
      root: './apps/web',
    },
  },
  {
    extends: 'apps/api/vite.config.ts',
    test: {
      name: 'api',
      include: ['src/**/*.spec.ts'],
      root: './apps/api',
    },
  },
]);
