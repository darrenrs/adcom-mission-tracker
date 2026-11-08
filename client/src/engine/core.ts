// The production formula from the Production Mechanics Spec. counts[0] is the resource and counts[g]
// is generator tier g. perTier[g - 1] is what one tier g generator adds to the tier below over the
// period, so one function covers online play, warps and offline periods.

/** `decay` is true for simultaneous production (online, warps), which divides term n by n!. */
export function produce(counts: readonly number[], perTier: readonly number[], decay: boolean): number[] {
  return counts.map((_, tier) => {
    let chain = 1;
    let total = counts[tier] as number;

    for (let source = tier + 1; source < counts.length; source++) {
      chain *= (perTier[source - 1] as number) / (decay ? source - tier : 1);
      if (chain === 0) {
        break;
      }
      const count = counts[source] as number;
      if (count !== 0) {
        total += count * chain;
      }
    }
    return total;
  });
}

/**
 * Seconds a calculation may run to. Far past any real answer, but below the point where production overflows, so
 * Infinity really means the goal can never be reached (nothing produces), not that the answer is merely enormous.
 */
export const MAX_SECONDS = 1e300;

/** Smallest time in [0, high] at which `reached` is true, or Infinity. `reached` must not turn false. */
export function solveTime(reached: (seconds: number) => boolean, high = MAX_SECONDS): number {
  if (reached(0)) {
    return 0;
  }
  if (!reached(high)) {
    return Infinity;
  }

  let low = 0;
  // Growing the bound first keeps precision when the answer is many orders below `high`.
  let upper = 1;
  while (!reached(upper)) {
    low = upper;
    upper *= 2;
  }
  for (let step = 0; step < 80 && upper - low > Math.max(1e-3, low * 1e-9); step++) {
    const middle = (low + upper) / 2;
    if (reached(middle)) {
      upper = middle;
    } else {
      low = middle;
    }
  }
  return upper;
}
