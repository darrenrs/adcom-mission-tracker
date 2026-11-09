// What the mission screens show, as data and without HTML. Ported from renderMissionButton,
// getRewardIcon, describeScheduleRankReward and the rank popover of the legacy tracker.
// tests/legacy/missionView.test.ts compares tone, icons and rank labels with the legacy functions.

import type { AssetResolver } from './assets';
import { bigNum } from './format';
import { amountValue } from './inputSteps';
import {
  getResearcherBasicDetails,
  resourceName,
  researcherName,
  type GameTextContext,
  type MissionDescription
} from './gameText';
import { availableAbGroups, type BoardMission, type MissionBoard } from './missions';
import type { LteInfo, GameBalance, Mission, ScheduleReward } from './types';

export type MissionTone = 'danger' | 'success' | 'neutral';

/** Spending and upgrading are red, cards and dark science green: players rely on these colours. */
export function missionTone(mission: Mission): MissionTone {
  const { ConditionType: type, ConditionId: id } = mission.Condition;
  if (type === 'ResourcesSpentSinceSubscription' || type === 'ResearchersUpgradedSinceSubscription') {
    return 'danger';
  }
  if (type === 'ResearcherCardsEarnedSinceSubscription' || (type === 'ResourcesEarnedSinceSubscription' && id === 'darkscience')) {
    return 'success';
  }
  return 'neutral';
}

/** The icon next to a mission's text, or null when the condition is unknown. */
export function missionIconUrl(description: MissionDescription, assets: AssetResolver): string | null {
  if (description.iconResourceId === null) {
    return null;
  }
  const file = `${description.iconResourceId}.png`;
  switch (description.iconSource) {
    case 'shared':
      return assets.iconUrl(file, assets.active('shared'));
    case 'event':
      return assets.iconUrl(file, assets.active('event'));
    default:
      return assets.iconUrl(file);
  }
}

export interface MissionRewardIcon {
  /** Empty when the reward has no icon. */
  url: string;
  /** A scripted capsule, whose contents are known in advance. Legacy drew a ring around its icon. */
  scripted: boolean;
}

export function missionRewardIcon(mission: Mission, balance: GameBalance, assets: AssetResolver): MissionRewardIcon {
  const { Reward: type, RewardId: id } = mission.Reward;

  if (type === 'Gacha') {
    const script = (balance.GachaScripts ?? []).find((entry) => entry.GachaId === id);
    return { url: assets.active(`shared/gacha/${script ? script.MimicGachaId : id}.png`), scripted: Boolean(script) };
  }

  if (type === 'Resources') {
    if (id === 'gold') {
      return { url: assets.active('shared/gold.png'), scripted: false };
    }
    if (id.includes('timehack_')) {
      return { url: assets.active(`shared/timewarps/${id}.png`), scripted: false };
    }
    return { url: assets.experimentIcon(id) || assets.active(`main/${id}.png`), scripted: false };
  }

  if (type === 'Experiment') {
    return { url: assets.experimentIcon(id) || assets.active(`main/${id}.png`), scripted: false };
  }
  return { url: '', scripted: false };
}

/** The icon of a reward in an event's rank list. Paths are built without the extension first, as legacy did. */
export function rewardIconUrl(reward: ScheduleReward, assets: AssetResolver): string {
  const { Reward: type, RewardId: id } = reward;
  let path: string;

  switch (type) {
    case 'Gacha':
      path = assets.active(`shared/gacha/${id}`);
      break;
    case 'Researcher':
      path = assets.active(`shared/card/card-${id}`);
      break;
    case 'Experiment':
      path = assets.experimentIcon(id) || assets.active(`main/${id}`);
      break;
    default:
      if (id.includes('timehack')) {
        path = assets.active(`shared/timewarps/${id}`);
      } else {
        path = assets.experimentIcon(id) || (id === 'gold' ? assets.active('shared/gold') : assets.active(`main/${id}`));
      }
  }
  return path.toLowerCase().endsWith('.png') ? path : `${path}.png`;
}

export interface RankProgress {
  rank: number;
  /** Missions completed in this rank. */
  done: number;
  /** Missions in this rank. Zero when the rank has none. */
  total: number;
  /** Every mission of the event is complete. */
  finished: boolean;
}

/** The rank on display and how far through it the player is. Event completions count through the ranks in order. */
export function rankProgress(board: MissionBoard): RankProgress {
  if (board.mode === 'lte') {
    let left = board.completed.length;
    let last = { rank: 1, size: 0 };
    for (let rank = 1; rank <= board.rankCount; rank++) {
      const size = board.rankSizes.get(rank);
      if (size === undefined) {
        continue;
      }
      if (left < size) {
        return { rank, done: left, total: size, finished: false };
      }
      left -= size;
      last = { rank, size };
    }
    return { rank: last.rank, done: last.size, total: last.size, finished: last.size > 0 };
  }

  const size = board.rankSizes.get(board.evergreenRank) ?? 0;
  const waiting = board.ranks.get(board.evergreenRank)?.length ?? 0;
  return { rank: board.evergreenRank, done: size ? size - waiting - board.current.length : 0, total: size, finished: false };
}

