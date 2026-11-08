import { expect, test, type Page } from '@playwright/test';
import { getCurrentLteInfo } from '../../client/src/domain/schedule';
import { bigNum } from '../../client/src/domain/format';
import { TITLES } from '../../client/src/domain/titles';
import type { LteScheduleData } from '../../client/src/domain/types';

const GUID = '44444444-4444-4444-4444-444444444444';
const AVATAR = 'AV0001';
const STATS = { players: 100_000, rankDistribution: [50_000, 30_000, 15_000, 4000, 900, 100], rankAverage: 2.1, trophySum: 2_500_000_000, boardFetchedAt: '2026-11-04T10:00:00Z' };

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
  await page.route(`**/api/leaderboard/${GUID}/stats?*`, (route) => route.fulfill({ json: STATS }));
  return { live, event };
}

function result(theme: string, globalPosition = 2000, globalCount = 100_000) {
  return {
    event: { guid: GUID, theme, start: '', end: '', status: 'active' },
    player: {
      playerId: 'ABC123',
      ordinal: 1,
      avatarId: AVATAR,
      lteRank: 12,
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
        { ordinal: 0, avatarId: AVATAR, lteRank: 3, position: 0, globalPosition: 50, trophies: 46000, isPlayer: false },
        { ordinal: 1, avatarId: AVATAR, lteRank: 12, position: 1, globalPosition: 2000, trophies: 45000, isPlayer: true },
        { ordinal: 2, avatarId: null, lteRank: null, position: 2, globalPosition: 9000, trophies: 1000, isPlayer: false }
      ]
    },
    fetchedAt: '2026-11-04T10:00:30Z',
    boardFetchedAt: '2026-11-04T10:00:00Z'
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
  await expect(page.getByText(/^Joined: /)).toBeVisible();
  await expect(page.getByText(/^Last updated: /)).toBeVisible();

  const global = page.getByRole('region', { name: 'Global Leaderboard' });
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

test('Show results asks again for the same ID and shows when the results were fetched', async ({ page }) => {
  let lookups = 0;
  const { live } = await setUp(page, () => {
    lookups += 1;
    const json = result(live.ThemeId);
    json.fetchedAt = new Date(Date.UTC(2026, 10, 4, 10, 0, 30 + lookups)).toISOString();
    return { status: 200, json };
  });
  await page.addInitScript(() => localStorage.setItem('adcom-mission-tracker:PlayerId', 'ABC123'));
  await page.goto('?title=adcom&mode=lte&view=leaderboard');

  const time = (seconds: number) => new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' }).format(new Date(Date.UTC(2026, 10, 4, 10, 0, seconds)));
  await expect(page.getByText(`Fetched at ${time(31)} · global positions as of ${time(0)}`)).toBeVisible();
  expect(lookups).toBe(1);

  await page.getByRole('button', { name: 'Show results' }).click();
  await expect(page.getByText(`Fetched at ${time(32)}`, { exact: false })).toBeVisible();
  expect(lookups).toBe(2);
  // The results stay on screen while they are fetched again.
  await expect(page.getByText('45,000', { exact: true }).first()).toBeVisible();
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

async function showResults(page: Page, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('?title=adcom&mode=lte&view=leaderboard');
  await page.getByLabel('PlayFab ID').fill('ABC123');
  await page.getByRole('button', { name: 'Show results' }).click();
  await expect(page.getByText('2,001 / 100,000')).toBeVisible();
}

async function box(locator: ReturnType<Page['locator']>) {
  const rect = await locator.boundingBox();
  if (!rect) {
    throw new Error('Not on screen');
  }
  return rect;
}

test('lays out the cards in order, stacked on phones', async ({ page }) => {
  await setUp(page, () => ({ status: 200, json: result('x') }));
  const titles = ['Super Soldier I', 'Global Position', 'Shortboard', 'Trophies', 'Player Rank', 'Joined: '];
  const find = (title: string) => (title === 'Super Soldier I' ? page.getByRole('heading', { name: title }) : page.getByText(title, { exact: false }).first());

  await showResults(page, 1280);
  const wide = [];
  for (const title of titles) {
    wide.push(await box(find(title)));
  }
  // The picture card is on the left and the rest follow in reading order on the right.
  expect(wide[0]?.x).toBeLessThan(wide[1]?.x ?? 0);
  expect(wide[1]?.y).toBeCloseTo(wide[2]?.y ?? 0, 0);
  expect(wide[3]?.y).toBeGreaterThan(wide[1]?.y ?? 0);
  expect(wide[3]?.y).toBeCloseTo(wide[4]?.y ?? 0, 0);
  expect(wide[5]?.y).toBeGreaterThan(wide[3]?.y ?? 0);
  await expect(page.getByText('12', { exact: true }).first()).toBeVisible();

  await page.setViewportSize({ width: 390, height: 900 });
  const narrow = [];
  for (const title of titles) {
    narrow.push(await box(find(title)));
  }
  for (let index = 1; index < narrow.length; index++) {
    expect(narrow[index]?.y).toBeGreaterThan(narrow[index - 1]?.y ?? 0);
  }
});

test('puts the global and Shortboard tables side by side without an inner scroll', async ({ page }) => {
  await setUp(page, () => ({ status: 200, json: result('x') }));
  await showResults(page, 1280);
  const global = page.getByRole('region', { name: 'Global Leaderboard' });
  const shortboard = page.getByRole('region', { name: 'Shortboard' });
  const first = await box(global);
  const second = await box(shortboard);
  expect(first.y).toBeCloseTo(second.y, 0);
  expect(second.x).toBeGreaterThan(first.x + first.width - 1);

  const clipped = await page.getByTestId('global-table').evaluate((element) => element.scrollHeight - element.clientHeight);
  expect(clipped).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 800, height: 900 });
  expect((await box(shortboard)).y).toBeGreaterThan((await box(global)).y);
});

test('keeps the position marker inside the player\'s bracket row and the table', async ({ page }) => {
  await setUp(page, () => ({ status: 200, json: result('x') }));
  for (const width of [1280, 390]) {
    await showResults(page, width);
    const global = page.getByRole('region', { name: 'Global Leaderboard' });
    const marker = global.getByLabel(/^Your place: /);
    await expect(marker).toBeVisible();
    // The marker is placed after measuring, so wait for it to leave the top.
    await expect.poll(async () => (await box(marker)).y).toBeGreaterThan((await box(global.getByRole('row').first())).y + 40);
    const row = await box(global.getByRole('row', { name: /Top 5%/ }));
    const spot = await box(marker);
    const centre = spot.y + spot.height / 2;
    expect(centre).toBeGreaterThanOrEqual(row.y);
    expect(centre).toBeLessThanOrEqual(row.y + row.height);
    const table = await box(page.getByTestId('global-table'));
    expect(spot.y + spot.height).toBeLessThanOrEqual(table.y + table.height + 0.5);
    expect(spot.x + spot.width).toBeLessThanOrEqual(table.x + 0.5);
  }
});

test('highlights a hovered Shortboard row and shows avatars', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Touch screens have no hover');
  await setUp(page, () => ({ status: 200, json: result('x') }));
  await showResults(page, 1280);
  const shortboard = page.getByRole('region', { name: 'Shortboard' });
  const row = shortboard.getByRole('row', { name: /Supreme Worker C/ });
  const background = () => row.evaluate((element) => getComputedStyle(element).backgroundColor);
  const before = await background();
  await row.hover();
  await expect.poll(background).not.toBe(before);

  const pictures = shortboard.locator('img[src*="avatars/"]');
  await expect(pictures).toHaveCount(2);
  await expect.poll(() => pictures.first().evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  // The entry without an avatar keeps an empty slot of the same size.
  const slot = shortboard.getByRole('row', { name: /Glorious Revolutionist/ }).locator('td').nth(1).locator('span');
  expect((await box(slot)).width).toBeGreaterThan(0);
  const card = page.locator('img[src*="avatars/"]').first();
  await expect.poll(() => card.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
});

test('draws the rank chart with the cumulative trophies', async ({ page }) => {
  await setUp(page, () => ({ status: 200, json: result('x') }));
  await showResults(page, 1280);
  await expect(page.getByRole('heading', { name: 'Rank Distribution' })).toBeVisible();
  const { powers } = TITLES.adcom;
  await expect(page.getByText(`Cumulative trophies: ${bigNum(STATS.trophySum, powers)}`)).toBeVisible();
  expect(bigNum(STATS.trophySum, powers)).not.toContain('2,500,000,000');
  const canvas = page.getByRole('img', { name: 'Number of players at each rank' });
  await expect(canvas).toBeVisible();
  expect((await box(canvas)).height).toBeGreaterThan(100);
});
