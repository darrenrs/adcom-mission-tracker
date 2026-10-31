import { useMemo } from 'react';
import { describeMission } from '@/domain/gameText';
import type { BoardMission } from '@/domain/missions';
import { missionIconUrl } from '@/domain/missionView';
import type { Session } from '@/state/store';
import { RankControls } from './RankControls';

/** Every mission of the board, in game order, grouped by rank. Motherland shows only the current rank. */
function rankGroups(board: Session['board']): [number, BoardMission[]][] {
  const all = [...board.completed, ...board.current, ...[...board.ranks.values()].flat()].sort((a, b) => a.Index - b.Index);
  const groups = new Map<number, BoardMission[]>();
  for (const mission of all) {
    if (board.mode === 'event' || mission.Rank === board.mainRank) {
      groups.set(mission.Rank, [...(groups.get(mission.Rank) ?? []), mission]);
    }
  }
  return [...groups];
}

export function ListView({ session, showIcon }: { session: Session; showIcon: boolean }) {
  const { board, text, assets, balance } = session;
  const groups = useMemo(() => rankGroups(board), [board]);

  return (
    <section aria-label="Mission list" className="rounded-xl border border-line bg-surface p-4">
      {board.mode === 'main' && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">Rank {board.mainRank}</h2>
          <RankControls rank={board.mainRank} max={balance.Ranks?.length ?? 0} />
        </div>
      )}
      {groups.map(([rank, missions]) => (
        <div key={rank} className="mb-4 last:mb-0">
          {board.mode === 'event' && <h2 className="mb-1 text-base font-semibold">Rank {rank}</h2>}
          <ul className="space-y-1 text-sm">
            {missions.map((mission) => {
              const description = describeMission(text, mission);
              const iconUrl = showIcon ? missionIconUrl(description, assets) : null;
              return (
                <li key={mission.Id} className="flex items-center gap-2 py-0.5">
                  {iconUrl ? (
                    <img src={iconUrl} alt="" width={20} height={20} loading="lazy" className="size-5 shrink-0 object-contain" />
                  ) : (
                    <span aria-hidden className="mx-2 size-1.5 shrink-0 rounded-full bg-muted" />
                  )}
                  <span>{description.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