export interface ScheduleRewardView {
  /** Empty when there is nothing to show. */
  iconUrl: string;
  text: string;
}

interface AvatarEntry {
  Rarity?: string;
  VisualKey?: string;
  UnlockLocation?: { ThemeId?: string };
  BalancesIncluded?: string[];
}

/** Legacy ends up with the last avatar that matches, so this does too. */
function lteAvatar(avatars: AvatarEntry[], lteInfo: Pick<LteInfo, 'ThemeId' | 'BalanceId'> | null, ctx: GameTextContext) {
  let found: AvatarEntry | undefined;
  for (const avatar of avatars) {
    if (avatar.UnlockLocation) {
      const themeId = avatar.UnlockLocation.ThemeId;
      const duplicate = lteInfo ? ctx.title.themeDuplicateOverrides[lteInfo.ThemeId] : undefined;
      if (themeId !== undefined && lteInfo && (themeId === lteInfo.ThemeId || themeId === duplicate)) {
        found = avatar;
      }
    } else if (lteInfo && avatar.BalancesIncluded?.includes(lteInfo.BalanceId)) {
      found = avatar;
    }
  }
  return found;
}

/** One reward of an event rank, such as `2x Rare Researchers` or `Wood Capsule`. */
export function describeScheduleReward(
  reward: ScheduleReward,
  ctx: GameTextContext,
  assets: AssetResolver,
  lteInfo: Pick<LteInfo, 'ThemeId' | 'BalanceId'> | null,
  common: Readonly<Record<string, unknown>> | undefined
): ScheduleRewardView {
  const { localization } = ctx;
  const iconUrl = rewardIconUrl(reward, assets);
  const plural = Number(reward.Value) !== 1;

  switch (reward.Reward) {
    case 'Resources': {
      // Some values arrive as text with a thousands comma.
      const value = parseInt(String(reward.Value).replace(',', ''));
      const name = resourceName(ctx, reward.RewardId, plural) ?? reward.RewardId;
      return { iconUrl, text: `${bigNum(value, ctx.title.powers)}x ${name}` };
    }

    case 'Gacha': {
      const name = localization[`gacha.${reward.RewardId}.name`]?.replace('Capsule', '').trim() ?? reward.RewardId;
      return { iconUrl, text: `${name} Capsule` };
    }

    case 'Researcher': {
      const rarity = localization[`researcher.rarity.${reward.RewardId}.name`] ?? reward.RewardId;
      const word = localization[`conditionmodel.researcher.${plural ? 'plural' : 'singular'}`] ?? 'researcher';
      return { iconUrl, text: `${String(reward.Value)}x ${rarity} ${word}` };
    }

    case 'Avatar': {
      const avatars = Array.isArray(common?.['Avatars']) ? (common['Avatars'] as AvatarEntry[]) : [];
      const avatar = reward.RewardId === 'LTE AVATAR' ? lteAvatar(avatars, lteInfo, ctx) : undefined;
      if (!avatar) {
        return { iconUrl: '', text: 'Unknown Avatar Reward' };
      }
      const file = avatar.VisualKey ?? '';
      return {
        iconUrl: assets.active(`shared/avatars/${file.toLowerCase().endsWith('.png') ? file : `${file}.png`}`),
        text: localization[`avatar.avatar.rarity.${(avatar.Rarity ?? '').toLowerCase()}`] ?? 'Avatar'
      };
    }

    default:
      return { iconUrl: '', text: `Unknown reward: ${reward.Reward}` };
  }
}

export interface RankResearcher {
  id: string;
  name: string;
  description: string;
}

export interface FirstFreeCapsule {
  /** Dark science in the capsule, when it has any. */
  science: number | null;
  scienceIconUrl: string;
  cardIconUrl: string;
  cards: { value: number; name: string }[];
}

export interface LteRankDetails {
  completionRewards: ScheduleRewardView[];
  firstFreeCapsule: FirstFreeCapsule | null;
  /** The game's word for researchers, for the heading of the list below. */
  researchersLabel: string;
  researchers: RankResearcher[];
  /** Whether there is anything to show. Legacy showed no info button otherwise. */
  hasContent: boolean;
}

export interface LteRankSource {
  ctx: GameTextContext;
  assets: AssetResolver;
  lteInfo: LteInfo | null;
  /** The `common` balance, which holds the avatars. */
  common: Readonly<Record<string, unknown>> | undefined;
}

