import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@show-browse/shows': resolve(__dirname, 'packages/shows/src'),
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'apps/web-e2e/**'],
  },
});
