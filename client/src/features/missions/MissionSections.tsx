import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown, Info } from 'lucide-react';
import { memo, useMemo, type ReactNode } from 'react';
import type { BoardMission } from '@/domain/missions';
import { currentRankLabel, eventRankDetails, type EventRankDetails } from '@/domain/missionView';
import { useTracker, type Session } from '@/state/store';
import { HelpText } from './HelpText';
import { MissionRow, type RowShared, type RowState } from './MissionRow';
import { RankControls } from './RankControls';

const headerRow = 'flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2';

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-xl border border-line bg-surface">{children}</section>;
}

/** DOM order is mission order, and grid auto-flow reads it left to right, top to bottom. */
function MissionGrid({ missions, state, shared }: { missions: BoardMission[]; state: RowState; shared: RowShared }) {
  if (missions.length === 0) {
    return null;
  }
  const { etas, ...rest } = shared;
  return (
    <ul className="grid grid-cols-1 gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
      {missions.map((mission) => (
        <MissionRow key={mission.Id} mission={mission} state={state} eta={etas[mission.Id]} {...rest} />
      ))}
    </ul>
  );
}

interface SectionProps {
  session: Session;
  missions: BoardMission[];
  shared: RowShared;
}

export function CompletedSection({ session, missions, shared }: SectionProps) {
  const open = useTracker((state) => state.settings.completedVisible);
  const setOpen = useTracker((state) => state.setCompletedVisible);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} asChild>
      <section className="group rounded-xl border border-line bg-surface">
        <h2>
          <Collapsible.Trigger className="flex min-h-14 w-full items-center gap-3 rounded-xl px-4 py-2 text-left hover:bg-raised/60">
            <span className="text-base font-semibold">Completed</span>
            <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-medium text-muted">
              {missions.length}
              <span className="sr-only"> completed missions</span>
            </span>
            <ChevronDown aria-hidden size={20} className="ml-auto text-muted transition-transform group-data-[state=open]:rotate-180" />
          </Collapsible.Trigger>
        </h2>
        <Collapsible.Content>
          {missions.length === 0 ? <HelpText session={session} /> : <MissionGrid missions={missions} state="completed" shared={shared} />}
        </Collapsible.Content>
      </section>
    </Collapsible.Root>
  );
}

export function CurrentSection({ session, missions, shared }: SectionProps) {
  return (
    <Card>
      <div className={headerRow}>
        <h2 className="text-base font-semibold">Current</h2>
        <span className="ml-auto text-sm text-muted">Rank {currentRankLabel(session.board)}</span>
      </div>
      <MissionGrid missions={missions} state="current" shared={shared} />
    </Card>
  );
}

export function MainRankSection({ session, rank, missions, shared }: SectionProps & { rank: number }) {
  const { board, balance } = session;
  const max = balance.Ranks?.length ?? 0;
  const finished = missions.length === 0 && board.current.length === 0;

  return (
    <Card>
      <div className={headerRow}>
        <h2 className="text-base font-semibold">Rank {rank}</h2>
        <RankControls rank={rank} max={max} />
      </div>
      {finished ? (
        <div className="space-y-1 px-4 pb-4 text-sm">
          <p>Congratulations on completing all missions in Rank {rank}!</p>
          {rank < max && <p>To go to the next rank, use the right arrow button in the header above.</p>}
        </div>
      ) : (
        <MissionGrid missions={missions} state="locked" shared={shared} />
      )}
    </Card>
  );
}

function DetailsPanel({ details }: { details: EventRankDetails }) {
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

function EventRankSectionView({ session, rank, missions, shared }: SectionProps & { rank: number }) {
  const { text, assets, eventInfo, data } = session;
  const common = data.balances['common'];
  const details = useMemo(
    () => eventRankDetails(rank, { ctx: text, assets, eventInfo, common }),
    [rank, text, assets, eventInfo, common]
  );

  return (
    <Collapsible.Root asChild>
      <section className="group rounded-xl border border-line bg-surface">
        <div className={headerRow}>
          <h2 className="text-base font-semibold">Rank {rank}</h2>
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
        <Collapsible.Content>
          <DetailsPanel details={details} />
        </Collapsible.Content>
        <MissionGrid missions={missions} state="locked" shared={shared} />
      </section>
    </Collapsible.Root>
  );
}

export const EventRankSection = memo(EventRankSectionView);
