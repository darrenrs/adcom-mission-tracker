// Compares the TypeScript schedule maths with the legacy functions, run from master over the real schedules.
import { afterAll, describe, expect, it } from 'vitest';
import {
  getBasicLteName,
  getCurrentLteInfo,
  getHoursPerBalanceId,
  getMilestoneRewardsById,
  getScheduleTimeMillis,
  getSoonestLteInfos,
  PriorityQueue
} from '@/domain/schedule';
import { TITLES } from '@/domain/titles';
import type { LteInfo, LteScheduleData } from '@/domain/types';
import { assetsAvailable, createLegacy, loadSchedule, TITLE_KEYS, type Legacy } from './harness';

const counts = { current: 0, soonest: 0, basicName: 0, other: 0, queue: 0 };

/** Plain JSON, so objects from the sandbox's realm compare equal. */
const legacyJson = <T>(legacy: Legacy, expression: string, vars: Record<string, unknown> = {}): T => {
  const text = legacy.run<string | undefined>(`JSON.stringify(${expression})`, vars);
  return (text === undefined ? undefined : JSON.parse(text)) as T;
};
// Leaderboard ids are left out: legacy only read them for one-offs, and the tracker now reads them for cycles too.
const LEADERBOARD_KEYS = new Set(['LeaderboardId', 'GlobalLeaderboardId']);
const plain = <T>(value: T): T =>
  value === undefined ? value : (JSON.parse(JSON.stringify(value, (key, field: unknown) => (LEADERBOARD_KEYS.has(key) ? undefined : field))) as T);

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (time: string) => Date.parse(time.endsWith('Z') ? time : `${time}Z`);

/** Times around every start and end in the schedule, plus a spread from before it to long after it. */
function sampleTimes(schedule: LteScheduleData, seed: number): number[] {
  const times = new Set<number>();
  const around = (time: number) => [time - 1, time, time + 1].forEach((t) => times.add(t));

  // Every third one-off end exactly, and both edges of every twelfth one-off in full.
  schedule.LteOneOff.forEach((oneOff, index) => {
    if (index % 3 === 0) times.add(iso(oneOff.EndTime));
    if (index % 12 === 0) {
      around(iso(oneOff.EndTime));
      around(iso(oneOff.StartTime));
    }
  });
  for (const cycle of schedule.LteSchedule) {
    around(iso(cycle.StartTime));
    around(iso(cycle.EndTime));
  }

  const random = mulberry32(seed);
  const first = Date.UTC(2018, 0, 1);
  const last = Date.UTC(2032, 0, 1);
  for (let i = 0; i < 100; i++) {
    times.add(Math.floor(first + random() * (last - first)));
  }
  // The edge of the Date range and nonsense input must not crash either.
  [0, Date.UTC(2100, 0, 1), 8.64e15, -1e12].forEach((t) => times.add(t));
  return [...times].sort((a, b) => a - b);
}

