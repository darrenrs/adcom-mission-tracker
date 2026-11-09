import { expect, test, type Page } from '@playwright/test';

const PREFIX = 'adcom-mission-tracker:';

const missionButtons = (page: Page, prefix: 'Complete' | 'Undo completed') =>
  page.getByRole('button', { name: new RegExp(`^${prefix} mission`) });

const sectionHeadings = (page: Page) => page.getByRole('heading', { level: 2 }).allInnerTexts();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  (page as Page & { errors?: string[] }).errors = errors;
});

test.afterEach(async ({ page }) => {
  expect((page as Page & { errors?: string[] }).errors).toEqual([]);
});

test('Completed follows mission order, not the order they were completed in', async ({ page }) => {
  // A Motherland rank always has three current missions; the live event may not.
  await page.goto('?view=missions&mode=evergreen&rank=5');
  await expect(missionButtons(page, 'Complete').first()).toBeVisible();

  const missionName = (label: string | null) => label?.replace(/^.*mission:\s*/, '').trim();
  const names = async (prefix: 'Complete' | 'Undo completed') =>
    (await missionButtons(page, prefix).evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label') ?? button.textContent))).map(
      missionName
    );

  const current = await names('Complete');
  await missionButtons(page, 'Complete').nth(2).click();
  await expect(missionButtons(page, 'Undo completed')).toHaveCount(1);
  await missionButtons(page, 'Complete').first().click();
  await expect(missionButtons(page, 'Undo completed')).toHaveCount(2);

  expect(await names('Undo completed')).toEqual([current[0], current[2]]);
});

test('the mission page has no complete or undo button', async ({ page }) => {
  await page.goto('?view=missions&mode=lte');
  await page.getByRole('button', { name: /^Reward/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Reward', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^(Complete mission|Undo completion)$/ })).toHaveCount(0);
});

test('groups missions into Completed, Current and Upcoming', async ({ page }) => {
  await page.goto('?view=missions&mode=lte');
  await expect(missionButtons(page, 'Complete').first()).toBeVisible();

  const headings = await sectionHeadings(page);
  expect(headings.map((heading) => heading.split('\n')[0])).toEqual(['How to use', 'Completed', 'Current', 'Upcoming']);

  const upcoming = await page.getByRole('heading', { level: 3, name: /^Rank \d+$/ }).allInnerTexts();
  const ranks = upcoming.map((heading) => Number(heading.replace('Rank ', '')));
  expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  expect(ranks.length).toBeGreaterThan(1);
});

test('no line between the Upcoming heading and its first rank', async ({ page }) => {
  await page.goto('?view=missions&mode=lte');
  const groups = page.getByRole('region', { name: /^Upcoming in Rank \d+$/ });
  await expect(groups.first()).toBeVisible();
  expect(await groups.first().evaluate((node) => getComputedStyle(node).borderTopWidth)).toBe('0px');
  expect(await groups.nth(1).evaluate((node) => getComputedStyle(node).borderTopWidth)).toBe('1px');
});

test('Motherland Upcoming has no rank subsections', async ({ page }) => {
  await page.goto('?view=missions&rank=5');
  await expect(page.getByRole('heading', { level: 2, name: 'Upcoming' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: /^Rank \d+$/ })).toHaveCount(0);
});

test('advances an event from the top bar and groups Completed by rank', async ({ page }) => {
  await page.goto('?view=missions&mode=lte');
  await page.getByRole('button', { name: /^Rank \d+, .* Change rank$/ }).click();
  await page.getByLabel(/Rank to go to/).fill('3');
  await page.getByRole('button', { name: 'Go', exact: true }).click();

  await expect(page.getByRole('region', { name: 'Completed in Rank 1' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Completed in Rank 2' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Completed in Rank 3' })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2, name: 'Current' })).toBeInViewport();
});

