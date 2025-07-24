import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-app.png'],
      manifest: {
        name: 'Lovenda Email',
        short_name: 'Lovenda',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1d4ed8',
        icons: [
          {
            src: '/logo-app.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-app.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })],
  server: {
    host: '0.0.0.0', // Escuchar en todas las interfaces de red
    // Puerto de desarrollo
    port: 5173,
    strictPort: true,
    // Proxy para API backend
    proxy: {
      '/api': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        secure: false,
        // Conserva el path original (/api/…)
        rewrite: (path) => path
      }
    }
  },
  preview: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.windsurf/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}'
      ],
      all: true,
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
});
