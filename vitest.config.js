import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 10000,
    environmentMatchGlobs: [
      ['src/**', 'jsdom'],
      ['backend/**', 'node']
    ],
    setupFiles: ['./src/test/setup.js', './backend/vitest.setup.js'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'backend/**/*.test.{js,ts}', 'backend/**/*.spec.{js,ts}'
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/AdvancedEmailWorkflows.test.jsx'],
    coverage: {
      provider: 'istanbul', // provider por defecto, genera coverage-final.json compatible
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage', // asegura ./coverage/coverage-final.json
      all: true, // genera cobertura para todos los archivos fuente
      exclude: ['**/node_modules/**', '**/dist/**', '**/test/**']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
