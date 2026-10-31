// Turns balance data and a player's saved form into the numbers the engine runs on.
// Tiers are ordered shallow to deep: tiers[0] makes the resource, tiers[1] makes tiers[0], and so on.

import { getValueForResearcherLevel } from '@/domain/gameText';
import type { GameBalance, Generator, Researcher } from '@/domain/types';

export interface FormValues {
  Config: Record<string, unknown>;
  ResearcherLevels: Record<string, number>;
  ResearcherOverrides?: Record<string, number>;
  Counts: Record<string, Record<string, number | undefined> | undefined>;
  Trades: {
    TotalComrades: number;
    Resource: Record<string, TradeValues | undefined>;
  };
}

export interface TradeValues {
  NextCost: string;
  Count: number;
  ComradesPerTrade: number;
  TotalComrades: number;
  IsInvalid: boolean;
}

export const emptyFormValues = (): FormValues => ({
  Config: {},
  ResearcherLevels: {},
  ResearcherOverrides: {},
  Counts: {},
  Trades: { TotalComrades: 1, Resource: {} }
});

export interface TierCost {
  resource: string;
  qty: number;
}

export interface Tier {
  id: string;
  /** Seconds per cycle. Infinity when the generator does not run. */
  cycleSeconds: number;
  /** Output per cycle per generator owned, including power but not crits. */
  outputPerCycle: number;
  critChance: number;
  critMultiplier: number;
  costs: TierCost[];
  unlockQty: number;
}

export interface DerivedValues {
  speed: number;
  power: number;
  critPower: number;
  critChance: number;
  costReduction: number;
}

export interface PropagandaInfo {
  power: number;
}

/** The multiplier of a propaganda boost, or null when the balance has none. */
export function propagandaInfo(balance: GameBalance): PropagandaInfo | null {
  const ads = (balance['Ads'] ?? []) as { Name?: string; Rewards?: { RewardId?: string }[] }[];
  const rewardId = ads.find((ad) => ad.Name === 'Propaganda Boost')?.Rewards?.[0]?.RewardId;
  const experiment = balance.Experiments?.find((candidate) => candidate.Id === rewardId) as
    | { Rewards?: { Value?: number }[] }
    | undefined;
  const power = experiment?.Rewards?.[0]?.Value;
  return typeof power === 'number' ? { power } : null;
}

function targets(researcher: Researcher): string[] {
  return (researcher.TargetIds[0] ?? '').split(/, ?/);
}

function levelValue(researcher: Researcher, form: FormValues): number {
  return getValueForResearcherLevel(
    researcher,
    form.ResearcherLevels[researcher.Id] ?? 0,
    form.ResearcherOverrides?.[researcher.Id]
  );
}

/** Port of getDerivedResearcherValues. Only Common speed researchers exist, and they shorten the cycle. */
export function derivedValues(balance: GameBalance, generator: Generator, form: FormValues): DerivedValues {
  const researchers = balance.Researchers ?? [];
  const crit = generator.Crit ?? { ChancePercent: 0, Multiplier: 1 };
  const industry = (generator.IndustryId ?? '').toLowerCase();
  const matchesIndustry = (researcher: Researcher) => targets(researcher).map((t) => t.toLowerCase()).includes(industry);
  const values: DerivedValues = {
    speed: 1,
    power: 1,
    critPower: crit.Multiplier,
    critChance: crit.ChancePercent / 100,
    costReduction: 1
  };

  for (const researcher of researchers) {
    switch (researcher.ModType) {
      case 'GenManagerAndSpeedMult':
        if (targets(researcher).includes(generator.Id)) {
          values.speed *= levelValue(researcher, form);
        }
        break;
      case 'GeneratorPayoutMultiplier':
        if (targets(researcher).includes(generator.Id) || matchesIndustry(researcher)) {
          values.power *= levelValue(researcher, form);
        }
        break;
      case 'GeneratorCritPowerMult':
        if (matchesIndustry(researcher)) {
          values.critPower *= levelValue(researcher, form);
        }
        break;
      case 'GeneratorCritChance':
        if (matchesIndustry(researcher)) {
          values.critChance += levelValue(researcher, form);
        }
        break;
      case 'GeneratorCostReduction':
        if (matchesIndustry(researcher)) {
          values.costReduction *= levelValue(researcher, form);
        }
        break;
      default:
        break;
    }
  }

  const boost = form.ResearcherLevels['PropagandaBoost'];
  if (boost) {
    values.power *= propagandaInfo(balance)?.power ?? 1;
  }
  return values;
}

export function industryTiers(balance: GameBalance, industryId: string, form: FormValues): Tier[] {
  const generators = (balance.Generators ?? []).filter((generator) => generator.IndustryId === industryId);

  return generators.map((generator) => {
    const values = derivedValues(balance, generator, form);
    return {
      id: generator.Id,
      cycleSeconds: values.speed > 0 ? (generator.BaseCompletionTime ?? 1) / values.speed : Infinity,
      outputPerCycle: (generator.Generate?.Qty ?? 0) * values.power,
      critChance: values.critChance,
      critMultiplier: values.critPower,
      costs: (generator.Cost ?? []).map((cost) => {
        const resource = cost.Resource.toLowerCase();
        const qty = Number(cost.Qty);
        return { resource, qty: resource === 'comrade' ? qty : qty / values.costReduction };
      }),
      unlockQty: generator.Unlock?.Threshold ?? 0
    };
  });
}

/** Expected output multiplier from crits. Exact on average, because crit rolls are independent. */
export function expectedCrit(tier: Tier): number {
  return 1 - tier.critChance + tier.critChance * tier.critMultiplier;
}

/** Average output per second per generator owned. */
export function tierRate(tier: Tier): number {
  return Number.isFinite(tier.cycleSeconds) ? (tier.outputPerCycle / tier.cycleSeconds) * expectedCrit(tier) : 0;
}
