import { expect, test, type Page } from '@playwright/test';

// Motherland rank 2: "Own Farmers (25)" has a calculator, "Trade Potatoes" does not.
const OWN_FARMERS = '?rank=2&mission=M0004';
const TRADE_MISSION = '?rank=2&mission=M0007';

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

const calculator = (page: Page) => page.getByRole('region', { name: 'Calculator' });

async function sidewaysOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

test('calculates an ETA from generators and keeps the inputs after a reload', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  await expect(calc.getByRole('heading', { name: 'Calculator' })).toBeVisible();
  await expect(calc.getByRole('tab')).toHaveText(['Generators', 'Researchers', 'Trades']);
  await expect(calc.getByRole('tab', { name: 'Generators' })).toHaveAttribute('aria-selected', 'true');

  // The Common researcher of the Farmers makes them run at all.
  await calc.getByRole('tab', { name: 'Researchers' }).click();
  await calc.getByRole('textbox', { name: /^Level of Ringo Ringlet/ }).fill('3');

  await calc.getByRole('tab', { name: 'Generators' }).click();
  await calc.getByLabel('# of Farmers').fill('10');
  await calc.getByLabel('# of Potatoes').fill('1500');
  await calc.getByLabel('# of Comrades', { exact: true }).fill('35.33 EE');

  await calc.getByRole('button', { name: 'Calculate' }).click();
  await expect(calc.getByRole('status')).toContainText(/ETA: .+/);

  await page.reload();
  const again = calculator(page);
  await expect(again.getByLabel('# of Farmers')).toHaveValue('10');
  await expect(again.getByLabel('# of Potatoes')).toHaveValue('1,500');
  await expect(again.getByLabel('# of Comrades', { exact: true })).toHaveValue('35.33 EE');
  await again.getByRole('tab', { name: 'Researchers' }).click();
  await expect(again.getByRole('textbox', { name: /^Level of Ringo Ringlet/ })).toHaveValue('3');

  // The saved ETA shows on the mission list too.
  await page.goto('?view=missions&rank=2');
  await expect(page.getByText(/^ETA: /).first()).toBeVisible();
});

test('says what is wrong with a field and refuses to calculate', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  await calc.getByLabel('# of Farmers').fill('lots');
  const farmers = calc.getByLabel('# of Farmers');
  await expect(farmers).toHaveAttribute('aria-invalid', 'true');
  // Only the red highlight shows; there is no warning text on the page.
  const red = await farmers.evaluate((input) => getComputedStyle(input).backgroundColor);
  expect(red).not.toBe(await calc.getByLabel('# of Communes').evaluate((input) => getComputedStyle(input).backgroundColor));
  await expect(calc.locator('.text-danger')).toHaveCount(0);

  await farmers.fill('-5');
  await expect(farmers).toHaveAttribute('aria-invalid', 'true');
  await farmers.fill('5');
  await expect(farmers).not.toHaveAttribute('aria-invalid', 'true');
  await farmers.fill('-5');

  await calc.getByRole('button', { name: 'Calculate' }).click();
  await expect(calc.getByRole('status')).toContainText('Please fix 1 issue');
});

test('steps with plain arrow keys', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  const farmers = calc.getByLabel('# of Farmers');

  // Plain Up and Down change the value. Modifiers and every other shortcut do nothing.
  await farmers.fill('10');
  await farmers.press('ArrowUp');
  await expect(farmers).toHaveValue('11');
  await farmers.press('Control+ArrowUp');
  await expect(farmers).toHaveValue('11');
  await farmers.press('ArrowDown');
  await expect(farmers).toHaveValue('10');
  await page.keyboard.press('Alt+KeyR');
  await expect(farmers).toBeFocused();

  await farmers.fill('307');
  await farmers.press('ArrowUp');
  await expect(farmers).toHaveValue('310');
});

test('Enter in a calculator field calculates', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  const farmers = calc.getByLabel('# of Farmers');
  await farmers.fill('30');
  await farmers.press('Enter');
  await expect(calc.getByRole('status')).toContainText(/ETA: /);

  await page.goto(OWN_FARMERS);
  await calc.getByRole('tab', { name: /Researchers/ }).click();
  await expect(calc.getByRole('status')).toBeEmpty();
  await calc.getByRole('textbox', { name: /^Level of / }).first().press('Enter');
  await expect(calc.getByRole('status')).not.toBeEmpty();
});

test('Infinity and fractional generator counts are invalid', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  const farmers = calc.getByLabel('# of Farmers');
  await farmers.fill('Infinity');
  await expect(farmers).toHaveAttribute('aria-invalid', 'true');
  await farmers.fill('2.5');
  await expect(farmers).toHaveAttribute('aria-invalid', 'true');
  await farmers.fill('2');
  await expect(farmers).not.toHaveAttribute('aria-invalid', 'true');
  const resource = calc.locator('input[data-field-key="resource"]');
  await resource.fill('Infinity');
  await expect(resource).toHaveAttribute('aria-invalid', 'true');
});

test('the Generators tab groups fields under Generators, Resources and Comrades', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  const headings = calc.getByRole('tabpanel').getByRole('heading', { level: 4 });
  await expect(headings).toHaveText(['Generators', 'Resources', 'Comrades']);
});

test('Import Counts is hidden for now', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  await calc.getByLabel('# of Farmers').fill('10');
  await expect(calc.getByRole('button', { name: 'Calculate' })).toBeVisible();
  await expect(calc.getByRole('button', { name: 'Import Counts' })).toHaveCount(0);
  await expect(calc.getByText(/Import Counts/)).toHaveCount(0);
});