describe.skipIf(!assetsAvailable).each(TITLE_KEYS)('schedule matches legacy (%s)', (titleKey) => {
  const title = TITLES[titleKey];
  const isAges = title.isAges;
  const schedule = loadSchedule(titleKey);
  const legacy = createLegacy(titleKey);
  legacy.run('SCHEDULE_CYCLES = __schedule; IsAges = __isAges;', { __schedule: schedule, __isAges: isAges });

  const legacyEvents = (now: number, min: number, max: number) =>
    legacyJson<LteInfo[]>(legacy, 'getSoonestEventInfos(__min, __max, __now)', { __min: min, __max: max, __now: now });

  it('getCurrentEventInfo and getSoonestLteInfos agree at every sampled time', () => {
    const times = new Set(sampleTimes(schedule, titleKey === 'adcom' ? 1 : 2));

    // Boundaries of generated cycle events are only known once an implementation has produced them.
    // Probe while the weekly cycles ran, which is where generated events come from.
    const cycleStart = Math.min(...schedule.LteSchedule.map((c) => iso(c.StartTime)));
    const cycleEnd = Math.max(...schedule.LteSchedule.map((c) => iso(c.EndTime)));
    const probes = Array.from({ length: 6 }, (_, i) => Math.floor(cycleStart + ((i + 0.5) / 6) * (cycleEnd - cycleStart)));
    for (const probe of probes) {
      for (const event of legacyEvents(probe, 10, 20).slice(0, 5)) {
        [event.StartTimeMillis, event.EndTimeMillis].forEach((t) => [t - 1, t, t + 1].forEach((n) => times.add(n)));
      }
    }
    expect(times.size).toBeGreaterThan(200);

    for (const now of times) {
      const expectedCurrent = legacyJson<LteInfo | undefined>(legacy, 'getCurrentEventInfo(__now)', { __now: now });
      expect(plain(getCurrentLteInfo(schedule, now, isAges)), `current ${now}`).toEqual(plain(expectedCurrent));
      counts.current++;

      expect(plain(getSoonestLteInfos(schedule, now, isAges)), `soonest ${now}`).toEqual(plain(legacyEvents(now, 10, 20)));
      counts.soonest++;
    }
  });

  it('getSoonestEventInfos agrees for other list sizes', () => {
    const random = mulberry32(7);
    const sizes: [number, number][] = [[1, 1], [3, 5], [10, 20], [30, 50], [0, 20], [5, 0], [20, 10], [1, 100]];
    const [start, end] = [Date.UTC(2020, 0, 1), Date.UTC(2027, 0, 1)];

    for (const [min, max] of sizes) {
      for (let i = 0; i < 12; i++) {
        const now = Math.floor(start + random() * (end - start));
        expect(plain(getSoonestLteInfos(schedule, now, isAges, min, max)), `${min}/${max} at ${now}`).toEqual(
          plain(legacyEvents(now, min, max))
        );
        counts.soonest++;
      }
    }
  });

  it('keeps legacy ordering: soonest first, and a cut after the last new theme', () => {
    // A time when the weekly cycles still ran, so most events are generated rather than one-offs.
    const now = titleKey === 'adcom' ? Date.UTC(2023, 5, 1) : Date.UTC(2024, 1, 1);
    const events = getSoonestLteInfos(schedule, now, isAges);
    expect(events.length).toBeGreaterThanOrEqual(10);
    expect(events.every((event, i) => i === 0 || (events[i - 1] as LteInfo).EndTimeMillis <= event.EndTimeMillis)).toBe(true);
  });

  it('getScheduleTimeMillis agrees with and without the trailing Z', () => {
    const strings = [
      '2026-10-22T16:00:00',
      '2026-10-22T16:00:00Z',
      '2020-02-22T09:00:00',
      '1999-12-31T23:59:59',
      '2026-10-22',
      '2026-10-22T16:00:00.250',
      'not a date',
      ''
    ];
    for (const text of strings) {
      const expected = legacy.call<number>('getScheduleTimeMillis', text);
      expect(Object.is(getScheduleTimeMillis(text), expected), text).toBe(true);
      counts.other++;
    }
  });

  it('getHoursPerBalanceId and getMilestoneRewardsById agree', () => {
    expect(getHoursPerBalanceId(schedule)).toEqual(legacyJson(legacy, 'getHoursPerBalanceId()'));
    counts.other++;

    const ids = [
      ...(schedule.LteMilestones ?? []).map((m) => m.MilestoneId),
      ...(schedule.LteRewards ?? []).map((r) => r.RewardId)
    ];
    expect(ids.length).toBeGreaterThan(5);
    for (const id of ids) {
      expect(plain(getMilestoneRewardsById(id, schedule, isAges)), id).toEqual(
        legacyJson(legacy, 'getMilestoneRewardsById(__id)', { __id: id })
      );
      counts.other++;
    }
  });

  it('getBasicEventName agrees for every theme, balance and override id', () => {
    const names = new Set<string>(['main', 'evergreen', 'MAIN', 'Evergreen', 'unknownthing', 'x-bal-3']);
    for (const datum of schedule.LteBalanceData) {
      names.add(datum.BalanceId);
      names.add(datum.ThemeId);
      names.add(datum.BalanceId.toUpperCase());
    }
    for (const oneOff of schedule.LteOneOff) {
      names.add(oneOff.ThemeId);
      names.add(oneOff.BalanceId);
    }
    for (const key of [...Object.keys(title.themeIdTitleOverrides), ...Object.keys(title.themeIdOverrides)]) names.add(key);
    for (const value of [...Object.values(title.themeIdOverrides), ...Object.values(title.themeDuplicateOverrides)]) names.add(value);

    for (const name of names) {
      expect(getBasicLteName(name, title), name).toBe(legacy.call<string>('getBasicEventName', name));
      counts.basicName++;
    }
    expect(names.size).toBeGreaterThan(30);
  });

  it('PriorityQueue behaves like the legacy class', () => {
    const random = mulberry32(titleKey === 'adcom' ? 11 : 12);
    for (const maxSize of [0, 1, 3, 20]) {
      const ours = new PriorityQueue<{ p: number; id: number }>(maxSize, (value) => value.p);
      legacy.run(`__queue = new PriorityQueue(${maxSize}, (value) => value.p);`);
      for (let step = 0; step < 300; step++) {
        const roll = random();
        if (roll < 0.6) {
          // Small range, so equal priorities come up often.
          const value = { p: Math.floor(random() * 15), id: step };
          expect(ours.push(value), `push ${step}`).toBe(legacy.run<number>('__queue.push(__value)', { __value: value }));
        } else if (roll < 0.9) {
          expect(plain(ours.pop()), `pop ${step}`).toEqual(legacyJson(legacy, '__queue.pop()'));
        } else {
          expect(plain(ours.peek()), `peek ${step}`).toEqual(legacyJson(legacy, '__queue.peek()'));
        }
        expect(ours.size(), `size ${step}`).toBe(legacy.run<number>('__queue.size()'));
        counts.queue++;
      }
    }
  });
});

