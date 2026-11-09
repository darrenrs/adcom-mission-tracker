// What Up and Down do to a number field. tests/legacy/inputSteps.test.ts checks plain presses against legacy.

import { bigNum, fromBigNum } from './format';

/** A key press, as far as stepping is concerned. */
export interface StepKey {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey?: boolean;
}

const SCIENTIFIC = /^-?\d+(?:\.\d+)?e[+-]?\d+$/i;

/**
 * Reads a typed amount: game notation (`35.33 EE`), scientific notation (`1.6e+18`) or plain digits.
 * `KKK` is read as `KFC`, the name the game uses for that power. Empty text is 0, junk is NaN.
 */
export function parseAmount(text: string, powers: readonly string[]): number {
  const trimmed = text.trim();
  if (SCIENTIFIC.test(trimmed)) {
    const value = Number(trimmed);
    return Number.isFinite(value) ? value : NaN;
  }
  const named = trimmed.replace(/\bKKK\b/i, 'KFC');
  const value = fromBigNum(named, powers) || Number(named);
  // "Infinity" and amounts too large for a number are not game amounts.
  return Number.isFinite(value) ? value : NaN;
}

/** Where `bigNum` switches from whole numbers to a power with up to two decimals. */
const POWERS_FROM = 1e6;

/**
 * An amount in the tracker's one number format, used by every field and every amount in mission text: whole numbers
 * with separators under 1 M (`1,234`), then up to two decimals and the power (`1.23 M`). Negatives keep their sign.
 */
export function formatAmount(value: number, powers: readonly string[]): string {
  const size = Math.abs(value);
  const shown = bigNum(size < POWERS_FROM ? Math.round(size) : size, powers);
  return value < 0 && shown !== '0' ? `-${shown}` : shown;
}

/** The value `formatAmount` shows, so what a field saves is what it shows: `12.5` gives 13, `1,234,567` gives 1,230,000. */
export function roundAmount(value: number, powers: readonly string[]): number {
  const rounded = parseAmount(formatAmount(value, powers), powers);
  return Number.isNaN(rounded) ? value : rounded;
}

/** A field's value: its text read and rounded to the format. Empty text is 0, junk is NaN. */
export function amountValue(text: string, powers: readonly string[]): number {
  const value = parseAmount(text, powers);
  return Number.isFinite(value) ? roundAmount(value, powers) : value;
}

/**
 * What a field settles to when the player leaves it or presses Enter: the text in the one format and the value it
 * saves. Null for empty text (left alone), junk, and negatives where they are not allowed (left red).
 */
export function settleAmount(text: string, powers: readonly string[], allowNegative = false): { text: string; value: number } | null {
  const value = parseAmount(text, powers);
  if (text.trim() === '' || !Number.isFinite(value) || (!allowNegative && value < 0)) {
    return null;
  }
  const shown = formatAmount(value, powers);
  const saved = parseAmount(shown, powers);
  return Number.isNaN(saved) ? null : { text: shown, value: saved };
}

/** 1 for plain Up, -1 for plain Down, and 0 for anything else, including either key with a modifier held. */
export function stepDirection(event: StepKey): number {
  if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
    return 0;
  }
  if (event.key === 'Down' || event.key === 'ArrowDown') {
    return -1;
  }
  return event.key === 'Up' || event.key === 'ArrowUp' ? 1 : 0;
}

/** Step size below which every amount moves by one. */
const UNIT_STEPS_BELOW = 100;

/**
 * The text a field should show after one Up or Down, or null when it should stay as it is.
 * Below 100 a step is 1. From 100 up it is 10^(digits − 2), so 100, 110 … 990, 1,000, 1,100 … 990 T, 1 AA, 1.1 AA.
 * Down from an exact power of ten takes the smaller step (1,000 to 990). Values off that grid snap onto it.
 */
export function stepAmount(text: string, direction: number, powers: readonly string[]): string | null {
  const value = parseAmount(text, powers);
  if (!Number.isFinite(value) || value < 0 || direction === 0 || (direction < 0 && value === 0)) {
    return null;
  }

  let step = 1;
  if (value >= UNIT_STEPS_BELOW) {
    const exponent = Math.floor(Math.log10(value) + 1e-12);
    const power = Math.pow(10, exponent);
    const atPower = Math.abs(value - power) <= power * 1e-12;
    step = Math.pow(10, direction < 0 && atPower ? exponent - 2 : exponent - 1);
  }

  const ratio = value / step;
  const nearest = Math.round(ratio);
  const onGrid = Math.abs(ratio - nearest) <= Math.max(1, ratio) * 1e-9;
  const next = Math.max(0, (onGrid ? nearest + direction : direction > 0 ? Math.ceil(ratio) : Math.floor(ratio)) * step);
  return bigNum(next, powers);
}
