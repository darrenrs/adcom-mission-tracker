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
  // The automator shows the researcher's level and effect, as its card does, not the list of multipliers.
  await expect(item.getByRole('heading', { name: 'Automator' })).toBeVisible();
  await expect(item).toContainText(/Level \d+ \/ \d+/);
  await expect(item).not.toContainText(/x\S+ \/ x\S+ \/ x\S+/);
});

test('researcher cards show the level bar, rarity and next cost, with unlock, guaranteed rank and quote behind the portrait', async ({ page }) => {
  await page.goto('?view=production&tab=researchers');
  const ringo = card(page, 'Ringo Ringlet');
  const level = page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ });
  const max = (await level.getAttribute('aria-label'))?.match(/0 to (\d+)/)?.[1] as string;

  await expect(ringo.getByTestId('researcher-level')).toHaveText(`0 / ${max}`);
  await expect(ringo.getByTestId('researcher-rarity')).toHaveText('Common');
  // Plus on top, the level field, minus at the bottom; no (i) button, the portrait opens the details.
  const stepper = await ringo.locator(':scope > div').last().locator(':scope > *').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')?.split(' ')[0]));
  expect(stepper).toEqual(['Raise', 'Level', 'Lower']);
  await expect(ringo.getByTestId('researcher-portrait')).toHaveAccessibleName('Details for Ringo Ringlet');
  await ringo.getByRole('button', { name: 'Details for Ringo Ringlet' }).click();
  await expect(page.getByText(/^Unlocks at Rank \d+$/)).toBeVisible();
  await expect(page.getByText(/^First guaranteed: (Rank \d+|First free capsule)$/)).toBeVisible();
  await expect(page.getByText('There\'s Potatoes in them there hills...')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText(/^Unlocks at Rank \d+$/)).toHaveCount(0);

  // Level 1 to 2 costs the first entry of the rarity's cost table.
  await level.fill('1');
  await expect(ringo.getByTestId('researcher-level')).toHaveText(`1 / ${max}`);
  await expect(ringo.getByTestId('next-cost-cards')).toHaveText('2');
  // "To next:" shares the line with the costs.
  const toNext = await ringo.getByText('To next:').boundingBox();
  const cards = await ringo.getByTestId('next-cost-cards').boundingBox();
  expect(Math.abs((toNext?.y ?? 0) + (toNext?.height ?? 0) / 2 - ((cards?.y ?? 0) + (cards?.height ?? 0) / 2))).toBeLessThan(4);
  await expect(ringo.getByTestId('next-cost-science')).toHaveText('50');

  await level.fill('2');
  await expect(ringo.getByTestId('next-cost-cards')).toHaveText('5');
  await expect(ringo.getByTestId('next-cost-science')).toHaveText('100');

  await level.fill(max);
  await expect(ringo.getByText('Max level')).toBeVisible();
  await expect(ringo.getByTestId('next-cost-cards')).toHaveCount(0);
  await expect(ringo.getByText('To next:')).toHaveCount(0);
});

test('researcher portraits are 4:5 with the industry icon top left, and cards have solid borders', async ({ page, isMobile }) => {
  await page.goto('?view=production&tab=researchers');
  const cards = page.getByRole('list', { name: 'Researchers' }).getByRole('listitem');
  await expect(cards.first()).toBeVisible();
  const portrait = await cards.first().getByTestId('researcher-portrait').boundingBox();
  expect(portrait?.height).toBeCloseTo(isMobile ? 112 : 96, 0);
  expect((portrait?.width ?? 0) / (portrait?.height ?? 1)).toBeCloseTo(0.8, 2);
  // The industry icon sits in the portrait's top-left corner and the level bar right under it. Measured in one go,
  // so the page cannot move between the readings.
  const layout = await cards.first().evaluate((card) => {
    const box = (id: string) => card.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect();
    const [picture, industry, bar] = [box('researcher-portrait'), box('industry-icon'), box('researcher-level')];
    return picture && industry && bar ? { dx: industry.left - picture.left, dy: industry.top - picture.top, gap: bar.top - picture.bottom } : null;
  });
  expect(Math.abs(layout?.dx ?? 99)).toBeLessThan(1);
  expect(Math.abs(layout?.dy ?? 99)).toBeLessThan(1);
  expect(layout?.gap ?? 99).toBeLessThan(8);
  const styles = await cards.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).borderTopStyle));
  expect(new Set(styles)).toEqual(new Set(['solid']));
});

test('researcher images stay inside their container at 4:5', async ({ page }) => {
  await page.goto('?view=production&tab=researchers');
  const card = page.getByRole('list', { name: 'Researchers' }).getByRole('listitem').first();
  const portrait = card.getByTestId('researcher-portrait');
  await expect(portrait).toBeVisible();
  // Both boxes in one reading, so the page cannot move between them while it is still loading.
  const boxes = await portrait.evaluate((node) => {
    const outer = node.getBoundingClientRect();
    const inner = node.querySelector('img')!.getBoundingClientRect();
    return { outer: { x: outer.x, y: outer.y, width: outer.width, height: outer.height }, inner: { x: inner.x, y: inner.y, width: inner.width, height: inner.height } };
  });
  const { outer: container, inner: image } = boxes;
  const slack = 0.5;
  expect(image.x).toBeGreaterThanOrEqual(container.x - slack);
  expect(image.y).toBeGreaterThanOrEqual(container.y - slack);
  expect(image.x + image.width).toBeLessThanOrEqual(container.x + container.width + slack);
  expect(image.y + image.height).toBeLessThanOrEqual(container.y + container.height + slack);
  expect(image.height / image.width).toBeCloseTo(5 / 4, 1);
  // The square art is squeezed to the card shape, not cropped.
  expect(await portrait.locator('img').first().evaluate((img) => getComputedStyle(img).objectFit)).toBe('fill');
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
