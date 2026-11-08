import { expect, test } from '@playwright/test';

const EVERGREEN = '?title=adcom&mode=evergreen&rank=5&view=missions';

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop sizes only');
  test.use({ viewport: { width: 1280, height: 800 } });

  test('mission cards stay short', async ({ page }) => {
    await page.goto(EVERGREEN);
    const first = page.getByRole('button', { name: /^Complete mission/ }).first();
    await expect(first).toBeVisible();
    // Was 50px before the compaction.
    const card = await first.locator('xpath=ancestor::li[1]').boundingBox();
    expect(card?.height).toBeLessThanOrEqual(36);
  });
});

test.describe('phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'Phone only');

  test('mission buttons are full tap targets', async ({ page }) => {
    await page.goto(EVERGREEN);
    const buttons = page.locator('main li button:visible');
    await expect(buttons.first()).toBeVisible();
    const small = await buttons.evaluateAll((elements) =>
      elements
        .map((element) => ({ name: element.getAttribute('aria-label') ?? element.textContent ?? '', height: element.getBoundingClientRect().height }))
        .filter((entry) => entry.height < 43.5)
    );
    expect(small).toEqual([]);
  });
});
