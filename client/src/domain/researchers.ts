// Researchers and generators as the calculator and Production page show them, as data and without HTML.
// Ported from sortResearchers, getResearchersByIndustry, getResearcherCard, describeGenerator and friends;
// tests/legacy/researchers.test.ts compares them with the legacy functions.

import type { AssetResolver } from './assets';
import { bigNum, getEta, shortBigNum } from './format';
import {
  describeMission,
  getGenerator,
  getIndustryByResource,
  getResearcherBasicDetails,
  getResourceByIndustry,
  getValueForResearcherLevel,
  researcherName,
  resourceName,
  type GameTextContext
} from './gameText';
import type { GameBalance, Generator, Mission, Researcher } from './types';
import { derivedValues, type FormValues } from '@/engine/model';

const RARITY_ORDER = ['Common', 'Rare', 'Epic', 'Event', 'Supreme', 'LteCommon', 'LteRare'];

const MOD_TYPE_ORDER = [
  'GenManagerAndSpeedMult',
  'GeneratorPayoutMultiplier',
  'GeneratorCostReduction',
  'GeneratorCritChance',
  'GeneratorCritPowerMult',
  'TradePayoutMultiplier'
];

const orders = new WeakMap<GameBalance, Map<string, number>>();

/** Each target id (industry, resource or generator) mapped to the position of its industry. */
function industryOrder(balance: GameBalance): Map<string, number> {
  let map = orders.get(balance);
  if (!map) {
    const industries = balance.Industries ?? [];
    map = new Map(industries.map((industry, index) => [industry.Id, index]));
    // The Nth resource belongs to the Nth industry.
    industries.forEach((_, index) => {
      const resource = balance.Resources?.[index];
      if (resource) {
        map?.set(resource.Id, index);
      }
    });
    for (const generator of balance.Generators ?? []) {
      // Like legacy, a generator whose industry is unknown gets no position.
      const position = map.get(generator.IndustryId ?? '');
      if (position === undefined) {
        map.delete(generator.Id);
      } else {
        map.set(generator.Id, position);
      }
    }
    orders.set(balance, map);
  }
  return map;
}

/**
 * The researchers in the game's own order: by rarity, then the industry they affect, then what they do, then
 * the generator they target. Legacy sorted in place; this returns a new list.
 */
export function sortResearchers(ctx: GameTextContext, researchers: readonly Researcher[]): Researcher[] {
  const { balance } = ctx;
  const rarities = new Map(RARITY_ORDER.map((value, index) => [value, index]));
  const modTypes = new Map(MOD_TYPE_ORDER.map((value, index) => [value, index]));
  const industries = industryOrder(balance);
  const generators = new Map((balance.Generators ?? []).map((generator, index) => [generator.Id, index]));
  // Unknown ranks compare as NaN, which a sort treats as equal, exactly as in legacy.
  const gap = (a: number | undefined, b: number | undefined) => (a ?? NaN) - (b ?? NaN);

  return [...researchers].sort((left, right) => {
    const leftTarget = left.TargetIds[0] ?? '';
    const rightTarget = right.TargetIds[0] ?? '';
    const leftRarity = rarities.get(left.Rarity ?? '');
    const rightRarity = rarities.get(right.Rarity ?? '');
    const leftIndustry = industries.get(leftTarget.toLowerCase());
    const rightIndustry = industries.get(rightTarget.toLowerCase());
    const leftGenerator = generators.get(leftTarget);
    const rightGenerator = generators.get(rightTarget);

    if (left.Rarity !== right.Rarity) {
      return gap(leftRarity, rightRarity);
    }
    if (leftIndustry !== rightIndustry) {
      return gap(leftIndustry, rightIndustry);
    }
    if (left.ModType !== right.ModType) {
      return gap(modTypes.get(left.ModType), modTypes.get(right.ModType));
    }
    if (leftGenerator !== rightGenerator) {
      return gap(leftGenerator, rightGenerator);
    }
    return left.Id.localeCompare(right.Id);
  });
}

