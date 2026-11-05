import { useLeaderboardEntry } from './useLeaderboard';

export function LeaderboardPage() {
  const entry = useLeaderboardEntry();
  return <p className="text-sm text-muted">{entry ? 'Leaderboard coming next.' : 'No leaderboard for this event.'}</p>;
}
