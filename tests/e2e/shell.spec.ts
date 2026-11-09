import { expect, test, type Page } from '@playwright/test';
import { getCurrentLteInfo } from '../../client/src/domain/schedule';
import type { LteScheduleData } from '../../client/src/domain/types';

/** A live AdCom event the leaderboard API knows, so the late-loading Leaderboard tab appears as a fifth tab. */
async function withLeaderboardTab(page: Page) {
  const data = (await (await page.request.get('/api/data/6bf5')).json()) as { LTESchedule: LteScheduleData };
  const live = getCurrentLteInfo(data.LTESchedule, Date.now(), false);
  if (!live) {
    throw new Error('No live AdCom event');
  }
  const event = {
    guid: '55555555-5555-5555-5555-555555555555',
    theme: live.ThemeId,
    start: new Date(live.StartTimeMillis).toISOString(),
    end: new Date(live.EndTimeMillis).toISOString(),
    status: 'active',
    live: true,
    players: 1000,
    divisionSize: 25
  };
  await page.route('**/api/leaderboard/events', (route) => route.fulfill({ json: { events: [event], unavailable: false } }));
}

test.describe('main tabs', () => {
  test.skip(({ isMobile }) => isMobile, 'Phones use the bottom bar');

  // 640 and 1279 are the edges of the row under the header; 1024 used to scroll; 1280 puts the tabs in the header.
  for (const width of [640, 1024, 1279, 1280]) {
    test(`never scroll sideways at ${width}px, with all five tabs`, async ({ page }) => {
      await withLeaderboardTab(page);
      await page.setViewportSize({ width, height: 800 });
      await page.goto('?title=adcom&mode=lte');
      const tabs = page.getByRole('navigation', { name: 'Main' }).filter({ visible: true });
      await expect(tabs.getByRole('button', { name: 'Leaderboard' })).toBeVisible();
      await expect(tabs.getByRole('button')).toHaveCount(5);

      const fit = await tabs.evaluate((nav) => ({
        nav: nav.scrollWidth <= nav.clientWidth,
        // No tab's label is cut off inside its button either.
        buttons: [...nav.querySelectorAll('button')].every((button) => button.scrollWidth <= button.clientWidth),
        inHeader: Boolean(nav.closest('header'))
      }));
      expect(fit).toEqual({ nav: true, buttons: true, inHeader: width >= 1280 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
});

test('fields are 14px on every device and never condensed', async ({ page }) => {
  await page.goto('?title=adcom&mode=lte');
  const fields = page.getByRole('region', { name: 'Stocks' }).getByRole('textbox');
  await expect(fields.first()).toBeVisible();
  const styles = await fields.evaluateAll((nodes) => nodes.map((node) => `${getComputedStyle(node).fontSize} ${getComputedStyle(node).fontStretch}`));
  expect(new Set(styles)).toEqual(new Set(['14px 100%']));
});