/**
 * The researchers that change generators (not trades) in one industry, or in all of them when `industryId` is
 * null. A researcher can name several industries, generators or resources.
 */
export function getResearchersByIndustry(ctx: GameTextContext, industryId: string | null): Researcher[] {
  const { balance } = ctx;
  const industryIds = industryId
    ? [industryId.toLowerCase()]
    : (balance.Industries ?? []).map((industry) => industry.Id.toLowerCase());
  const generators = (balance.Generators ?? []).filter((generator) => !industryId || generator.IndustryId === industryId);
  const resourceIds = industryIds.flatMap((id) => getResourceByIndustry(ctx, id)?.Id.toLowerCase() ?? []);
  const wanted = new Set([...industryIds, ...resourceIds, ...generators.map((generator) => generator.Id.toLowerCase())]);

  return (balance.Researchers ?? []).filter(
    (researcher) =>
      researcher.ModType !== 'TradePayoutMultiplier' &&
      (researcher.TargetIds[0] ?? '').toLowerCase().split(/, ?/).some((id) => wanted.has(id))
  );
}

/** Everything the trades tab shows a card for, in game order. */
export function getTradeResearchers(ctx: GameTextContext): Researcher[] {
  return sortResearchers(ctx, (ctx.balance.Researchers ?? []).filter((researcher) => researcher.ModType === 'TradePayoutMultiplier'));
}

/** Highest level a researcher can reach, or null when the balance does not say. */
export function researcherMaxLevel(balance: GameBalance, researcher: Researcher): number | null {
  const costs = (balance['ResearcherRankCosts'] ?? []) as { Rarity: string; Quantity: number[] }[];
  const cost = costs.find((entry) => entry.Rarity === researcher.Rarity);
  return cost ? cost.Quantity.length + 1 : null;
}

/**
 * The two corner icons of a researcher card: the industry it works in (top left, `multi-industry.png` when it works in
 * several) and the generator it works on (top right). Either is null when the researcher has none, such as a trade
 * researcher, which works on a resource and so shows only its industry.
 */
export function researcherCornerIcons(
  ctx: GameTextContext,
  assets: AssetResolver,
  researcher: Researcher
): { industry: string | null; generator: string | null } {
  const targetId = researcher.TargetIds[0] ?? '';
  if (researcher.TargetIds.length > 1 || targetId.includes(',')) {
    return { industry: assets.iconUrl('multi-industry.png'), generator: null };
  }
  const industryIcon = (industryId: string | undefined) => {
    const resource = industryId ? getResourceByIndustry(ctx, industryId) : undefined;
    return resource ? assets.iconUrl(`${resource.Id}.png`) : null;
  };

  const generator = getGenerator(ctx, targetId);
  if (generator) {
    return { industry: industryIcon(generator.IndustryId), generator: assets.iconUrl(`${generator.Id}.png`) };
  }
  const industry = (ctx.balance.Industries ?? []).find((candidate) => candidate.Id.toLowerCase() === targetId.toLowerCase());
  if (industry) {
    return { industry: industryIcon(industry.Id), generator: null };
  }
  return { industry: industryIcon(getIndustryByResource(ctx, targetId)?.Id), generator: null };
}

export interface ResearcherValueLabel {
  /** `Level 3`, or `Custom` for a value the player typed. */
  level: string;
  /** `x12` for multipliers, `35%` for chances, empty at level 0. */
  value: string;
}

/** What a researcher card prints under the image for a level. */
export function researcherValueLabel(
  ctx: GameTextContext,
  researcher: Researcher,
  level: number
): ResearcherValueLabel {
  const { powers } = ctx.title;
  const amount = getValueForResearcherLevel(researcher, level);
  let value = '';
  if (level !== 0) {
    value = researcher.ExpoMultiplier ? `x${shortBigNum(amount, powers)}` : `${shortBigNum(amount * 100, powers)}%`;
  }
  return { level: `Level ${level}`, value };
}

export type FirstGuaranteed =
  | { kind: 'mission'; mission: Mission; text: string }
  | { kind: 'freeCapsule' }
  | { kind: 'none' };

