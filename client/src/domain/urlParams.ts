// What the page opens with: the URL first, then the saved state, then the schedule.
//
// Parameters:
//   title=adcom|ages         The game.
//   mode=evergreen|lte       Motherland or an event.
//   rank=N                   A Motherland rank. Without `mode`, it also switches to Motherland.
//   at=MILLIS                Opens the schedule entry running at that time.
//   balance=ID               Opens an event by balance id, such as `crusade-bal-1`, with no schedule entry.
// `view` and `mission` only choose a page, so they are not read here.

import { getCurrentLteInfo } from './schedule';
import { TITLES, type TitleKey } from './titles';
import type { Balance, LteInfo, LteScheduleData, TrackerMode } from './types';

export interface StartupParams {
  title: TitleKey | null;
  mode: TrackerMode | null;
  rank: number | null;
  at: number | null;
  balance: string | null;
}

/** A saved value to update. The key has no game prefix: add the title's `gameSaveKeyPrefix`. */
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
  /** Events only the leaderboard API knows about, so `at` can open them too. */
  extraLtes?: readonly LteInfo[];
}

export interface Startup {
  mode: TrackerMode;
  evergreenRank: number;
  /** The event on display, whether or not the mode is `lte`. Null only when the schedule has no events. */
  lteInfo: LteInfo | null;
  /** The balance to play: an empty stub for fake events, null when the schedule names an unknown balance. */
  lteBalance: Balance | null;
  /** `balance` was applied: progress is temporary and a banner says so. */
  preview: boolean;
  /** The event has no datamined balance. Show the fake event alert. */
  isFakeLte: boolean;
  /** Saved values to update, so that the next plain visit opens the same place. */
  writes: StorageWrite[];
}

const BALANCE_EXCLUSIONS = ['main', 'common'];

const positiveInt = (text: string | null): number | null => {
  const value = text === null || !/^\d+$/.test(text) ? 0 : Number(text);
  return value > 0 ? value : null;
};

/** Reads `window.location.search`, ignoring anything it does not recognise. */
export function parseStartupParams(search: string): StartupParams {
  const params = new URLSearchParams(search);
  const title = params.get('title');
  const mode = params.get('mode');
  return {
    title: title !== null && Object.hasOwn(TITLES, title) ? (title as TitleKey) : null,
    mode: mode === 'evergreen' || mode === 'lte' ? mode : null,
    rank: positiveInt(params.get('rank')),
    at: positiveInt(params.get('at')),
    balance: params.get('balance')
  };
}

/** The balance for a fake event: nothing to play, so the page shows an alert instead. */
export function createFakeLteBalance(): Balance {
  return { Generators: [], Industries: [], Missions: [], Researchers: [], Resources: [{ Id: 'potato' }] };
}

/** Applies the URL, then the saved state, then the schedule. Parameters win over the saved mode and rank. */
export function resolveStartup(input: ResolveStartupInput): Startup {
  const { params, schedule, balances, title, now } = input;
  const isAges = title.key === 'ages';

  const previewId =
    params.balance !== null && Object.hasOwn(balances, params.balance) && !BALANCE_EXCLUSIONS.includes(params.balance)
      ? params.balance
      : null;
  const at = params.at;
  let scheduled = at === null ? undefined : getCurrentLteInfo(schedule, at, isAges);
  const runs = (info: LteInfo | undefined) => at !== null && info !== undefined && info.StartTimeMillis <= at && at < info.EndTimeMillis;
  const extra = input.extraLtes?.find(runs);
  if (extra && !runs(scheduled)) {
    scheduled = extra;
  }

  const impliedMode = previewId !== null || scheduled ? 'lte' : params.rank !== null ? 'evergreen' : null;
  const mode: TrackerMode = params.mode ?? impliedMode ?? (input.savedMode === 'event' ? 'lte' : 'evergreen');
  const useRank = mode === 'evergreen' && params.rank !== null;

  const writes: StorageWrite[] = [];
  if (params.mode !== null || impliedMode !== null) {
    writes.push({ key: 'CurrentMode', value: mode === 'lte' ? 'event' : 'main' });
  }
  if (useRank) {
    writes.push({ key: 'main-CurrentRank', value: String(params.rank) });
  }

  let lteInfo = scheduled ?? getCurrentLteInfo(schedule, now, isAges) ?? null;
  if (previewId !== null) {
    const themeOverride = Object.hasOwn(title.themeIdOverrides, previewId) ? title.themeIdOverrides[previewId] : undefined;
    lteInfo = {
      LteId: previewId,
      BalanceId: previewId,
      // the xxx part of xxx-bal-5
      ThemeId: themeOverride || previewId.split('-')[0] || previewId,
      StartTimeMillis: now,
      EndTimeMillis: now,
      Rewards: new Array<undefined>(20) // empty values, which the tracker handles gracefully
    };
  }

  const balanceFor = (id: string): Balance | null => (Object.hasOwn(balances, id) ? (balances[id] ?? null) : null);

  let lteBalance: Balance | null = null;
  let isFakeLte = false;
  if (lteInfo) {
    // A fake balance, or an event from the leaderboard API whose balance the tracker does not have yet.
    isFakeLte = mode === 'lte' && (Boolean(balanceFor(lteInfo.BalanceId)?.['fake']) || (lteInfo === extra && !balanceFor(lteInfo.BalanceId)));
    lteBalance = isFakeLte ? createFakeLteBalance() : balanceFor(lteInfo.BalanceId);
  }

  const evergreenRank = (useRank ? params.rank : parseInt(input.savedRank ?? '')) || 1;
  return { mode, evergreenRank, lteInfo, lteBalance, preview: previewId !== null, isFakeLte, writes };
}