test('How to use stays hidden once hidden', async ({ page }) => {
  await page.goto('?view=missions&mode=evergreen');
  await expect(page.getByText('Tap a')).toHaveCount(2);

  await page.getByRole('button', { name: 'How to use' }).click();
  await expect(page.getByText('Tap a')).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('button', { name: 'How to use' })).toBeVisible();
  await expect(page.getByText('Tap a')).toHaveCount(0);
});

test('a future mission asks before completing everything ahead of it', async ({ page }) => {
  await page.goto('?view=missions&mode=lte');
  const target = page.getByRole('button', { name: /^Upcoming mission/ }).nth(5);
  const name = ((await target.innerText()).split('\n').at(-1) ?? '').trim();

  await target.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(name);
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(missionButtons(page, 'Undo completed')).toHaveCount(0);

  await target.click();
  await page.getByRole('dialog').getByRole('button', { name: /^Mark \d+ missions? complete$/ }).click();
  await expect(missionButtons(page, 'Complete').filter({ hasText: name })).toHaveCount(1);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.reload();
  await expect(missionButtons(page, 'Complete').filter({ hasText: name })).toHaveCount(1);
});

test('a future mission still opens its calculator page', async ({ page }) => {
  await page.goto('?view=missions&mode=lte');
  await page.getByRole('region', { name: /^Upcoming in Rank/ }).first().getByRole('button', { name: /^Reward/ }).first().click();
  await expect(page).toHaveURL(/mission=/);
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
});

test('settings no longer offer icon or list view toggles', async ({ page }) => {
  await page.goto('?view=missions&mode=evergreen');
  await page.getByRole('button', { name: 'Settings' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByText('Theme', { exact: true }).first()).toBeVisible();
  await expect(sheet.getByText(/Mission icons|List view|Advance to rank/)).toHaveCount(0);
});

test('moves a mission to Completed and back, and keeps it across a reload', async ({ page }) => {
  await page.goto('?view=missions&mode=lte');
  const first = missionButtons(page, 'Complete').first();
  const label = (await first.getAttribute('aria-label')) ?? (await first.innerText());
  const name = label.replace(/^Complete mission:\s*/, '').trim();
  const order = await missionButtons(page, 'Complete').allInnerTexts();

  await first.click();
  await expect(missionButtons(page, 'Undo completed')).toHaveCount(1);
  await expect(missionButtons(page, 'Undo completed').first()).toContainText(name);

  await page.reload();
  await expect(missionButtons(page, 'Undo completed').first()).toContainText(name);

  await missionButtons(page, 'Undo completed').first().click();
  await expect(missionButtons(page, 'Undo completed')).toHaveCount(0);
  expect(await missionButtons(page, 'Complete').allInnerTexts()).toEqual(order);
});

test('continues a legacy save and copies it under the prefix', async ({ page }) => {
  await page.goto('?view=missions&mode=evergreen');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('CurrentMode', 'main');
    localStorage.setItem('main-CurrentRank', '5');
    localStorage.setItem('StyleConfig', 'dark');
    localStorage.setItem('playerId', 'KEEPME');
  });
  await page.goto('./');

  await expect(page.getByText('Rank 5', { exact: false }).first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const stored = await page.evaluate((prefix) => localStorage.getItem(`${prefix}main-CurrentRank`), PREFIX);
  expect(stored).toBe('5');
});

test('Reset All keeps data from other tools', async ({ page }) => {
  await page.goto('?view=missions&mode=evergreen');
  await expect(missionButtons(page, 'Complete').first()).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem('playerId', 'KEEPME');
    localStorage.setItem('gng-save', 'OTHER');
  });

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Reset all tracker data' }).click();
  await page.getByRole('button', { name: 'Yes, reset all tracker data' }).click();
  await expect(missionButtons(page, 'Complete').first()).toBeVisible();

  const keys = await page.evaluate(() => ({ player: localStorage.getItem('playerId'), gng: localStorage.getItem('gng-save') }));
  expect(keys).toEqual({ player: 'KEEPME', gng: 'OTHER' });
});

