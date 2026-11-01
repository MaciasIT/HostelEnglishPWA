import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    exclude: ['**/e2e/**', '**/node_modules/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(new URL('.', import.meta.url).pathname, 'src'),
    },
  },
});
