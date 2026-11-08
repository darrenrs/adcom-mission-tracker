import { describe, expect, it } from 'vitest';
import type { PlayerResult } from './leaderboard';
import { avatarVisualKey, globalRows, markerLabel, markerPlacement, markerOffset, playerName, shortboardLabel, shortboardNumber, shortboardReward, topPercent, trophiesToMoveUp } from './leaderboardView';
import type { LteScheduleData } from './types';

const gacha = (id: string) => ({ Reward: 'Gacha', RewardId: id, Value: 1 });

const schedule = {
  LteLeaderboards: [
    {
      LeaderboardId: 'leaderboard1',
      Brackets: [
        { IsPercentage: false, Value: 1 },
        { IsPercentage: false, Value: 5 },
        { IsPercentage: false, Value: 25 },
        { IsPercentage: false, Value: 100 },
        { IsPercentage: true, Value: 0.01 },
        { IsPercentage: true, Value: 0.05 },
        { IsPercentage: true, Value: 1 }
      ],
      BracketRewards: ['champion', 'top5', 'top25', 'top100', 'glorious', 'elite', 'scientist'].map(gacha)
    }
  ],
  LteShortLeaderboards: [
    { LeaderboardId: 'bucket1', Brackets: [1, 2, 3].map((Value) => ({ IsPercentage: false, Value })), BracketRewards: ['supreme', 'elite', 'prime'].map(gacha) }
  ]
} as unknown as LteScheduleData;

function result(globalPosition: number, count = 100_000): PlayerResult {
  return {
    event: { guid: 'g', theme: 'spooky', start: '', end: '', status: 'active' },
    player: {
      playerId: 'A',
      ordinal: 3,
      avatarId: null,
      lteRank: null,
      segmentId: 'spookySPEND_2_TO_100:20',
      shortboardCategory: 'SPEND_2_TO_100',
      root: 'global',
      trophies: 5000,
      joined: null,
      updated: null,
      globalPosition,
      globalCount: count,
      divisionPosition: 0,
      divisionCount: 25
    },
    global: {
      count,
      brackets: [
        { rank: 1, fraction: null, score: 90000 },
        { rank: 5, fraction: null, score: 80000 },
        { rank: 25, fraction: null, score: 70000 },
        { rank: 100, fraction: null, score: 60000 },
        { rank: null, fraction: 0.01, score: 50000 },
        { rank: null, fraction: 0.05, score: 40000 },
        { rank: null, fraction: 0.1, score: null }
      ]
    },
    division: null,
    cachedAt: ''
  };
}

describe('playerName', () => {
  it('builds the game-style name from the leaderboard ordinal', () => {
    expect(playerName(0)).toBe('Supreme Worker C');
    expect(playerName(1)).toBe('Super Soldier I');
    expect(playerName(-1)).toBe('Not available');
    expect(playerName(null)).toBe('Not available');
  });
});

describe('Shortboard labels', () => {
  it('names spending and rank categories, and reads the number', () => {
    expect(shortboardLabel('SPEND_2_TO_100')).toBe('$2–$99 lifetime spent');
    expect(shortboardLabel('default')).toBe('Spending-agnostic');
    expect(shortboardLabel(null)).toBe('No Shortboard');
    expect(shortboardLabel('SOMETHING_NEW')).toBe('Unknown Shortboard type');
    expect(shortboardNumber('spookySPEND_2_TO_100:20')).toBe('20');
    expect(shortboardNumber(null)).toBeNull();
  });
});

describe('globalRows', () => {
  it('skips brackets with no cut-off, adds the 100% row, and attaches rewards', () => {
    const rows = globalRows(result(2000), schedule, 'leaderboard1');
    expect(rows.map((row) => [row.name, row.position, row.score, row.reward?.RewardId ?? null])).toEqual([
      ['Champion', 1, 90000, 'champion'],
      ['Top 5', 5, 80000, 'top5'],
      ['Top 25', 25, 70000, 'top25'],
      ['Top 100', 100, 60000, 'top100'],
      ['Top 1%', 1000, 50000, 'glorious'],
      ['Top 5%', 5000, 40000, 'elite'],
      ['Top 100%', 100_000, 10, 'scientist']
    ]);
  });

  it('marks the first bracket whose last place is beyond the player', () => {
    expect(globalRows(result(0), schedule, 'leaderboard1').findIndex((row) => row.current)).toBe(0);
    expect(globalRows(result(4), schedule, 'leaderboard1').findIndex((row) => row.current)).toBe(1);
    expect(globalRows(result(2000), schedule, 'leaderboard1').findIndex((row) => row.current)).toBe(5);
  });

  it('has no rewards without a schedule entry', () => {
    expect(globalRows(result(10), schedule, undefined).every((row) => row.reward === null)).toBe(true);
  });
});

describe('marker and numbers', () => {
  it('places the marker proportionally inside the bracket', () => {
    const rows = globalRows(result(0), schedule, 'leaderboard1');
    expect(markerOffset(rows, 0)).toBe(0);
    expect(markerOffset(rows, 62)).toBeCloseTo(3 + (62 - 25) / (100 - 1 - 25));
    expect(markerLabel(62, 100_000)).toBe('#63');
    expect(markerLabel(1999, 100_000)).toBe('2%');
    expect(markerLabel(2049, 100_000)).toBe('2.1%');
  });

  it('counts trophies to move up and the top percentage like the old page', () => {
    expect(trophiesToMoveUp(5000, 4800)).toBe(210);
    expect(trophiesToMoveUp(null, 4800)).toBeNull();
    expect(topPercent(0, 1000)).toBe('Top 0.00%');
    expect(topPercent(999, 1000)).toBe('Top 100.00%');
  });

  it('finds Shortboard rewards by place', () => {
    expect(shortboardReward(schedule, 'bucket1', 2)?.RewardId).toBe('elite');
    expect(shortboardReward(schedule, 'bucket1', 9)).toBeNull();
    expect(shortboardReward(schedule, undefined, 1)).toBeNull();
  });
});

describe('markerPlacement', () => {
  it('picks the row and the share through it, keeping both inside the table', () => {
    expect(markerPlacement(2.25, 5)).toEqual({ index: 2, fraction: 0.25 });
    expect(markerPlacement(0, 5)).toEqual({ index: 0, fraction: 0 });
    expect(markerPlacement(5, 5)).toEqual({ index: 4, fraction: 1 });
  });
});

describe('avatarVisualKey', () => {
  const common = { Avatars: [{ ID: 'AV0001', VisualKey: 'one' }, { Id: 'AV0002', VisualKey: 'two' }] };
  it('finds the picture name by id', () => {
    expect(avatarVisualKey(common, 'AV0001')).toBe('one');
    expect(avatarVisualKey(common, 'AV0002')).toBe('two');
    expect(avatarVisualKey(common, 'AV9')).toBeNull();
    expect(avatarVisualKey(common, null)).toBeNull();
    expect(avatarVisualKey(undefined, 'AV0001')).toBeNull();
  });
});
