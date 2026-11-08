import { describe, expect, it } from 'vitest';
import { formatAmountText, parseAmount, stepAmount } from './inputSteps';
import { TITLES } from './titles';

const powers = TITLES.adcom.powers;

describe('parseAmount', () => {
  it('reads game notation, scientific notation and plain digits', () => {
    expect(parseAmount('1.6 BB', powers)).toBe(1.6e18);
    expect(parseAmount('1.6e+18', powers)).toBe(1.6e18);
    expect(parseAmount('1.6E18', powers)).toBe(1.6e18);
    expect(parseAmount('1600000000000000000', powers)).toBe(1.6e18);
    expect(parseAmount('28,139', powers)).toBe(28139);
    expect(parseAmount('', powers)).toBe(0);
    expect(parseAmount('nonsense', powers)).toBeNaN();
  });

  it('reads KKK as the power the game calls KFC', () => {
    expect(parseAmount('2 KKK', powers)).toBe(parseAmount('2 KFC', powers));
    expect(parseAmount('2 kkk', powers)).toBe(parseAmount('2 KFC', powers));
  });
});

describe('formatAmountText', () => {
  it('rewrites a valid amount in the game format', () => {
    expect(formatAmountText('1.6e+18', powers)).toBe('1.6 BB');
    expect(formatAmountText('1600000000000000000', powers)).toBe('1.6 BB');
    expect(formatAmountText('2 KKK', powers)).toBe('2 KFC');
    expect(formatAmountText('28139', powers)).toBe('28,139');
  });

  it('leaves empty, invalid and negative text alone', () => {
    expect(formatAmountText('', powers)).toBeNull();
    expect(formatAmountText('abc', powers)).toBeNull();
    expect(formatAmountText('-5', powers)).toBeNull();
  });
});

describe('negative amounts', () => {
  it('are never valid game amounts', async () => {
    const { isInvalidAmount } = await import('@/features/calculator/fields');
    expect(isInvalidAmount('-5', powers)).toBe(true);
    expect(isInvalidAmount('-1.6 BB', powers)).toBe(true);
    expect(isInvalidAmount('0', powers)).toBe(false);
    expect(isInvalidAmount('1.6e+18', powers)).toBe(false);
  });

  it('are allowed where mission progress stands in for another goal', async () => {
    const { isInvalidAmount } = await import('@/features/calculator/fields');
    expect(isInvalidAmount('-5', powers, true)).toBe(false);
    expect(isInvalidAmount('junk', powers, true)).toBe(true);
  });
});

describe('stepAmount', () => {
  const up = (text: string) => stepAmount(text, 1, powers);
  const down = (text: string) => stepAmount(text, -1, powers);

  it('steps by 1 below 100', () => {
    expect(up('0')).toBe('1');
    expect(up('9')).toBe('10');
    expect(up('99')).toBe('100');
    expect(down('1')).toBe('0');
    expect(down('0')).toBeNull();
    expect(up('5.5')).toBe('6');
    expect(down('5.5')).toBe('5');
  });

  it('follows the owner sequence from 100 up', () => {
    expect(up('100')).toBe('110');
    expect(up('110')).toBe('120');
    expect(up('990')).toBe('1,000');
    expect(up('1,000')).toBe('1,100');
    expect(up('980 T')).toBe('990 T');
    expect(up('990 T')).toBe('1 AA');
    expect(up('1 AA')).toBe('1.1 AA');
    expect(up('1.1 AA')).toBe('1.2 AA');
  });

  it('takes the smaller step down from an exact power of ten', () => {
    expect(down('100')).toBe('99');
    expect(down('1,000')).toBe('990');
    expect(down('10000')).toBe('9,900');
    expect(down('1 AA')).toBe('990 T');
    expect(down('110')).toBe('100');
  });

  it('snaps values off the grid onto it', () => {
    expect(up('1234')).toBe('1,300');
    expect(down('1234')).toBe('1,200');
  });

  it('leaves invalid text alone', () => {
    expect(up('Infinity')).toBeNull();
    expect(up('abc')).toBeNull();
    expect(up('-5')).toBeNull();
  });
});

describe('validation', () => {
  it('never accepts Infinity or NaN', async () => {
    const { isInvalidAmount } = await import('@/features/calculator/fields');
    expect(parseAmount('Infinity', powers)).toBeNaN();
    expect(parseAmount('1e400', powers)).toBeNaN();
    expect(isInvalidAmount('Infinity', powers)).toBe(true);
    expect(isInvalidAmount('NaN', powers)).toBe(true);
  });

  it('requires whole generator counts below 2^53', async () => {
    const { isInvalidAmount } = await import('@/features/calculator/fields');
    expect(isInvalidAmount('2.5', powers, false, true)).toBe(true);
    expect(isInvalidAmount('3', powers, false, true)).toBe(false);
    expect(isInvalidAmount('1.25 AAAA', powers, false, true)).toBe(false);
    expect(isInvalidAmount('2.5', powers)).toBe(false);
  });
});
