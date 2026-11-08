// What the Leaderboard tab shows, worked out from a player's result and the schedule file's bracket rewards.
// The rules follow the old adcom-leaderboard page, so players see the same numbers there and here.

import type { PlayerResult } from './leaderboard';
import type { LteScheduleData, MissionReward } from './types';

const NAME_PARTS = {
  adjectives: ['Supreme', 'Super', 'Glorious', 'Marvelous', 'Brilliant', 'Great', 'Prosperous', 'Red', 'Pink', 'Crimson', 'Scarlet', 'Patriotic', 'True', 'Model', 'Communistic', 'Iron'],
  nouns: ['Chicken', 'Captain', 'Communist', 'Comrade', 'Leader', 'Guardian', 'Guard', 'Worker', 'Pioneer', 'Soldier', 'Proletariat', 'Revolutionist', 'Socialist'],
  generations: ['I', 'V', 'X', 'L', 'C', 'D', 'M']
};

/** The name the game shows for a player, made from their number in the leaderboard, as the game does. */
export function playerName(ordinal: number | null): string {
  if (ordinal === null || ordinal < 0) {
    return 'Not available';
  }
  const pick = (list: readonly string[], step: number, base: number) => list[(ordinal * step + base) % list.length] as string;
  return `${pick(NAME_PARTS.adjectives, 1, 0)} ${pick(NAME_PARTS.nouns, 2, 7)} ${pick(NAME_PARTS.generations, 3, 4)}`;
}

const SHORTBOARD_LABELS: Readonly<Record<string, string>> = {
  default: 'Spending-agnostic',
  SPEND_GT_500: '>$500 lifetime spent',
  SPEND_100_TO_500: '$100–$499 lifetime spent',
  SPEND_2_TO_100: '$2–$99 lifetime spent',
  SPEND_LTE_2: '<$2 lifetime spent',
  RANK_19_TO_29: 'Motherland rank 19–29',
  RANK_UPTO_18: 'Motherland rank 1–18'
};

/** What kind of Shortboard the player was put in, such as "$2–$99 lifetime spent". */
export function shortboardLabel(category: string | null): string {
  if (category === null) {
    return 'No Shortboard';
  }
  return SHORTBOARD_LABELS[category] ?? 'Unknown Shortboard type';
}

/** The Shortboard's number, such as 20 for `defenseSPEND_100_TO_500:20`. */
export function shortboardNumber(segmentId: string | null): string | null {
  return /:(\d+)$/.exec(segmentId ?? '')?.[1] ?? null;
}

interface ScheduleBracket {
  IsPercentage: boolean;
  Value: number;
}

interface ScheduleLeaderboard {
  LeaderboardId: string;
  Brackets: ScheduleBracket[];
  BracketRewards: MissionReward[];
}

function leaderboardById(list: unknown, id: string | undefined): ScheduleLeaderboard | undefined {
  return Array.isArray(list) && id ? (list as ScheduleLeaderboard[]).find((entry) => entry.LeaderboardId === id) : undefined;
}

export interface GlobalRow {
  name: string;
  /** The last position inside the bracket, counting from 1. */
  position: number;
  /** Trophies needed to be in the bracket, or null when unknown. */
  score: number | null;
  reward: MissionReward | null;
  /** The bracket the player is in. */
  current: boolean;
}

const BRACKET_NAMES: Readonly<Record<string, string>> = {
  '1': 'Champion',
  '5': 'Top 5',
  '25': 'Top 25',
  '100': 'Top 100'
};

/** Everyone on the board has at least this many trophies, as the old page assumed for its last row. */
const JOIN_TROPHIES = 10;