describe('legacy defects the port avoids', () => {
  const empty: LteScheduleData = { LteBalanceData: [], LteOneOff: [], LteSchedule: [] };

  it('returns no event for an empty schedule instead of an undefined entry', () => {
    expect(getSoonestLteInfos(empty, 0, false)).toEqual([]);
    expect(getCurrentLteInfo(empty, 0, false)).toBeUndefined();
  });

  it('does not loop forever on a cycle whose StartTime does not parse', () => {
    const broken: LteScheduleData = {
      ...empty,
      LteBalanceData: [{ BalanceId: 'a-bal-1', DurationHours: 10, ThemeId: 'a' }],
      LteSchedule: [
        {
          StartDayOfTheWeek: 'Monday',
          StartHourUTC: 1,
          StartTime: 'garbage',
          EndTime: '2030-01-01T00:00:00',
          LteBalanceIds: ['a-bal-1'],
          LteRewardIds: ['r']
        }
      ]
    };
    expect(getSoonestLteInfos(broken, 0, false)).toEqual([]);
  });

  it('stops at a balance it has no duration for instead of crashing', () => {
    const missing: LteScheduleData = {
      ...empty,
      LteBalanceData: [{ BalanceId: 'a-bal-1', DurationHours: 10, ThemeId: 'a' }],
      LteSchedule: [
        {
          StartDayOfTheWeek: 'Monday',
          StartHourUTC: 1,
          StartTime: '2020-01-01T00:00:00',
          EndTime: '2030-01-01T00:00:00',
          LteBalanceIds: ['a-bal-1', 'ghost-bal-1'],
          LteRewardIds: ['r']
        }
      ]
    };
    expect(getSoonestLteInfos(missing, 0, false).map((event) => event.BalanceId)).toEqual(['a-bal-1']);
  });
});

afterAll(() => {
  console.info(`schedule comparisons against legacy: ${JSON.stringify(counts)}`);
});
