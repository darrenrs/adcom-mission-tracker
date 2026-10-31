// Mission order and movement. This is the behaviour players rely on, so it must match the legacy
// tracker exactly: tests/golden/missions.test.ts replays traces captured from the old code.

import type { Balance, Mission, TrackerMode } from './types';

/** A mission with its position in the balance and its display rank. */
export interface BoardMission extends Mission {
  Rank: number;
  Index: number;
}

export interface MissionBoard {
  mode: TrackerMode;
  /** Motherland rank on display. Unused for events. */
  mainRank: number;
  rankCount: number;
  completed: BoardMission[];
  current: BoardMission[];
  currentSize: number;
  ranks: Map<number, BoardMission[]>;
  rankSizes: Map<number, number>;
  /** Saved Motherland completions from ranks other than `mainRank`. */
  otherRankMissionIds: string[];
}

export type SectionKey = 'Completed' | 'Current' | number;

export interface BoardSection {
  key: SectionKey;
  missions: BoardMission[];
}

const DEFAULT_ACTIVE_MISSIONS = 3;

/** Maps each A/B test to its groups, for example `{ MissionTest: ['A', 'B'] }`. */
export function availableAbGroups(balance: Balance): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  const configs = balance.Missions.flatMap((m) => (m.AbTestConfig ? [m.AbTestConfig] : []));

  for (const config of new Set(configs)) {
    const [testName = '', groupName = ''] = config.split('|');
    (groups[testName] ??= []).push(groupName);
  }

  for (const list of Object.values(groups)) {
    list.sort();
  }
  return groups;
}

/** Drops retired groups and places the player in the first group of any new test. */
export function normalizeAbGroups(saved: string[], balance: Balance): string[] {
  const available = availableAbGroups(balance);
  const kept = saved.filter((group) => (group.split('|')[0] ?? '') in available);
  const assigned = new Set(kept.map((group) => group.split('|')[0]));

  for (const [testName, groups] of Object.entries(available)) {
    if (!assigned.has(testName)) {
      kept.push(`${testName}|${groups[0]}`);
    }
  }
  return kept;
}

export function missionsForGroups(balance: Balance, abGroups: string[]): Mission[] {
  const groups = new Set(abGroups);
  return balance.Missions.filter((m) => !m.AbTestConfig || groups.has(m.AbTestConfig));
}

function emptyBoard(mode: TrackerMode, mainRank: number, rankCount: number, currentSize: number): MissionBoard {
  return {
    mode,
    mainRank,
    rankCount,
    completed: [],
    current: [],
    currentSize,
    ranks: new Map(),
    rankSizes: new Map(),
    otherRankMissionIds: []
  };
}

function createEventBoard(balance: Balance, missions: Mission[]): MissionBoard {
  const ranks = balance.Ranks ?? [];
  const activeCount = ranks[1]?.ActiveMissionCount ?? DEFAULT_ACTIVE_MISSIONS;
  const board = emptyBoard('event', 1, ranks.length, activeCount);

  let rank = 0;
  let missionsLeft = 0;
  missions.forEach((mission, index) => {
    if (missionsLeft === 0) {
      rank += 1;

      if (rank >= ranks.length) {
        // Stretch goals are grouped together as one final rank.
        missionsLeft = missions.length - index + 2;
      } else {
        missionsLeft = parseInt(ranks[rank]?.Missions ?? '0', 10);
      }

      board.ranks.set(rank, []);
      board.rankSizes.set(rank, missionsLeft);

      if (rank === 1) {
        // Rank 1 carries extra missions so that a player has choices.
        const shown = rank < ranks.length ? (ranks[rank]?.ActiveMissionCount ?? DEFAULT_ACTIVE_MISSIONS) : DEFAULT_ACTIVE_MISSIONS;
        missionsLeft += shown - 1;
      }
    }

    board.ranks.get(rank)?.push({ ...mission, Rank: rank, Index: index });
    missionsLeft -= 1;
  });

  const first = board.ranks.get(1);
  if (first) {
    board.current.push(...first.splice(0, activeCount));
  }
  return board;
}

