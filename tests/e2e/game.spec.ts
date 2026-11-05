import { expect, test, type Page } from '@playwright/test';

const OPEN = '?title=adcom&mode=evergreen&rank=2';

const generators = (page: Page) => page.getByRole('list', { name: 'Generators' });
const stocks = (page: Page) => page.getByRole('region', { name: 'Stocks' });
const resourcesBox = (page: Page) => page.locator('section[aria-labelledby="resources-heading"] > div');
const PROGRESS_NOTE = 'Generator progress bars do not update values; only manual updating is supported.';

/** Raises Ringo Ringlet's card, the Farmers automator, through the card popover. */
async function raiseFarmersCard(page: Page, times = 1) {
  const farmers = generators(page).getByRole('listitem').filter({ hasText: 'Farmers' });
  await farmers.getByRole('button', { name: /Show card$/ }).click();
  for (let i = 0; i < times; i++) {
    await page.getByRole('button', { name: 'Raise level' }).click();
  }
  await page.keyboard.press('Escape');
}

async function openGame(page: Page) {
  await page.goto(OPEN);
  await expect(page.getByRole('list', { name: 'Current missions' })).toBeVisible();
}

test('is the default tab with comrades, science and gold boxes', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Game View' })).toHaveAttribute('aria-current', 'page');
  await expect(stocks(page).getByRole('textbox')).toHaveCount(3);
  await expect(page.getByText('RevRushes coming soon')).toBeVisible();
});

test('saves comrades and science, in plain numbers or game notation', async ({ page }) => {
  await openGame(page);
  const comrades = stocks(page).getByRole('textbox').first();
  const science = stocks(page).getByRole('textbox').nth(1);
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

  await farmers.getByRole('textbox', { name: 'number of Farmers' }).fill('7');
  await expect(own.getByRole('button', { name: /^Edit progress/ })).toContainText('7 /');

  await own.getByRole('button', { name: /^Edit progress/ }).click();
  await own.getByRole('textbox').fill('9');
  await own.getByRole('textbox').blur();
  await expect(farmers.getByRole('textbox', { name: 'number of Farmers' })).toHaveValue('9');
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
  await expect(generators(page).getByRole('textbox', { name: 'number of Roads' })).toBeVisible();

  const amount = page.getByRole('textbox', { name: 'Land amount' });
  await amount.fill('5 K');
  await amount.blur();
  await expect(amount).toHaveValue('5 K');

  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Land amount' })).toHaveValue('5,000');
});

test('has propaganda on by default and shares it with the calculator', async ({ page }) => {
  await openGame(page);
  const boost = page.getByRole('button', { name: 'Propaganda Boost' });
  await expect(boost).toHaveAttribute('aria-pressed', 'true');
  await expect(boost).toHaveText('x2');
  await boost.click();
  await expect(boost).toHaveAttribute('aria-pressed', 'false');
  await expect(boost).toHaveText('Boost');

  await page.reload();
  await expect(boost).toHaveAttribute('aria-pressed', 'false');
});

test('generators have a label, a card popover and details', async ({ page }) => {
  await openGame(page);
  const farmers = generators(page).getByRole('listitem').filter({ hasText: 'Farmers' });
  await expect(farmers.getByRole('button', { name: /^Farmers - Tier/ })).toHaveCount(0);
  await expect(farmers.getByText('BUY')).toHaveCount(0);

  await farmers.getByRole('button', { name: 'Farmers details' }).click();
  await expect(farmers.getByRole('heading', { name: 'Costs' })).toBeVisible();
  await farmers.getByRole('button', { name: 'Farmers details' }).click();
  await expect(farmers.getByRole('heading', { name: 'Costs' })).toHaveCount(0);
});

test('titles each generator with its tier, the resource maker first', async ({ page }) => {
  await openGame(page);
  const rows = generators(page).getByRole('listitem');
  await expect(rows.first()).toContainText('Farmers - Tier 1');
  await expect(rows.nth(1)).toContainText('- Tier 2');
  await expect(rows.nth(2)).toContainText('- Tier 3');
});

test('the card popover shows the card and changes the level in place', async ({ page }) => {
  await openGame(page);
  const farmers = generators(page).getByRole('listitem').filter({ hasText: 'Farmers' });
  const card = farmers.getByRole('button', { name: /level 0\. Show card$/ });
  await card.click();
  const popover = page.getByRole('dialog');
  await expect(popover).toContainText('Ringo Ringlet');
  await expect(popover.getByTestId('card-level')).toHaveText('Level 0');
  await expect(popover.getByRole('button', { name: 'Lower level' })).toBeDisabled();

  await popover.getByRole('button', { name: 'Raise level' }).click();
  await expect(popover.getByTestId('card-level')).toHaveText('Level 1');
  await expect(popover).toContainText('x');
  await popover.getByRole('button', { name: 'Lower level' }).click();
  await expect(popover.getByTestId('card-level')).toHaveText('Level 0');
  await expect(page).not.toHaveURL(/view=production/);
});

