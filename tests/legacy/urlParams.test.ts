// Compares the TypeScript startup logic with legacy loadModeSettings, run from master with a stubbed page.
import { afterAll, describe, expect, it } from 'vitest';
import { getSoonestEventInfos } from '@/domain/schedule';
import { TITLES } from '@/domain/titles';
import type { Balance, EventInfo, GameBalance } from '@/domain/types';
import { createFakeEventBalance, parseStartupParams, resolveStartup } from '@/domain/urlParams';
import { assetsAvailable, createLegacy, loadBalances, loadCommon, loadSchedule, TITLE_KEYS } from './harness';

const counts = { compared: 0, legacyCrashed: 0 };

interface Saved {
  mode: string | null;
  rank: string | null;
}

const SAVED_STATES: Saved[] = [
  { mode: null, rank: null },
  { mode: 'event', rank: '12' },
  { mode: 'main', rank: 'abc' }
];

const NOWS = [Date.UTC(2023, 5, 1, 12), Date.UTC(2026, 9, 30)];
// Past every event in the schedule, where legacy falls back to a past one-off.
const AFTER_SCHEDULE = Date.UTC(2030, 0, 1);

/** The query strings to try, with `{END}`-style tokens replaced by times and balances from the schedule at `now`. */
function queries(tokens: Record<string, string>): string[] {
  const table = [
    '',
    '?',
    '?rank=5',
    '?rank=0',
    '?rank=-2',
    '?rank=2.9',
    '?rank=0x10',
    '?rank=abc',
    '?rank=event',
    '?rank=main',
    '?rank=',
    '?rank',
    '?rank=3=4',
    '?rank=7&rank=9',
    '?rank=7&rank=bogus',
    '?rank=event&rank=3',
    '?mode=event',
    '?mode=main',
    '?mode=schedule',
    '?mode=bogus',
    '?mode=event&mode=main',
    '?mode=main&mode=event',
    '?mode=schedule&mode=event',
    '?mode=schedule&mode=main',
    '?rank=7&mode=event',
    '?mode=event&rank=7',
    '?rank=event&mode=main',
    '?mode=main&rank=event',
    '?rank=main&mode=event',
    '?event={END}',
    '?event={END}&mode=main',
    '?mode=main&event={END}',
    '?event={END2}',
    '?event={END3}',
    '?event={END1}',
    '?event={END_PLUS}',
    '?event={END_MINUS}',
    '?event=abc',
    '?event=',
    '?event={END}&event={END2}',
    '?event={END2}&event={END}',
    '?event={END}&event=123',
    '?event=123&event={END}',
    '?timeOverride={T}',
    '?timeOverride={T}&mode=main',
    '?mode=main&timeOverride={T}',
    '?timeOverride=abc',
    '?timeOverride=',
    '?timeOverride={T}&event={END}',
    '?event={END}&timeOverride={T}',
    '?timeOverride={T}&timeOverride={T2}',
    '?timeOverride=0',
    '?timeOverride=8640000000000000',
    '?eventOverride={BAL}',
    '?eventOverride={BAL}&mode=main',
    '?mode=main&eventOverride={BAL}',
    '?eventOverride={BAL}&rank=4',
    '?rank=4&eventOverride={BAL}',
    '?eventOverride={BAL}&timeOverride={T}',
    '?timeOverride={T}&eventOverride={BAL}',
    '?eventOverride={BAL}&event={END}',
    '?event={END}&eventOverride={BAL}',
    '?eventOverride={BAL}&eventOverride={BAL2}',
    '?eventOverride={BAL}&eventOverride=nope',
    '?eventOverride=nope&eventOverride={BAL}',
    '?eventOverride=evergreen',
    '?eventOverride=main',
    '?eventOverride=common',
    '?eventOverride=nope',
    '?eventOverride=',
    '?eventOverride=architecture',
    '?eventOverride=monster',
    '?eventOverride=fakeevent-bal-1',
    '?eventOverride=fakeevent-bal-1&mode=main',
    '?mode=event&eventOverride=fakeevent-bal-1',
    '?a=1?rank=5',
    '?rank=5?',
    '?rank=5&&mode=event',
    '?&rank=5',
    '?rank=5&',
    '?rank=5&unknown=1&mode=event',
    '?view=missions&mission=M0001',
    '?mission=a=b&rank=6'
  ];
  return table.map((query) => query.replace(/\{(\w+)\}/g, (_, name: string) => tokens[name] ?? 'missing'));
}

