// What a researcher card says about upgrades and where the first copies come from. Pure helpers over the balance.

import { createBoard } from './missions';
import type { FirstGuaranteed } from './researchers';
import type { GameBalance, Mission, Researcher } from './types';
import type { GameTextContext } from './gameText';

export interface NextLevelCost {
  /** Cards needed to go from the current level to the next. */
  cards: number;
  /** Science (Motherland) or dark science (events) needed for the same step. */
  science: number;
}

/**
 * The cost of the next level, or null at max level, at level 0 (the first copy comes from a capsule, not an
 * upgrade) or when the balance has no costs for this rarity. `Quantity[level - 1]` takes level to level + 1.
 */
export function nextLevelCost(balance: GameBalance, researcher: Researcher, level: number): NextLevelCost | null {
  const costs = (balance['ResearcherRankCosts'] ?? []) as { Rarity: string; Quantity: number[]; Science: number[] }[];
  const entry = costs.find((candidate) => candidate.Rarity === researcher.Rarity);
  if (!entry || level < 1) {
    return null;
  }
  const cards = entry.Quantity[level - 1];
  const science = entry.Science[level - 1];
  return cards === undefined || science === undefined ? null : { cards, science };
}

/** The rank that holds a mission: its own in Motherland, the position in the event's rank list otherwise. */
export function missionRank(ctx: GameTextContext, mission: Mission, abGroups: readonly string[]): number | null {
  if (ctx.mode === 'evergreen') {
    return mission.Rank ?? null;
  }
  const board = createBoard('lte', ctx.balance, [...abGroups]);
  if (board.current.some((candidate) => candidate.Id === mission.Id)) {
    return 1;
  }
  for (const [rank, missions] of board.ranks) {
    if (missions.some((candidate) => candidate.Id === mission.Id)) {
      return rank;
    }
  }
  return null;
}

/** `First guaranteed: Rank 4`, or null when there is nothing to say. */
export function firstGuaranteedText(ctx: GameTextContext, guaranteed: FirstGuaranteed, abGroups: readonly string[]): string | null {
  switch (guaranteed.kind) {
    case 'freeCapsule':
      return 'First guaranteed: First free capsule';
    case 'mission': {
      const rank = missionRank(ctx, guaranteed.mission, abGroups);
      return rank === null ? `First guaranteed: ${guaranteed.text}` : `First guaranteed: Rank ${rank}`;
    }
    case 'none':
      return null;
  }
}
