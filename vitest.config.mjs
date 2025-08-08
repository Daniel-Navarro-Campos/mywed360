import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['src/**', 'jsdom'],
      ['backend/**', 'node']
    ],
    setupFiles: ['./src/test/setup.js', './backend/vitest.setup.js'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'backend/**/*.test.{js,ts}', 'backend/**/*.spec.{js,ts}'
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'istanbul', // provider por defecto
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      all: true,
      exclude: ['**/node_modules/**', '**/dist/**', '**/test/**']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
