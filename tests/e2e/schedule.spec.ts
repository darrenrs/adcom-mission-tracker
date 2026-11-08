import { expect, test, type Page } from '@playwright/test';
import { getCurrentLteInfo } from '../../client/src/domain/schedule';
import type { LteScheduleData } from '../../client/src/domain/types';

const DAY = 86_400_000;

/** The live AdCom event, worked out from the same schedule the page uses. */
async function liveEvent(page: Page) {
  const response = await page.request.get('/api/data/6bf5');
  const data = (await response.json()) as { LTESchedule: LteScheduleData };
  const live = getCurrentLteInfo(data.LTESchedule, Date.now(), false);
  if (!live) {
    throw new Error('No live AdCom event in the schedule');
  }
  return live;
}

function mockEvents(page: Page, events: object[]) {
  return page.route('**/api/leaderboard/events', (route) => route.fulfill({ json: { events, unavailable: false } }));
}

async function openMenu(page: Page) {
  await page.getByRole('button', { name: /^Mode: / }).click();
  return page.getByRole('menu');
}

test('the mode menu offers Schedule and All Events, and the Events tab is gone', async ({ page }) => {
  await page.goto('?title=adcom&mode=evergreen');
  const menu = await openMenu(page);
  await expect(menu.getByRole('menuitemradio', { name: 'Schedule' })).toBeVisible();
  await expect(menu.getByRole('menuitemradio', { name: 'All Events' })).toBeVisible();
  await expect(menu.getByRole('menuitemradio', { name: /Motherland/ })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Events', exact: true })).toHaveCount(0);
});

test('Schedule shows a calendar and an event list, and opens the chosen event', async ({ page }) => {
  await page.goto('?title=adcom&mode=evergreen');
  const menu = await openMenu(page);
  await menu.getByRole('menuitemradio', { name: 'Schedule' }).click();
  await expect(page).toHaveURL(/view=schedule/);
  await expect(page.getByRole('grid')).toBeVisible();

  const list = page.getByRole('list', { name: 'Events' });
  await expect(list.getByRole('button', { name: /^Open / }).first()).toBeVisible();
  await list.getByRole('button', { name: /^Open / }).last().click();
  await expect(page).toHaveURL(/mode=lte/);
  await expect(page).toHaveURL(/at=\d+/);
  await expect(page).not.toHaveURL(/view=schedule/);
});

test('Today returns the calendar to the current month and selects today', async ({ page }) => {
  await page.goto('?title=adcom&mode=evergreen&view=schedule');
  const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());
  const grid = page.getByRole('grid');
  await expect(grid).toBeVisible();
  await page.getByRole('button', { name: /Previous Month/ }).click();
  await page.getByRole('button', { name: /Previous Month/ }).click();
  await expect(grid).not.toHaveAccessibleName(new RegExp(month));
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(grid).toHaveAccessibleName(new RegExp(month));
  await expect(grid.getByRole('gridcell', { selected: true })).toHaveText(new RegExp(`^${new Date().getDate()}`));
});

test('Today sits between the month arrows, and is the only Today button', async ({ page }) => {
  await page.goto('?title=adcom&mode=evergreen&view=schedule');
  const today = page.getByRole('button', { name: 'Today', exact: true });
  await expect(today).toHaveCount(1);
  const previous = (await page.getByRole('button', { name: /Previous Month/ }).boundingBox())!;
  const next = (await page.getByRole('button', { name: /Next Month/ }).boundingBox())!;
  const box = (await today.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(previous.x + previous.width);
  expect(box.x + box.width).toBeLessThanOrEqual(next.x);
  expect(Math.abs(box.y + box.height / 2 - (previous.y + previous.height / 2))).toBeLessThanOrEqual(2);
});

test('the event list shows the year', async ({ page }) => {
  await page.goto('?title=adcom&mode=evergreen&view=schedule');
  const rows = page.getByRole('list', { name: 'Events' }).getByRole('listitem');
  await expect(rows.first()).toBeVisible();
  await expect(rows.first()).toContainText(/\b20\d\d\b/);
});

test.describe('desktop schedule', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop sizes');
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the calendar takes half the width, with room before the month name', async ({ page }) => {
    await page.goto('?title=adcom&mode=evergreen&view=schedule');
    const calendar = (await page.getByRole('grid').locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]').boundingBox())!;
    const list = (await page.getByRole('list', { name: 'Events' }).boundingBox())!;
    expect(Math.abs(calendar.width - list.width)).toBeLessThanOrEqual(1);
    expect(await page.locator('.rdp-month_caption').evaluate((node) => parseFloat(getComputedStyle(node).paddingLeft))).toBeGreaterThanOrEqual(12);
  });
});

