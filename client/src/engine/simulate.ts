// Everything that needs more than one evaluation of the formula: goals, cycles, auto-buy and ranges.

import { produce, solveTime } from './core';
import { tierRate, type Tier } from './model';

export type Goal =
  | { kind: 'resource'; qty: number }
  | { kind: 'earned'; qty: number }
  | { kind: 'tier'; tier: number; qty: number }
  | { kind: 'comrades'; qty: number };

export interface ProductionState {
  /** counts[0] is the resource, counts[g] is tier g - 1 of `tiers`. */
  counts: number[];
  /** Resource earned so far towards a Collect mission. */
  earned: number;
  comrades: number;
  comradesPerSecond: number;
}

export interface Model {
  tiers: Tier[];
  state: ProductionState;
  goals: Goal[];
}

/** Seconds already done in each tier's cycle. Null means unknown. */
export type Progress = readonly (number | null)[];

const SLOW_TIER_CYCLES = 200;
const SAMPLES = 201;

function goalMet(goal: Goal, counts: readonly number[], earned: number, comrades: number): boolean {
  switch (goal.kind) {
    case 'resource':
      return (counts[0] as number) >= goal.qty;
    case 'earned':
      return earned >= goal.qty;
    case 'tier':
      return (counts[goal.tier + 1] as number) >= goal.qty;
    case 'comrades':
      return comrades >= goal.qty;
  }
}

function met(goals: readonly Goal[], state: ProductionState, counts: readonly number[], seconds: number): boolean {
  const earned = state.earned + (counts[0] as number) - (state.counts[0] as number);
  const comrades = state.comrades + state.comradesPerSecond * seconds;
  return goals.every((goal) => goalMet(goal, counts, earned, comrades));
}

/** Average online result after `seconds`, also used for warps. */
export function online(tiers: readonly Tier[], counts: readonly number[], seconds: number): number[] {
  return produce(counts, tiers.map((tier) => tierRate(tier) * seconds), true);
}

/** Average offline result after `seconds`, deepest tier first. */
export function offline(tiers: readonly Tier[], counts: readonly number[], seconds: number): number[] {
  return produce(counts, tiers.map((tier) => tierRate(tier) * seconds), false);
}

/** Time for every goal to be met online with no purchases. Infinity if a goal is out of reach. */
export function onlineEta({ tiers, state, goals }: Model): number {
  return solveTime((seconds) => met(goals, state, online(tiers, state.counts, seconds), seconds));
}

export function offlineEta({ tiers, state, goals }: Model): number {
  return solveTime((seconds) => met(goals, state, offline(tiers, state.counts, seconds), seconds));
}

export type Random = () => number;

/** Number of crits in `cycles` rolls. Large counts use the normal approximation to stay fast. */
function critCount(cycles: number, chance: number, random: Random): number {
  if (chance <= 0) {
    return 0;
  }
  if (cycles * chance * (1 - chance) > 25) {
    const normal = Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
    return Math.max(0, Math.min(cycles, Math.round(cycles * chance + normal * Math.sqrt(cycles * chance * (1 - chance)))));
  }
  let crits = 0;
  for (let roll = 0; roll < cycles; roll++) {
    if (random() < chance) {
      crits += 1;
    }
  }
  return crits;
}

/** One offline period with whole cycles, carried progress and rolled crits. */
function offlineSample(tiers: readonly Tier[], counts: readonly number[], seconds: number, progress: readonly number[], random: Random) {
  const perTier = tiers.map((tier, index) => {
    if (!Number.isFinite(tier.cycleSeconds)) {
      return 0;
    }
    const cycles = Math.floor(((progress[index] as number) + seconds) / tier.cycleSeconds);
    const crits = critCount(cycles, tier.critChance, random);
    return tier.outputPerCycle * (cycles + crits * (tier.critMultiplier - 1));
  });
  return produce(counts, perTier, false);
}

function resolveProgress(tiers: readonly Tier[], known: Progress | undefined, random: Random): number[] {
  return tiers.map((tier, index) => {
    const value = known?.[index];
    if (value !== null && value !== undefined) {
      return value;
    }
    return Number.isFinite(tier.cycleSeconds) ? random() * tier.cycleSeconds : 0;
  });
}

/** One online run where slow tiers pay out in whole cycles and fast tiers run on the formula between payouts. */
function onlineSample({ tiers, state, goals }: Model, estimate: number, known: Progress | undefined, random: Random): number {
  const progress = resolveProgress(tiers, known, random);
  const slow = tiers.map((tier) => Number.isFinite(tier.cycleSeconds) && estimate / tier.cycleSeconds < SLOW_TIER_CYCLES);
  const rates = tiers.map((tier, index) => (slow[index] ? 0 : tierRate(tier)));
  const next = tiers.map((tier, index) => (slow[index] ? tier.cycleSeconds - (progress[index] as number) : Infinity));
  const horizon = Math.max(estimate * 20, 3600);

  let counts = [...state.counts];
  let now = 0;

  while (now < horizon) {
    const due = Math.min(...next);
    const until = Math.min(due, horizon);
    const step = until - now;
    const start = counts;
    const advance = (seconds: number) => produce(start, rates.map((rate) => rate * seconds), true);

    if (met(goals, state, advance(step), until)) {
      return now + solveTime((seconds) => met(goals, state, advance(seconds), now + seconds), step);
    }
    counts = advance(step);
    now = until;

    tiers.forEach((tier, index) => {
      if (next[index] === due) {
        const crit = random() < tier.critChance ? tier.critMultiplier : 1;
        counts[index] = (counts[index] as number) + tier.outputPerCycle * crit * (counts[index + 1] as number);
        next[index] = due + tier.cycleSeconds;
      }
    });
    if (met(goals, state, counts, now)) {
      return now;
    }
  }
  return Infinity;
}