test('a generator bar runs at the cycle time once it is owned and automated', async ({ page }) => {
  await openGame(page);
  const farmers = generators(page).getByRole('listitem').filter({ hasText: 'Farmers' });
  const bar = farmers.getByTestId('generator-bar');
  await expect(bar).toHaveCount(0);

  const count = farmers.getByRole('textbox', { name: 'number of Farmers' });
  await count.fill('3');
  await expect(bar).toHaveCount(0);

  await raiseFarmersCard(page);
  await expect(bar).toHaveCount(1);
  const running = await bar.evaluate((node) => getComputedStyle(node).animationName);
  expect(running).toBe('generator-cycle');

  // Numbers stay what was typed: only the bar moves.
  await expect(count).toHaveValue('3');
});

test('tapping an idle generator runs one cycle, and a level change ends it', async ({ page }) => {
  await openGame(page);
  const farmers = generators(page).getByRole('listitem').filter({ hasText: 'Farmers' });
  const bar = farmers.getByTestId('generator-bar');
  await expect(bar).toHaveCount(0);

  await farmers.getByRole('button', { name: 'Run Farmers once' }).click();
  await expect(bar).toHaveCount(1);
  expect(await bar.evaluate((node) => getComputedStyle(node).animationIterationCount)).toBe('1');

  await raiseFarmersCard(page);
  await expect(bar).toHaveCount(0);
});

test('an automated generator ignores a tap on its picture', async ({ page }) => {
  await openGame(page);
  const farmers = generators(page).getByRole('listitem').filter({ hasText: 'Farmers' });
  await farmers.getByRole('textbox', { name: 'number of Farmers' }).fill('2');
  await raiseFarmersCard(page);
  const bar = farmers.getByTestId('generator-bar');
  await expect(bar).toHaveCount(1);
  await farmers.getByRole('button', { name: 'Run Farmers once' }).click();
  await expect(bar).toHaveCount(1);
  expect(await bar.evaluate((node) => getComputedStyle(node).animationIterationCount)).toBe('infinite');
});

test('the info panel lists costs, outputs, generates, modifiers and the automator', async ({ page }) => {
  await openGame(page);
  const farmers = generators(page).getByRole('listitem').filter({ hasText: 'Farmers' });
  await farmers.getByRole('button', { name: 'Farmers details' }).click();
  for (const name of ['Costs', 'Outputs', 'Generates', 'Modifiers', 'Automator']) {
    await expect(farmers.getByRole('heading', { name })).toBeVisible();
  }
  await expect(farmers).toContainText('Base per cycle');
  await expect(farmers).toContainText('Average per cycle, with crits');
  await expect(farmers).toContainText('Base per second');
  await expect(farmers).toContainText('Average per second, with crits');
  for (const label of ['Power', 'Discount', 'Speed', 'Crit chance', 'Crit power']) {
    await expect(farmers.getByText(label, { exact: true })).toHaveCount(1);
  }
  await expect(farmers).toContainText('Ringo Ringlet');
  await expect(farmers).toContainText(/x\S+ \/ x\S+ \/ x\S+/);
  await expect(farmers).not.toContainText('Unlocks at Rank');
  await expect(farmers).not.toContainText('First guaranteed');
});

