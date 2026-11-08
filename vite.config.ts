import { readFileSync } from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { parse } from 'dotenv';
import { defineConfig, type Plugin } from 'vite';

/** Answers the leaderboard event list with "none". Only the browser tests turn this on, so they never see live events. */
function leaderboardStub(): Plugin {
  return {
    name: 'leaderboard-stub',
    configureServer(server) {
      server.middlewares.use('/api/leaderboard/events', (_request, response) => {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ events: [], unavailable: true }));
      });
    }
  };
}

/**
 * The PORT the local Docker app listens on, read from the .env file itself. A PORT in the shell is
 * ignored on purpose: tools that launch Vite often set it to Vite's own port, which would loop.
 */
function dockerAppPort(): string {
  try {
    return parse(readFileSync(path.join(import.meta.dirname, '.env')))['PORT'] || '3000';
  } catch {
    return '3000'; // No .env, as in the Docker build. app.js defaults to 3000 too.
  }
}

export default defineConfig(() => {
  // The local Docker app serves the API and runtime config.
  const backend = `http://localhost:${dockerAppPort()}`;
  const stubLeaderboard = process.env['LEADERBOARD_STUB'] === '1';

  return {
    root: 'client',
    base: './',
    plugins: [react(), tailwindcss(), ...(stubLeaderboard ? [leaderboardStub()] : [])],
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
        '/api': backend,
        '/js/runtime-config.js': backend
      }
    }
  };
});