test('generator fields sit in one column, in tier order', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const fields = calculator(page).locator('input[data-field-key^="gen:"]');
  await expect(fields.first()).toBeVisible();
  const count = await fields.count();
  expect(count).toBeGreaterThan(1);
  const boxes = [];
  for (let index = 0; index < count; index++) {
    const box = await fields.nth(index).boundingBox();
    boxes.push({ x: Math.round(box?.x ?? 0), y: box?.y ?? 0 });
  }
  for (let index = 1; index < count; index++) {
    const previous = boxes[index - 1] as { x: number; y: number };
    const current = boxes[index] as { x: number; y: number };
    expect(current.x, `field ${index}`).toBe(previous.x);
    expect(current.y, `field ${index}`).toBeGreaterThan(previous.y);
  }
});

test('comrades per second is read-only text that follows Trades', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  await expect(calc.getByText('Comrades per second')).toBeVisible();
  await expect(calc.getByRole('textbox', { name: /per second/ })).toHaveCount(0);
  const shown = calc.getByTestId('comrades-per-second');
  await expect(shown).toHaveText('1');

  await calc.getByRole('tab', { name: 'Trades' }).click();
  await calc.getByLabel(/^Next trade cost/).first().fill('5 M');
  await calc.getByRole('tab', { name: 'Generators' }).click();
  await expect(shown).toHaveText('2');
});

test('trades show the base cost at zero trades and say comrades per second', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  await calc.getByRole('tab', { name: 'Trades' }).click();
  const potatoes = calc.getByLabel(/^Next trade cost/).first();
  await expect(potatoes).toHaveValue('5,000');
  await expect(calc.getByText(/per second in total/)).toHaveCount(0);
  await expect(calc.getByText(/Comrades per second$/).first()).toBeVisible();

  // One trade later the field moves on, and clearing it falls back to the base cost when left.
  await potatoes.fill('5 M');
  await expect(potatoes).toHaveValue('5 M');
  await potatoes.fill('');
  await potatoes.blur();
  await expect(potatoes).toHaveValue('5,000');
});

test('options: offline switches off auto-buy', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  const autobuy = calc.getByRole('checkbox', { name: 'Auto-buy deepest generator' });
  await expect(autobuy).toBeEnabled();
  await calc.getByText('Offline', { exact: true }).click();
  await expect(calc.getByRole('radio', { name: 'Offline' })).toBeChecked();
  await expect(autobuy).toBeDisabled();
  await calc.getByText('Online', { exact: true }).click();
  await expect(calc.getByRole('radio', { name: 'Online' })).toBeChecked();
  await expect(autobuy).toBeEnabled();
  await expect(calc.getByRole('checkbox', { name: /^Limited by .* only$/ })).toBeVisible();
});

test('changing a researcher level on Production updates generator details at once', async ({ page }) => {
  await page.goto('?view=production');
  await expect(page.getByRole('tab')).toHaveText(['Generators', 'Researchers', 'Trades']);

  const farmer = page.getByRole('button', { name: /^Farmers details$/ });
  await farmer.click();
  const details = page.getByRole('listitem').filter({ has: farmer });
  await expect(details).toContainText(/x1\s*Speed/);

  await page.getByRole('tab', { name: 'Researchers' }).click();
  await page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ }).fill('3');
  await expect(page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ })).toHaveValue('3');

  await page.getByRole('tab', { name: 'Generators' }).click();
  await page.getByRole('button', { name: /^Farmers details$/ }).click();
  await expect(details).toContainText(/x8\s*Speed/);
});

test('a mission without a calculator says so', async ({ page }) => {
  await page.goto(TRADE_MISSION);
  const calc = calculator(page);
  await expect(calc.getByText('This mission type has no calculator yet.')).toBeVisible();
  await expect(calc.getByRole('tab')).toHaveCount(0);
});

test('never scrolls sideways on the mission page, in any tab', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  await expect(calc.getByLabel('# of Farmers')).toBeVisible();
  expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0);

  for (const tab of ['Researchers', 'Trades']) {
    await calc.getByRole('tab', { name: tab }).click();
    await expect(calc.getByRole('tabpanel')).toBeVisible();
    expect(await sidewaysOverflow(page), tab).toBeLessThanOrEqual(0);
  }

  await page.goto('?view=production');
  for (const tab of ['Generators', 'Researchers', 'Trades']) {
    await page.getByRole('tab', { name: tab }).click();
    expect(await sidewaysOverflow(page), `production ${tab}`).toBeLessThanOrEqual(0);
  }
});

test('researchers step with arrows, have no custom value, and can be maxed or cleared', async ({ page }) => {
  await page.goto('?view=production&tab=researchers');
  await expect(page.getByRole('button', { name: /^Set a custom value/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Max Ringo/ })).toHaveCount(0);

  const level = page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ });
  await level.press('ArrowUp');
  await expect(level).toHaveValue('1');
  await level.press('Control+ArrowUp');
  await expect(level).toHaveValue('1');
  await level.press('ArrowDown');
  await expect(level).toHaveValue('0');

  await page.getByRole('button', { name: 'Max all' }).click();
  const max = (await level.getAttribute('aria-label'))?.match(/0 to (\d+)/)?.[1];
  await expect(level).toHaveValue(max as string);
  await expect(page.getByRole('button', { name: 'Raise Ringo Ringlet' })).toBeDisabled();

  await page.getByRole('button', { name: 'Set all to 0' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(level).toHaveValue(max as string);

  await page.getByRole('button', { name: 'Set all to 0' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Set all to 0' }).click();
  await expect(level).toHaveValue('0');
});

test('phone keyboards can type the game notation', async ({ page }) => {
  await page.goto('?view=missions&rank=5');
  await page.getByRole('button', { name: /^Reward and calculator for/ }).first().click();
  const field = page.getByLabel(/^# of /).first();
  await expect(field).toHaveAttribute('inputmode', 'text');
});
