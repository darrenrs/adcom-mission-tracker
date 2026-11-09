import { expect, test, type Page } from '@playwright/test';

// The In-Game theme and the game's rarity colours. Needs palettes from adcom-assets in the local asset data.
const CRUSADE = '?title=adcom&mode=lte&balance=crusade-bal-1';
const PREFIX = 'adcom-mission-tracker:';

const root = (page: Page) => page.locator('html');
const inlineVar = (page: Page, name: string) => root(page).evaluate((node, n) => node.style.getPropertyValue(n), name);
const portraitColours = (page: Page) =>
  page.getByTestId('researcher-portrait').evaluateAll((nodes) => [...new Set(nodes.map((node) => (node as HTMLElement).style.backgroundColor))]);

async function chooseTheme(page: Page, label: string) {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('dialog').getByText(label, { exact: true }).click();
  await page.keyboard.press('Escape');
}

test('In-Game is the fourth theme, tints the page from the event, and goes away with System', async ({ page }) => {
  await page.goto(CRUSADE);
  await page.getByRole('button', { name: 'Settings' }).click();
  const themes = page.getByRole('dialog').getByRole('group', { name: 'Theme' }).getByRole('radio');
  expect(await themes.evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value))).toEqual(['system', 'light', 'dark', 'ingame']);
  await page.keyboard.press('Escape');

  await chooseTheme(page, 'In-Game');
  // Crusade's navy panel gives the dark base, a navy tint and its own red accent.
  await expect(root(page)).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => inlineVar(page, '--canvas')).toMatch(/^#[0-9a-f]{6}$/);
  expect(await inlineVar(page, '--canvas')).not.toBe('#131211');
  expect(await inlineVar(page, '--accent')).toMatch(/^#[0-9a-f]{6}$/);
  expect(await page.evaluate((key) => localStorage.getItem(key), `${PREFIX}StyleConfig`)).toBe('ingame');

  await page.reload();
  await expect.poll(() => inlineVar(page, '--canvas')).not.toBe('');

  await chooseTheme(page, 'System');
  await expect.poll(() => root(page).getAttribute('style')).toBeFalsy();
  await expect(root(page)).toHaveAttribute('data-theme', 'light');
});

test('a light panel gets the light base, and an event without an accent keeps the tracker accent', async ({ page }) => {
  await page.goto(CRUSADE);
  await page.evaluate((key) => localStorage.setItem(key, 'ingame'), `${PREFIX}StyleConfig`);

  await page.goto('?title=adcom&mode=lte&balance=fusfarm-bal-30');
  await expect.poll(() => inlineVar(page, '--canvas')).not.toBe('');
  await expect(root(page)).toHaveAttribute('data-theme', 'light');

  await page.goto('?title=ages&mode=lte&balance=egypt-bal-1');
  await expect.poll(() => inlineVar(page, '--canvas')).not.toBe('');
  expect(await inlineVar(page, '--accent')).toBe('');
});

test('researcher cards use the game rarity colours, whatever the theme', async ({ page }) => {
  await page.goto(`${CRUSADE}&view=production&tab=researchers`);
  await expect(page.getByTestId('researcher-portrait').first()).toBeVisible();
  // Crusade's LteCommon (#1C3C70) and LteRare (#E00E1C).
  expect((await portraitColours(page)).sort()).toEqual(['rgb(224, 14, 28)', 'rgb(28, 60, 112)']);

  await page.goto('?title=adcom&mode=evergreen&view=production&tab=researchers');
  await expect(page.getByTestId('researcher-portrait').first()).toBeVisible();
  // Motherland's Common, Rare, Epic and Supreme, from the shared rarity colours.
  expect((await portraitColours(page)).sort()).toEqual(['rgb(197, 61, 242)', 'rgb(224, 14, 28)', 'rgb(236, 224, 223)', 'rgb(255, 185, 27)']);
});

test('without palettes, In-Game behaves like System and cards keep their own colours', async ({ page }) => {
  await page.route('**/api/data/*', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    delete body.Palette;
    await route.fulfill({ response, json: body });
  });
  await page.goto(CRUSADE);
  await page.evaluate((key) => localStorage.setItem(key, 'ingame'), `${PREFIX}StyleConfig`);
  await page.goto(`${CRUSADE}&view=production&tab=researchers`);
  await expect(page.getByTestId('researcher-portrait').first()).toBeVisible();
  expect(await root(page).getAttribute('style')).toBeFalsy();
  await expect(root(page)).toHaveAttribute('data-theme', 'light');
  expect(await portraitColours(page)).toEqual(['']);
});
