import { defineConfig, devices } from '@playwright/test';

// Needs the API on 3001 and adcom-assets on 3002, for example the local Docker containers.
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
    reuseExistingServer: true
  }
});
