import { expect, test, type Page } from '@playwright/test';

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

const card = (page: Page, name: string) =>
  page.getByRole('listitem').filter({ has: page.getByRole('textbox', { name: new RegExp(`^Level of ${name}`) }) });

test('?tab= opens that tab, and a researcher link opens Researchers', async ({ page }) => {
  await page.goto('?view=production&tab=trades');
  await expect(page.getByRole('tab', { name: 'Trades' })).toHaveAttribute('aria-selected', 'true');
  await page.goto('?view=production&tab=researchers');
  await expect(page.getByRole('tab', { name: 'Researchers' })).toHaveAttribute('aria-selected', 'true');
  await page.goto('?view=production&researcher=RS0001');
  await expect(page.getByRole('tab', { name: 'Researchers' })).toHaveAttribute('aria-selected', 'true');
  await page.goto('?view=production&tab=nonsense');
  await expect(page.getByRole('tab', { name: 'Generators' })).toHaveAttribute('aria-selected', 'true');
});

test('each industry sits in its own bordered container', async ({ page }) => {
  await page.goto('?view=production');
  const sections = page.getByRole('region');
  await expect(sections.first()).toBeVisible();
  const count = await sections.count();
  expect(count).toBeGreaterThan(1);
  for (let index = 0; index < count; index++) {
    const style = await sections.nth(index).evaluate((element) => {
      const css = getComputedStyle(element);
      return { border: css.borderTopWidth, background: css.backgroundColor };
    });
    expect(style.border).toBe('1px');
    expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
  }
});

test('opening a generator shows its info in the expanded area', async ({ page }) => {
  await page.goto('?view=production');
  const trigger = page.getByRole('button', { name: /^Farmers details$/ });
  const item = page.getByRole('listitem').filter({ has: trigger });
  const closed = (await item.innerText()).length;
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(async () => (await item.innerText()).length).toBeGreaterThan(closed + 20);
});

test('researcher cards show level out of max and the cost of the next level, with unlock, guaranteed rank and quote in a popover', async ({ page }) => {
  await page.goto('?view=production&tab=researchers');
  const ringo = card(page, 'Ringo Ringlet');
  const level = page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ });
  const max = (await level.getAttribute('aria-label'))?.match(/0 to (\d+)/)?.[1] as string;

  await expect(ringo.getByTestId('researcher-level')).toHaveText(`Level 0 / ${max}`);
  await ringo.getByRole('button', { name: 'Details for Ringo Ringlet' }).click();
  await expect(page.getByText(/^Unlocks at Rank \d+$/)).toBeVisible();
  await expect(page.getByText(/^First guaranteed: (Rank \d+|First free capsule)$/)).toBeVisible();
  await expect(page.getByText('There\'s Potatoes in them there hills...')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText(/^Unlocks at Rank \d+$/)).toHaveCount(0);

  // Level 1 to 2 costs the first entry of the rarity's cost table.
  await level.fill('1');
  await expect(ringo.getByTestId('researcher-level')).toHaveText(`Level 1 / ${max}`);
  await expect(ringo.getByTestId('next-cost-cards')).toHaveText('2');
  await expect(ringo.getByTestId('next-cost-science')).toHaveText('50');

  await level.fill('2');
  await expect(ringo.getByTestId('next-cost-cards')).toHaveText('5');
  await expect(ringo.getByTestId('next-cost-science')).toHaveText('100');

  await level.fill(max);
  await expect(ringo.getByText('Max level')).toBeVisible();
  await expect(ringo.getByTestId('next-cost-cards')).toHaveCount(0);
});

test('the next row of cards starts at one height even when cards differ', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('?view=production&tab=researchers');
  const cards = page.getByRole('list', { name: 'Researchers' }).getByRole('listitem');
  await expect(cards.first()).toBeVisible();
  const tops = await cards.evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().top + window.scrollY)));
  const rows = [...new Set(tops)];
  expect(rows.length).toBeGreaterThan(1);
  // Cards in a row share a top, so every card top is one of a few row tops.
  expect(rows.length).toBeLessThan(tops.length / 2);
});

test('Ages cards have no quote', async ({ page }) => {
  await page.goto('?title=ages&mode=evergreen&view=production&tab=researchers');
  await expect(page.getByRole('textbox', { name: /^Level of / }).first()).toBeVisible();
  await page.getByRole('button', { name: /^Details for / }).first().click();
  await expect(page.getByText(/^Unlocks at Rank/).first()).toBeVisible();
  await expect(page.getByText(/^“/)).toHaveCount(0);
});

test('the propaganda card says Boost or Active, with its power', async ({ page }) => {
  await page.goto('?view=production&tab=researchers');
  const boost = page.getByRole('button', { name: /^Propaganda Boost/ });
  const item = page.getByRole('listitem').filter({ has: boost });
  const power = item.getByTestId('propaganda-power');
  await expect(item).not.toContainText('Watch ads');

  // It starts on in a fresh game, so go through both states whichever way it begins.
  if ((await boost.getAttribute('aria-pressed')) === 'true') {
    await boost.click();
  }
  await expect(boost).toHaveText('Boost');
  await expect(boost).toHaveAttribute('aria-pressed', 'false');
  await expect(power).toHaveText('x1');
  await boost.click();
  await expect(boost).toHaveText('Active');
  await expect(boost).toHaveAttribute('aria-pressed', 'true');
  await expect(power).toHaveText(/^x\d+$/);
  await expect(power).not.toHaveText('x1');
});
