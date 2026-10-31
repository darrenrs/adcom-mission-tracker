// What the arrow keys do to a number field. Ported from inputKeyboardHandler and keystrokeInputLogic of the
// legacy tracker, minus the DOM. tests/legacy/inputSteps.test.ts runs both versions side by side.

import { bigNum, fromBigNum } from './format';

export type StepKind = 'count' | 'comrades' | 'comradesPerSecond';

/** A key press, as far as stepping is concerned. */
export interface StepKey {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/** Reads a typed amount: AdCom notation (`35.33 EE`) first, then a plain number. Empty text is 0, junk is NaN. */
export function parseAmount(text: string, powers: readonly string[]): number {
  return fromBigNum(text, powers) || Number(text);
}

/**
 * Legacy's "delta order of magnitude": the sign says up or down, the size says how far.
 * Down is negative. Plain 2, Alt 1, Shift 3, Ctrl 4, Ctrl+Shift 5. Zero means the key is not a step.
 */
export function stepOrder(event: StepKey): number {
  let order = 0;
  if (event.key === 'Down' || event.key === 'ArrowDown') {
    order--;
  } else if (event.key === 'Up' || event.key === 'ArrowUp') {
    order++;
  }

  if (event.ctrlKey && event.shiftKey) {
    return order * 5;
  }
  if (event.ctrlKey) {
    return order * 4;
  }
  if (event.shiftKey) {
    return order * 3;
  }
  return event.altKey ? order : order * 2;
}

/** How many trades to move the next-trade cost by. Alt only tidies the number, so it moves nothing. */
export function tradeCostStep(order: number): number {
  const size = Math.abs(order);
  return size > 1 ? Math.pow(5, size - 2) * Math.sign(order) : 0;
}

const COUNT_POWER_DELTA: Readonly<Record<number, number>> = { 5: 3, 6: 30, 7: 78 };

/**
 * The text a field should show after a step, or null when it should stay as it is.
 * Counts change the digit that the key's size points at and never leave their thousand: at 12 K, a step of
 * 1 K is fine but a step past 999 K is not.
 */
export function stepValue(kind: StepKind, text: string, order: number, powers: readonly string[]): string | null {
  const raw = parseAmount(text, powers);

  if (kind === 'count') {
    if (raw === 0 && order > 0) {
      return '1';
    }
    const size = Math.abs(order);
    const direction = order / size;
    const thousandPower = Math.floor(Math.log(raw) / Math.log(1000));
    let next: number;
    let nextThousandPower: number;

    if (size < 5) {
      next = raw + Math.pow(10, thousandPower * 3 + size - 2) * direction;
      nextThousandPower = Math.floor(Math.log(next) / Math.log(1000));
    } else {
      const powerDelta = COUNT_POWER_DELTA[size];
      if (powerDelta === undefined) {
        return null;
      }
      next = raw * Math.pow(10, powerDelta * direction);
      nextThousandPower = thousandPower;
    }
    const shown = bigNum(next, powers);
    return shown === 'NaN undefined' || next < 1 || nextThousandPower !== thousandPower ? null : shown;
  }

  if (raw === 0 && order > 0) {
    return '1';
  }
  if (order > 5 || order < -5) {
    return null;
  }
  const coefficient = kind === 'comrades' ? 3 : 2;
  const next = raw + Math.pow(10, coefficient * (Math.abs(order) - 1)) * Math.sign(order);
  const shown = bigNum(next, powers);
  return shown === 'NaN undefined' || next < 0 ? '0' : shown;
}
