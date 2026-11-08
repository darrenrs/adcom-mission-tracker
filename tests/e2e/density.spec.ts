import { expect, test } from '@playwright/test';

// Height limits from the 7 November density pass, measured at 1280×800 with a mouse.
test.describe('desktop density', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop limits');
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the pinned top bar is one row', async ({ page }) => {
    await page.goto('?title=adcom&mode=evergreen');
    const bar = page.locator('header').first().locator('..');
    await expect(page.getByRole('button', { name: 'Game View' })).toBeVisible();
    expect((await bar.boundingBox())?.height).toBeLessThanOrEqual(60);
  });
});

test('the rank controls open in a popover without moving the page', async ({ page }) => {
  await page.goto('?title=adcom&mode=evergreen&rank=5');
  const main = page.locator('main');
  const before = (await main.boundingBox())?.y;

  await page.getByRole('button', { name: /^Rank 5, / }).click();
  await expect(page.getByRole('button', { name: 'Go forward to Rank 6' })).toBeVisible();
  expect((await main.boundingBox())?.y).toBe(before);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Go forward to Rank 6' })).toHaveCount(0);
});

test('help and info buttons are skipped by Tab', async ({ page }) => {
  await page.goto('?title=adcom&mode=evergreen');
  const skipped = await page.locator('button[aria-label^="Help: "], button[aria-label$=" details"][tabindex]').evaluateAll((buttons) =>
    buttons.every((button) => button.getAttribute('tabindex') === '-1')
  );
  expect(skipped).toBe(true);
});
