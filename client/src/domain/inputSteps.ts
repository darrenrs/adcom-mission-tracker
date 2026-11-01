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

/** Reads a typed amount: AdCom notation (`35.33 EE`) first, then a plain number. Empty text is 0, junk is NaN. */
export function parseAmount(text: string, powers: readonly string[]): number {
  return fromBigNum(text, powers) || Number(text);
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
