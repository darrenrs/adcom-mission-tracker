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

test('shows sections in the legacy order', async ({ page }) => {
  await page.goto('?mode=event');
  await expect(missionButtons(page, 'Complete').first()).toBeVisible();

  const headings = await sectionHeadings(page);
  expect(headings[0]).toContain('Completed');
  expect(headings[1]).toContain('Current');
  expect(headings[2]).toContain('Rank 1');
});

test('moves a mission to Completed and back, and keeps it across a reload', async ({ page }) => {
  await page.goto('?mode=event');
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
  await page.goto('?mode=main');
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
  await page.goto('?mode=main');
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

test('switches game and keeps old links working', async ({ page }) => {
  await page.goto('?rank=5');
  await expect(page.getByRole('heading', { level: 2, name: /Rank 5/ })).toBeVisible();

  await page.getByRole('button', { name: 'Switch game' }).click();
  await expect(page).toHaveTitle(/Ages/);
  await expect(page.locator('html')).toHaveAttribute('data-title', 'ages');
});

test('opens the mission page and returns with Back', async ({ page }) => {
  await page.goto('?mode=main');
  await page.getByRole('button', { name: /^Reward and calculator for/ }).first().click();
  await expect(page).toHaveURL(/mission=/);

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).not.toHaveURL(/mission=/);
  await expect(missionButtons(page, 'Complete').first()).toBeVisible();
});

test('never scrolls sideways', async ({ page }) => {
  await page.goto('?mode=event');
  await expect(missionButtons(page, 'Complete').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
