// What Up and Down do to a number field. tests/legacy/inputSteps.test.ts checks plain presses against legacy.

import { bigNum, fromBigNum } from './format';

export type StepKind = 'count' | 'comrades' | 'comradesPerSecond';

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
    return Number(trimmed);
  }
  const named = trimmed.replace(/\bKKK\b/i, 'KFC');
  return fromBigNum(named, powers) || Number(named);
}

/** What a field should show once the player leaves it: a valid amount in the game's format, or null to leave it alone. */
export function formatAmountText(text: string, powers: readonly string[]): string | null {
  const value = parseAmount(text, powers);
  if (text.trim() === '' || !Number.isFinite(value) || value < 0) {
    return null;
  }
  const shown = bigNum(value, powers);
  // Keep the exact digits when the game's rounding would change the number.
  return Math.abs(parseAmount(shown, powers) - value) <= value * 1e-9 ? shown : String(value);
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

/**
 * The text a field should show after a step, or null when it should stay as it is.
 * Counts change their lowest shown thousand and never leave it: at 12 K, a step of 1 K is fine but a step past 999 K is not.
 */
export function stepValue(kind: StepKind, text: string, direction: number, powers: readonly string[]): string | null {
  const raw = parseAmount(text, powers);
  if (raw === 0 && direction > 0) {
    return '1';
  }

  if (kind === 'count') {
    const thousandPower = Math.floor(Math.log(raw) / Math.log(1000));
    const next = raw + Math.pow(1000, thousandPower) * direction;
    const nextThousandPower = Math.floor(Math.log(next) / Math.log(1000));
    const shown = bigNum(next, powers);
    return shown === 'NaN undefined' || next < 1 || nextThousandPower !== thousandPower ? null : shown;
  }

  const next = raw + (kind === 'comrades' ? 1000 : 100) * direction;
  const shown = bigNum(next, powers);
  return shown === 'NaN undefined' || next < 0 ? '0' : shown;
}
