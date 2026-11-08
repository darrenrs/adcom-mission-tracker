import { expect, test, type Page } from '@playwright/test';

const bannerBox = async (page: Page) => {
  const image = page.getByTestId('banner-image');
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  return (await image.boundingBox()) ?? { x: -1, y: -1, width: 0, height: 0 };
};

for (const [name, query] of [
  ['Game View', '?title=adcom&mode=evergreen'],
  ['Missions', '?title=adcom&mode=evergreen&view=missions'],
  ['Production', '?title=adcom&mode=evergreen&view=production']
] as const) {
  test(`${name} shows the banner across the full width, right under the navbar`, async ({ page }) => {
    await page.goto(query);
    const viewport = page.viewportSize();
    const box = await bannerBox(page);
    const nav = await page.locator('div.sticky').first().boundingBox();
    expect(Math.abs(box.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.width - (viewport?.width ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs(box.y - ((nav?.y ?? 0) + (nav?.height ?? 0)))).toBeLessThanOrEqual(2);
  });
}

test('the title is upper case in the Oswald font', async ({ page }) => {
  await page.goto('?title=adcom&mode=evergreen');
  const title = page.getByTestId('banner-title');
  await expect(title).toBeVisible();
  expect(await title.evaluate((node) => getComputedStyle(node).fontFamily)).toContain('Oswald');
  expect(await title.evaluate((node) => getComputedStyle(node).textTransform)).toBe('uppercase');
  await expect(title).toHaveText(/Motherland/i);
});

test('an event shows its dates in the banner, and Motherland does not', async ({ page }) => {
  await page.goto('?title=adcom&mode=lte');
  await expect(page.getByTestId('banner-dates')).toBeVisible();
  await page.goto('?title=adcom&mode=evergreen');
  await expect(page.getByTestId('banner-title')).toBeVisible();
  await expect(page.getByTestId('banner-dates')).toHaveCount(0);
});

test('never scrolls sideways at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const query of ['?title=adcom&mode=lte', '?title=adcom&mode=evergreen&view=missions', '?title=adcom&mode=evergreen&view=schedule']) {
    await page.goto(query);
    await expect(page.getByTestId('banner-title')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  }
});