test('switches game and opens a rank from its link', async ({ page }) => {
  await page.goto('?view=missions&rank=5');
  await expect(page.getByRole('button', { name: /^Rank 5, / })).toBeVisible();

  await page.getByRole('button', { name: 'Switch game' }).click();
  await expect(page).toHaveTitle(/Ages/);
  await expect(page.locator('html')).toHaveAttribute('data-title', 'ages');
});

test('moves between Motherland ranks from the top bar', async ({ page }) => {
  await page.goto('?mode=evergreen&rank=5');
  const rank = page.getByRole('button', { name: /^Rank 5, / });
  await expect(rank).toContainText('Rank 5');
  await expect(rank).toContainText(/\d+\/\d+/);

  await rank.click();
  await page.getByRole('button', { name: 'Go forward to Rank 6' }).click();
  await expect(page.getByRole('button', { name: /^Rank 6, / })).toBeVisible();
  await expect(page).toHaveURL(/rank=6/);
  await expect(page).toHaveURL(/mode=evergreen/);

  await page.getByRole('button', { name: 'Go back to Rank 5' }).click();
  await expect(page.getByRole('button', { name: /^Rank 5, / })).toBeVisible();

  await page.getByLabel(/Rank to go to/).fill('9999');
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid rank');
});

test('events only move forward', async ({ page }) => {
  await page.goto('?view=missions&mode=lte');
  await page.getByRole('button', { name: /^Rank \d+, .* Change rank$/ }).click();
  await expect(page.getByText('All missions in earlier ranks will be marked as complete.')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Go back to Rank/ })).toHaveCount(0);
});

test('keeps links in Settings and only the fan content notice in the footer', async ({ page }) => {
  await page.goto('?view=missions&mode=evergreen');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link')).toHaveText(['Fan Content Policy']);

  await page.getByRole('button', { name: 'Settings' }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('link')).toHaveText(['GitHub', 'Privacy', 'Terms', 'Idle Game Tools']);
  await expect(sheet.getByText(/^Build \S{1,7}$/)).toBeVisible();
});

test('always shows the game and mode in the URL, and Back can change game', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/title=adcom/);
  await expect(page).toHaveURL(/mode=evergreen/);

  await page.getByRole('button', { name: 'Switch game' }).click();
  await expect(page).toHaveURL(/title=ages/);
  await expect(page).toHaveTitle(/Ages/);

  await page.goBack();
  await expect(page).toHaveURL(/title=adcom/);
  await expect(page).toHaveTitle(/Communist/);
});

test('opens a game and mode from the URL, and ignores old links', async ({ page }) => {
  await page.goto('?title=ages&mode=lte');
  await expect(page.locator('html')).toHaveAttribute('data-title', 'ages');
  await expect(page).toHaveURL(/mode=lte/);

  await page.goto('?title=adcom&mode=evergreen');
  await page.goto('?title=adcom&eventOverride=crusade-bal-1');
  await expect(page).toHaveURL(/mode=evergreen/);
  await expect(page.getByText('You are previewing this event')).toHaveCount(0);
});

test('previews an event by balance without saving progress', async ({ page }) => {
  await page.goto('?title=adcom&balance=crusade-bal-1');
  await expect(page.getByText('You are previewing this event')).toBeVisible();
  await expect(page).toHaveURL(/mode=lte/);
});

test('opens the mission page and returns with Back', async ({ page }) => {
  await page.goto('?view=missions&mode=evergreen');
  await page.getByRole('button', { name: /^Reward/ }).first().click();
  await expect(page).toHaveURL(/mission=/);

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).not.toHaveURL(/mission=/);
  await expect(missionButtons(page, 'Complete').first()).toBeVisible();
});

test('never scrolls sideways', async ({ page }) => {
  await page.goto('?view=missions&mode=lte');
  await expect(missionButtons(page, 'Complete').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
