// Names and descriptions of game objects, ported from the legacy tracker without its HTML.
// Everything reads from an explicit context, so switching balance or title needs no cache reset.
// tests/legacy/gameText.test.ts compares the visible text with the legacy functions.

import { bigNum, upperCaseFirstLetter } from './format';
import type { TitleConfig } from './titles';
import type {
  Experiment,
  GameBalance,
  Generator,
  Mission,
  MissionReward,
  Researcher,
  Resource,
  TrackerMode
} from './types';

export interface GameTextContext {
  /** The balance on display: evergreen for Motherland, the event's own balance otherwise. */
  balance: GameBalance;
  /** English text from `parseLocalization`. */
  localization: Readonly<Record<string, string>>;
  title: TitleConfig;
  mode: TrackerMode;
}

export interface MissionDescription {
  /** What the mission asks for, for example `Own Potatoes (1 M)`. No icon and no HTML. */
  text: string;
  /** Icon file name without extension, or null when the condition is unknown. */
  iconResourceId: string | null;
  conditionType: string;
  /**
   * Where the icon lives: `balance` is the current balance's own icons, `event` the shared event
   * icons (used for upgrades and spending in events) and `shared` the title-wide ones.
   */
  iconSource: 'balance' | 'shared' | 'event';
}

export type RewardPartKind = 'resource' | 'capsule' | 'card' | 'text';

export interface RewardPart {
  kind: RewardPartKind;
  /** Resource id (the icon to show), capsule id, researcher id, or empty for plain text. */
  id: string;
  value: number | null;
  /**
   * Visible text, including the spacing legacy printed around icons, so the texts of all parts
   * joined together read as legacy did. Capsule parts hold only that spacing.
   */
  text: string;
  /** Resource parts: the formatted amount. */
  amount?: string;
  /** Resource and card parts: the display name. */
  name?: string;
}

/** Legacy printed the word "undefined" for text the game does not have; so does this. */
const show = (value: string | undefined): string => String(value);

function experimentIconKey(balance: GameBalance, rewardId: string): string {
  const id = rewardId.trim();
  const experiments: Experiment[] = balance.Experiments ?? [];
  const found =
    experiments.find((experiment) => experiment.Id === id) ??
    experiments.find((experiment) => experiment.Id.toLowerCase() === id.toLowerCase());
  return id && found?.IconKey ? String(found.IconKey).trim() : '';
}

// Lookup tables are keyed by the list they were built from, so a new balance gets new tables.
const generatorTables = new WeakMap<readonly Generator[], Map<string, Generator>>();
const resourceTables = new WeakMap<readonly Resource[], Map<string, Resource>>();

function tableFor<T extends { Id: string }>(cache: WeakMap<readonly T[], Map<string, T>>, list: readonly T[]) {
  let table = cache.get(list);
  if (!table) {
    // A later entry replaces an earlier one with the same id, as in legacy.
    table = new Map(list.map((item) => [item.Id, item]));
    cache.set(list, table);
  }
  return table;
}

export function getGenerator(ctx: GameTextContext, id: string): Generator | undefined {
  return tableFor(generatorTables, ctx.balance.Generators ?? []).get(id);
}

export function getResource(ctx: GameTextContext, id: string): Resource | undefined {
  return tableFor(resourceTables, ctx.balance.Resources ?? []).get(id);
}

/** Display name of a resource, or undefined when the game has no text for it. */
export function resourceName(ctx: GameTextContext, resourceId: string, isPluralized = true): string | undefined {
  const { localization } = ctx;
  const experimentName = localization[`experiment.${resourceId}.name`];
  if (experimentIconKey(ctx.balance, resourceId) && experimentName) {
    return experimentName;
  }

  if (resourceId.includes('timehack')) {
    return localization[`store.bundleitem.${resourceId}.${isPluralized ? 'plural' : 'name'}`];
  }

  return localization[`resource.${resourceId}.${isPluralized ? 'plural' : 'singular'}`];
}

export function industryName(ctx: GameTextContext, industryId: string): string | undefined {
  // The game is not consistent about industry capitalization.
  return ctx.localization[industryId.toLowerCase()];
}

/**
 * Display name of a researcher given an id or the researcher itself. Quotes become apostrophes so
 * the name is safe inside an attribute. Legacy throws when the name is missing; this returns the id.
 */
export function researcherName(ctx: GameTextContext, researcherIdOrObj: string | { Id: string } | null | undefined): string {
  let id = '';
  if (typeof researcherIdOrObj === 'string') {
    id = researcherIdOrObj;
  } else if (researcherIdOrObj && 'Id' in researcherIdOrObj) {
    id = researcherIdOrObj.Id;
  }

  return ctx.localization[`researcher.${id}.name`]?.replaceAll('"', "'") ?? id;
}

