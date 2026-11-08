import { defineConfig, devices } from '@playwright/test';

// Needs the local Docker containers: the tracker API on the PORT set in .env, and adcom-assets on 3002.
// LEADERBOARD_STUB answers the leaderboard event list with "none", so tests never see live events;
// specs that need leaderboard data fake those routes themselves.
// PW_PORT lets two test runs share the machine.
const PORT = Number(process.env['PW_PORT'] ?? 5199);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    env: { LEADERBOARD_STUB: '1' },
    reuseExistingServer: true
  }
});
