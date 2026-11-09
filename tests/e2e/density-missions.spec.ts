import { expect, test } from '@playwright/test';

const EVERGREEN = '?title=adcom&mode=evergreen&rank=5&view=missions';

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop sizes only');
  test.use({ viewport: { width: 1280, height: 800 } });

  test('mission cards stay short but hold the capsule, its scripted ring and the calculator badge', async ({ page }) => {
    await page.goto(EVERGREEN);
    const first = page.getByRole('button', { name: /^Complete mission/ }).first();
    await expect(first).toBeVisible();
    // 44px with a mouse too (round 5): the 32px capsule with its ring is 40px, which a 32px row cut off.
    const card = await first.locator('xpath=ancestor::li[1]').boundingBox();
    expect(card?.height).toBeLessThanOrEqual(48);
    const outside = await page.locator('main ul li.rounded-lg').evaluateAll((rows) =>
      rows.filter((row) => {
        const box = row.getBoundingClientRect();
        return [...row.querySelectorAll('img, span')].some((node) => {
          const part = node.getBoundingClientRect();
          return part.width > 0 && (part.top < box.top - 0.5 || part.bottom > box.bottom + 0.5 || part.right > box.right + 0.5);
        });
      }).length
    );
    expect(outside).toBe(0);
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