function createMainBoard(balance: Balance, missions: Mission[], mainRank: number): MissionBoard {
  const ranks = balance.Ranks ?? [];
  const activeCount = ranks[mainRank - 1]?.ActiveMissionCount ?? DEFAULT_ACTIVE_MISSIONS;
  const board = emptyBoard('main', mainRank, ranks.length, activeCount);
  const indexed = missions.map((mission, index): BoardMission => ({ ...mission, Rank: mission.Rank ?? 0, Index: index }));
  const lastRank = indexed.at(-1)?.Rank ?? 0;

  for (let rank = 1; rank <= lastRank; rank++) {
    const rankMissions = indexed.filter((m) => m.Rank === rank);
    board.ranks.set(rank, rankMissions);
    board.rankSizes.set(rank, rankMissions.length);
  }

  const available = board.ranks.get(mainRank) ?? [];
  board.current.push(...available.splice(0, activeCount));
  return board;
}

export function createBoard(mode: TrackerMode, balance: Balance, abGroups: string[], mainRank = 1): MissionBoard {
  const missions = missionsForGroups(balance, abGroups);
  return mode === 'main' ? createMainBoard(balance, missions, mainRank) : createEventBoard(balance, missions);
}

function applyEventSave(board: MissionBoard, savedIds: string[]): void {
  const sources = [...[...board.ranks.keys()].sort((a, b) => a - b).map((rank) => board.ranks.get(rank) ?? []), board.current];

  // Walking the saved list keeps completion order.
  for (const id of savedIds) {
    if (!id) {
      break;
    }
    for (const source of sources) {
      const index = source.findIndex((m) => m.Id === id);
      if (index !== -1) {
        board.completed.push(...source.splice(index, 1));
        break;
      }
    }
  }

  fillEventCurrent(board, 1);
}

function fillEventCurrent(board: MissionBoard, firstRank: number): void {
  for (let rank = firstRank; rank <= board.rankCount && board.current.length < board.currentSize; rank++) {
    const available = board.ranks.get(rank);
    while (available && available.length > 0 && board.current.length < board.currentSize) {
      board.current.push(available.shift() as BoardMission);
    }
  }
}

function applyMainSave(board: MissionBoard, savedIds: string[]): void {
  const rankMissions = board.ranks.get(board.mainRank) ?? [];
  const inRank = new Set([...board.current, ...rankMissions].map((m) => m.Id));

  for (const id of savedIds) {
    if (!inRank.has(id)) {
      board.otherRankMissionIds.push(id);
      continue;
    }
    const currentIndex = board.current.findIndex((m) => m.Id === id);
    const source = currentIndex !== -1 ? board.current : rankMissions;
    const index = currentIndex !== -1 ? currentIndex : rankMissions.findIndex((m) => m.Id === id);
    if (index !== -1) {
      board.completed.push(...source.splice(index, 1));
    }
  }

  while (board.current.length < board.currentSize && rankMissions.length > 0) {
    board.current.push(rankMissions.shift() as BoardMission);
  }
}

/** Applies a saved comma-separated `Completed` value to a fresh board. */
export function applySave(board: MissionBoard, saved: string | null): void {
  if (!saved) {
    return;
  }
  const ids = saved.split(',');
  if (board.mode === 'event') {
    applyEventSave(board, ids);
  } else {
    applyMainSave(board, ids);
  }
}

export function serializeCompleted(board: MissionBoard): string {
  const ids = board.completed.map((m) => m.Id);
  return (board.mode === 'event' ? ids : [...ids, ...board.otherRankMissionIds]).join(',');
}

function byIndex(a: BoardMission, b: BoardMission): number {
  return a.Index - b.Index;
}

function refillCurrent(board: MissionBoard): void {
  if (board.mode === 'main') {
    const next = board.ranks.get(board.mainRank)?.shift();
    if (next) {
      board.current.push(next);
    }
    return;
  }

  for (let rank = 1; rank <= board.rankCount; rank++) {
    const next = board.ranks.get(rank)?.shift();
    if (next) {
      board.current.push(next);
      return;
    }
  }
}

function completeMission(board: MissionBoard, index: number): void {
  board.completed.push(...board.current.splice(index, 1));
  refillCurrent(board);
}