test('rows carry two dots for the schedule file and the leaderboard API', async ({ page }) => {
  const live = await liveEvent(page);
  await mockEvents(page, [
    {
      guid: '55555555-5555-5555-5555-555555555555',
      theme: live.ThemeId,
      start: new Date(live.StartTimeMillis).toISOString(),
      end: new Date(live.EndTimeMillis).toISOString(),
      status: 'active',
      live: true,
      players: 10,
      divisionSize: 25
    },
    { guid: '66666666-6666-6666-6666-666666666666', theme: 'zzapionly', start: new Date(Date.now() + 400 * DAY).toISOString(), end: new Date(Date.now() + 404 * DAY).toISOString(), status: 'active', live: false, players: 0, divisionSize: 25 }
  ]);
  await page.goto('?title=adcom&mode=evergreen&view=schedule');
  const list = page.getByRole('list', { name: 'Events' });
  const apiOnly = list.getByRole('listitem').filter({ hasText: 'Zzapionly' });
  await expect(apiOnly.getByRole('img', { name: 'Schedule file: not found' })).toBeVisible();
  await expect(apiOnly.getByRole('img', { name: 'Leaderboard API: found' })).toBeVisible();
  const matched = list.getByRole('listitem').filter({ has: page.getByRole('img', { name: 'Leaderboard API: found' }) }).filter({ has: page.getByRole('img', { name: 'Schedule file: found' }) });
  await expect(matched).toHaveCount(1);
  await expect(list.getByRole('img', { name: 'Leaderboard API: not found' }).first()).toBeVisible();
});

test('the API dot is grey when the leaderboard API is unavailable', async ({ page }) => {
  await page.route('**/api/leaderboard/events', (route) => route.fulfill({ json: { events: [], unavailable: true } }));
  await page.goto('?title=adcom&mode=evergreen&view=schedule');
  const list = page.getByRole('list', { name: 'Events' });
  await expect(list.getByRole('img', { name: 'Schedule file: found' }).first()).toBeVisible();
  await expect(list.getByRole('img', { name: 'Leaderboard API: unknown' }).first()).toBeVisible();
  await expect(list.getByRole('img', { name: /Leaderboard API: (found|not found)/ })).toHaveCount(0);
});

test('Open goes to the exact start of the event, and picking a row highlights its dates', async ({ page }) => {
  const start = Date.now() + 30 * DAY;
  const end = start + 4 * DAY;
  await mockEvents(page, [
    { guid: '77777777-7777-7777-7777-777777777777', theme: 'zzapionly', start: new Date(start).toISOString(), end: new Date(end).toISOString(), status: 'active', live: false, players: 0, divisionSize: 25 }
  ]);
  await page.goto('?title=adcom&mode=evergreen&view=schedule');
  const row = page.getByRole('list', { name: 'Events' }).getByRole('listitem').filter({ hasText: 'Zzapionly' });
  await row.locator('[aria-pressed]').click();
  await expect(page.getByRole('grid').locator('.bg-accent-soft').first()).toBeVisible();
  await row.getByRole('button', { name: /^Open / }).click();
  await expect(page).toHaveURL(new RegExp(`at=${start}(&|$)`));
});

test('All Events lists balances alphabetically by name and previews the chosen one', async ({ page }) => {
  await page.goto('?title=adcom&mode=evergreen&view=events');
  await expect(page.getByRole('button', { name: /crusade-bal-1/ })).toBeVisible();
  const names = await page.getByRole('list', { name: 'All events' }).getByRole('button').evaluateAll((buttons) =>
    buttons.map((button) => button.querySelector('span span')?.textContent ?? '')
  );
  expect(names.length).toBeGreaterThan(10);
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

  await page.getByRole('button', { name: /crusade-bal-1/ }).click();
  await expect(page).toHaveURL(/balance=crusade-bal-1/);
  await expect(page.getByText('You are previewing this event')).toBeVisible();
});

test('an event known only to the leaderboard API appears in the schedule', async ({ page }) => {
  const start = Date.now() + 400 * DAY;
  await mockEvents(page, [
    { guid: '11111111-1111-1111-1111-111111111111', theme: 'zzapionly', start: new Date(start).toISOString(), end: new Date(start + 4 * DAY).toISOString(), status: 'active', live: false, players: 0, divisionSize: 25 }
  ]);
  await page.goto('?title=adcom&mode=evergreen&view=schedule');
  await expect(page.getByRole('list', { name: 'Events' }).getByText('Zzapionly', { exact: false })).toBeVisible();
});

test('the Leaderboard tab shows only for a started AdCom event the leaderboard API knows', async ({ page }) => {
  const live = await liveEvent(page);
  const event = {
    guid: '22222222-2222-2222-2222-222222222222',
    theme: live.ThemeId,
    start: new Date(live.StartTimeMillis).toISOString(),
    end: new Date(live.EndTimeMillis).toISOString(),
    status: 'active',
    live: true,
    players: 1000,
    divisionSize: 25
  };
  await mockEvents(page, [event]);

  await page.goto('?title=adcom&mode=evergreen');
  await expect(page.getByRole('button', { name: 'Game View' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Leaderboard' })).toHaveCount(0);

  await page.goto('?title=adcom&mode=lte');
  await expect(page.getByRole('button', { name: 'Leaderboard' })).toBeVisible();

  await page.goto('?title=ages&mode=lte');
  await expect(page.locator('html')).toHaveAttribute('data-title', 'ages');
  await expect(page.getByRole('button', { name: 'Leaderboard' })).toHaveCount(0);
});

test('no Leaderboard tab before the event starts', async ({ page }) => {
  const start = Date.now() + 3 * DAY;
  await mockEvents(page, [
    { guid: '33333333-3333-3333-3333-333333333333', theme: 'zzfuture', start: new Date(start).toISOString(), end: new Date(start + 4 * DAY).toISOString(), status: 'active', live: false, players: 0, divisionSize: 25 }
  ]);
  await page.goto(`?title=adcom&mode=lte&at=${start + 3_600_000}`);
  await expect(page.getByRole('button', { name: 'Game View' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Leaderboard' })).toHaveCount(0);
});
