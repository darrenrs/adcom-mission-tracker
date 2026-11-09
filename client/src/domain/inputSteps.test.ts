import { describe, expect, it } from 'vitest';
import { amountValue, formatAmount, parseAmount, roundAmount, settleAmount, stepAmount } from './inputSteps';
import { TITLES } from './titles';
import { isInvalidAmount } from '@/features/calculator/fields';

const powers = TITLES.adcom.powers;

describe('parseAmount', () => {
  it('reads game amounts exactly, so whole amounts stay whole', () => {
    expect(parseAmount('1.1 AA', powers)).toBe(1_100_000_000_000_000);
    expect(parseAmount('16.1 K', powers)).toBe(16_100);
    expect(parseAmount('32.3 K', powers)).toBe(32_300);
    expect(parseAmount('2.35 AA', powers)).toBe(2.35e15);
    // Every amount with up to two decimals below 2^53 is a whole number, as a generator count must be.
    for (let power = 1; power <= 5; power++) {
      for (let hundredths = 100; hundredths < 100_000; hundredths += 7) {
        const text = `${(hundredths / 100).toFixed(2)} ${powers[power - 1]}`;
        const value = parseAmount(text, powers);
        if (value < Number.MAX_SAFE_INTEGER) {
          expect(Number.isInteger(value), text).toBe(true);
        }
      }
    }
  });

  it('accepts 1.1 AA, and reads it as a whole number', () => {
    expect(isInvalidAmount('1.1 AA', powers)).toBe(false);
    expect(Number.isInteger(amountValue('1.1 AA', powers))).toBe(true);
  });

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

describe('the one number format', () => {
  it('shows whole numbers with separators under 1 M, then two decimals and the power', () => {
    expect(formatAmount(28139, powers)).toBe('28,139');
    expect(formatAmount(999_999, powers)).toBe('999,999');
    expect(formatAmount(1_234_567, powers)).toBe('1.23 M');
    expect(formatAmount(1.6e18, powers)).toBe('1.6 BB');
    expect(formatAmount(0, powers)).toBe('0');
    expect(formatAmount(-1200, powers)).toBe('-1,200');
  });

  it('rounds fractions under 1 M to whole numbers', () => {
    expect(formatAmount(12.5, powers)).toBe('13');
    expect(formatAmount(500.005, powers)).toBe('500');
    expect(formatAmount(999_999.6, powers)).toBe('1 M');
  });

  it('saves the value it shows', () => {
    expect(roundAmount(12.5, powers)).toBe(13);
    expect(roundAmount(1_234_567, powers)).toBe(1_230_000);
    expect(amountValue('1.234 M', powers)).toBe(1_230_000);
    expect(amountValue('', powers)).toBe(0);
    expect(amountValue('junk', powers)).toBeNaN();
  });
});

describe('settleAmount', () => {
  it('settles any valid amount into the format, even when the format rounds it', () => {
    expect(settleAmount('1.6e+18', powers)).toEqual({ text: '1.6 BB', value: 1.6e18 });
    expect(settleAmount('1600000000000000000', powers)).toEqual({ text: '1.6 BB', value: 1.6e18 });
    expect(settleAmount('2 KKK', powers)?.text).toBe('2 KFC');
    expect(settleAmount('28139', powers)).toEqual({ text: '28,139', value: 28139 });
    expect(settleAmount('1234567', powers)).toEqual({ text: '1.23 M', value: 1_230_000 });
    expect(settleAmount('12.5', powers)).toEqual({ text: '13', value: 13 });
  });

  it('leaves empty, invalid and (unless allowed) negative text alone', () => {
    expect(settleAmount('', powers)).toBeNull();
    expect(settleAmount('abc', powers)).toBeNull();
    expect(settleAmount('-5', powers)).toBeNull();
    expect(settleAmount('-5.4', powers, true)).toEqual({ text: '-5', value: -5 });
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

  it('accepts fractions in every field, since they round to the format', async () => {
    const { isInvalidAmount } = await import('@/features/calculator/fields');
    expect(isInvalidAmount('2.5', powers)).toBe(false);
    expect(isInvalidAmount('1.25 AAAA', powers)).toBe(false);
  });
});