interface Outcome {
  mode: string;
  mainRank: number;
  eventInfo: unknown;
  /** Id of the balance on display, `stub` for the fake event stub, or `none`. */
  eventBalance: string;
  stub: unknown;
  overrideActive: boolean;
  isFakeEvent: boolean;
  openSchedule: boolean;
  writes: [string, string][];
}

const plain = <T>(value: T): T => (value === undefined || value === null ? value : (JSON.parse(JSON.stringify(value)) as T));

describe.skipIf(!assetsAvailable).each(TITLE_KEYS)('startup matches legacy (%s)', (titleKey) => {
  const title = TITLES[titleKey];
  const schedule = loadSchedule(titleKey);
  const real = loadBalances(titleKey);
  const base: Record<string, Balance> = {
    ...real,
    common: { Missions: [], Avatars: loadCommon(titleKey)['Avatars'] },
    // Names that exercise THEME_ID_OVERRIDES and fake events, which the real data never reaches.
    architecture: real[Object.keys(real).find((id) => id.startsWith('architecture') || id.startsWith('crusade')) as string] as GameBalance,
    monster: real[Object.keys(real).find((id) => id.startsWith('monster') || id.startsWith('crusade')) as string] as GameBalance,
    'fakeevent-bal-1': { Missions: [], fake: true }
  };
  const legacy = createLegacy(titleKey);
  const prefix = title.gameSaveKeyPrefix;

  const eventsAt = (now: number) => getSoonestEventInfos(schedule, now, title.isAges);

  function legacyOutcome(search: string, hash: string, saved: Saved, now: number, data: Record<string, Balance>): Outcome | { error: string } {
    legacy.setNow(now);
    legacy.storage.clear();
    if (saved.mode !== null) legacy.storage.setItem(`${prefix}CurrentMode`, saved.mode);
    if (saved.rank !== null) legacy.storage.setItem(`${prefix}main-CurrentRank`, saved.rank);
    legacy.storage.writes.length = 0;
    legacy.jquery.length = 0;
    legacy.run(
      `DATA = __data; eventScheduleInfo = null; currentMode = 'main'; currentMainRank = 1;
       window.location.href = __href; SCHEDULE_CYCLES = __schedule; IsAges = __isAges;
       ACTIVE_TITLE = __key; ACTIVE_TITLE_ID = __titleId;`,
      {
        __data: { ...data },
        __href: `http://tracker.test/${search}${hash}`,
        __schedule: schedule,
        __isAges: title.isAges,
        __key: titleKey,
        __titleId: title.titleId
      }
    );

    try {
      legacy.run('loadModeSettings()');
    } catch (error) {
      return { error: error instanceof Error ? error.constructor.name : String(error) };
    }

    const called = (selector: string, method: string) => legacy.jquery.some((call) => call.selector === selector && call.method === method);
    const info = plain(legacy.run<unknown>('eventScheduleInfo')) as EventInfo;
    const shown = legacy.run<string>(
      `Object.keys(DATA).find((key) => key !== 'event' && DATA[key] === DATA.event) ?? 'stub'`
    );
    const isStub = shown === 'stub';
    return {
      mode: legacy.run<string>('currentMode'),
      mainRank: legacy.run<number>('currentMainRank'),
      eventInfo: info,
      eventBalance: shown,
      stub: isStub ? plain(legacy.run<unknown>('DATA.event')) : null,
      overrideActive: called('#overrideWarning', 'addClass'),
      isFakeEvent: called('#alertFakeEvent', 'removeClass'),
      openSchedule: called('#schedulePopup', 'modal'),
      writes: legacy.storage.writes.map(([key, value]) => [key.slice(prefix.length), value])
    };
  }

  function ourOutcome(search: string, saved: Saved, now: number, data: Record<string, Balance>): Outcome {
    const startup = resolveStartup({
      params: parseStartupParams(search),
      savedMode: saved.mode,
      savedRank: saved.rank,
      schedule,
      balances: data,
      now,
      title
    });
    const shown = Object.keys(data).find((key) => data[key] === startup.eventBalance);
    return {
      mode: startup.mode,
      mainRank: startup.mainRank,
      eventInfo: plain(startup.eventInfo),
      eventBalance: startup.eventBalance === null ? 'none' : (shown ?? 'stub'),
      stub: startup.isFakeEvent ? plain(startup.eventBalance) : null,
      overrideActive: startup.overrideActive,
      isFakeEvent: startup.isFakeEvent,
      openSchedule: startup.openSchedule,
      writes: startup.writes.map(({ key, value }) => [key, value])
    };
  }

  function compare(search: string, saved: Saved, now: number, data: Record<string, Balance>, hash = '') {
    const label = `${titleKey} ${search}${hash} saved=${JSON.stringify(saved)} now=${new Date(now).toISOString()}`;
    const expected = legacyOutcome(search, hash, saved, now, data);
    counts.compared++;

    if ('error' in expected) {
      // Legacy crashes when the schedule names a balance it has no data for. That is a state to report, not to copy.
      counts.legacyCrashed++;
      expect(expected.error, label).toBe('TypeError');
      const ours = ourOutcome(search, saved, now, data);
      expect(ours.eventBalance, label).toBe('none');
      return;
    }
    expect(ourOutcome(search, saved, now, data), label).toEqual(expected);
  }

  /** Tokens for the query table: times and balances from the schedule around `now`. */
  function tokensAt(now: number): Record<string, string> {
    // Late in the schedule there may be fewer than three events. The later tokens then repeat or miss.
    const events = eventsAt(now);
    const first = events[0] as EventInfo;
    const second = events[1] ?? first;
    const third = events[2] ?? second;
    const eventBalances = Object.keys(real).filter((id) => id !== 'evergreen' && id !== first.BalanceId);
    const other = events.find((event) => event.BalanceId in real && event.BalanceId !== first.BalanceId)?.BalanceId ?? (eventBalances[0] as string);
    const another = events.find((event) => event.BalanceId in real && event.BalanceId !== other)?.BalanceId ?? (eventBalances[1] as string);
    return {
      END: String(first.EndTimeMillis),
      END1: String(first.EndTimeMillis),
      END2: String(second.EndTimeMillis),
      END3: String(third.EndTimeMillis),
      END_PLUS: String(first.EndTimeMillis + 1),
      END_MINUS: String(first.EndTimeMillis - 1),
      T: String(second.StartTimeMillis + 1000),
      T2: String(third.StartTimeMillis + 1000),
      BAL: other,
      BAL2: another
    };
  }

  for (const now of NOWS) {
    it(`handles every query at ${new Date(now).toISOString()}`, () => {
      const tokens = tokensAt(now);
      for (const search of queries(tokens)) {
        for (const saved of SAVED_STATES) {
          compare(search, saved, now, base);
        }
      }
    });
  }

  it('handles a fragment after the query', () => {
    const now = NOWS[0] as number;
    const tokens = tokensAt(now);
    for (const search of ['', '?rank=5', '?mode=schedule', `?event=${tokens['END']}`, '?eventOverride=nope']) {
      compare(search, SAVED_STATES[1] as Saved, now, base, '#schedule');
    }
  });

  it('handles the current event being a fake event', () => {
    for (const now of NOWS) {
      const current = eventsAt(now)[0] as EventInfo;
      if (!(current.BalanceId in real)) continue;
      const faked = { ...base, [current.BalanceId]: { ...base[current.BalanceId], fake: true } as Balance };
      const tokens = tokensAt(now);
      let fakeSeen = 0;
      for (const search of ['', '?mode=event', '?mode=main', '?rank=4', `?timeOverride=${tokens['T']}`, `?event=${tokens['END']}`, '?eventOverride=fakeevent-bal-1']) {
        for (const saved of SAVED_STATES) {
          compare(search, saved, now, faked);
          const ours = ourOutcome(search, saved, now, faked);
          if (ours.isFakeEvent) fakeSeen++;
          if (ours.isFakeEvent) expect(ours.stub).toEqual(createFakeEventBalance());
        }
      }
      expect(fakeSeen, `fake events seen at ${now}`).toBeGreaterThan(3);
    }
  });

  it('handles times after the schedule ends', () => {
    const tokens = tokensAt(AFTER_SCHEDULE);
    for (const search of ['', '?mode=event', '?timeOverride=' + tokens['T'], '?event=' + tokens['END'], '?eventOverride=' + tokens['BAL'], '?rank=9']) {
      for (const saved of SAVED_STATES) {
        compare(search, saved, AFTER_SCHEDULE, base);
      }
    }
  });

  it('timeOverride moves the time used by eventOverride when it comes first', () => {
    const now = NOWS[0] as number;
    const tokens = tokensAt(now);
    const timeFirst = ourOutcome(`?timeOverride=${tokens['T']}&eventOverride=${tokens['BAL']}`, SAVED_STATES[0] as Saved, now, base);
    const timeLast = ourOutcome(`?eventOverride=${tokens['BAL']}&timeOverride=${tokens['T']}`, SAVED_STATES[0] as Saved, now, base);
    expect((timeFirst.eventInfo as EventInfo).EndTimeMillis).toBe(Number(tokens['T']));
    expect((timeLast.eventInfo as EventInfo).EndTimeMillis).toBe(now);
  });
});

