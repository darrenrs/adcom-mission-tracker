import { describe, expect, it } from 'vitest';
import { parseStartupParams, resolveStartup, type ResolveStartupInput } from './urlParams';
import type { LteScheduleData } from './types';

const HOUR = 3_600_000;
const EMPTY = { Missions: [] };
const START = Date.UTC(2026, 0, 5);
const iso = (ms: number) => new Date(ms).toISOString();

const schedule: LteScheduleData = {
  LteBalanceData: [],
  LteSchedule: [],
  LteOneOff: [
    { BalanceId: 'crusade-bal-1', ThemeId: 'crusade', StartTime: iso(START), EndTime: iso(START + HOUR), RewardId: 'r' },
    { BalanceId: 'zombie-bal-2', ThemeId: 'zombie', StartTime: iso(START + 2 * HOUR), EndTime: iso(START + 3 * HOUR), RewardId: 'r' }
  ]
};

function resolve(search: string, saved: Partial<Pick<ResolveStartupInput, 'savedMode' | 'savedRank'>> = {}) {
  return resolveStartup({
    params: parseStartupParams(search),
    savedMode: null,
    savedRank: null,
    schedule,
    balances: { evergreen: EMPTY, common: EMPTY, main: EMPTY, 'crusade-bal-1': EMPTY, 'zombie-bal-2': EMPTY },
    now: START + 1,
    title: { key: 'adcom', themeIdOverrides: {} },
    ...saved
  });
}

describe('parseStartupParams', () => {
  it('reads every parameter', () => {
    expect(parseStartupParams('?title=ages&mode=lte&rank=4&at=123&balance=crusade-bal-1')).toEqual({
      title: 'ages',
      mode: 'lte',
      rank: 4,
      at: 123,
      balance: 'crusade-bal-1'
    });
  });

  it('ignores values it does not know, and the old parameters', () => {
    expect(parseStartupParams('?title=constructor&mode=main&rank=two&at=soon&event=1&eventOverride=x')).toEqual({
      title: null,
      mode: null,
      rank: null,
      at: null,
      balance: null
    });
  });
});

describe('resolveStartup', () => {
  it('uses the saved mode and rank when the URL says nothing', () => {
    expect(resolve('', { savedMode: 'event', savedRank: '7' })).toMatchObject({ mode: 'lte', evergreenRank: 7, writes: [] });
    expect(resolve('')).toMatchObject({ mode: 'evergreen', evergreenRank: 1 });
  });

  it('lets the URL win and saves what it chose in the old format', () => {
    const startup = resolve('?mode=evergreen', { savedMode: 'event' });
    expect(startup.mode).toBe('evergreen');
    expect(startup.writes).toEqual([{ key: 'CurrentMode', value: 'main' }]);
    expect(resolve('?mode=lte').writes).toEqual([{ key: 'CurrentMode', value: 'event' }]);
  });

  it('treats a rank as Motherland unless the mode says otherwise', () => {
    expect(resolve('?rank=9', { savedMode: 'event' })).toMatchObject({ mode: 'evergreen', evergreenRank: 9 });
    expect(resolve('?mode=lte&rank=9', { savedRank: '3' })).toMatchObject({ mode: 'lte', evergreenRank: 3 });
  });

  it('opens the schedule entry running at a time', () => {
    const startup = resolve(`?at=${START + 2 * HOUR + 5}`);
    expect(startup).toMatchObject({ mode: 'lte', preview: false });
    expect(startup.lteInfo?.BalanceId).toBe('zombie-bal-2');
  });

  it('opens the next entry when the time falls between two', () => {
    expect(resolve(`?at=${START + 90 * 60_000}`).lteInfo?.BalanceId).toBe('zombie-bal-2');
  });

  it('still opens an event when the schedule has nothing that late', () => {
    const startup = resolve(`?at=${START + 1000 * HOUR}`);
    expect(startup.mode).toBe('lte');
    expect(startup.lteInfo).not.toBeNull();
  });

  it('previews a balance with no schedule entry', () => {
    const startup = resolve('?balance=zombie-bal-2');
    expect(startup).toMatchObject({ mode: 'lte', preview: true });
    expect(startup.lteInfo).toMatchObject({ BalanceId: 'zombie-bal-2', ThemeId: 'zombie' });
    expect(startup.lteBalance).toEqual({ Missions: [] });
  });

  it('refuses balances that are not events', () => {
    for (const id of ['common', 'main', 'constructor', 'nope']) {
      expect(resolve(`?balance=${id}`).preview).toBe(false);
    }
  });
});