function completionRewards(rank: number, { ctx, assets, lteInfo, common }: LteRankSource): ScheduleRewardView[] {
  const ranks = ctx.balance.Ranks ?? [];
  const rewards = lteInfo?.Rewards ?? [];
  // Event overrides have no reward data: empty slots.
  if (rank >= ranks.length || rewards[0] === undefined) {
    return [];
  }

  const view = (reward: ScheduleReward) => describeScheduleReward(reward, ctx, assets, lteInfo, common);

  if (ctx.title.isAges) {
    const reward = rewards[rank - 1] as ScheduleReward | undefined;
    return reward ? [view(reward)] : [];
  }

  const milestone = rewards.find((entry) => (entry as { Rank?: number } | undefined)?.Rank === rank);
  if (!milestone) {
    return [];
  }
  return Object.keys(milestone)
    .filter((key) => key.includes('MilestoneReward'))
    .map((key) => view((milestone as unknown as Record<string, ScheduleReward>)[key] as ScheduleReward));
}

function firstFreeCapsule(rank: number, { ctx, assets }: LteRankSource): FirstFreeCapsule | null {
  const scriptId = ctx.balance.GachaFreeCycle?.[0]?.ScriptId;
  if (rank !== 1 || !scriptId) {
    return null;
  }
  const script = ctx.balance.GachaScripts?.find((entry) => entry.GachaId === scriptId);
  if (!script) {
    return null;
  }
  return {
    science: script.Science ?? null,
    scienceIconUrl: assets.active('event/darkscience.png'),
    cardIconUrl: assets.active('shared/card.png'),
    cards: script.Card.map((card) => ({ value: card.Value, name: researcherName(ctx, card.Id) }))
  };
}

/** What legacy's rank popover showed: the completion rewards, the first free capsule and the new researchers. */
export function lteRankDetails(rank: number, source: LteRankSource): LteRankDetails {
  const { ctx } = source;
  const completion = completionRewards(rank, source);
  const capsule = firstFreeCapsule(rank, source);
  const researchers = (ctx.balance.Researchers ?? [])
    .filter((researcher) => researcher.PlayerRankUnlock === rank)
    .map((researcher) => ({
      id: researcher.Id,
      name: researcherName(ctx, researcher),
      description: getResearcherBasicDetails(ctx, researcher)
    }));

  return {
    completionRewards: completion,
    firstFreeCapsule: capsule,
    researchersLabel: `New ${ctx.localization['gachapurchaseconfirmation.content.panel.go_researchers.txt_name'] ?? 'Researchers'}`,
    researchers,
    hasContent: completion.length > 0 || capsule !== null || researchers.length > 0
  };
}

/** The rank typed into a field, or null when it is not a whole number from 1 to `max`. */
const CALCULATOR_CONDITIONS = new Set(['ResourceQuantity', 'IndustryUnlocked', 'ResourcesEarnedSinceSubscription']);

/** Whether the mission page can calculate this mission. Science has no calculator, as in legacy. */
export function hasCalculator(mission: Mission): boolean {
  const { ConditionType: type, ConditionId: id } = mission.Condition;
  if (!CALCULATOR_CONDITIONS.has(type)) {
    return false;
  }
  return type === 'IndustryUnlocked' || !['scientist', 'darkscience'].includes(id.toLowerCase());
}

export interface RankGroup {
  rank: number;
  missions: BoardMission[];
}

/** A mission's text without its goal: `Own Roads (5)` is `Own Roads`. For cards that show the goal on a progress bar. */
export function missionRequirement(text: string): string {
  return text.replace(/\s+\([^()]+\)$/, '');
}

/** A copy of the list in the balance's own mission order, whatever order the missions were completed in. */
export function inMissionOrder(missions: readonly BoardMission[]): BoardMission[] {
  return [...missions].sort((a, b) => a.Rank - b.Rank || a.Index - b.Index);
}

/** Groups missions by rank, lowest rank first. Each group keeps the order of the list it came from. */
export function groupByRank(missions: readonly BoardMission[]): RankGroup[] {
  const groups = new Map<number, BoardMission[]>();
  for (const mission of missions) {
    const group = groups.get(mission.Rank);
    if (group) {
      group.push(mission);
    } else {
      groups.set(mission.Rank, [mission]);
    }
  }
  return [...groups].sort(([a], [b]) => a - b).map(([rank, group]) => ({ rank, missions: group }));
}

export function parseRankInput(text: string, max: number, powers: readonly string[]): number | null {
  // The same rules as every amount field: game or plain notation, and fractions round.
  const rank = text.trim() === '' ? NaN : amountValue(text, powers);
  return Number.isInteger(rank) && rank >= 1 && rank <= max ? rank : null;
}

const abGroupTables = new WeakMap<GameBalance, Record<string, string[]>>();

/** What the A/B switch of a mission does, for example `Switch from Test|A to alternate mission group Test|B`. */
export function abSwitchLabel(balance: GameBalance, config: string): string {
  let groups = abGroupTables.get(balance);
  if (!groups) {
    groups = availableAbGroups(balance);
    abGroupTables.set(balance, groups);
  }
  const [testName = '', groupName = ''] = config.split('|');
  const list = groups[testName] ?? [];
  const next = list[(list.indexOf(groupName) + 1) % Math.max(list.length, 1)] ?? groupName;
  return `Switch from ${config} to alternate mission group ${testName}|${next}`;
}
