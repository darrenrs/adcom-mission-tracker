import { expect, test } from '@playwright/test';

test('Settings says the leaderboard is not available with the dev stub', async ({ page }) => {
  await page.goto('?title=adcom&mode=evergreen');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByText('Leaderboard: not available')).toBeVisible();
});

test('Settings says the leaderboard is connected, with the event count', async ({ page }) => {
  const start = Date.now() + 400 * 86_400_000;
  await page.route('**/api/leaderboard/events', (route) =>
    route.fulfill({
      json: {
        events: [{ guid: '88888888-8888-8888-8888-888888888888', theme: 'zzapionly', start: new Date(start).toISOString(), end: new Date(start + 4 * 86_400_000).toISOString(), status: 'active', live: false, players: 0, divisionSize: 25 }],
        unavailable: false
      }
    })
  );
  await page.goto('?title=adcom&mode=evergreen');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByText('Leaderboard: connected (1 event)')).toBeVisible();
});

test('Settings says Ages does not use the leaderboard', async ({ page }) => {
  await page.goto('?title=ages&mode=evergreen');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByText('Leaderboard: not used in this game')).toBeVisible();
});
