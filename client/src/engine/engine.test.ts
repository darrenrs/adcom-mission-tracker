import { describe, expect, it } from 'vitest';
import { produce, solveTime } from './core';
import type { Tier } from './model';
import { autobuyEta, offline, offlineEta, offlineRange, online, onlineEta, onlineRange, type Model } from './simulate';

const tier = (id: string, output: number, cycle: number, extra: Partial<Tier> = {}): Tier => ({
  id,
  cycleSeconds: cycle,
  outputPerCycle: output,
  critChance: 0,
  critMultiplier: 1,
  costs: [],
  unlockQty: 0,
  ...extra
});

const chain = [tier('a', 3, 2), tier('b', 4, 4), tier('c', 5, 8)];
const rates = [1.5, 1, 0.625];

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('produce', () => {
  it('matches the online formula, term by term', () => {
    const t = 10;
    const [resource] = online(chain, [7, 2, 3, 4], t);
    const expected = 7 + 2 * rates[0]! * t + (3 * rates[0]! * rates[1]! * t ** 2) / 2 + (4 * rates[0]! * rates[1]! * rates[2]! * t ** 3) / 6;
    expect(resource).toBeCloseTo(expected, 9);
  });

  it('runs offline deepest first', () => {
    const t = 10;
    let counts = [7, 2, 3, 4];
    for (let index = 2; index >= 0; index--) {
      counts = counts.map((value, slot) => (slot === index ? value + (counts[index + 1] as number) * rates[index]! * t : value));
    }
    expect(offline(chain, [7, 2, 3, 4], t)).toEqual(counts);
  });

  it('beats online by n! on the deepest term', () => {
    const [off] = offline(chain, [0, 0, 0, 1], 10);
    const [on] = online(chain, [0, 0, 0, 1], 10);
    expect((off as number) / (on as number)).toBeCloseTo(6, 9);
  });

  it('stops at a tier that does not run', () => {
    expect(produce([0, 0, 5], [2, 0], false)).toEqual([0, 0, 5]);
  });

  it('does not produce NaN from unowned tiers at huge times', () => {
    expect(produce([0, 1, 0, 0], [1e300, 1e300, 1e300], false).every((value) => !Number.isNaN(value))).toBe(true);
  });
});

describe('solveTime', () => {
  it('finds small and huge answers, and gives up on impossible ones', () => {
    expect(solveTime((t) => t >= 0.5)).toBeCloseTo(0.5, 2);
    expect(solveTime((t) => t >= 3e12) / 3e12).toBeCloseTo(1, 6);
    expect(solveTime(() => false)).toBe(Infinity);
    expect(solveTime(() => true)).toBe(0);
  });
});

describe('ETAs', () => {
  const state = { counts: [0, 0, 0, 1], earned: 0, comrades: 0, comradesPerSecond: 0 };
  const model: Model = { tiers: chain, state, goals: [{ kind: 'resource', qty: 1e6 }] };

  it('solves the closed forms exactly', () => {
    const product = rates[0]! * rates[1]! * rates[2]!;
    expect(onlineEta(model)).toBeCloseTo(Math.cbrt((6 * 1e6) / product), 2);
    expect(offlineEta(model)).toBeCloseTo(Math.cbrt(1e6 / product), 2);
  });

  it('waits for the slowest goal', () => {
    const both: Model = { ...model, state: { ...state, comradesPerSecond: 1 }, goals: [{ kind: 'comrades', qty: 5000 }, ...model.goals] };
    expect(onlineEta(both)).toBeCloseTo(5000, 2);
  });

  it('reports a mission that can never finish', () => {
    expect(onlineEta({ ...model, state: { ...state, counts: [0, 0, 0, 0] } })).toBe(Infinity);
  });

  it('is the same on every run', () => {
    expect(onlineEta(model)).toBe(onlineEta(model));
    expect(autobuyEta(model)).toBe(autobuyEta(model));
  });
});

describe('ranges', () => {
  const slow = [tier('a', 3, 2), tier('b', 4, 1024), tier('c', 5, 2048)];
  const model: Model = {
    tiers: slow,
    state: { counts: [0, 0, 0, 10], earned: 0, comrades: 0, comradesPerSecond: 0 },
    goals: [{ kind: 'resource', qty: 1e6 }]
  };

  it('brackets the average when progress is unknown', () => {
    const estimate = onlineEta(model);
    const range = onlineRange(model, estimate, undefined, seeded(1));
    expect(range.low).toBeLessThan(estimate * 1.1);
    expect(range.high).toBeGreaterThan(estimate * 0.9);
    expect(range.high).toBeGreaterThan(range.low);
  });

  it('narrows when the time left on deep tiers is known', () => {
    const estimate = offlineEta(model);
    const unknown = offlineRange(model, undefined, seeded(2));
    const known = offlineRange(model, [0, 0, 0], seeded(2));
    expect(known.high - known.low).toBeLessThanOrEqual(unknown.high - unknown.low);
    expect(estimate).toBeGreaterThan(0);
  });

  it('carries partial offline progress into whole cycles', () => {
    const single: Model = {
      tiers: [tier('a', 1, 4320)],
      state: { counts: [0, 1], earned: 0, comrades: 0, comradesPerSecond: 0 },
      goals: [{ kind: 'resource', qty: 1 }]
    };
    // 72 minutes per cycle, 48 minutes already done: 24 minutes left.
    const range = offlineRange(single, [2880], seeded(3));
    expect(range.low).toBeCloseTo(1440, 0);
    expect(range.high).toBeCloseTo(1440, 0);
  });
});

describe('auto-buy', () => {
  it('reaches a tier goal it could not reach by waiting', () => {
    const costed = [tier('a', 1, 1, { costs: [{ resource: 'res', qty: 10 }] })];
    const model: Model = {
      tiers: costed,
      state: { counts: [0, 1], earned: 0, comrades: 0, comradesPerSecond: 0 },
      goals: [{ kind: 'tier', tier: 0, qty: 1000 }]
    };
    expect(onlineEta(model)).toBe(Infinity);
    expect(autobuyEta(model)).toBeLessThan(Infinity);
  });
});
