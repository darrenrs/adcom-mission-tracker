// Numbers and text for a generator's info panel and Game View's notes, kept apart from the components.

import { getEta, shortBigNum } from './format';
import { researcherValueLabel, getResearchersByIndustry, researcherMaxLevel } from './researchers';
import type { GameTextContext } from './gameText';
import type { Researcher } from './types';

/** Rounds to three significant figures and keeps the trailing zeros: 250, 25.0, 2.50. */
function threeFigures(value: number): string {
  const rounded = Number(value.toPrecision(3));
  if (rounded >= 100) {
    return rounded.toFixed(0);
  }
  return rounded >= 10 ? rounded.toFixed(1) : rounded.toFixed(2);
}

/**
 * A cycle time. Under a second it shows milliseconds or microseconds with three significant figures
 * (250ms, 25.0ms, 2.50ms, 250μs); a second or more uses the usual countdown text.
 */
export function formatCycleTime(seconds: number, powers: readonly string[]): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '-';
  }
  if (seconds >= 1) {
    return getEta(seconds, powers);
  }

  const milliseconds = Number((seconds * 1e3).toPrecision(3));
  if (milliseconds >= 1) {
    return milliseconds >= 1e3 ? getEta(1, powers) : `${threeFigures(milliseconds)}ms`;
  }
  const microseconds = Number((seconds * 1e6).toPrecision(3));
  // Under one microsecond the figures stay in microseconds, such as 0.250μs.
  return `${threeFigures(microseconds)}μs`;
}

/** An amount of a resource with three significant figures below 10,000 and game notation above. */
export function formatAmount(value: number, powers: readonly string[]): string {
  if (value < 1e4) {
    return Number(value.toPrecision(3)).toLocaleString(undefined, { maximumSignificantDigits: 3 });
  }
  return shortBigNum(value, powers);
}

/** What one cycle gives on average: crits make some cycles pay more. */
export function expectedCritFactor(critChance: number, critPower: number): number {
  return 1 - critChance + critChance * critPower;
}

export interface GeneratesFigures {
  basePerCycle: number;
  averagePerCycle: number;
  basePerSecond: number;
  averagePerSecond: number;
}

export function generatesFigures(perCycle: number, cycleSeconds: number, critChance: number, critPower: number): GeneratesFigures {
  const factor = expectedCritFactor(critChance, critPower);
  return {
    basePerCycle: perCycle,
    averagePerCycle: perCycle * factor,
    basePerSecond: perCycle / cycleSeconds,
    averagePerSecond: (perCycle * factor) / cycleSeconds
  };
}

export interface LevelValue {
  level: number;
  /** `x4`, or a percentage for chances. */
  text: string;
}

/** The value of a researcher at each level from 1 to its maximum. */
export function researcherLevelValues(ctx: GameTextContext, researcher: Researcher): LevelValue[] {
  const max = researcherMaxLevel(ctx.balance, researcher) ?? 3;
  return Array.from({ length: max }, (_, index) => ({
    level: index + 1,
    text: researcherValueLabel(ctx, researcher, index + 1).value
  }));
}

/** Whether any researcher that changes this industry's generators is at level 1 or higher. */
export function hasActiveResearcher(ctx: GameTextContext, industryId: string, levels: Readonly<Record<string, number>>): boolean {
  return getResearchersByIndustry(ctx, industryId).some((researcher) => (levels[researcher.Id] ?? 0) >= 1);
}
