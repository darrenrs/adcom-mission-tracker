// What the page opens with. A pure port of the URL handling in loadModeSettings of
// public/mission-tracker.js: parseStartupParams reads the query string and resolveStartup applies it to
// the saved state and the schedule. tests/legacy/urlParams.test.ts compares both with the legacy code.
//
// Parameters, as legacy documents them:
//   rank=X          X is `event`, `main` or a Motherland rank. A rank also switches to Motherland.
//   mode=X          X is `event`, `main` or `schedule` (opens the schedule popup).
//   event=X         X is an event's EndTime in millis. Applies only when an event really ends then.
//   eventOverride=X X is a balance id like `crusade-bal-1`. For testing and the schedule's "View in Tracker".
//   timeOverride=X  Opens the event running at X (millis).
// New: `view` and `mission` are only passed through for the React app to interpret.

import { getCurrentEventInfo } from './schedule';
import type { Balance, EventInfo, LteScheduleData, TrackerMode } from './types';

/** One parameter that changes the startup state. Legacy applies them in query order. */
export type StartupStep =
  | { param: 'rank'; value: string }
  | { param: 'mode'; value: 'event' | 'main' | 'schedule' }
  | { param: 'event'; value: string }
  | { param: 'timeOverride'; value: string }
  | { param: 'eventOverride'; value: string };

export interface StartupParams {
  /** Only the parameters legacy would act on, in query order. */
  steps: StartupStep[];
  /** Last `view` parameter. */
  view: string | null;
  /** Last `mission` parameter. */
  mission: string | null;
}

/** A write legacy makes to storage. The key has no game prefix: add the title's `gameSaveKeyPrefix`. */
export interface StorageWrite {
  key: 'CurrentMode' | 'main-CurrentRank';
  value: string;
}

export interface StartupTitle {
  key: string;
  themeIdOverrides: Readonly<Record<string, string>>;
}

export interface ResolveStartupInput {
  params: StartupParams;
  /** `CurrentMode` as saved before this visit. */
  savedMode: string | null;
  /** `main-CurrentRank` as saved before this visit. */
  savedRank: string | null;
  schedule: LteScheduleData;
  balances: Readonly<Record<string, Balance>>;
  now: number;
  title: StartupTitle;
}

export interface Startup {
  mode: TrackerMode;
  mainRank: number;
  /** The event on display, whether or not the mode is `event`. Null only when the schedule has no events. */
  eventInfo: EventInfo | null;
  /**
   * The balance to play: an empty stub for fake events, null when the schedule names an unknown balance.
   * As in legacy, `eventOverride` fixes it, even if a later `event` parameter changes `eventInfo`.
   */
  eventBalance: Balance | null;
  /** `eventOverride` was applied: show the warning and hide the reset alert. */
  overrideActive: boolean;
  /** The event has no datamined balance. Show the fake event alert. */
  isFakeEvent: boolean;
  /** `mode=schedule`: open the schedule popup. */
  openSchedule: boolean;
  /** Storage writes legacy makes while reading the URL, in order. Apply them before reading the saved state. */
  writes: StorageWrite[];
}

const BALANCE_EXCLUSIONS = ['main', 'common'];

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Reads `window.location.search`, with or without the leading `?`. */
export function parseStartupParams(search: string): StartupParams {
  const params: StartupParams = { steps: [], view: null, mission: null };

  // Legacy takes the arguments only when the URL has exactly one `?`.
  const query = search.startsWith('?') ? search.slice(1) : search;
  if (query.includes('?')) {
    return params;
  }

  for (const arg of query.split('&')) {
    const keyValue = arg.split('=');
    if (keyValue.length !== 2) {
      continue;
    }

    const [param = '', value = ''] = keyValue;
    switch (param) {
      case 'rank':
        if (value === 'event' || value === 'main' || parseInt(value)) {
          params.steps.push({ param, value });
        }
        break;
      case 'mode':
        if (value === 'event' || value === 'main' || value === 'schedule') {
          params.steps.push({ param, value });
        }
        break;
      case 'event':
      case 'timeOverride':
      case 'eventOverride':
        params.steps.push({ param, value });
        break;
      case 'view':
        params.view = safeDecode(value);
        break;
      case 'mission':
        params.mission = safeDecode(value);
        break;
    }
  }

  return params;
}

