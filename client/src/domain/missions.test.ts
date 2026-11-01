import { describe, expect, it } from 'vitest';
import {
  advanceLteToRank,
  applyAbGroups,
  availableAbGroups,
  boardSections,
  clickMission,
  createBoard,
  missionsBefore,
  missionsForGroups,
  nextAbGroups,
  normalizeAbGroups
} from './missions';
import { groupByRank, inMissionOrder, missionRequirement, rankProgress } from './missionView';
import type { Balance, Mission } from './types';

const mission = (id: string): Mission => ({
  Id: id,
  Condition: { ConditionType: 'ResourceQuantity', ConditionId: 'potato', Threshold: 1 },
  Reward: { Reward: 'Gacha', RewardId: 'wood' }
});

const rankInfo = (rank: number, missions: number) => ({
  Rank: String(rank),
  Missions: String(missions),
  ActiveMissionCount: 3
});

// Three shown missions, then a small rank, then a stretch rank.
const balance: Balance = {
  Missions: ['a', 'b', 'c', 'd', 'e', 'f'].map(mission),
  Ranks: [rankInfo(1, 0), rankInfo(2, 1), rankInfo(3, 1), rankInfo(4, 1)]
};

describe('advanceEventToRank', () => {
  // Legacy looped one step too far here and filled Current with undefined, crashing the page.
  it('moves on to the next rank when the target rank runs out', () => {
    const board = createBoard('lte', balance, []);
    advanceLteToRank(board, 3);

    expect(board.current.map((m) => m.Id)).toEqual(['e', 'f']);
    expect(board.current.every(Boolean)).toBe(true);
    expect(boardSections(board).flatMap((s) => s.missions).every(Boolean)).toBe(true);
  });
});

describe('clickMission', () => {
  it('ignores a mission that is not Current or Completed', () => {
    const board = createBoard('lte', balance, []);
    expect(clickMission(board, 'f')).toBeNull();
  });

  it('round-trips a completed mission back to its original place', () => {
    const board = createBoard('lte', balance, []);
    const before = board.current.map((m) => m.Id);

    expect(clickMission(board, 'a')).toBe('completed');
    expect(clickMission(board, 'a')).toBe('undone');
    expect(board.current.map((m) => m.Id)).toEqual(before);
  });
});

describe('A/B mission groups', () => {
  const abMission = (id: string, config: string, threshold: number): Mission => ({
    ...mission(id),
    AbTestConfig: config,
    Condition: { ConditionType: 'ResourceQuantity', ConditionId: 'potato', Threshold: threshold }
  });

  // The same mission id exists in both groups, with different requirements.
  const abBalance: Balance = {
    Missions: [mission('a'), abMission('b', 'Test|B', 200), abMission('b', 'Test|A', 100), mission('c'), mission('d')],
    Ranks: [rankInfo(1, 0), rankInfo(2, 1), rankInfo(3, 1)]
  };

  it('sorts groups regardless of balance order', () => {
    expect(availableAbGroups(abBalance)).toEqual({ Test: ['A', 'B'] });
  });

  it('starts players in the first group and drops retired tests', () => {
    expect(normalizeAbGroups([], abBalance)).toEqual(['Test|A']);
    expect(normalizeAbGroups(['Old|A', 'Test|B'], abBalance)).toEqual(['Test|B']);
  });

  it('shows only the missions of the current group', () => {
    expect(missionsForGroups(abBalance, ['Test|A']).map((m) => m.Condition.Threshold)).toEqual([1, 100, 1, 1]);
  });

  it('cycles through groups and wraps around', () => {
    expect(nextAbGroups(abBalance, ['Test|A'], 'b')).toEqual(['Test|B']);
    expect(nextAbGroups(abBalance, ['Test|B'], 'b')).toEqual(['Test|A']);
    expect(nextAbGroups(abBalance, ['Test|A'], 'a')).toBeNull();
  });

  it('swaps a mission to the new group without moving it', () => {
    const board = createBoard('lte', abBalance, ['Test|A']);
    const order = board.current.map((m) => m.Id);

    applyAbGroups(board, abBalance, ['Test|B']);

    expect(board.current.map((m) => m.Id)).toEqual(order);
    expect(board.current.find((m) => m.Id === 'b')?.Condition.Threshold).toBe(200);
  });
});

describe('groupByRank', () => {
  it('sorts ranks but keeps completion order inside each rank', () => {
    const board = createBoard('lte', balance, []);
    for (const id of ['b', 'a', 'c', 'd', 'e']) {
      clickMission(board, id);
    }

    const groups = groupByRank(board.completed);
    expect(groups.map((group) => group.rank)).toEqual([...groups.map((group) => group.rank)].sort((a, b) => a - b));
    const rankOne = groups.find((group) => group.rank === 1);
    expect(rankOne?.missions.map((m) => m.Id).slice(0, 2)).toEqual(['b', 'a']);
  });
});

describe('inMissionOrder', () => {
  it('ignores completion order and leaves the board alone', () => {
    const board = createBoard('lte', balance, []);
    for (const id of ['b', 'a', 'c']) {
      clickMission(board, id);
    }

    expect(inMissionOrder(board.completed).map((m) => m.Id)).toEqual(['a', 'b', 'c']);
    expect(board.completed.map((m) => m.Id)).toEqual(['b', 'a', 'c']);
  });
});

describe('missionRequirement', () => {
  it('drops only a trailing goal', () => {
    expect(missionRequirement('Own Roads (5)')).toBe('Own Roads');
    expect(missionRequirement('Collect Land (500 T)')).toBe('Collect Land');
    expect(missionRequirement('Unlock Ore')).toBe('Unlock Ore');
  });
});

describe('rankProgress', () => {
  it('counts event completions through the ranks and then finishes', () => {
    const board = createBoard('lte', balance, []);
    expect(rankProgress(board)).toMatchObject({ rank: 1, done: 0, finished: false });

    for (const id of [...board.ranks.values()].flat().map((m) => m.Id).concat(board.current.map((m) => m.Id))) {
      clickMission(board, id);
    }
    while (board.current.length > 0) {
      clickMission(board, board.current[0]?.Id as string);
    }
    const end = rankProgress(board);
    expect(end.finished).toBe(true);
    expect(end.done).toBe(end.total);
  });
});

describe('completeMissionsBefore', () => {
  it('stays inside the Motherland rank on display', () => {
    const motherland: Balance = {
      Missions: [
        { ...mission('r1'), Rank: 1 },
        { ...mission('a'), Rank: 2 },
        { ...mission('b'), Rank: 2 },
        { ...mission('c'), Rank: 2 },
        { ...mission('d'), Rank: 2 }
      ],
      Ranks: [rankInfo(1, 0), { ...rankInfo(2, 0), ActiveMissionCount: 1 }]
    };
    const board = createBoard('evergreen', motherland, [], 2);

    expect(missionsBefore(board, 'c').map((m) => m.Id)).toEqual(['a', 'b']);
    expect(missionsBefore(board, 'r1')).toEqual([]);
  });
});
