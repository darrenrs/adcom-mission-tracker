import { describe, expect, it } from 'vitest';
import { formatAmountText, parseAmount } from './inputSteps';
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
});