export interface EtaRange {
  low: number;
  middle: number;
  high: number;
}

function percentile(sorted: readonly number[], fraction: number): number {
  return sorted[Math.round((sorted.length - 1) * fraction)] as number;
}

/** 10th to 90th percentile across unknown cycle progress and crit luck. */
function rangeOf(sample: () => number): EtaRange {
  const samples = Array.from({ length: SAMPLES }, sample).sort((a, b) => a - b);
  return { low: percentile(samples, 0.1), middle: percentile(samples, 0.5), high: percentile(samples, 0.9) };
}

export function onlineRange(model: Model, estimate: number, known: Progress | undefined, random: Random): EtaRange {
  return rangeOf(() => onlineSample(model, estimate, known, random));
}

export function offlineRange({ tiers, state, goals }: Model, known: Progress | undefined, random: Random): EtaRange {
  return rangeOf(() => {
    const progress = resolveProgress(tiers, known, random);
    return solveTime((seconds) => met(goals, state, offlineSample(tiers, state.counts, seconds, progress, random), seconds));
  });
}

interface AutobuyState {
  counts: number[];
  earned: number;
  comrades: number;
  /** The tier being bought, or -1 when none is owned yet. */
  target: number;
}

/** Produces for `seconds`, then spends everything affordable on the target tier, moving deeper once it unlocks. */
function autobuyStep(
  tiers: readonly Tier[],
  usable: readonly boolean[],
  goals: readonly Goal[],
  from: AutobuyState,
  comradesPerSecond: number,
  seconds: number
): AutobuyState {
  const counts = online(tiers, from.counts, seconds);
  const earned = from.earned + (counts[0] as number) - (from.counts[0] as number);
  let comrades = from.comrades + comradesPerSecond * seconds;
  let target = from.target;

  const slot = (resource: string) => {
    const index = tiers.findIndex((tier) => tier.id === resource);
    return index === -1 ? 0 : index + 1;
  };
  // Generators an Own mission counts are never spent on deeper ones.
  const reserved = new Map<number, number>();
  for (const goal of goals) {
    if (goal.kind === 'tier') {
      reserved.set(goal.tier + 1, Math.max(reserved.get(goal.tier + 1) ?? 0, goal.qty));
    }
  }
  const stock = (resource: string, keep: boolean) => {
    if (resource === 'comrade') {
      return comrades;
    }
    const index = slot(resource);
    return Math.max(0, (counts[index] as number) - (keep ? (reserved.get(index) ?? 0) : 0));
  };
  const affordable = (tier: Tier, keep: boolean) =>
    Math.max(0, Math.floor(Math.min(...tier.costs.map((cost) => stock(cost.resource, keep) / cost.qty), Infinity)));
  const purchase = (index: number, buy: number) => {
    for (const cost of (tiers[index] as Tier).costs) {
      if (cost.resource === 'comrade') {
        comrades -= cost.qty * buy;
      } else {
        counts[slot(cost.resource)] = (counts[slot(cost.resource)] as number) - cost.qty * buy;
      }
    }
    counts[index + 1] = (counts[index + 1] as number) + buy;
  };

  // An Own mission's generators are bought as soon as all that are still needed can be paid for, as a player would.
  for (const goal of goals) {
    const needed = goal.kind === 'tier' ? goal.qty - (counts[goal.tier + 1] as number) : 0;
    const tier = goal.kind === 'tier' ? tiers[goal.tier] : undefined;
    if (goal.kind === 'tier' && tier && needed > 0 && affordable(tier, false) >= needed) {
      purchase(goal.tier, Math.ceil(needed));
    }
  }

  const tier = tiers[target];
  if (tier) {
    const buy = affordable(tier, true);
    if (Number.isFinite(buy) && buy > 0) {
      purchase(target, buy);
    }

    const deeper = tiers[target + 1];
    if (deeper && usable[target + 1] && (counts[target + 1] as number) >= deeper.unlockQty) {
      target += 1;
      counts[target + 1] = Math.max(counts[target + 1] as number, 1);
    }
  }
  return { counts, earned, comrades, target };
}

/**
 * Online with auto-buy on the deepest owned tier, plus the mission's own generators once they are affordable.
 * Steps grow with time, so very long runs stay quick.
 */
export function autobuyEta({ tiers, state, goals }: Model): number {
  const usable = tiers.map((tier) => tierRate(tier) > 0);
  let target = -1;
  for (let index = tiers.length - 1; index >= 0; index--) {
    if ((state.counts[index + 1] as number) > 0) {
      target = index;
      break;
    }
  }

  const done = ({ counts, earned, comrades }: AutobuyState) => goals.every((goal) => goalMet(goal, counts, earned, comrades));
  let current: AutobuyState = { counts: [...state.counts], earned: state.earned, comrades: state.comrades, target };
  if (done(current)) {
    return 0;
  }
  let now = 0;

  while (now < 1e15) {
    const step = Math.max(1, now * 0.01);
    const next = autobuyStep(tiers, usable, goals, current, state.comradesPerSecond, step);
    if (done(next)) {
      // The goal was reached somewhere inside this step: find where, rather than reporting the step's end.
      const from = current;
      return now + solveTime((seconds) => done(autobuyStep(tiers, usable, goals, from, state.comradesPerSecond, seconds)), step);
    }
    current = next;
    now += step;
  }
  return Infinity;
}

