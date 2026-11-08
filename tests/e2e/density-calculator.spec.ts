import { expect, test, type Page } from '@playwright/test';

const MISSION = '?title=adcom&mode=evergreen&rank=2&mission=M0004';
const PRODUCTION_RESEARCHERS = '?title=adcom&mode=evergreen&view=production&tab=researchers';

const calculator = (page: Page) => page.locator('[aria-labelledby=calculator-heading]');

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop sizes only');
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the calculator starts near the top and its tabs stay short', async ({ page }) => {
    await page.goto(MISSION);
    const calc = calculator(page);
    await expect(calc.getByLabel('# of Farmers')).toBeVisible();
    const top = await calc.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    expect(top).toBeLessThanOrEqual(250);

    const generators = await calc.getByRole('tabpanel').boundingBox();
    expect(generators?.height).toBeLessThanOrEqual(400);

    await calc.getByRole('tab', { name: 'Researchers' }).click();
    await expect(calc.getByRole('textbox', { name: /^Level of / }).first()).toBeVisible();
    const researchers = await calc.getByRole('tabpanel').boundingBox();
    expect(researchers?.height).toBeLessThanOrEqual(700);
  });

  test('Production researchers fit many cards on the first screen', async ({ page }) => {
    await page.goto(PRODUCTION_RESEARCHERS);
    const cards = page.getByRole('list', { name: 'Researchers' }).getByRole('listitem');
    await expect(cards.first()).toBeVisible();
    const bottoms = await cards.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().bottom));
    expect(bottoms.filter((bottom) => bottom <= 800).length).toBeGreaterThanOrEqual(12);
  });

  test('Tab goes straight from one researcher level to the next', async ({ page }) => {
    await page.goto(PRODUCTION_RESEARCHERS);
    const levels = page.getByRole('textbox', { name: /^Level of / });
    await levels.first().focus();
    await page.keyboard.press('Tab');
    await expect(levels.nth(1)).toBeFocused();
  });

  test('Tab goes straight from one generator field to the next', async ({ page }) => {
    await page.goto(MISSION);
    const fields = calculator(page).locator('input[data-field-key^="gen:"]');
    await fields.first().focus();
    await page.keyboard.press('Tab');
    await expect(fields.nth(1)).toBeFocused();
  });

  test('researcher details open in a popover without moving the card', async ({ page }) => {
    await page.goto(PRODUCTION_RESEARCHERS);
    const card = page.getByRole('listitem').filter({ has: page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ }) });
    await expect(card).toBeVisible();
    const before = await card.boundingBox();
    await card.getByRole('button', { name: 'Details for Ringo Ringlet' }).click();
    await expect(page.getByText(/^Unlocks at Rank \d+$/)).toBeVisible();
    await expect(page.getByText('There\'s Potatoes in them there hills...')).toBeVisible();
    expect((await card.boundingBox())?.height).toBe(before?.height);
    await page.keyboard.press('Escape');
    await expect(page.getByText(/^Unlocks at Rank \d+$/)).toHaveCount(0);
  });
});

test.describe('phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'Phone only');

  test('every button and field in the calculator is a full tap target, and nothing scrolls sideways', async ({ page }) => {
    await page.goto(MISSION);
    const calc = calculator(page);
    await expect(calc.getByLabel('# of Farmers')).toBeVisible();
    for (const tab of ['Generators', 'Researchers', 'Trades']) {
      await calc.getByRole('tab', { name: tab }).click();
      await expect(calc.getByRole('tabpanel')).toBeVisible();
      // Checkboxes and the Online/Offline radios are tapped through their 44px labels.
      const small = await calc.locator('button:visible, input:not([type=checkbox]):not([type=radio]):visible').evaluateAll((elements) =>
        elements
          .map((element) => ({ name: element.getAttribute('aria-label') ?? element.textContent ?? '', height: element.getBoundingClientRect().height }))
          .filter((entry) => entry.height < 43.5 && entry.height > 0)
      );
      expect(small, tab).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), tab).toBeLessThanOrEqual(0);
    }
  });
});
