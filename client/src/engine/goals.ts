// What a mission asks for, as engine goals. Ported from the goal logic of simulateProductionMission.

import type { Industry, Mission } from '@/domain/types';
import type { Tier } from './model';
import type { Goal, ProductionState } from './simulate';

/** The goals for a mission, or null if the mission cannot be calculated on this chain. */
export function missionGoals(
  mission: Mission,
  tiers: readonly Tier[],
  state: ProductionState,
  resourceId: string,
  industries: readonly Industry[],
  autobuy: boolean
): Goal[] | null {
  const { ConditionType: type, ConditionId: id, Threshold: threshold } = mission.Condition;

  if (type === 'ResourcesEarnedSinceSubscription') {
    return [{ kind: 'earned', qty: threshold }];
  }

  if (type === 'IndustryUnlocked') {
    const industry = industries.find((candidate) => candidate.Id === id);
    const costResource = industry?.UnlockCostResourceId?.toLowerCase();
    const qty = industry?.UnlockCostResourceQty ?? 0;
    if (costResource === resourceId) {
      return [{ kind: 'resource', qty }];
    }
    return costResource === 'comrade' ? [{ kind: 'comrades', qty }] : null;
  }

  if (type !== 'ResourceQuantity') {
    return null;
  }

  const tierIndex = tiers.findIndex((tier) => tier.id === id);
  const tier = tiers[tierIndex];
  if (!tier) {
    return [{ kind: 'resource', qty: threshold }];
  }
  if (autobuy) {
    return [{ kind: 'tier', tier: tierIndex, qty: threshold }];
  }

  // Own missions are measured by the cost of the generators still needed, which can always be reached.
  const needed = threshold - (state.counts[tierIndex + 1] as number);
  if (needed <= 0) {
    return [];
  }
  return tier.costs.map((cost): Goal => {
    const qty = cost.qty * needed;
    if (cost.resource === 'comrade') {
      return { kind: 'comrades', qty };
    }
    if (cost.resource === resourceId) {
      return { kind: 'resource', qty };
    }
    return { kind: 'tier', tier: tiers.findIndex((candidate) => candidate.id === cost.resource), qty };
  });
}