/** The resource an industry produces. The first N resources belong to the N industries, in order. */
export function getResourceByIndustry(ctx: GameTextContext, industryId: string): Resource | undefined {
  const id = industryId.toLowerCase();
  const industryIndex = (ctx.balance.Industries ?? []).findIndex((industry) => industry.Id === id);
  return industryIndex === -1 ? undefined : ctx.balance.Resources?.[industryIndex];
}

/** The industry a resource belongs to, by the same ordering as `getResourceByIndustry`. */
export function getIndustryByResource(ctx: GameTextContext, resourceId: string) {
  const resourceIndex = (ctx.balance.Resources ?? []).findIndex((resource) => resource.Id === resourceId);
  return resourceIndex === -1 ? undefined : ctx.balance.Industries?.[resourceIndex];
}

/**
 * The multiplier (above 1x) or chance (0 to 1) of a researcher at a level. Level -1 stands for the
 * player's own value, passed as `customOverride`; legacy returns undefined when there is none, this NaN.
 */
export function getValueForResearcherLevel(researcher: Researcher, level: number, customOverride?: number): number {
  if (!level) {
    // Multiplicative researchers default to 1x. Commons are the exception: no production without them.
    return researcher.ExpoMultiplier && researcher.ModType !== 'GenManagerAndSpeedMult' ? 1 : 0;
  }

  if (level === -1) {
    return customOverride ?? NaN;
  }

  const exponentialTotal = researcher.ExpoMultiplier * Math.pow(researcher.ExpoGrowth, level);
  const quadraticTotal =
    researcher.BasePower + level * researcher.CurveModifier + level * level * researcher.UpgradePower;

  return exponentialTotal + quadraticTotal;
}

/** One line describing a researcher's effect at levels 1, 2 and 3. */
export function getResearcherBasicDetails(ctx: GameTextContext, researcher: Researcher): string {
  const { localization } = ctx;
  const industryCount = ctx.balance.Industries?.length ?? 0;
  const first = researcher.TargetIds[0] ?? '';
  const rates = [1, 2, 3].map((level) => getValueForResearcherLevel(researcher, level)) as [number, number, number];
  const [a, b, c] = rates;
  const multipliers = `${a}x/${b}x/${c}x/...`;
  const comrade = show(resourceName(ctx, 'comrade'));
  const industries = (ids: string) => ids.split(/, ?/).map((id) => industryName(ctx, id));

  switch (researcher.ModType) {
    case 'GenManagerAndSpeedMult':
      return `Speeds up ${show(resourceName(ctx, first))} by ${multipliers}`;

    case 'TradePayoutMultiplier': {
      const resources = first.split(/, ?/).map((id) => resourceName(ctx, id));
      if (resources.length === industryCount) {
        return `All ${show(localization['conditionmodel.trade.plural'])} grant ${multipliers} ${comrade}`;
      }
      const wordForTrading = (localization['researcher.tradepayoutmultiplier.single'] ?? '').split(' ')[0];
      return `${wordForTrading} ${resources.join('/')} grants ${multipliers} ${comrade}`;
    }

    case 'GeneratorPayoutMultiplier': {
      // The target is one generator ("Farmer") or a set of industries ("Farming,Landwork,Mining").
      const single = ctx.balance.Resources?.find((resource) => resource.Id === first.toLowerCase());
      if (single) {
        return `Multiplies output of ${show(resourceName(ctx, single.Id))} by ${multipliers}`;
      }
      const names = industries(first);
      if (names.length === industryCount) {
        return `Multiplies output of all generators by ${multipliers}`;
      }
      return `Multiplies output of every ${names.join('/')} generator by ${multipliers}`;
    }

    case 'GeneratorCritChance': {
      const [x, y, z] = rates.map((v) => `${+(v * 100).toFixed(2)}%`);
      const names = industries(first);
      if (names.length === industryCount) {
        return `Increases crit chance of all generators by ${x}/${y}/${z}/...`;
      }
      return `Increases crit chance of every ${names.join('/')} generator by ${x}/${y}/${z}/...`;
    }

    case 'GeneratorCostReduction': {
      const names = industries(first);
      if (names.length === industryCount) {
        return `Lowers cost of all generators by ${multipliers}`;
      }
      return `Lowers cost of every ${names.join('/')} generator by ${multipliers}`;
    }

    case 'GeneratorCritPowerMult': {
      const names = industries(first);
      if (names.length === industryCount) {
        return `Multiplies crit bonus of all generators by ${multipliers}`;
      }
      return `Multiplies crit bonus of every ${names.join('/')} generator by ${multipliers}`;
    }

    // Legacy never described the Gacha* types (marked TODO there) and falls through to this too.
    default:
      return `Unknown researcher ModType ${researcher.ModType}`;
  }
}