/** The balance for a fake event: nothing to play, so the page shows an alert instead. */
export function createFakeEventBalance(): Balance {
  return { Generators: [], Industries: [], Missions: [], Researchers: [], Resources: [{ Id: 'potato' }] };
}

/**
 * Applies the URL parameters, then the saved state, then the schedule, as legacy loadModeSettings does.
 * Parameters win over the saved mode and rank.
 *
 * Differences from legacy, each a crash there: an `eventOverride` naming a prototype property
 * (`constructor`) is ignored, a saved mode other than `main` or `event` counts as `main`,
 * and a schedule naming an unknown balance gives a null `eventBalance`.
 */
export function resolveStartup(input: ResolveStartupInput): Startup {
  const { params, schedule, balances, title } = input;
  const isAges = title.key === 'ages';
  const writes: StorageWrite[] = [];
  let now = input.now;
  let eventInfo: EventInfo | null = null;
  let overrideActive = false;
  let openSchedule = false;
  // Legacy points DATA.event at the override's balance once and never moves it again.
  let overrideBalanceId: string | null = null;

  const writeMode = (mode: TrackerMode) => writes.push({ key: 'CurrentMode', value: mode });

  for (const step of params.steps) {
    switch (step.param) {
      case 'rank':
        if (step.value === 'event') {
          writeMode('event');
        } else if (step.value === 'main') {
          writeMode('main');
        } else if (parseInt(step.value)) {
          writeMode('main');
          writes.push({ key: 'main-CurrentRank', value: step.value });
        }
        break;

      case 'mode':
        if (step.value === 'schedule') {
          openSchedule = true;
        } else {
          writeMode(step.value);
        }
        break;

      case 'event': {
        // Like timeOverride, but more rigid: test one millisecond before the end time.
        // If right, the event running then ends exactly at that time.
        const eventTime = parseInt(step.value);
        const candidate = getCurrentEventInfo(schedule, eventTime - 1, isAges);
        if (candidate && candidate.EndTimeMillis === eventTime) {
          eventInfo = candidate;
          writeMode('event');
        }
        break;
      }

      case 'timeOverride':
        now = parseInt(step.value);
        writeMode('event');
        break;

      case 'eventOverride': {
        const balanceId = step.value;
        if (!Object.hasOwn(balances, balanceId) || BALANCE_EXCLUSIONS.includes(balanceId)) {
          break;
        }
        const themeOverride = Object.hasOwn(title.themeIdOverrides, balanceId) ? title.themeIdOverrides[balanceId] : undefined;

        // A quick hack to allow switching to non-current events.
        writeMode('event');
        overrideActive = true;
        overrideBalanceId = balanceId;
        eventInfo = {
          LteId: balanceId,
          BalanceId: balanceId,
          // the xxx part of xxx-bal-5
          ThemeId: themeOverride || balanceId.split('-')[0] || balanceId,
          StartTimeMillis: now,
          EndTimeMillis: now,
          Rewards: new Array<undefined>(20) // empty values, which the tracker handles gracefully
        };
        break;
      }
    }
  }

  // Values from URL parameters > previous save > defaults.
  const lastWrite = (key: StorageWrite['key']) => writes.findLast((write) => write.key === key)?.value;
  const modeValue = lastWrite('CurrentMode') ?? input.savedMode;
  const mode: TrackerMode = modeValue === 'event' ? 'event' : 'main';
  const mainRank = parseInt(lastWrite('main-CurrentRank') ?? input.savedRank ?? '') || 1;

  // The schedule decides unless a parameter already chose the event.
  eventInfo ??= getCurrentEventInfo(schedule, now, isAges) ?? null;

  const balanceFor = (id: string): Balance | null => (Object.hasOwn(balances, id) ? (balances[id] ?? null) : null);

  let eventBalance: Balance | null = null;
  let isFakeEvent = false;
  if (eventInfo) {
    isFakeEvent = mode === 'event' && Boolean(balanceFor(eventInfo.BalanceId)?.['fake']);
    eventBalance = isFakeEvent ? createFakeEventBalance() : balanceFor(overrideBalanceId ?? eventInfo.BalanceId);
  }

  return { mode, mainRank, eventInfo, eventBalance, overrideActive, isFakeEvent, openSchedule, writes };
}
