// A mission's progress. Own missions read the amounts entered on Game View, and editing one edits the other.
// Every other mission type keeps a typed number per mission.

import { getResourceByIndustry, type GameTextContext } from '@/domain/gameText';
import type { Mission } from '@/domain/types';
import type { FormValues } from '@/engine/model';
import { applyCount, COMRADES_KEY, generatorKey, RESOURCE_KEY } from '@/features/calculator/fields';

/** Where an Own mission's number lives in the saved form. */
interface CountSlot {
  resourceId: string;
  key: string;
  /** The name of the number inside `form.Counts[resourceId]`. */
  field: string;
}

function countSlot(ctx: GameTextContext, mission: Mission): CountSlot | null {
  const { ConditionType: type, ConditionId: id } = mission.Condition;
  if (type !== 'ResourceQuantity') {
    return null;
  }
  const generator = ctx.balance.Generators?.find((candidate) => candidate.Id === id);
  const resource = generator ? getResourceByIndustry(ctx, generator.IndustryId ?? '') : undefined;
  if (resource) {
    return { resourceId: resource.Id, key: generatorKey(id), field: id };
  }
  return { resourceId: id, key: id === 'comrade' ? COMRADES_KEY : RESOURCE_KEY, field: id };
}

/** Unlock missions have no amount, so they count from 0 to 1. */
export function missionGoal(mission: Mission): number {
  return Number(mission.Condition.Threshold) || 1;
}

export function readProgress(ctx: GameTextContext, form: FormValues, typed: Readonly<Record<string, number>>, mission: Mission): number {
  const slot = countSlot(ctx, mission);
  return (slot ? form.Counts[slot.resourceId]?.[slot.field] : typed[mission.Id]) ?? 0;
}

/** Writes an Own mission's progress into the form. Returns false when the mission's progress is typed instead. */
export function writeLinkedProgress(ctx: GameTextContext, form: FormValues, mission: Mission, value: number, now: number): boolean {
  const slot = countSlot(ctx, mission);
  if (slot) {
    applyCount(form, slot.resourceId, slot.key, value, now);
  }
  return slot !== null;
}

/** Whether the mission's progress follows the entered amounts. */
export function isLinkedProgress(ctx: GameTextContext, mission: Mission): boolean {
  return countSlot(ctx, mission) !== null;
}
