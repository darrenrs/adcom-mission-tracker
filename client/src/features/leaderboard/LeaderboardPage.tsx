import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { describeReward, type RewardPart } from '@/domain/gameText';
import type { PlayerResult } from '@/domain/leaderboard';
import {
  globalRows,
  markerLabel,
  markerOffset,
  playerName,
  shortboardLabel,
  shortboardNumber,
  shortboardReward,
  topPercent,
  trophiesToMoveUp,
  type GlobalRow
} from '@/domain/leaderboardView';
import type { MissionReward } from '@/domain/types';
import { partIconUrl } from '@/features/mission/MissionPage';
import { PLAYER_ID, useSession, useTracker } from '@/state/store';
import { useLeaderboardEntry } from './useLeaderboard';

type Lookup =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'found'; result: PlayerResult }
  | { state: 'missing' }
  | { state: 'unavailable' }
  | { state: 'failed' };

const box = 'rounded-xl border border-line bg-surface';
const ROW_HEIGHT = 48;
const HEAD_HEIGHT = 40;

function usePlayerResult(guid: string, playerId: string): Lookup {
  const [lookup, setLookup] = useState<Lookup>({ state: 'idle' });

  useEffect(() => {
    if (!playerId) {
      setLookup({ state: 'idle' });
      return;
    }
    const controller = new AbortController();
    setLookup({ state: 'loading' });
    fetch(`api/leaderboard/${encodeURIComponent(guid)}/player/${encodeURIComponent(playerId)}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.ok) {
          setLookup({ state: 'found', result: (await response.json()) as PlayerResult });
        } else {
          setLookup({ state: response.status === 404 ? 'missing' : response.status === 503 ? 'unavailable' : 'failed' });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.warn('Leaderboard lookup failed', error);
          setLookup({ state: 'failed' });
        }
      });
    return () => controller.abort();
  }, [guid, playerId]);

  return lookup;
}

function PlayerIdForm() {
  const saved = useTracker((state) => state.settings.playerId);
  const setPlayerId = useTracker((state) => state.setPlayerId);
  const [text, setText] = useState(saved);
  const id = useId();
  const valid = PLAYER_ID.test(text);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (valid) {
      setPlayerId(text);
    }
  };

  return (
    <form onSubmit={submit} className={`flex flex-wrap items-end gap-2 p-3 ${box}`}>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-sm font-medium">
          PlayFab ID
        </label>
        <input
          id={id}
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={16}
          value={text}
          aria-invalid={text !== '' && !valid ? true : undefined}
          aria-describedby={`${id}-hint`}
          onChange={(event) => setText(event.target.value.toUpperCase().replace(/\s/g, ''))}
          className="mt-1 h-11 w-full rounded-lg border border-line bg-canvas px-3 font-mono text-base aria-invalid:border-danger"
        />
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          Found in the game&apos;s settings. It is saved in this browser and used for every event.
        </p>
      </div>
      <button type="submit" disabled={!valid} className="mb-5 h-11 rounded-lg bg-accent px-4 text-sm font-medium text-white disabled:opacity-50 dark:text-black">
        Show results
      </button>
    </form>
  );
}

/** Words for a reward icon, so the table reads well without pictures. */
function rewardName(part: RewardPart): string {
  if (part.kind === 'capsule') {
    return `${part.id.charAt(0).toUpperCase()}${part.id.slice(1)} capsule`;
  }
  return ('name' in part && part.name ? String(part.name) : part.text).trim();
}

function Reward({ reward }: { reward: MissionReward | null }) {
  const { text: ctx, assets, mode } = useSession();
  if (!reward) {
    return null;
  }
  // Leaderboard capsules are not in the event's own capsule table, so they are drawn straight from their icon.
  const parts: RewardPart[] =
    reward.Reward === 'Gacha'
      ? [{ kind: 'capsule', id: reward.RewardId, value: reward.Value ?? null, text: '' } as RewardPart]
      : describeReward(ctx, reward).filter((part) => part.kind !== 'text');
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {parts.map((part, index) => (
        <span key={index} className="inline-flex items-center gap-0.5 whitespace-nowrap">
          {part.kind === 'card' && `${part.value}x`}
          <img src={partIconUrl(part, mode, assets)} alt={rewardName(part)} title={rewardName(part)} width={24} height={24} loading="lazy" className="size-6 object-contain" />
          {part.kind === 'resource' && part.amount}
        </span>
      ))}
    </span>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={`p-3 ${box}`}>
      <p className="text-xs font-medium text-muted uppercase">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function MoveUpRow({ trophies, columns }: { trophies: number | null; columns: number }) {
  if (trophies === null) {
    return null;
  }
  return (
    <tr>
      <td colSpan={columns} className="py-1 text-center text-sm font-semibold text-accent">
        ▲ {trophies.toLocaleString()} trophies needed to move up ▲
      </td>
    </tr>
  );
}

function GlobalTable({ result, rows }: { result: PlayerResult; rows: GlobalRow[] }) {
  const { globalPosition: position, trophies } = result.player;
  const count = result.global?.count ?? 0;
  const currentIndex = rows.findIndex((row) => row.current);
  const offset = markerOffset(rows, position);
  // The move-up line sits above the player's bracket, pushing the rows below it down by one row.
  const moveUp = currentIndex > 0 && position !== 0 ? trophiesToMoveUp(rows[currentIndex - 1]?.score ?? null, trophies) : null;
  const top = HEAD_HEIGHT + (offset + (moveUp !== null && offset >= currentIndex ? 1 : 0)) * ROW_HEIGHT;

  return (
    <section aria-labelledby="global-heading" className="space-y-2">
      <h2 id="global-heading" className="text-base font-semibold">
        Global leaderboard
      </h2>
      <div className={`relative overflow-x-auto pl-20 ${box}`}>
        {position !== null && (
          <span
            aria-label={`Your place: ${markerLabel(position, count)}`}
            className="absolute left-2 -translate-y-1/2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white tabular-nums dark:text-black"
            style={{ top }}
          >
            {markerLabel(position, count)} ▶
          </span>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="h-10 text-left text-xs text-muted uppercase">
              <th className="px-2 font-medium">Bracket</th>
              <th className="px-2 font-medium">Place</th>
              <th className="px-2 font-medium">Trophies</th>
              <th className="px-2 font-medium">Reward</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <Rows key={row.name} before={index === currentIndex ? <MoveUpRow trophies={moveUp} columns={4} /> : null}>
                <tr className={`h-12 border-t border-line ${row.current ? 'bg-raised font-bold' : ''}`} aria-current={row.current ? 'true' : undefined}>
                  <td className="px-2">{row.name}</td>
                  <td className="px-2 tabular-nums">{row.position.toLocaleString()}</td>
                  <td className="px-2 tabular-nums">{row.score?.toLocaleString() ?? '—'}</td>
                  <td className="px-2">
                    <Reward reward={row.reward} />
                  </td>
                </tr>
              </Rows>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Rows({ before, children }: { before: ReactNode; children: ReactNode }) {
  return (
    <>
      {before}
      {children}
    </>
  );
}

function ShortboardTable({ result, shortLeaderboardId }: { result: PlayerResult; shortLeaderboardId: string | undefined }) {
  const { data } = useSession();
  const division = result.division;
  if (!division) {
    return null;
  }
  const count = result.global?.count ?? result.player.globalCount ?? 0;
  const playerIndex = division.entries.findIndex((entry) => entry.isPlayer);

  return (
    <section aria-labelledby="shortboard-heading" className="space-y-2">
      <h2 id="shortboard-heading" className="text-base font-semibold">
        Shortboard
      </h2>
      <div className={`overflow-x-auto ${box}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="h-10 text-left text-xs text-muted uppercase">
              <th className="px-2 font-medium">#</th>
              <th className="px-2 font-medium">Player</th>
              <th className="px-2 font-medium">Trophies</th>
              <th className="px-2 font-medium">Global</th>
              <th className="px-2 font-medium">Reward</th>
            </tr>
          </thead>
          <tbody>
            {division.entries.map((entry, index) => {
              const place = entry.position + 1;
              const globalPlace = entry.globalPosition === null ? null : entry.globalPosition + 1;
              const share = globalPlace !== null && count > 1 ? globalPlace / (count - 1) : null;
              const moveUp = entry.isPlayer && index > 0 ? trophiesToMoveUp(division.entries[index - 1]?.trophies ?? null, entry.trophies) : null;
              return (
                <Rows key={`${entry.position}-${entry.ordinal ?? index}`} before={index === playerIndex ? <MoveUpRow trophies={moveUp} columns={5} /> : null}>
                  <tr className={`h-12 border-t border-line ${entry.isPlayer ? 'bg-raised font-bold' : ''}`} aria-current={entry.isPlayer ? 'true' : undefined}>
                    <td className="px-2 tabular-nums">{place}</td>
                    <td className="px-2">{playerName(entry.ordinal)}</td>
                    <td className="px-2 tabular-nums">{entry.trophies.toLocaleString()}</td>
                    <td className="px-2 tabular-nums">
                      {globalPlace?.toLocaleString() ?? '—'}
                      {share !== null && share >= 5e-4 && <span className="ml-1 text-muted">{(share * 100).toFixed(1)}%</span>}
                    </td>
                    <td className="px-2">
                      <Reward reward={shortboardReward(data.schedule, shortLeaderboardId, place)} />
                    </td>
                  </tr>
                </Rows>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const DATE = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const when = (iso: string | null) => (iso ? DATE.format(new Date(iso)) : '—');

function Results({ result, globalLeaderboardId, shortLeaderboardId }: { result: PlayerResult; globalLeaderboardId?: string; shortLeaderboardId?: string }) {
  const { data } = useSession();
  const { player } = result;
  const number = shortboardNumber(player.segmentId);
  const rows = globalRows(result, data.schedule, globalLeaderboardId);

  return (
    <div className="space-y-4">
      {result.event.status === 'archived' && (
        <p role="status" className="rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm">
          This leaderboard is archived, so only your final place is available.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label="Trophies">
          <p className="text-4xl font-bold tabular-nums">{player.trophies?.toLocaleString() ?? '—'}</p>
        </Stat>
        <Stat label="Global position">
          {player.globalPosition !== null && player.globalCount ? (
            <>
              <p className="text-xl font-semibold tabular-nums">
                {(player.globalPosition + 1).toLocaleString()} / {player.globalCount.toLocaleString()}
              </p>
              <p className="text-sm text-muted">{topPercent(player.globalPosition, player.globalCount)}</p>
            </>
          ) : (
            <p className="text-muted">Not available</p>
          )}
        </Stat>
        <Stat label="Shortboard">
          <p className="text-xl font-semibold">{shortboardLabel(player.shortboardCategory)}</p>
          <p className="text-sm text-muted">
            {number !== null && `Shortboard ${number}`}
            {player.divisionPosition !== null && player.divisionCount ? ` · ${player.divisionPosition + 1} of ${player.divisionCount}` : ''}
          </p>
        </Stat>
      </div>
      <p className="text-sm text-muted">
        {playerName(player.ordinal)} · Joined {when(player.joined)} · Last updated {when(player.updated)}
      </p>
      {rows.length > 0 && <GlobalTable result={result} rows={rows} />}
      <ShortboardTable result={result} shortLeaderboardId={shortLeaderboardId} />
    </div>
  );
}

/** A player's results in the event on display, from the tracker server's copy of the game's leaderboard. */
export function LeaderboardPage() {
  const entry = useLeaderboardEntry();
  const playerId = useTracker((state) => state.settings.playerId);
  const lookup = usePlayerResult(entry?.api?.guid ?? '', entry ? playerId : '');

  if (!entry?.api) {
    return <p className={`p-4 text-sm text-muted ${box}`}>There is no leaderboard for this event yet. Leaderboards open once an event has started.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-lg font-semibold">Leaderboard</h1>
      <PlayerIdForm />
      {lookup.state === 'loading' && <p role="status" className="text-sm text-muted">Loading results…</p>}
      {lookup.state === 'missing' && <p role="status" className="text-sm">No results for this PlayFab ID in this event. Check the ID, or join the event in the game first.</p>}
      {lookup.state === 'unavailable' && <p role="status" className="text-sm">The leaderboard is not available right now.</p>}
      {lookup.state === 'failed' && <p role="alert" className="text-sm text-danger">The results could not be loaded. Try again in a moment.</p>}
      {lookup.state === 'found' && (
        <Results result={lookup.result} globalLeaderboardId={entry.schedule?.GlobalLeaderboardId} shortLeaderboardId={entry.schedule?.LeaderboardId} />
      )}
    </div>
  );
}
