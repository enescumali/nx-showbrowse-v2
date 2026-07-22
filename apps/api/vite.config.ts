import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  plugins: [nxViteTsPaths()],
  test: {
    name: 'api',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
