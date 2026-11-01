import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown, Info } from 'lucide-react';
import { memo, useMemo, type ReactNode } from 'react';
import { boardSections, type BoardMission } from '@/domain/missions';
import { lteRankDetails, groupByRank, inMissionOrder, type LteRankDetails } from '@/domain/missionView';
import { useTracker, type Session } from '@/state/store';
import { MissionRow, type RowShared, type RowState } from './MissionRow';

/** Advancing fills Completed, so the rank control scrolls back to this section. */
export const CURRENT_SECTION_ID = 'current-missions';

const headerRow = 'flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2';

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-xl border border-line bg-surface">{children}</section>;
}

/** DOM order is mission order, and grid auto-flow reads it left to right, top to bottom. */
function MissionGrid({ missions, state, shared }: { missions: BoardMission[]; state: RowState; shared: RowShared }) {
  const ordered = useMemo(() => inMissionOrder(missions), [missions]);
  if (ordered.length === 0) {
    return null;
  }
  const { etas, ...rest } = shared;
  return (
    <ul className="grid grid-cols-1 gap-2 p-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {ordered.map((mission) => (
        <MissionRow key={mission.Id} mission={mission} state={state} eta={etas[mission.Id]} {...rest} />
      ))}
    </ul>
  );
}

interface SectionProps {
  session: Session;
  shared: RowShared;
}

const rankHeading = 'text-sm font-semibold text-muted';

/** Events group completed missions by rank. */
export function CompletedSection({ session, shared }: SectionProps) {
  const { board, mode } = session;
  const open = useTracker((state) => state.settings.completedVisible);
  const setOpen = useTracker((state) => state.setCompletedVisible);
  const groups = useMemo(() => groupByRank(board.completed), [board.completed]);

  let body = <p className="px-4 pb-4 text-sm text-muted">No completed missions yet.</p>;
  if (board.completed.length > 0) {
    body =
      mode === 'evergreen' ? (
        <MissionGrid missions={board.completed} state="completed" shared={shared} />
      ) : (
        <>
          {groups.map(({ rank, missions }) => (
            <section key={rank} aria-label={`Completed in Rank ${rank}`} className="border-t border-line first:border-t-0">
              <h3 className={`px-4 pt-3 ${rankHeading}`}>Rank {rank}</h3>
              <MissionGrid missions={missions} state="completed" shared={shared} />
            </section>
          ))}
        </>
      );
  }

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} asChild>
      <section className="group rounded-xl border border-line bg-surface">
        <h2>
          <Collapsible.Trigger className="flex min-h-14 w-full items-center gap-3 rounded-xl px-4 py-2 text-left hover:bg-raised/60">
            <span className="text-base font-semibold">Completed</span>
            <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-medium text-muted">
              {board.completed.length}
              <span className="sr-only"> completed missions</span>
            </span>
            <ChevronDown aria-hidden size={20} className="ml-auto text-muted transition-transform group-data-[state=open]:rotate-180" />
          </Collapsible.Trigger>
        </h2>
        <Collapsible.Content>{body}</Collapsible.Content>
      </section>
    </Collapsible.Root>
  );
}

export function CurrentSection({ session, shared }: SectionProps) {
  const { board, mode, balance } = session;
  const max = balance.Ranks?.length ?? 0;
  const rank = board.evergreenRank;
  const finished = mode === 'evergreen' && board.current.length === 0;

  return (
    <section id={CURRENT_SECTION_ID} className="scroll-mt-16 rounded-xl border border-line bg-surface sm:scroll-mt-28">
      <div className={headerRow}>
        <h2 className="text-base font-semibold">Current</h2>
      </div>
      {finished ? (
        <div className="space-y-1 px-4 pb-4 text-sm">
          <p>Congratulations on completing all missions in Rank {rank}!</p>
          {rank < max && <p>To go to the next rank, tap the rank at the top of the page.</p>}
        </div>
      ) : (
        <MissionGrid missions={board.current} state="current" shared={shared} />
      )}
    </section>
  );
}

