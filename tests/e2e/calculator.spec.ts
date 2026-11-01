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
  await page.goto('?rank=2');
  await expect(page.getByText(/^ETA: /).first()).toBeVisible();
});

test('says what is wrong with a field and refuses to calculate', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  await calc.getByLabel('# of Farmers').fill('lots');
  await expect(calc.getByLabel('# of Farmers')).toHaveAttribute('aria-invalid', 'true');
  await expect(calc.getByText(/Not a number/)).toBeVisible();

  await calc.getByRole('button', { name: 'Calculate' }).click();
  await expect(calc.getByRole('status')).toContainText('Please fix 1 issue');
});

test('imports saved counts and steps with plain arrow keys', async ({ page }) => {
  await page.goto(OWN_FARMERS);
  const calc = calculator(page);
  const farmers = calc.getByLabel('# of Farmers');
  await expect(calc.getByRole('button', { name: 'Import Counts' })).toBeDisabled();

  await farmers.fill('10');
  await expect(calc.getByRole('button', { name: 'Import Counts' })).toBeEnabled();

  // Plain Up and Down change the value. Modifiers and every other shortcut do nothing.
  await farmers.press('ArrowUp');
  await expect(farmers).toHaveValue('11');
  await farmers.press('Control+ArrowUp');
  await expect(farmers).toHaveValue('11');
  await farmers.press('ArrowDown');
  await expect(farmers).toHaveValue('10');
  await page.keyboard.press('Alt+KeyR');
  await expect(farmers).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(calc.getByRole('status')).toBeEmpty();

  await calc.getByRole('button', { name: 'Import Counts' }).click();
  await expect(calc.getByRole('tab', { name: 'Generators' })).toHaveAttribute('aria-selected', 'true');
  await expect(farmers).toHaveValue('10');
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
  const speed = details.locator('dt', { hasText: 'Speed' }).locator('xpath=following-sibling::dd');
  await expect(speed).toHaveText('x1');

  await page.getByRole('tab', { name: 'Researchers' }).click();
  await page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ }).fill('3');
  await expect(page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ })).toHaveValue('3');

  await page.getByRole('tab', { name: 'Generators' }).click();
  await page.getByRole('button', { name: /^Farmers details$/ }).click();
  await expect(speed).toHaveText('x8');
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
  await page.goto('?view=production');
  await page.getByRole('tab', { name: 'Researchers' }).click();
  await expect(page.getByRole('button', { name: /^Set a custom value/ })).toHaveCount(0);

  const level = page.getByRole('textbox', { name: /^Level of Ringo Ringlet/ });
  await level.press('ArrowUp');
  await expect(level).toHaveValue('1');
  await level.press('Control+ArrowUp');
  await expect(level).toHaveValue('1');
  await level.press('ArrowDown');
  await expect(level).toHaveValue('0');

  await page.getByRole('button', { name: 'Max Ringo Ringlet' }).click();
  const max = (await level.getAttribute('aria-label'))?.match(/0 to (\d+)/)?.[1];
  await expect(level).toHaveValue(max as string);
  await expect(page.getByRole('button', { name: 'Max Ringo Ringlet' })).toBeDisabled();

  await page.getByRole('button', { name: 'Set all to 0' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(level).toHaveValue(max as string);

  await page.getByRole('button', { name: 'Set all to 0' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Set all to 0' }).click();
  await expect(level).toHaveValue('0');

  await page.getByRole('button', { name: 'Max all' }).click();
  await expect(level).toHaveValue(max as string);
});

test('phone keyboards can type the game notation', async ({ page }) => {
  await page.goto('?rank=5');
  await page.getByRole('button', { name: /^Reward and calculator for/ }).first().click();
  const field = page.getByLabel(/^# of /).first();
  await expect(field).toHaveAttribute('inputmode', 'text');
});