describe('parseStartupParams', () => {
  it('keeps what legacy acts on, in query order', () => {
    expect(parseStartupParams('?mode=event&rank=7&rank=bogus&event=123&timeOverride=5&eventOverride=x&mode=bogus').steps).toEqual([
      { param: 'mode', value: 'event' },
      { param: 'rank', value: '7' },
      { param: 'event', value: '123' },
      { param: 'timeOverride', value: '5' },
      { param: 'eventOverride', value: 'x' }
    ]);
  });

  it('ignores everything when the URL has a second question mark', () => {
    expect(parseStartupParams('?rank=5?mode=event')).toEqual({ steps: [], view: null, mission: null });
  });

  it('reads view and mission, the last one winning, and decodes them', () => {
    const params = parseStartupParams('?view=missions&mission=M%200001&view=schedule&mission=%E0%A4%A&rank=3');
    expect(params.view).toBe('schedule');
    expect(params.mission).toBe('%E0%A4%A');
    expect(parseStartupParams('?mission=M%200001').mission).toBe('M 0001');
    expect(parseStartupParams('?rank=3').view).toBeNull();
  });

  it('accepts a query without the leading question mark and an empty one', () => {
    expect(parseStartupParams('rank=3').steps).toEqual([{ param: 'rank', value: '3' }]);
    expect(parseStartupParams('').steps).toEqual([]);
    expect(parseStartupParams('?').steps).toEqual([]);
  });
});

describe('startup differences from legacy', () => {
  const schedule = { LteBalanceData: [], LteOneOff: [], LteSchedule: [] };
  const title = { key: 'adcom', themeIdOverrides: {} };
  const resolve = (search: string, savedMode: string | null = null) =>
    resolveStartup({ params: parseStartupParams(search), savedMode, savedRank: null, schedule, balances: {}, now: 0, title });

  it('does not apply an eventOverride that names an Object property (legacy crashes later)', () => {
    const startup = resolve('?eventOverride=constructor');
    expect(startup.overrideActive).toBe(false);
    expect(startup.writes).toEqual([]);
  });

  it('treats a saved mode other than main or event as main (legacy crashes)', () => {
    expect(resolve('', 'junk').mode).toBe('main');
  });

  it('copes with a schedule that has no events', () => {
    const startup = resolve('');
    expect(startup.eventInfo).toBeNull();
    expect(startup.eventBalance).toBeNull();
  });
});

afterAll(() => {
  console.info(`startup comparisons against legacy: ${JSON.stringify(counts)}`);
});