function undoMission(board: MissionBoard, index: number): void {
  const mission = board.completed[index] as BoardMission;
  let destination = board.current;

  if (board.current.length === board.currentSize) {
    const newest = board.current.reduce((prev, cur) => (prev.Index > cur.Index ? prev : cur));

    if (mission.Index > newest.Index) {
      // A mission later than all of Current goes straight back to its rank.
      destination = board.ranks.get(mission.Rank) ?? [];
    } else {
      board.current.splice(board.current.indexOf(newest), 1);
      const rankList = board.ranks.get(newest.Rank) ?? [];
      rankList.unshift(newest);
      rankList.sort(byIndex);
    }
  }

  board.completed.splice(index, 1);
  destination.push(mission);
  destination.sort(byIndex);
}

/**
 * Moves a mission between incomplete and completed, in place.
 * Returns `completed` or `undone`, or null when the mission is not currently clickable.
 */
export function clickMission(board: MissionBoard, missionId: string): 'completed' | 'undone' | null {
  const currentIndex = board.current.findIndex((m) => m.Id === missionId);
  if (currentIndex !== -1) {
    completeMission(board, currentIndex);
    return 'completed';
  }

  const completedIndex = board.completed.findIndex((m) => m.Id === missionId);
  if (completedIndex !== -1) {
    undoMission(board, completedIndex);
    return 'undone';
  }
  return null;
}

/** Event only: marks every mission below `targetRank` complete and refills Current from there. */
export function advanceEventToRank(board: MissionBoard, targetRank: number): void {
  const eligibleRanks = [...board.ranks.keys()].filter((rank) => rank <= targetRank).sort((a, b) => a - b);

  for (const list of [board.current, ...eligibleRanks.map((rank) => board.ranks.get(rank) ?? [])]) {
    for (let index = 0; index < list.length; index++) {
      const mission = list[index] as BoardMission;
      if (mission.Rank < targetRank) {
        list.splice(index, 1);
        board.completed.push(mission);
        index -= 1;
      }
    }
  }

  fillEventCurrent(board, targetRank);
}

/** Returns the saved group list after moving a mission's test to its next group, or null if it has none. */
export function nextAbGroups(balance: Balance, abGroups: string[], missionId: string): string[] | null {
  const mission = missionsForGroups(balance, abGroups).find((m) => m.Id === missionId);
  if (!mission?.AbTestConfig) {
    return null;
  }

  const [testName = '', groupName = ''] = mission.AbTestConfig.split('|');
  const groups = availableAbGroups(balance)[testName] ?? [];
  const groupIndex = groups.indexOf(groupName);
  if (groupIndex === -1) {
    return null;
  }

  const nextGroup = `${testName}|${groups[(groupIndex + 1) % groups.length]}`;
  return abGroups.map((group) => (group === mission.AbTestConfig ? nextGroup : group));
}

/** Swaps board missions to the versions used by the new A/B groups, keeping their positions. */
export function applyAbGroups(board: MissionBoard, balance: Balance, abGroups: string[]): void {
  const active = new Set(abGroups);
  const missions = missionsForGroups(balance, abGroups);

  const swap = (list: BoardMission[]) => {
    list.forEach((mission, index) => {
      if (mission.AbTestConfig && !active.has(mission.AbTestConfig)) {
        const replacement = missions.find((m) => m.Id === mission.Id);
        if (replacement) {
          list[index] = { ...replacement, Rank: mission.Rank, Index: mission.Index };
        }
      }
    });
  };

  swap(board.completed);
  swap(board.current);
  board.ranks.forEach(swap);
}

/** Sections in display order: Completed, Current, then ranks. */
export function boardSections(board: MissionBoard): BoardSection[] {
  const sections: BoardSection[] = [
    { key: 'Completed', missions: board.completed },
    { key: 'Current', missions: board.current }
  ];

  if (board.mode === 'main') {
    sections.push({ key: board.mainRank, missions: board.ranks.get(board.mainRank) ?? [] });
    return sections;
  }

  const rankKeys = [...board.ranks.keys()].sort((a, b) => a - b);
  for (const rank of rankKeys) {
    sections.push({ key: rank, missions: board.ranks.get(rank) ?? [] });
  }
  return sections.filter((section) => section.key === 'Completed' || section.missions.length > 0);
}
