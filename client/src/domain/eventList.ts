// One list of events from two sources: the game's schedule file and the leaderboard API. An event shows up when either
// source has it. Matching both lets the calendar show events the schedule file has not caught up with, and lets the
// Leaderboard tab find the API's id for a scheduled event.

import type { LeaderboardEvent } from './leaderboard';
import { getSoonestLteInfos } from './schedule';
import type { LteInfo, LteScheduleData } from './types';

export interface EventEntry {
  /** Stable key for lists: the API guid, or the schedule's id and end time. */
  key: string;
  themeId: string;
  /** The balance to play, or null when no balance of the theme is known. */
  balanceId: string | null;
  start: number;
  end: number;
  /** The schedule file's entry, which carries milestone and leaderboard reward ids. */
  schedule: LteInfo | null;
  /** The leaderboard API's entry, needed for leaderboard results. */
  api: LeaderboardEvent | null;
}

const DAY = 86_400_000;
/** A schedule entry and an API event are the same event when their themes match and they start this close together. */
export const MATCH_WINDOW = DAY;

/**
 * Every schedule entry ending after `from` (by default, the whole file back to its first event), in time order.
 * Repeating cycles are expanded into single events. There is no cap: the AdCom file holds about 660 events since
 * May 2019 and expands in a few milliseconds. A two-year window used to cut it off, so older leaderboard events
 * found no schedule entry.
 */
export function scheduleEvents(schedule: LteScheduleData, isAges: boolean, from = 0): LteInfo[] {
  // Infinity for both counts keeps every event; each cycle still stops at its own end date. (A queue size of 0 would
  // also be unbounded, but the cycle expansion counts up to the queue size, so it would find nothing.)
  return getSoonestLteInfos(schedule, from, isAges, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
}

/** The newest balance of a theme, such as `crusade-bal-3` for `crusade`, or null when the data has none. */
export function newestBalanceOf(themeId: string, balanceIds: readonly string[]): string | null {
  let best: { id: string; version: number } | null = null;
  for (const id of balanceIds) {
    const match = /^(.+)-bal-(\d+)$/.exec(id);
    if (match?.[1] === themeId && (best === null || Number(match[2]) > best.version)) {
      best = { id, version: Number(match[2]) };
    }
  }
  return best?.id ?? null;
}

function scheduleKey(info: LteInfo): string {
  return `schedule:${String(info.LteId)}:${info.EndTimeMillis}`;
}

/** Joins the two sources. Each API event takes the closest unmatched schedule entry of its theme within the window. */
export function reconcileEvents(scheduled: readonly LteInfo[], api: readonly LeaderboardEvent[], balanceIds: readonly string[]): EventEntry[] {
  const entries: EventEntry[] = scheduled.map((info) => ({
    key: scheduleKey(info),
    themeId: info.ThemeId,
    balanceId: info.BalanceId,
    start: info.StartTimeMillis,
    end: info.EndTimeMillis,
    schedule: info,
    api: null
  }));

  for (const event of api) {
    const start = Date.parse(event.start);
    const end = Date.parse(event.end);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      continue;
    }
    let best: EventEntry | null = null;
    for (const entry of entries) {
      if (entry.api || entry.themeId !== event.theme || Math.abs(entry.start - start) > MATCH_WINDOW) {
        continue;
      }
      if (!best || Math.abs(entry.start - start) < Math.abs(best.start - start)) {
        best = entry;
      }
    }
    if (best) {
      best.api = event;
      best.key = event.guid;
    } else {
      entries.push({ key: event.guid, themeId: event.theme, balanceId: newestBalanceOf(event.theme, balanceIds), start, end, schedule: null, api: event });
    }
  }

  return entries.sort((a, b) => a.start - b.start || a.end - b.end);
}

/** The event running at a time, or the next one to start after it. */
export function eventAt(entries: readonly EventEntry[], time: number): EventEntry | undefined {
  return entries.find((entry) => entry.start <= time && time < entry.end) ?? entries.find((entry) => entry.start > time);
}

/** An entry known only to the API, in the shape the rest of the tracker expects of a schedule entry. */
export function entryAsLteInfo(entry: EventEntry): LteInfo {
  return (
    entry.schedule ?? {
      LteId: entry.key,
      BalanceId: entry.balanceId ?? entry.themeId,
      ThemeId: entry.themeId,
      StartTimeMillis: entry.start,
      EndTimeMillis: entry.end,
      Rewards: []
    }
  );
}
