// Import Counts: moves counts saved some time ago forward to now. Legacy did this one second at a time,
// which undershoots; the production formula gives the same average in one step.

import type { Tier } from './model';
import { online } from './simulate';

/**
 * Counts after `seconds` of online play with no purchases. `counts[0]` is the resource and `counts[g]` is tier
 * g - 1 of `tiers`, as in `online`. Negative or non-finite times change nothing.
 */
export function projectForward(tiers: readonly Tier[], counts: readonly number[], seconds: number): number[] {
  if (!(seconds > 0) || !Number.isFinite(seconds)) {
    return [...counts];
  }
  return online(tiers, counts, seconds);
}

/** Comrades earned at a steady rate since the last time they were typed in. */
export function projectComrades(comrades: number, perSecond: number, seconds: number): number {
  return comrades + perSecond * Math.max(0, seconds);
}
