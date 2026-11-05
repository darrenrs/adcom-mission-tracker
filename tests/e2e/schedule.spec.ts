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
  await expect(list.getByRole('button').first()).toBeVisible();
  await list.getByRole('button').last().click();
  await expect(page).toHaveURL(/mode=lte/);
  await expect(page).toHaveURL(/at=\d+/);
  await expect(page).not.toHaveURL(/view=schedule/);
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