test('shows the generator notes only when they apply', async ({ page }) => {
  await openGame(page);
  const progress = page.getByText(PROGRESS_NOTE);
  await expect(progress).toHaveCount(0);
  await expect(page.getByText(/Each generators' visible output is the base value/)).toBeVisible();
  await expect(page.getByRole('img', { name: 'crits' })).toBeVisible();

  await raiseFarmersCard(page);
  await expect(progress).toBeVisible();
});

test('shows the name, description and dates of an event', async ({ page }) => {
  await page.goto('?title=adcom&mode=lte');
  const header = page.locator('header').filter({ has: page.getByRole('heading', { level: 2 }) });
  const name = header.getByRole('heading', { level: 2 });
  await expect(name).not.toBeEmpty();
  expect(await name.evaluate((node) => getComputedStyle(node).textTransform)).toBe('uppercase');
  await expect(header.locator('p').first()).not.toBeEmpty();
  await expect(header).toContainText(/\d{4} - .*\d{4}/);
  await expect(header.getByTestId('game-banner')).toBeVisible();
  expect(await header.getByTestId('game-banner').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
});

test('shows Motherland as the name, with the banner and no description or dates', async ({ page }) => {
  await openGame(page);
  const header = page.locator('header').filter({ has: page.getByRole('heading', { level: 2 }) });
  await expect(header.getByRole('heading', { level: 2 })).toHaveText('Motherland');
  await expect(header.locator('p')).toHaveCount(0);
  await expect(header.getByTestId('game-banner')).toBeVisible();
});

test('shows comrades per second, and the comrade icon opens the Trades menu', async ({ page }) => {
  await openGame(page);
  await expect(stocks(page).getByLabel('Comrades per second')).toHaveText(/\/sec$/);
  await stocks(page).getByRole('button', { name: 'Open Trades' }).click();
  await expect(page).toHaveURL(/view=production/);
  await expect(page).toHaveURL(/tab=trades/);
});

test('saves gold across a reload', async ({ page }) => {
  await openGame(page);
  const gold = stocks(page).getByRole('textbox', { name: 'Gold' });
  await gold.fill('1234');
  await page.reload();
  await expect(stocks(page).getByRole('textbox', { name: 'Gold' })).toHaveValue('1,234');
  const saved = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((name) => name.endsWith('main-FormValues')) ?? '';
    return JSON.parse(localStorage.getItem(key) ?? '{}').Counts?.gold?.gold;
  });
  expect(saved).toBe(1234);
});

test('centres a single mission card', async ({ page }) => {
  await page.goto('?title=ages&mode=evergreen&rank=1');
  const list = page.getByRole('list', { name: 'Current missions' });
  const cards = list.getByRole('listitem');
  await expect(cards.first()).toBeVisible();
  const cardCount = await cards.count();
  const container = (await list.boundingBox())!;
  const first = (await cards.first().boundingBox())!;
  const last = (await cards.last().boundingBox())!;
  // The group of cards sits in the middle whatever its size.
  const left = first.x - container.x;
  const right = container.x + container.width - (last.x + last.width);
  expect(Math.abs(left - right)).toBeLessThanOrEqual(2);
  expect(cardCount).toBeGreaterThan(0);
});

test('mission cards have even borders, a text cursor on progress and pointers on buttons', async ({ page }) => {
  await openGame(page);
  const card = page.getByRole('list', { name: 'Current missions' }).getByRole('listitem').first();
  const widths = await card.evaluate((node) => {
    const style = getComputedStyle(node);
    return [style.borderLeftWidth, style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth];
  });
  expect(new Set(widths).size).toBe(1);
  const cursor = (locator: ReturnType<Page['locator']>) => locator.evaluate((node) => getComputedStyle(node).cursor);
  expect(await cursor(card.getByRole('button', { name: /^Edit progress/ }))).toBe('text');
  expect(await cursor(card.getByRole('button', { name: /^Complete mission/ }))).toBe('pointer');
  expect(await cursor(stocks(page).getByRole('textbox').first())).toBe('text');
  expect(await cursor(page.getByRole('button', { name: 'Show Land' }))).toBe('pointer');
});

test('puts the Resources heading outside its container, with always visible inputs', async ({ page }) => {
  await openGame(page);
  const heading = page.getByRole('heading', { name: 'Resources' });
  await expect(heading).toBeVisible();
  await expect(resourcesBox(page).getByRole('heading')).toHaveCount(0);
  const headingBox = (await heading.boundingBox())!;
  const container = (await resourcesBox(page).boundingBox())!;
  expect(headingBox.y + headingBox.height).toBeLessThanOrEqual(container.y);

  await expect(resourcesBox(page).getByRole('button', { name: /^Show / })).toHaveCount(5);
  await expect(resourcesBox(page).getByRole('textbox', { name: /amount$/ })).toBeVisible();
  await expect(generators(page).getByRole('textbox', { name: 'number of Farmers' })).toBeVisible();
});

test('keeps completions, rank and researcher levels from a save made before this work', async ({ page }) => {
  await page.goto('?view=production&mode=evergreen&rank=2');
  await page.getByRole('tab', { name: 'Researchers' }).click();
  await page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ }).fill('2');

  // Rebuild the save under the old unprefixed keys, as the live site wrote them.
  await page.evaluate(() => {
    const prefix = 'adcom-mission-tracker:';
    const form = localStorage.getItem(`${prefix}main-FormValues`) as string;
    localStorage.clear();
    localStorage.setItem('CurrentMode', 'main');
    localStorage.setItem('main-CurrentRank', '2');
    localStorage.setItem('main-Completed', 'M0004');
    localStorage.setItem('main-FormValues', form);
  });

  await page.goto('?view=missions');
  await expect(page.getByRole('button', { name: /^Rank 2, 1 of/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Undo completed mission/ })).toHaveCount(1);

  await page.goto('?view=production');
  await page.getByRole('tab', { name: 'Researchers' }).click();
  await expect(page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ })).toHaveValue('2');
});

test('fits five industries with the selected amount readable at the narrowest phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('?title=ages&mode=evergreen');
  const amount = page.getByRole('textbox', { name: /amount$/ });
  await expect(amount).toBeVisible();
  expect((await amount.boundingBox())?.width).toBeGreaterThan(40);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const boxes = await stocks(page).getByRole('textbox').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
  expect(boxes).toHaveLength(3);
  for (const width of boxes) {
    expect(width).toBeGreaterThan(40);
  }
});

test('never scrolls sideways', async ({ page }) => {
  await openGame(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
