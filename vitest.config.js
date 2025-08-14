import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 30000,
    hookTimeout: 10000,
    // Migrado de environmentMatchGlobs deprecado a projects
    projects: [
      {
        name: 'frontend',
        testMatch: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
        environment: 'jsdom',
        exclude: [
          '**/src/test/**',
          '**/src/__tests__/**',
          '**/__tests__/**',
          '**/TagService.test.js',
          '**/FolderSelectionModal.test.jsx',
          '**/AIEmailModal.test.jsx',
          '**/Email*.test.*',
          '**/ComposeEmailModal.test.jsx',
          '**/Email*Modal.test.jsx',
          '**/Email*Manager.test.jsx',
          '**/EmailComposer.test.jsx',
          '**/EmailNotificationBadge.test.jsx',
          '**/EmailInbox.test.jsx',
          '**/EmailDetail.test.jsx',
          '**/SmartEmailComposer.test.jsx',
          '**/src/test/services/**',
          '**/cypress/**',
          '**/*.perf.test.*',
          '**/*.security.test.*',
          '**/*.a11y.test.*'
        ]
      },
    ],
    setupFiles: ['./src/test/setup.js'],
    exclude: [
      '**/node_modules/**', 
      '**/dist/**', 
      '**/test/**',
      '**/backend/**',
      '**/src/__tests__/**',
      '**/__tests__/**',
      '**/src/test/**',
      '**/TagService.test.js',
      '**/FolderSelectionModal.test.jsx',
      '**/AIEmailModal.test.jsx',
      '**/cypress/**',
      '**/*.perf.test.*',
      '**/*.security.test.*',
      '**/*.a11y.test.*'
    ],
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
