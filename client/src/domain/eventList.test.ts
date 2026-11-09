import { describe, expect, it } from 'vitest';
import { entryAsLteInfo, eventAt, newestBalanceOf, reconcileEvents } from './eventList';
import type { LeaderboardEvent } from './leaderboard';
import type { LteInfo } from './types';

const HOUR = 3_600_000;
const T = Date.UTC(2026, 9, 29, 16);

const info = (themeId: string, start: number, hours = 96): LteInfo => ({
  LteId: `${themeId}-${start}`,
  BalanceId: `${themeId}-bal-1`,
  ThemeId: themeId,
  StartTimeMillis: start,
  EndTimeMillis: start + hours * HOUR,
  Rewards: []
});

const api = (theme: string, start: number, guid = `${theme}-guid`): LeaderboardEvent => ({
  guid,
  theme,
  start: new Date(start).toISOString(),
  end: new Date(start + 96 * HOUR).toISOString(),
  status: 'active',
  live: false,
  players: 10,
  divisionSize: 25
});

describe('reconcileEvents', () => {
  it('joins a schedule entry and an API event of the same theme that start close together', () => {
    const [entry, ...rest] = reconcileEvents([info('spooky', T)], [api('spooky', T + 2 * HOUR)], []);
    expect(rest).toEqual([]);
    expect(entry).toMatchObject({ key: 'spooky-guid', themeId: 'spooky', balanceId: 'spooky-bal-1', start: T });
    expect(entry?.schedule?.ThemeId).toBe('spooky');
    expect(entry?.api?.guid).toBe('spooky-guid');
  });

  it('keeps events found in only one source', () => {
    const entries = reconcileEvents([info('spooky', T)], [api('zombie', T + 200 * HOUR)], ['zombie-bal-2', 'zombie-bal-10', 'other-bal-99']);
    expect(entries.map((entry) => [entry.themeId, Boolean(entry.schedule), Boolean(entry.api)])).toEqual([
      ['spooky', true, false],
      ['zombie', false, true]
    ]);
    expect(entries[1]?.balanceId).toBe('zombie-bal-10');
  });

  it('does not match themes that differ or starts more than a day apart', () => {
    const entries = reconcileEvents([info('spooky', T)], [api('spooky', T + 30 * HOUR), api('winter', T, 'w')], []);
    expect(entries.filter((entry) => entry.schedule && entry.api)).toEqual([]);
    expect(entries).toHaveLength(3);
  });

  it('gives each schedule entry to the closest API event only once', () => {
    const entries = reconcileEvents([info('spooky', T), info('spooky', T + 168 * HOUR)], [api('spooky', T + 167 * HOUR, 'b'), api('spooky', T + HOUR, 'a')], []);
    expect(entries.map((entry) => entry.api?.guid)).toEqual(['a', 'b']);
  });
});

describe('eventAt', () => {
  const entries = reconcileEvents([info('a', T), info('b', T + 168 * HOUR)], [], []);

  it('finds the running event, or the next one', () => {
    expect(eventAt(entries, T + HOUR)?.themeId).toBe('a');
    expect(eventAt(entries, T + 120 * HOUR)?.themeId).toBe('b');
    expect(eventAt(entries, T + 1000 * HOUR)).toBeUndefined();
  });
});

describe('newestBalanceOf', () => {
  it('compares versions as numbers', () => {
    expect(newestBalanceOf('crusade', ['crusade-bal-9', 'crusade-bal-10', 'crusader-bal-50'])).toBe('crusade-bal-10');
    expect(newestBalanceOf('none', ['crusade-bal-1'])).toBeNull();
  });
});

describe('entryAsLteInfo', () => {
  it('builds a schedule-like entry for API-only events', () => {
    const [entry] = reconcileEvents([], [api('zombie', T)], []);
    expect(entryAsLteInfo(entry as never)).toMatchObject({ BalanceId: 'zombie', ThemeId: 'zombie', StartTimeMillis: T, Rewards: [] });
  });
});

describe('scheduleEvents', () => {
  it('reads the whole file, years back, with no cap, so old leaderboard events find their entry', async () => {
    const { reconcileEvents, scheduleEvents } = await import('./eventList');
    const start = Date.UTC(2019, 4, 9, 16);
    // One event a week for nine years: more than the old 400-event cap.
    const end = Date.UTC(2028, 4, 9, 16);
    const schedule = {
      LteBalanceData: [
        { BalanceId: 'a-bal-1', ThemeId: 'a', DurationHours: 72 },
        { BalanceId: 'b-bal-1', ThemeId: 'b', DurationHours: 72 }
      ],
      LteOneOff: [],
      LteSchedule: [
        {
          StartDayOfTheWeek: 'Thursday',
          StartHourUTC: 16,
          StartTime: new Date(start).toISOString(),
          EndTime: new Date(end).toISOString(),
          LteBalanceIds: ['a-bal-1', 'b-bal-1'],
          LteRewardIds: ['r1'],
          LteLeaderboardIds: [],
          LteShortLeaderboardIds: []
        }
      ]
    } as never;
    const events = scheduleEvents(schedule, false);
    expect(events.length).toBeGreaterThan(400);
    expect(new Date(events[0]!.StartTimeMillis).getUTCFullYear()).toBe(2019);

    // An API event from 2022, more than two years before the newest entries, matches its schedule entry.
    const old = events.find((event) => new Date(event.StartTimeMillis).getUTCFullYear() === 2022)!;
    const api = [{ guid: 'g', theme: old.ThemeId, start: new Date(old.StartTimeMillis).toISOString(), end: new Date(old.EndTimeMillis).toISOString() }];
    const entries = reconcileEvents(events, api as never, []);
    expect(entries.filter((entry) => entry.api && !entry.schedule)).toEqual([]);
    expect(entries.find((entry) => entry.key === 'g')?.schedule).toBe(old);
  });

  it('gives cycle events the leaderboard ids of their slot in the rotation', async () => {
    const { scheduleEvents } = await import('./eventList');
    const start = Date.UTC(2026, 0, 1);
    const events = scheduleEvents(
      {
        LteBalanceData: [
          { BalanceId: 'a-bal-1', ThemeId: 'a', DurationHours: 96 },
          { BalanceId: 'b-bal-1', ThemeId: 'b', DurationHours: 96 }
        ],
        LteOneOff: [],
        LteSchedule: [
          {
            StartDayOfTheWeek: 'Thursday',
            StartHourUTC: 16,
            StartTime: new Date(start).toISOString(),
            EndTime: new Date(start + 30 * 86_400_000).toISOString(),
            LteBalanceIds: ['a-bal-1', 'b-bal-1'],
            LteRewardIds: ['r1'],
            LteLeaderboardIds: ['leaderboard1', 'leaderboard2'],
            LteShortLeaderboardIds: ['bucket1', 'bucket2']
          }
        ]
      } as never,
      false,
      start
    );
    expect(events.slice(0, 4).map((event) => [event.ThemeId, event.GlobalLeaderboardId, event.LeaderboardId])).toEqual([
      ['a', 'leaderboard1', 'bucket1'],
      ['b', 'leaderboard2', 'bucket2'],
      ['a', 'leaderboard1', 'bucket1'],
      ['b', 'leaderboard2', 'bucket2']
    ]);
  });
});
