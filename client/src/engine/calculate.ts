// The one entry point for an ETA. Runs in the Web Worker, so its input must be plain data.

import { getIndustryByResource, getGenerator, type GameTextContext } from '@/domain/gameText';
import type { Mission } from '@/domain/types';
import { missionGoals } from './goals';
import { industryTiers, tierRate, type FormValues } from './model';
import {
  autobuyEta,
  offlineEta,
  offlineRange,
  onlineEta,
  onlineRange,
  type EtaRange,
  type Model,
  type Progress,
  type Random
} from './simulate';

export type CalculationMode = 'online' | 'offline';

export interface CalculationOptions {
  mode: CalculationMode;
  autobuy: boolean;
  comradesOnly: boolean;
  /** Seconds already done in each tier's cycle, from the time left the player entered. */
  progress: Progress;
}

export interface CalculationInput {
  model: Model;
  options: CalculationOptions;
}

export interface CalculationResult {
  seconds: number;
  range: EtaRange | null;
}

export interface MissionCounts {
  /** Generator counts, shallow to deep. */
  generators: number[];
  resource: number;
  earned: number;
  comrades: number;
  comradesPerSecond: number;
}

/** The industry a calculator runs on. An Unlock mission runs on the industry before the one it unlocks. */
export function calculatorIndustryId(ctx: GameTextContext, mission: Mission): string | null {
  const { ConditionType: type, ConditionId: id } = mission.Condition;
  if (type === 'IndustryUnlocked') {
    const industries = ctx.balance.Industries ?? [];
    return industries[industries.findIndex((industry) => industry.Id === id) - 1]?.Id ?? null;
  }
  return getGenerator(ctx, id)?.IndustryId ?? getIndustryByResource(ctx, id)?.Id ?? null;
}

export function buildCalculation(
  ctx: GameTextContext,
  mission: Mission,
  resourceId: string,
  industryId: string,
  counts: MissionCounts,
  form: FormValues,
  options: CalculationOptions
): CalculationInput | null {
  const tiers = industryTiers(ctx.balance, industryId, form);
  const state = {
    counts: [counts.resource, ...tiers.map((_, index) => counts.generators[index] ?? 0)],
    earned: counts.earned,
    comrades: counts.comrades,
    comradesPerSecond: counts.comradesPerSecond
  };
  const goals = missionGoals(mission, tiers, state, resourceId, ctx.balance.Industries ?? [], options.autobuy);
  if (!goals) {
    return null;
  }
  return {
    model: { tiers, state, goals: options.comradesOnly ? goals.filter((goal) => goal.kind === 'comrades') : goals },
    options
  };
}

/** True when whole cycles or crits could visibly move this result, so a range is worth showing. */
function hasSlowTier({ tiers }: Model, seconds: number): boolean {
  return tiers.some((tier) => tierRate(tier) > 0 && seconds / tier.cycleSeconds < 200);
}

export function calculate({ model, options }: CalculationInput, random: Random = Math.random): CalculationResult {
  const known = options.progress.some((value) => value !== null);

  if (options.autobuy && options.mode === 'online') {
    return { seconds: autobuyEta(model), range: null };
  }

  const estimate = options.mode === 'online' ? onlineEta(model) : offlineEta(model);
  if (!Number.isFinite(estimate) || options.comradesOnly || !(known || hasSlowTier(model, estimate))) {
    return { seconds: estimate, range: null };
  }

  const range =
    options.mode === 'online' ? onlineRange(model, estimate, options.progress, random) : offlineRange(model, options.progress, random);
  return { seconds: known ? range.middle : estimate, range };
}
