import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Express (or the local Docker app) serves the API and runtime config on 3001 during development.
const BACKEND = process.env.TRACKER_BACKEND ?? 'http://localhost:3001';

export default defineConfig({
  root: 'client',
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'client/src') }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': BACKEND,
      '/js/runtime-config.js': BACKEND
    }
  }
});
