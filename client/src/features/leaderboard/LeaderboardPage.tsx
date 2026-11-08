import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { describeReward, type RewardPart } from '@/domain/gameText';
import type { PlayerResult } from '@/domain/leaderboard';
import {
  avatarVisualKey,
  globalRows,
  markerLabel,
  markerOffset,
  markerPlacement,
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
import { bigNum } from '@/domain/format';
import { inputClass } from '@/ui/inputStyles';
import { PLAYER_ID, useSession, useTracker } from '@/state/store';
import { RankDistribution } from './RankChart';
import { useLeaderboardEntry } from './useLeaderboard';

type Lookup =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'found'; result: PlayerResult }
  | { state: 'missing' }
  | { state: 'unavailable' }
  | { state: 'failed' };

const box = 'rounded-xl border border-line bg-surface';

/** The picture URL for an avatar id, or null when the id is unknown. */
function useAvatarUrl(): (avatarId: string | null | undefined) => string | null {
  const { data, assets } = useSession();
  const common = data.balances['common'];
  return useMemo(
    () => (avatarId) => {
      const key = avatarVisualKey(common, avatarId);
      return key ? assets.forTitle('adcom', `shared/avatars/${key}.png`) : null;
    },
    [common, assets]
  );
}

function Avatar({ url, className }: { url: string | null; className: string }) {
  return url ? <img src={url} alt="" loading="lazy" className={`${className} shrink-0 object-contain`} /> : <span className={`${className} block shrink-0`} />;
}

/**
 * Looks up a player's result. Every change of `request` asks again, even for the same player.
 * While the same player is asked again, the previous result stays on screen and `refreshing` is true.
 */
