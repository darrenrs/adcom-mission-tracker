import { expect, test, type Page } from '@playwright/test';
import { getCurrentLteInfo } from '../../client/src/domain/schedule';
import { bigNum } from '../../client/src/domain/format';
import { TITLES } from '../../client/src/domain/titles';
import type { LteScheduleData } from '../../client/src/domain/types';

const GUID = '44444444-4444-4444-4444-444444444444';

async function setUp(page: Page, player: (id: string) => { status: number; json?: object }) {
  const response = await page.request.get('/api/data/6bf5');
  const data = (await response.json()) as { LTESchedule: LteScheduleData };
  const live = getCurrentLteInfo(data.LTESchedule, Date.now(), false);
  if (!live) {
    throw new Error('No live AdCom event');
  }
  const event = {
    guid: GUID,
    theme: live.ThemeId,
    start: new Date(live.StartTimeMillis).toISOString(),
    end: new Date(live.EndTimeMillis).toISOString(),
    status: 'active',
    live: true,
    players: 100_000,
    divisionSize: 25
  };
  await page.route('**/api/leaderboard/events', (route) => route.fulfill({ json: { events: [event], unavailable: false } }));
  await page.route(`**/api/leaderboard/${GUID}/player/*`, (route) => {
    const id = route.request().url().split('/').pop() as string;
    const { status, json } = player(id);
    return route.fulfill({ status, json: json ?? { error: 'player-not-found' } });
  });
  return { live, event };
}

function result(theme: string, globalPosition = 2000, globalCount = 100_000) {
  return {
    event: { guid: GUID, theme, start: '', end: '', status: 'active' },
    player: {
      playerId: 'ABC123',
      ordinal: 1,
      segmentId: `${theme}SPEND_2_TO_100:20`,
      shortboardCategory: 'SPEND_2_TO_100',
      root: 'global',
      trophies: 45000,
      joined: '2026-11-03T16:05:00Z',
      updated: '2026-11-04T10:00:00Z',
      globalPosition,
      globalCount,
      divisionPosition: 1,
      divisionCount: 3
    },
    global: {
      count: 100_000,
      brackets: [
        { rank: 1, fraction: null, score: 90000 },
        { rank: 5, fraction: null, score: 80000 },
        { rank: 25, fraction: null, score: 70000 },
        { rank: 100, fraction: null, score: 60000 },
        { rank: null, fraction: 0.01, score: 50000 },
        { rank: null, fraction: 0.05, score: 40000 },
        { rank: null, fraction: 0.1, score: 30000 },
        { rank: null, fraction: 0.25, score: 20000 },
        { rank: null, fraction: 0.5, score: 10000 },
        { rank: null, fraction: 0.75, score: 500 }
      ]
    },
    division: {
      count: 3,
      entries: [
        { ordinal: 0, position: 0, globalPosition: 50, trophies: 46000, isPlayer: false },
        { ordinal: 1, position: 1, globalPosition: 2000, trophies: 45000, isPlayer: true },
        { ordinal: 2, position: 2, globalPosition: 9000, trophies: 1000, isPlayer: false }
      ]
    },
    cachedAt: '2026-11-04T10:00:00Z'
  };
}

test('looks up a PlayFab ID, remembers it, and shows the results', async ({ page }) => {
  const { live } = await setUp(page, (id) => (id === 'ABC123' ? { status: 200, json: result(live.ThemeId) } : { status: 404 }));
  await page.goto('?title=adcom&mode=lte');
  await page.getByRole('button', { name: 'Leaderboard' }).click();
  await expect(page).toHaveURL(/view=leaderboard/);

  const field = page.getByLabel('PlayFab ID');
  await field.fill('abc123');
  await expect(field).toHaveValue('ABC123');
  await page.getByRole('button', { name: 'Show results' }).click();

  await expect(page.getByText('45,000', { exact: true }).first()).toHaveClass(/text-4xl/);
  await expect(page.getByText('2,001 / 100,000')).toBeVisible();
  await expect(page.getByText('Top 2.00%')).toBeVisible();
  await expect(page.getByText('$2–$99 lifetime spent')).toBeVisible();
  await expect(page.getByText(/Shortboard 20/)).toBeVisible();
  await expect(page.getByText(/Joined .* Last updated/)).toBeVisible();

  const global = page.getByRole('region', { name: 'Global leaderboard' });
  await expect(global.getByRole('row', { name: /Top 5%/ })).toHaveAttribute('aria-current', 'true');
  await expect(global.getByText('▲ 5,010 trophies needed to move up ▲')).toBeVisible();
  await expect(global.getByLabel(/^Your place: /)).toHaveText(/2%/);
  await expect(global.getByRole('row', { name: /Champion/ }).getByRole('img').first()).toBeVisible();

  const shortboard = page.getByRole('region', { name: 'Shortboard' });
  await expect(shortboard.getByRole('row', { name: /Super Soldier I/ })).toHaveAttribute('aria-current', 'true');
  await expect(shortboard.getByText('▲ 1,010 trophies needed to move up ▲')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('PlayFab ID')).toHaveValue('ABC123');
  await expect(page.getByText('2,001 / 100,000')).toBeVisible();
});

test('copies the old leaderboard site\'s saved ID', async ({ page }) => {
  const { live } = await setUp(page, () => ({ status: 200, json: result('x') }));
  await page.goto('?title=adcom&mode=lte');
  await page.evaluate(() => {
    localStorage.removeItem('adcom-mission-tracker:PlayerId');
    localStorage.setItem('playerId', 'FEED42');
  });
  void live;
  await page.goto('?title=adcom&mode=lte&view=leaderboard');
  await expect(page.getByLabel('PlayFab ID')).toHaveValue('FEED42');
});

test('says when an ID has no results', async ({ page }) => {
  await setUp(page, () => ({ status: 404 }));
  await page.goto('?title=adcom&mode=lte&view=leaderboard');
  await page.getByLabel('PlayFab ID').fill('DEAD00');
  await page.getByRole('button', { name: 'Show results' }).click();
  await expect(page.getByText(/No results for this PlayFab ID/)).toBeVisible();
});

test('the Leaderboard page explains itself when the event has no leaderboard', async ({ page }) => {
  await page.goto('?title=adcom&mode=evergreen&view=leaderboard');
  await expect(page.getByText(/There is no leaderboard for this event yet/)).toBeVisible();
});

test('never scrolls the page sideways', async ({ page }) => {
  const { live } = await setUp(page, () => ({ status: 200, json: result('x') }));
  void live;
  await page.goto('?title=adcom&mode=lte&view=leaderboard');
  await page.getByLabel('PlayFab ID').fill('ABC123');
  await page.getByRole('button', { name: 'Show results' }).click();
  await expect(page.getByText('2,001 / 100,000')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('writes places above a million in the game\'s number format', async ({ page }) => {
  const { live } = await setUp(page, () => ({ status: 200, json: result(live.ThemeId, 2_500_000, 5_000_000) }));
  await page.goto('?title=adcom&mode=lte&view=leaderboard');
  await page.getByLabel('PlayFab ID').fill('ABC123');
  await page.getByRole('button', { name: 'Show results' }).click();
  const { powers } = TITLES.adcom;
  const position = `${bigNum(2_500_001, powers)} / ${bigNum(5_000_000, powers)}`;
  expect(position).not.toContain('2,500,001');
  await expect(page.getByText(position)).toBeVisible();
});