export interface ResearcherDetails {
  description: string;
  unlockRank: number;
  firstGuaranteed: FirstGuaranteed;
}

/** The mission whose scripted capsule first contains this researcher, among the missions the player can see. */
function firstMissionWithScriptedReward(ctx: GameTextContext, researcher: Researcher, abGroups: readonly string[]): Mission | undefined {
  const capsules = new Set(
    (ctx.balance.GachaScripts ?? []).filter((script) => script.Card.some((card) => card.Id === researcher.Id)).map((script) => script.GachaId)
  );
  const groups = new Set(abGroups);
  return ctx.balance.Missions.find(
    (mission) => (!mission.AbTestConfig || groups.has(mission.AbTestConfig)) && capsules.has(mission.Reward.RewardId)
  );
}

/** What legacy's researcher popover said: the effect, the unlock rank and where the first copies come from. */
export function researcherDetails(ctx: GameTextContext, researcher: Researcher, abGroups: readonly string[]): ResearcherDetails {
  const mission = firstMissionWithScriptedReward(ctx, researcher, abGroups);
  // The first free capsule is the scripted capsule "sc3" in every balance.
  const inFirstFree = ctx.balance.GachaScripts?.find((script) => script.GachaId === 'sc3')?.Card.some((card) => card.Id === researcher.Id);

  let firstGuaranteed: FirstGuaranteed = { kind: 'none' };
  if (mission) {
    firstGuaranteed = { kind: 'mission', mission, text: describeMission(ctx, mission).text };
  } else if (inFirstFree) {
    firstGuaranteed = { kind: 'freeCapsule' };
  }
  return { description: getResearcherBasicDetails(ctx, researcher), unlockRank: researcher.PlayerRankUnlock, firstGuaranteed };
}

export interface PropagandaBoost {
  id: string;
  name: string;
  power: number;
  description: string;
  /** The "on" and "off" artwork. */
  onIconUrl: string;
  offIconUrl: string;
  targetIconUrl: string;
}

/** The propaganda boost every balance offers as an ad, or null when this one has none. */
export function getPropagandaBoost(ctx: GameTextContext, assets: AssetResolver): PropagandaBoost | null {
  const ads = (ctx.balance['Ads'] ?? []) as { Name?: string; Rewards?: { RewardId?: string }[] }[];
  const id = ads.find((ad) => ad.Name === 'Propaganda Boost')?.Rewards?.[0]?.RewardId;
  const experiment = ctx.balance.Experiments?.find((candidate) => candidate.Id === id) as { Rewards?: { Value?: number }[] } | undefined;
  const power = experiment?.Rewards?.[0]?.Value;
  if (id === undefined || typeof power !== 'number') {
    return null;
  }
  return {
    id,
    name: ctx.localization[`experiment.${id}.name`] ?? id,
    power,
    description: `Watch ads or purchase the ${String(ctx.localization['supreme.pass'])} to boost the output of all generators by x${power}`,
    onIconUrl: assets.iconUrl('propaganda_boost_on.png'),
    offIconUrl: assets.active('shared/propaganda_boost_off.png'),
    targetIconUrl: assets.iconUrl('multi-industry.png')
  };
}

export interface GeneratorAmount {
  resourceId: string;
  name: string;
  iconUrl: string;
  amount: number;
  /** `bigNum` of the amount. */
  text: string;
}

export interface GeneratorDetails {
  id: string;
  name: string;
  iconUrl: string;
  costs: GeneratorAmount[];
  output: {
    resourceId: string;
    name: string;
    iconUrl: string;
    perCycle: number;
    perCycleText: string;
    cycleSeconds: number;
    cycleText: string;
  };
  power: number;
  discount: number;
  speed: number;
  critChance: number;
  critPower: number;
  /** Average output of one generator per second, crits included. */
  perSecond: number;
  perSecondText: string;
  bubble: { iconUrl: string; value: number; text: string };
  /** What has to be owned or paid before this generator shows up, or null when nothing. */
  unlock: GeneratorAmount | null;
  automator: { id: string; name: string; details: ResearcherDetails } | null;
}

