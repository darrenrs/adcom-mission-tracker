import { useMemo } from 'react';
import { reconcileEvents, scheduleEvents, type EventEntry } from '@/domain/eventList';
import type { Session } from '@/state/store';
import { useSession, useTracker } from '@/state/store';

/** How far back the calendar reaches into the schedule file. */
const HISTORY = 2 * 365 * 86_400_000;

/** Every known event of the game, from the schedule file and the leaderboard API, in time order. */
export function useEventEntries(): EventEntry[] {
  const { title, data } = useSession();
  const events = useTracker((state) => state.leaderboardEvents);
  return useMemo(() => {
    const scheduled = scheduleEvents(data.schedule, title.isAges, Date.now() - HISTORY);
    return reconcileEvents(scheduled, events ?? [], Object.keys(data.balances));
  }, [data, title.isAges, events]);
}

/** The entry for the event on display, if the session is in an event. */
export function currentEntry(session: Pick<Session, 'mode' | 'lteInfo'>, entries: readonly EventEntry[]): EventEntry | undefined {
  const info = session.lteInfo;
  if (session.mode !== 'lte' || !info) {
    return undefined;
  }
  return entries.find(
    (entry) => entry.key === info.LteId || (entry.schedule?.LteId === info.LteId && entry.schedule.EndTimeMillis === info.EndTimeMillis)
  );
}

/** The leaderboard needs an AdCom event that the leaderboard API knows and that has started. */
export function leaderboardEntry(session: Pick<Session, 'mode' | 'lteInfo' | 'title' | 'startup'>, entries: readonly EventEntry[], now: number) {
  if (session.title.isAges || session.startup.preview) {
    return undefined;
  }
  const entry = currentEntry(session, entries);
  return entry?.api && entry.start <= now ? entry : undefined;
}
