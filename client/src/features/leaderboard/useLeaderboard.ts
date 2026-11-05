import { leaderboardEntry, useEventEntries } from '@/features/schedule/useEventEntries';
import { useSession } from '@/state/store';

/** The leaderboard entry for the event on display, or undefined when the tab should not be offered. */
export function useLeaderboardEntry() {
  const session = useSession();
  const entries = useEventEntries();
  return leaderboardEntry(session, entries, Date.now());
}

export function useLeaderboardAvailable(): boolean {
  return useLeaderboardEntry() !== undefined;
}