/** Port of describeGenerator: everything the player wants to know about one generator at the current researcher levels. */
export function generatorDetails(
  ctx: GameTextContext,
  assets: AssetResolver,
  generator: Generator,
  form: FormValues,
  abGroups: readonly string[]
): GeneratorDetails {
  const { balance, title } = ctx;
  const { powers } = title;
  const values = derivedValues(balance, generator, form);
  const amount = (resourceId: string, quantity: number): GeneratorAmount => ({
    resourceId,
    name: String(resourceName(ctx, resourceId)),
    iconUrl: assets.iconUrl(`${resourceId}.png`),
    amount: quantity,
    text: bigNum(quantity, powers)
  });

  const costs = (generator.Cost ?? []).map((cost) => {
    const resource = cost.Resource.toLowerCase();
    const quantity = Number(cost.Qty);
    return amount(resource, resource === 'comrade' ? quantity : quantity / values.costReduction);
  });

  // A Common researcher at level 0 means no speed at all; the page shows the base time then.
  const speed = values.speed || 1;
  const cycleSeconds = (generator.BaseCompletionTime ?? 1) / speed;
  const perCycle = (generator.Generate?.Qty ?? 0) * values.power;
  const perSecond = (perCycle * (values.critChance * values.critPower + 1 - values.critChance)) / cycleSeconds;
  const produced = generator.Generate?.Resource ?? '';

  const reward = (generator as Generator & { ObjectiveReward?: { RewardId: string; Value: number } }).ObjectiveReward;
  const industry = (balance.Industries ?? []).find((candidate) => candidate.Id === generator.IndustryId);
  const unlockQuantity = generator.Unlock?.Threshold ?? 0;
  const industryCost = industry?.UnlockCostResourceQty ?? 0;

  let unlock: GeneratorAmount | null = null;
  if (unlockQuantity > 0 || industryCost > 0) {
    if (unlockQuantity > 0 && generator.Unlock?.ConditionType !== 'IndustryUnlocked') {
      unlock = amount(generator.Unlock?.ConditionId ?? '', unlockQuantity);
    } else {
      unlock = amount((industry?.UnlockCostResourceId ?? '').toLowerCase(), industryCost);
    }
  }

  const automator = (balance.Researchers ?? []).find(
    (researcher) => researcher.ModType === 'GenManagerAndSpeedMult' && researcher.TargetIds[0] === generator.Id
  );

  return {
    id: generator.Id,
    name: String(resourceName(ctx, generator.Id)),
    iconUrl: assets.iconUrl(`${generator.Id}.png`),
    costs,
    output: {
      resourceId: produced,
      name: String(resourceName(ctx, produced)),
      iconUrl: assets.iconUrl(`${produced}.png`),
      perCycle,
      perCycleText: shortBigNum(perCycle, powers),
      cycleSeconds,
      cycleText: getEta(cycleSeconds, powers)
    },
    power: values.power,
    discount: values.costReduction,
    speed,
    critChance: values.critChance,
    critPower: values.critPower,
    perSecond,
    // Legacy printed 1.23e+3 for values between 1,000 and 9,999 here. This prints 1,230.
    perSecondText: perSecond < 1e4
        ? Number(perSecond.toPrecision(3)).toLocaleString(undefined, { maximumSignificantDigits: 3 })
         : shortBigNum(perSecond, powers),
    bubble: {
      iconUrl: assets.active(`${ctx.mode === 'lte' ? 'event' : 'main'}/${reward?.RewardId ?? ''}.png`),
      value: reward?.Value ?? 0,
      text: shortBigNum(reward?.Value ?? 0, powers)
    },
    unlock,
    automator: automator
      ? { id: automator.Id, name: researcherName(ctx, automator), details: researcherDetails(ctx, automator, abGroups) }
      : null
  };
}

/** A generator in its industry, for lists across all industries. Used by the Production page. */
export function industryGenerators(ctx: GameTextContext, industryId: string): Generator[] {
  return (ctx.balance.Generators ?? []).filter((generator) => generator.IndustryId === industryId);
}
