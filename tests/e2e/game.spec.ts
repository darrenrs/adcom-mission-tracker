import { expect, test, type Page } from '@playwright/test';

const OPEN = '?title=adcom&mode=evergreen&rank=2';

const generators = (page: Page) => page.getByRole('list', { name: 'Generators' });

async function openGame(page: Page) {
  await page.goto(OPEN);
  await expect(page.getByRole('list', { name: 'Current missions' })).toBeVisible();
}

test('is the default tab and has no Gold box', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Game View' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('region', { name: 'Stocks' }).getByRole('textbox')).toHaveCount(2);
  await expect(page.getByText('RevRushes coming soon')).toBeVisible();
});

test('saves comrades and science, in plain numbers or game notation', async ({ page }) => {
  await openGame(page);
  const comrades = page.getByRole('region', { name: 'Stocks' }).getByRole('textbox').first();
  const science = page.getByRole('region', { name: 'Stocks' }).getByRole('textbox').last();
  await comrades.fill('21.15 M');
  await science.fill('307');
  await science.press('ArrowUp');
  await expect(science).toHaveValue('308');

  await page.reload();
  await expect(comrades).toHaveValue('21.15 M');
  await expect(science).toHaveValue('308');
});

test('completes a mission from its requirement and opens the calculator from its capsule', async ({ page }) => {
  await openGame(page);
  const cards = page.getByRole('list', { name: 'Current missions' }).getByRole('listitem');
  const first = cards.first().getByRole('button', { name: /^Complete mission/ });
  const label = (await first.textContent()) ?? '';
  await first.click();
  await expect(page.getByRole('button', { name: label })).toHaveCount(0);

  await cards.first().getByRole('button', { name: /^Reward/ }).click();
  await expect(page).toHaveURL(/mission=/);
});

test('shows each goal once, on the progress bar', async ({ page }) => {
  await openGame(page);
  const own = page.getByRole('listitem').filter({ hasText: 'Own Farmers' }).first();
  await expect(own.locator('[aria-hidden]', { hasText: 'Own Farmers' })).toHaveText('Own Farmers');
  await expect(own.getByRole('button', { name: /^Edit progress/ })).toContainText('0 /');
});

test('links an Own mission to its generator, in both directions', async ({ page }) => {
  await openGame(page);
  const own = page.getByRole('listitem').filter({ hasText: 'Own Farmers' }).first();
  const farmers = generators(page).getByRole('listitem').filter({ hasText: 'Farmers' });

  await farmers.getByRole('button', { name: 'Edit number of Farmers' }).click();
  await page.getByRole('textbox', { name: 'number of Farmers' }).fill('7');
  await page.getByRole('textbox', { name: 'number of Farmers' }).blur();
  await expect(own.getByRole('button', { name: /^Edit progress/ })).toContainText('7 /');

  await own.getByRole('button', { name: /^Edit progress/ }).click();
  await own.getByRole('textbox').fill('9');
  await own.getByRole('textbox').blur();
  await expect(farmers.getByRole('button', { name: 'Edit number of Farmers' })).toHaveText('9');
});

test('keeps typed progress per mission across a reload', async ({ page }) => {
  await page.goto('?title=adcom&mode=lte');
  const card = page.getByRole('list', { name: 'Current missions' }).getByRole('listitem').first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: /^Edit progress/ }).click();
  await card.getByRole('textbox').fill('1');
  await card.getByRole('textbox').blur();
  await expect(card.getByRole('button', { name: /^Edit progress/ })).toContainText('1 /');

  await page.reload();
  await expect(card.getByRole('button', { name: /^Edit progress/ })).toContainText('1 /');
});

test('switches industry, edits its amount, and remembers the choice', async ({ page }) => {
  await openGame(page);
  await page.getByRole('button', { name: 'Show Land' }).click();
  await expect(generators(page).getByRole('button', { name: 'Edit number of Roads' })).toBeVisible();

  await page.getByRole('button', { name: 'Edit Land amount' }).click();
  await page.getByRole('textbox', { name: 'Land amount' }).fill('5 K');
  await page.getByRole('textbox', { name: 'Land amount' }).blur();
  await expect(page.getByRole('button', { name: 'Edit Land amount' })).toHaveText('5,000');

  await page.reload();
  await expect(page.getByRole('button', { name: 'Edit Land amount' })).toHaveText('5,000');
});

test('has propaganda on by default and shares it with the calculator', async ({ page }) => {
  await openGame(page);
  const boost = page.getByRole('button', { name: 'Propaganda Boost' });
  await expect(boost).toHaveAttribute('aria-pressed', 'true');
  await boost.click();
  await expect(boost).toHaveAttribute('aria-pressed', 'false');

  await page.reload();
  await expect(boost).toHaveAttribute('aria-pressed', 'false');
});

test('generators have a label, a researcher button and details', async ({ page }) => {
  await openGame(page);
  const farmers = generators(page).getByRole('listitem').filter({ hasText: 'Farmers' });
  await expect(farmers.getByRole('button', { name: 'Farmers', exact: true })).toHaveCount(0);
  await expect(farmers.getByText('BUY')).toHaveCount(0);

  await farmers.getByRole('button', { name: 'Farmers details' }).click();
  await expect(farmers.getByRole('heading', { name: 'Costs' })).toBeVisible();
  await farmers.getByRole('button', { name: 'Farmers details' }).click();
  await expect(farmers.getByRole('heading', { name: 'Costs' })).toHaveCount(0);

  await farmers.getByRole('button', { name: /Open researcher$/ }).click();
  await expect(page).toHaveURL(/view=production/);
  await expect(page.getByRole('tab', { name: 'Researchers' })).toHaveAttribute('aria-selected', 'true');
  const level = page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ });
  await expect(level).toBeInViewport();
  await level.press('ArrowUp');

  await page.goBack();
  await expect(farmers.getByRole('button', { name: /level 1\. Open researcher$/ })).toBeVisible();
});

test('a generator bar runs at the cycle time once it is owned and automated', async ({ page }) => {
  await openGame(page);
  const farmers = generators(page).getByRole('listitem').filter({ hasText: 'Farmers' });
  const bar = farmers.getByTestId('generator-bar');
  await expect(bar).toHaveCount(0);

  await farmers.getByRole('button', { name: 'Edit number of Farmers' }).click();
  await page.getByRole('textbox', { name: 'number of Farmers' }).fill('3');
  await page.getByRole('textbox', { name: 'number of Farmers' }).blur();
  await expect(bar).toHaveCount(0);

  await farmers.getByRole('button', { name: /Open researcher$/ }).click();
  await page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ }).press('ArrowUp');
  await page.goBack();
  await expect(bar).toHaveCount(1);
  const running = await bar.evaluate((node) => getComputedStyle(node).animationName);
  expect(running).toBe('generator-cycle');

  // Numbers stay what was typed: only the bar moves.
  await expect(farmers.getByRole('button', { name: 'Edit number of Farmers' })).toHaveText('3');
});

test('never scrolls sideways', async ({ page }) => {
  await openGame(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
