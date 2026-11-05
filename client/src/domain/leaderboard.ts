// Shapes the tracker's own server returns from /api/leaderboard. The server talks to Hyper Hippo's leaderboard API.

export interface LeaderboardEvent {
  guid: string;
  /** The theme, such as `atlantis`. */
  theme: string;
  start: string;
  end: string;
  status: 'active' | 'archived';
  live: boolean;
  players: number;
  divisionSize: number | null;
}

export interface LeaderboardBracket {
  rank: number | null;
  fraction: number | null;
  score: number | null;
}

export interface PlayerResult {
  event: { guid: string; theme: string; start: string; end: string; status: 'active' | 'archived' };
  player: {
    playerId: string;
    ordinal: number | null;
    segmentId: string | null;
    shortboardCategory: string | null;
    root: string | null;
    trophies: number | null;
    joined: string | null;
    updated: string | null;
    globalPosition: number | null;
    globalCount: number | null;
    divisionPosition: number | null;
    divisionCount: number | null;
  };
  global: { count: number; brackets: LeaderboardBracket[] } | null;
  division: {
    count: number;
    entries: { ordinal: number | null; position: number; globalPosition: number | null; trophies: number; isPlayer: boolean }[];
  } | null;
  cachedAt: string;
}
