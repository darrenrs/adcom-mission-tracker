import { expect, test } from '@playwright/test';

const OPEN = '?title=adcom&mode=evergreen&rank=5';

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop layout only.');
  test.use({ viewport: { width: 1280, height: 800 } });

  test('fits the page in 1,870px with short generator rows in one column', async ({ page }) => {
    await page.goto(OPEN);
    await expect(page.getByRole('list', { name: 'Generators' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(1870);

    const boxes = await page.locator('[aria-label=Generators] li').evaluateAll((nodes) =>
      nodes.map((node) => {
        const { x, y, height } = node.getBoundingClientRect();
        return { x, y, height };
      })
    );
    expect(boxes.length).toBeGreaterThan(2);
    for (const box of boxes) {
      expect(box.height).toBeLessThanOrEqual(80);
    }
    const first = boxes[0]!;
    for (const box of boxes) {
      expect(Math.abs(box.x - first.x)).toBeLessThan(1);
    }
  });

  test('Tab goes from one number field straight to the next', async ({ page }) => {
    await page.goto(OPEN);
    const counts = page.locator('[aria-label=Generators] li input');
    await counts.first().focus();
    await page.keyboard.press('Tab');
    await expect(counts.nth(1)).toBeFocused();

    const stocks = page.getByRole('region', { name: 'Stocks' }).getByRole('textbox');
    await stocks.first().focus();
    await page.keyboard.press('Tab');
    await expect(stocks.nth(1)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(stocks.nth(2)).toBeFocused();
  });
});

test.describe('phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'Phone layout only.');

  test('keeps 44px buttons and inputs, and does not scroll sideways at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(OPEN);
    await expect(page.getByRole('list', { name: 'Generators' })).toBeVisible();
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('button, input')]
        .map((node) => ({ node, box: node.getBoundingClientRect() }))
        .filter(({ box }) => box.width > 0 && box.height > 0 && box.height < 43.5)
        .map(({ node, box }) => `${node.tagName} ${node.getAttribute('aria-label') ?? node.textContent?.trim()} ${box.height}`)
    );
    expect(small).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