/** Motherland shows the rest of its one rank. Events show every later rank, each with its own heading. */
export function UpcomingSection({ session, shared }: SectionProps) {
  const { board, mode } = session;
  const groups = boardSections(board).flatMap(({ key, missions }) =>
    typeof key === 'number' && missions.length > 0 ? [{ rank: key, missions }] : []
  );

  if (groups.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className={headerRow}>
        <h2 className="text-base font-semibold">Upcoming</h2>
      </div>
      {mode === 'evergreen'
        ? groups.map(({ rank, missions }) => <MissionGrid key={rank} missions={missions} state="locked" shared={shared} />)
        : groups.map(({ rank, missions }) => (
            <LteRankGroup key={rank} session={session} rank={rank} missions={missions} shared={shared} />
          ))}
    </Card>
  );
}

function DetailsPanel({ details }: { details: LteRankDetails }) {
  const { completionRewards, firstFreeCapsule, researchers, researchersLabel } = details;

  return (
    <div className="space-y-4 border-t border-line bg-raised/50 px-4 py-3 text-sm">
      {completionRewards.length > 0 && (
        <div>
          <h3 className="font-semibold">Completion reward{completionRewards.length > 1 ? 's' : ''}</h3>
          <ul className="mt-1 space-y-1">
            {completionRewards.map((reward, index) => (
              <li key={index} className="flex items-center gap-2">
                {reward.iconUrl && <img src={reward.iconUrl} alt="" width={24} height={24} loading="lazy" className="size-6 object-contain" />}
                {reward.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {firstFreeCapsule && (
        <div>
          <h3 className="font-semibold">First free capsule</h3>
          <ul className="mt-1 space-y-1">
            {firstFreeCapsule.science !== null && (
              <li className="flex items-center gap-2">
                {firstFreeCapsule.science}
                <img src={firstFreeCapsule.scienceIconUrl} alt="" width={24} height={24} loading="lazy" className="size-6 object-contain" />
              </li>
            )}
            {firstFreeCapsule.cards.map((card) => (
              <li key={card.name} className="flex items-center gap-2">
                {card.value}x
                <img src={firstFreeCapsule.cardIconUrl} alt="" width={24} height={24} loading="lazy" className="size-6 object-contain" />
                {card.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {researchers.length > 0 && (
        <div>
          <h3 className="font-semibold">{researchersLabel}</h3>
          <ul className="mt-1 space-y-2">
            {researchers.map((researcher) => (
              <li key={researcher.id}>
                {researcher.name}: <em>{researcher.description}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LteRankGroupView({ session, rank, missions, shared }: SectionProps & { rank: number; missions: BoardMission[] }) {
  const { text, assets, lteInfo, data } = session;
  const common = data.balances['common'];
  const details = useMemo(
    () => lteRankDetails(rank, { ctx: text, assets, lteInfo, common }),
    [rank, text, assets, lteInfo, common]
  );

  return (
    <Collapsible.Root asChild>
      <section aria-label={`Upcoming in Rank ${rank}`} className="border-t border-line">
        <div className="flex min-h-11 items-center gap-3 px-4 pt-2">
          <h3 className={rankHeading}>Rank {rank}</h3>
          {details.hasContent && (
            <Collapsible.Trigger
              aria-label={`Rank ${rank} details`}
              className="ml-auto flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm text-muted hover:bg-raised hover:text-ink data-[state=open]:bg-raised data-[state=open]:text-ink"
            >
              <Info aria-hidden size={18} />
              Details
            </Collapsible.Trigger>
          )}
        </div>
        <Collapsible.Content className="mt-2">
          <DetailsPanel details={details} />
        </Collapsible.Content>
        <MissionGrid missions={missions} state="locked" shared={shared} />
      </section>
    </Collapsible.Root>
  );
}

const LteRankGroup = memo(LteRankGroupView);