function usePlayerResult(guid: string, playerId: string, request: number): { lookup: Lookup; refreshing: boolean } {
  const [lookup, setLookup] = useState<Lookup>({ state: 'idle' });
  const [refreshing, setRefreshing] = useState(false);
  const shownKey = useRef('');

  useEffect(() => {
    if (!playerId) {
      shownKey.current = '';
      setLookup({ state: 'idle' });
      setRefreshing(false);
      return;
    }
    const key = `${guid}:${playerId}`;
    const controller = new AbortController();
    if (shownKey.current === key) {
      setRefreshing(true);
    } else {
      setLookup({ state: 'loading' });
    }
    const settle = (next: Lookup) => {
      shownKey.current = next.state === 'found' ? key : '';
      setLookup(next);
      setRefreshing(false);
    };
    fetch(`api/leaderboard/${encodeURIComponent(guid)}/player/${encodeURIComponent(playerId)}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (response.ok) {
          settle({ state: 'found', result: (await response.json()) as PlayerResult });
        } else {
          settle({ state: response.status === 404 ? 'missing' : response.status === 503 ? 'unavailable' : 'failed' });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.warn('Leaderboard lookup failed', error);
          settle({ state: 'failed' });
        }
      });
    return () => controller.abort();
  }, [guid, playerId, request]);

  return { lookup, refreshing };
}

/** The PlayFab ID box. Show results saves the ID and always asks for fresh results. */
function PlayerIdForm({ busy, onShow }: { busy: boolean; onShow: () => void }) {
  const saved = useTracker((state) => state.settings.playerId);
  const setPlayerId = useTracker((state) => state.setPlayerId);
  const [text, setText] = useState(saved);
  const id = useId();
  const valid = PLAYER_ID.test(text);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (valid && !busy) {
      setPlayerId(text);
      onShow();
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
          className={`${inputClass} mt-1 w-full font-mono`}
        />
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          Found in the game&apos;s settings. It is saved in this browser and used for every event.
        </p>
      </div>
      <button type="submit" disabled={!valid || busy} className="mb-5 h-control rounded-lg bg-accent px-4 text-sm font-medium text-white disabled:opacity-50 dark:text-black">
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
  const { title } = useSession();
  if (trophies === null) {
    return null;
  }
  return (
    <tr>
      <td colSpan={columns} className="py-1 text-center text-sm font-semibold text-accent">
        ▲ {bigNum(trophies, title.powers)} trophies needed to move up ▲
      </td>
    </tr>
  );
}

function GlobalTable({ result, rows }: { result: PlayerResult; rows: GlobalRow[] }) {
  const { title } = useSession();
  const { powers } = title;
  const { globalPosition: position, trophies } = result.player;
  const count = result.global?.count ?? 0;
  const currentIndex = rows.findIndex((row) => row.current);
  const offset = markerOffset(rows, position);
  const moveUp = currentIndex > 0 && position !== 0 ? trophiesToMoveUp(rows[currentIndex - 1]?.score ?? null, trophies) : null;
  const container = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const [top, setTop] = useState<number | null>(null);

  // The marker's place comes from where the rows really are, so wrapped text or the move-up line cannot throw it off.
  useLayoutEffect(() => {
    const measure = () => {
      const box = container.current;
      const row = rowRefs.current[markerPlacement(offset, rows.length).index];
      if (!box || !row) {
        return;
      }
      const { index, fraction } = markerPlacement(offset, rows.length);
      const target = rowRefs.current[index] ?? row;
      const boxRect = box.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      const half = (marker.current?.offsetHeight ?? 0) / 2;
      const y = rect.top - boxRect.top + Math.min(Math.max(fraction * rect.height, 1), rect.height - 1);
      setTop(Math.min(Math.max(y, half), boxRect.height - half));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (container.current) {
      observer.observe(container.current);
    }
    return () => observer.disconnect();
  }, [offset, rows, moveUp]);

  return (
    <section aria-labelledby="global-heading" className="min-w-0 space-y-2">
      <h2 id="global-heading" className="text-base font-semibold">
        Global Leaderboard
      </h2>
      <div ref={container} className="flex">
        <div className="relative w-16 shrink-0 sm:w-20">
          {position !== null && (
            <span
              ref={marker}
              aria-label={`Your place: ${markerLabel(position, count)}`}
              className="absolute right-1 -translate-y-1/2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold whitespace-nowrap text-white tabular-nums dark:text-black"
              style={{ top: top ?? 0, visibility: top === null ? 'hidden' : 'visible' }}
            >
              {markerLabel(position, count)} ▶
            </span>
          )}
        </div>
        <div data-testid="global-table" className={`min-w-0 flex-1 ${box}`}>
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
                  <tr
                    ref={(element) => {
                      rowRefs.current[index] = element;
                    }}
                    className={`h-12 border-t border-line ${row.current ? 'bg-raised font-bold' : ''}`}
                    aria-current={row.current ? 'true' : undefined}
                  >
                    <td className="px-2">{row.name}</td>
                    <td className="px-2 tabular-nums">{bigNum(row.position, powers)}</td>
                    <td className="px-2 tabular-nums">{row.score === null ? '—' : bigNum(row.score, powers)}</td>
                    <td className="px-2">
                      <Reward reward={row.reward} />
                    </td>
                  </tr>
                </Rows>
              ))}
            </tbody>
          </table>
        </div>
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
  const { data, title } = useSession();
  const avatarUrl = useAvatarUrl();
  const { powers } = title;
  const division = result.division;
  if (!division) {
    return null;
  }
  const count = result.global?.count ?? result.player.globalCount ?? 0;
  const playerIndex = division.entries.findIndex((entry) => entry.isPlayer);

  return (
    <section aria-labelledby="shortboard-heading" className="min-w-0 space-y-2">
      <h2 id="shortboard-heading" className="text-base font-semibold">
        Shortboard
      </h2>
      <div className={`overflow-x-auto ${box}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="h-10 text-left text-xs text-muted uppercase">
              <th className="px-2 font-medium">#</th>
              <th className="w-10 px-1 font-medium">
                <span className="sr-only">Avatar</span>
              </th>
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
                <Rows key={`${entry.position}-${entry.ordinal ?? index}`} before={index === playerIndex ? <MoveUpRow trophies={moveUp} columns={6} /> : null}>
                  <tr className={`h-12 border-t border-line ${entry.isPlayer ? 'bg-raised font-bold hover:bg-accent/25' : 'hover:bg-accent/15'}`} aria-current={entry.isPlayer ? 'true' : undefined}>
                    <td className="px-2 tabular-nums">{bigNum(place, powers)}</td>
                    <td className="px-1">
                      <Avatar url={avatarUrl(entry.avatarId)} className="size-8" />
                    </td>
                    <td className="px-2">{playerName(entry.ordinal)}</td>
                    <td className="px-2 tabular-nums">{bigNum(entry.trophies, powers)}</td>
                    <td className="px-2 tabular-nums">
                      {globalPlace === null ? '—' : bigNum(globalPlace, powers)}
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
const TIME = new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' });
const at = (iso: string) => TIME.format(new Date(iso));

function Results({
  result,
  guid,
  live,
  globalLeaderboardId,
  shortLeaderboardId
}: {
  result: PlayerResult;
  guid: string;
  live: boolean;
  globalLeaderboardId?: string;
  shortLeaderboardId?: string;
}) {
  const { data, title } = useSession();
  const avatarUrl = useAvatarUrl();
  const { powers } = title;
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
        <div className={`flex flex-col items-center justify-center gap-3 p-4 text-center sm:row-span-3 ${box}`}>
          <Avatar url={avatarUrl(player.avatarId)} className="size-32" />
          <h2 className="text-lg font-semibold">{playerName(player.ordinal)}</h2>
        </div>
        <Stat label="Global Position">
          {player.globalPosition !== null && player.globalCount ? (
            <>
              <p className="text-xl font-semibold tabular-nums">
                {bigNum(player.globalPosition + 1, powers)} / {bigNum(player.globalCount, powers)}
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
            {player.divisionPosition !== null && player.divisionCount ? ` · ${bigNum(player.divisionPosition + 1, powers)} of ${bigNum(player.divisionCount, powers)}` : ''}
          </p>
        </Stat>
        <Stat label="Trophies">
          <p className="text-4xl font-bold tabular-nums">{player.trophies === null ? '—' : bigNum(player.trophies, powers)}</p>
        </Stat>
        <Stat label="Player Rank">
          <p className="text-4xl font-bold tabular-nums">{live && player.lteRank !== null ? bigNum(player.lteRank, powers) : '—'}</p>
        </Stat>
        <div className={`p-3 sm:col-span-2 ${box}`}>
          <p className="text-sm">Joined: {when(player.joined)}</p>
          <p className="text-sm">Last updated: {when(player.updated)}</p>
          <p className="mt-1 text-xs text-muted">
            Fetched at {at(result.fetchedAt)}
            {result.boardFetchedAt && <> · global positions as of {at(result.boardFetchedAt)}</>}
          </p>
        </div>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {rows.length > 0 && <GlobalTable result={result} rows={rows} />}
        <ShortboardTable result={result} shortLeaderboardId={shortLeaderboardId} />
      </div>
      <RankDistribution guid={guid} playerId={player.playerId} refreshKey={result.fetchedAt} />
    </div>
  );
}

/** A player's results in the event on display, from the tracker server's copy of the game's leaderboard. */
export function LeaderboardPage() {
  const entry = useLeaderboardEntry();
  const playerId = useTracker((state) => state.settings.playerId);
  const [request, setRequest] = useState(0);
  const { lookup, refreshing } = usePlayerResult(entry?.api?.guid ?? '', entry ? playerId : '', request);

  if (!entry?.api) {
    return <p className={`p-4 text-sm text-muted ${box}`}>There is no leaderboard for this event yet. Leaderboards open once an event has started.</p>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="text-lg font-semibold">Leaderboard</h1>
      <PlayerIdForm busy={lookup.state === 'loading' || refreshing} onShow={() => setRequest((n) => n + 1)} />
      {(lookup.state === 'loading' || refreshing) && <p role="status" className="text-sm text-muted">Loading results…</p>}
      {lookup.state === 'missing' && <p role="status" className="text-sm">No results for this PlayFab ID in this event. Check the ID, or join the event in the game first.</p>}
      {lookup.state === 'unavailable' && <p role="status" className="text-sm">The leaderboard is not available right now.</p>}
      {lookup.state === 'failed' && <p role="alert" className="text-sm text-danger">The results could not be loaded. Try again in a moment.</p>}
      {lookup.state === 'found' && (
        <Results
          result={lookup.result}
          guid={entry.api.guid}
          live={entry.api.live}
          globalLeaderboardId={entry.schedule?.GlobalLeaderboardId} shortLeaderboardId={entry.schedule?.LeaderboardId}
        />
      )}
    </div>
  );
}
