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
    // Migrado de environmentMatchGlobs deprecado a projects
    projects: [
      {
        name: 'frontend',
        testMatch: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
        environment: 'jsdom'
      },
      {
        name: 'backend', 
        testMatch: ['backend/**/*.{test,spec}.{js,ts}'],
        environment: 'node'
      }
    ],
    setupFiles: ['./src/test/setup.js', './backend/vitest.setup.js'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'backend/**/*.test.{js,ts}', 'backend/**/*.spec.{js,ts}'
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/AdvancedEmailWorkflows.test.jsx', '**/EmailWorkflows.test.jsx'],
    coverage: {
      provider: 'v8', // Cambiar a v8 para mejor rendimiento y menos cuelgues
      reporter: ['text', 'json'],
      reportsDirectory: './coverage',
      all: false, // Deshabilitar para evitar cuelgues
      exclude: ['**/node_modules/**', '**/dist/**', '**/test/**', '**/cypress/**']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