/** What a mission asks for, plus which icon goes with it. */
export function describeMission(ctx: GameTextContext, mission: Mission): MissionDescription {
  const { ConditionType: conditionType, ConditionId: id, Threshold: threshold } = mission.Condition;
  const inEvent = ctx.mode === 'event';
  const describe = (
    body: string,
    iconResourceId: string,
    iconSource: MissionDescription['iconSource'] = 'balance'
  ): MissionDescription => ({ text: body, iconResourceId, conditionType, iconSource });

  switch (conditionType) {
    case 'TradesSinceSubscription':
      return describe(
        `${upperCaseFirstLetter(ctx.localization['conditionmodel.trade.singular'])} ${show(resourceName(ctx, id))} (${threshold})`,
        id
      );

    case 'ResearchersUpgradedSinceSubscription':
      return describe(
        `${show(ctx.localization['mission.researchersupgradedsincesubscription.any.simplename'])} (${threshold})`,
        'upgrade',
        inEvent ? 'event' : 'balance'
      );

    case 'ResourceQuantity':
      return describe(`Own ${show(resourceName(ctx, id))} (${bigNum(threshold, ctx.title.powers)})`, id);

    case 'IndustryUnlocked': {
      // Legacy throws when no resource matches the industry; this falls back to the industry id.
      const resourceId = getResourceByIndustry(ctx, id)?.Id ?? id;
      return describe(`Unlock ${show(resourceName(ctx, resourceId))}`, resourceId);
    }

    case 'ResourcesEarnedSinceSubscription':
      return describe(`Collect ${show(resourceName(ctx, id))} (${bigNum(threshold, ctx.title.powers)})`, id);

    case 'ResearcherCardsEarnedSinceSubscription':
      return describe(`Collect Cards (${threshold})`, 'card', 'shared');

    case 'ResourcesSpentSinceSubscription':
      return describe(`Spend ${show(resourceName(ctx, id))} (${threshold})`, id, inEvent ? 'event' : 'balance');

    default:
      return { text: `Unknown mission condition: ${conditionType}`, iconResourceId: null, conditionType, iconSource: 'balance' };
  }
}

/** A single amount of one resource, such as `1 K Gold`. Science is named for the mode: scientists in Motherland, dark science in events. */
export function describeRewardIndividual(ctx: GameTextContext, reward: { RewardId: string; Value?: number }): RewardPart {
  const value = reward.Value ?? null;
  const amount = bigNum(reward.Value ?? NaN, ctx.title.powers);

  if (reward.RewardId === 'science' || reward.RewardId === 'scientist') {
    const id = ctx.mode === 'main' ? 'science' : 'darkscience';
    const name = show(ctx.mode === 'main' ? resourceName(ctx, 'scientist') : resourceName(ctx, id));
    // Legacy shows a text icon here, which is a space; other rewards show an image, which is not text.
    return { kind: 'resource', id, value, text: `${amount} ${name}`, amount, name };
  }

  const name = show(resourceName(ctx, reward.RewardId));
  return { kind: 'resource', id: reward.RewardId, value, text: `${amount}${name}`, amount, name };
}

const label = (labelText: string): RewardPart => ({ kind: 'text', id: '', value: null, text: labelText });
const capsule = (id: string): RewardPart => ({ kind: 'capsule', id, value: null, text: ' ' });

/**
 * What a mission rewards: one resource, a random capsule, or a scripted capsule with its gold,
 * science and researcher cards. `includeCapType` leaves out the "Scripted <capsule>:" lead-in.
 */
export function describeReward(ctx: GameTextContext, reward: MissionReward, includeCapType = true): RewardPart[] {
  switch (reward.Reward) {
    case 'Resources':
      return [describeRewardIndividual(ctx, reward)];

    case 'Gacha': {
      const gacha = ctx.balance.GachaLootTable?.find((entry) => entry.Id === reward.RewardId);
      if (!gacha) {
        return [label(`Unknown gacha reward id: ${reward.RewardId}`)];
      }

      if (gacha.Type !== 'Scripted') {
        return [label('Random '), capsule(reward.RewardId)];
      }

      const script = ctx.balance.GachaScripts?.find((entry) => entry.GachaId === gacha.Id);
      if (!script) {
        // Legacy refers to a variable that does not exist here and throws.
        return [label(`Unknown gacha script id: ${gacha.Id}`)];
      }

      const parts: RewardPart[] = includeCapType ? [label('Scripted '), capsule(script.MimicGachaId), label(':')] : [];
      if (script.Gold) {
        parts.push(describeRewardIndividual(ctx, { RewardId: 'gold', Value: script.Gold }));
      }
      if (script.Science) {
        parts.push(describeRewardIndividual(ctx, { RewardId: 'science', Value: script.Science }));
      }
      for (const card of script.Card) {
        const name = researcherName(ctx, card.Id);
        parts.push({ kind: 'card', id: card.Id, value: card.Value, text: `${card.Value}x ${name}`, name });
      }
      return parts;
    }

    default:
      return [label(`Unknown reward: ${reward.Reward}`)];
  }
}

/** The parts of a reward as one string. */
export function rewardText(parts: readonly RewardPart[]): string {
  return parts.map((part) => part.text).join('');
}