/** The global brackets, their cut-offs and rewards, with the player's bracket marked. */
export function globalRows(result: PlayerResult, schedule: LteScheduleData, globalLeaderboardId: string | undefined): GlobalRow[] {
  const global = result.global;
  if (!global) {
    return [];
  }
  const rewards = leaderboardById(schedule['LteLeaderboards'], globalLeaderboardId);
  const rewardFor = (isPercentage: boolean, value: number) => {
    const index = rewards?.Brackets.findIndex((bracket) => bracket.IsPercentage === isPercentage && bracket.Value === value) ?? -1;
    return index === -1 ? null : (rewards?.BracketRewards[index] ?? null);
  };

  const rows: GlobalRow[] = [];
  for (const bracket of global.brackets) {
    if (bracket.score === null) {
      continue;
    }
    if (bracket.rank !== null) {
      rows.push({ name: BRACKET_NAMES[bracket.rank] ?? `Top ${bracket.rank}`, position: bracket.rank, score: bracket.score, reward: rewardFor(false, bracket.rank), current: false });
    } else if (bracket.fraction !== null) {
      rows.push({
        name: `Top ${Math.round(bracket.fraction * 100)}%`,
        position: Math.floor(global.count * bracket.fraction),
        score: bracket.score,
        reward: rewardFor(true, bracket.fraction),
        current: false
      });
    }
  }
  rows.push({ name: 'Top 100%', position: global.count, score: JOIN_TROPHIES, reward: rewardFor(true, 1), current: false });

  const position = result.player.globalPosition;
  const current = position === null ? -1 : rows.findIndex((row) => row.position > position);
  if (current !== -1) {
    (rows[current] as GlobalRow).current = true;
  }
  return rows;
}

/** Trophies the player needs to reach the next bracket or place up, as the old page counted them. */
export function trophiesToMoveUp(aboveScore: number | null, trophies: number | null): number | null {
  return aboveScore === null || trophies === null ? null : aboveScore - trophies + 10;
}

/** Where the marker sits beside the global table: row index plus how far through that row, from 0 to 1. */
export function markerOffset(rows: readonly GlobalRow[], position: number | null): number {
  if (position === null || position === 0) {
    return 0;
  }
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index] as GlobalRow;
    if (position < row.position) {
      const previous = index === 0 ? 0 : (rows[index - 1] as GlobalRow).position;
      const span = row.position - 1 - previous;
      return index + (span > 0 ? Math.min(Math.max((position - previous) / span, 0), 1) : 0);
    }
  }
  return rows.length;
}

/** `markerOffset` split into the row to measure and how far down that row the marker sits, from 0 to 1. */
export function markerPlacement(offset: number, rowCount: number): { index: number; fraction: number } {
  const index = Math.max(0, Math.min(Math.floor(offset), rowCount - 1));
  return { index, fraction: Math.min(Math.max(offset - index, 0), 1) };
}

/** The avatar picture name for an avatar id, read from the `common` balance's avatar list. */
export function avatarVisualKey(common: unknown, avatarId: string | null | undefined): string | null {
  if (!avatarId || typeof common !== 'object' || common === null) {
    return null;
  }
  const list = (common as Record<string, unknown>)['Avatars'] ?? (common as Record<string, unknown>)['Avatar'];
  if (!Array.isArray(list)) {
    return null;
  }
  for (const item of list as Record<string, unknown>[]) {
    if ((item['ID'] ?? item['Id']) === avatarId) {
      const key = item['VisualKey'];
      return typeof key === 'string' && key ? key : null;
    }
  }
  return null;
}

/** The marker's label: the place for the top 100, otherwise the percentage, as the old page showed. */
export function markerLabel(position: number, count: number): string {
  if (position < 100) {
    return `#${(position + 1).toLocaleString()}`;
  }
  const percent = (((position + 1) / count) * 100).toFixed(1);
  return `${percent.endsWith('.0') ? percent.slice(0, -2) : percent}%`;
}

/** "Top x%" under the global position, as the old page worded it. */
export function topPercent(position: number, count: number): string {
  return `Top ${count > 1 ? ((position / (count - 1)) * 100).toFixed(2) : '0.00'}%`;
}

/** The Shortboard reward for a place, counting from 1. */
export function shortboardReward(schedule: LteScheduleData, shortLeaderboardId: string | undefined, place: number): MissionReward | null {
  const board = leaderboardById(schedule['LteShortLeaderboards'], shortLeaderboardId);
  const index = board?.Brackets.findIndex((bracket) => !bracket.IsPercentage && bracket.Value === place) ?? -1;
  return index === -1 ? null : (board?.BracketRewards[index] ?? null);
}
