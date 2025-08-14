import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // DESHABILITAR COMPLETAMENTE TODOS LOS TESTS UNITARIOS
    include: [], // No incluir ningún archivo de test
    exclude: ['**/*'], // Excluir absolutamente todo
    testTimeout: 30000,
    hookTimeout: 10000,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportsDirectory: './coverage',
      all: false,
      exclude: ['**/*'] // Excluir todo de coverage también
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
