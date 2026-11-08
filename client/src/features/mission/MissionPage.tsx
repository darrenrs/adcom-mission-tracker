import { ArrowLeft, Gift } from 'lucide-react';
import { useMemo } from 'react';
import { getTimeStampLocaleString } from '@/domain/format';
import { describeMission, describeReward, type RewardPart } from '@/domain/gameText';
import type { BoardMission, MissionBoard } from '@/domain/missions';
import { missionIconUrl, missionRewardIcon, missionTone } from '@/domain/missionView';
import { MissionCalculator } from '@/features/calculator/MissionCalculator';
import type { AssetResolver } from '@/domain/assets';
import { navigate } from '@/state/navigation';
import type { TrackerMode } from '@/domain/types';
import { useSession } from '@/state/store';

type MissionStatus = 'current' | 'completed' | 'upcoming';

function findMission(board: MissionBoard, missionId: string): { mission: BoardMission; status: MissionStatus } | null {
  const completed = board.completed.find((m) => m.Id === missionId);
  if (completed) {
    return { mission: completed, status: 'completed' };
  }
  const current = board.current.find((m) => m.Id === missionId);
  if (current) {
    return { mission: current, status: 'current' };
  }
  for (const missions of board.ranks.values()) {
    const upcoming = missions.find((m) => m.Id === missionId);
    if (upcoming) {
      return { mission: upcoming, status: 'upcoming' };
    }
  }
  return null;
}

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigate({ mission: null });
  }
}

function BackButton() {
  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex min-h-control items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted hover:bg-raised hover:text-ink"
    >
      <ArrowLeft aria-hidden size={18} />
      Back
    </button>
  );
}

const TONE_CLASS = {
  danger: 'border-l-danger bg-danger-soft',
  success: 'border-l-success bg-success-soft',
  neutral: 'border-l-line bg-surface'
} as const;

const STATUS_TEXT: Record<MissionStatus, string> = {
  current: 'Current',
  completed: 'Completed',
  upcoming: 'Locked until it reaches Current'
};

function PartIcon({ src }: { src: string }) {
  return <img src={src} alt="" width={24} height={24} loading="lazy" className="inline-block size-6 object-contain" />;
}

export function partIconUrl(part: RewardPart, mode: TrackerMode, assets: AssetResolver): string {
  switch (part.kind) {
    case 'capsule':
      return assets.active(`shared/gacha/${part.id}.png`);
    case 'card':
      return assets.active('shared/card.png');
    default:
      if (part.id === 'science' || part.id === 'darkscience') {
        return assets.active(mode === 'evergreen' ? 'main/darkscience.png' : 'event/darkscience.png');
      }
      return part.id === 'gold' ? assets.active('shared/gold.png') : assets.active(`main/${part.id}.png`);
  }
}

export function RewardView({ parts, mode, assets }: { parts: RewardPart[]; mode: TrackerMode; assets: AssetResolver }) {
  const lead = parts.filter((part) => part.kind === 'text' || part.kind === 'capsule');
  const items = parts.filter((part) => part.kind === 'resource' || part.kind === 'card');

  return (
    <div className="space-y-1">
      {lead.length > 0 && (
        <p className="flex flex-wrap items-center gap-1">
          {lead.map((part, index) =>
            part.kind === 'capsule' ? (
              <PartIcon key={index} src={partIconUrl(part, mode, assets)} />
            ) : (
              <span key={index}>{part.text.trim()}</span>
            )
          )}
        </p>
      )}
      {items.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {items.map((part, index) => (
            <li key={index} className="flex items-center gap-2">
              {part.kind === 'card' ? (
                <>
                  {part.value}x <PartIcon src={partIconUrl(part, mode, assets)} /> {part.name}
                </>
              ) : (
                <>
                  <PartIcon src={partIconUrl(part, mode, assets)} /> {part.amount} {part.name}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MissionPage({ missionId }: { missionId: string }) {
  const session = useSession();
  const found = useMemo(() => findMission(session.board, missionId), [session.board, missionId]);

  if (!found) {
    return (
      <div className="space-y-3">
        <BackButton />
        <div role="alert" className="rounded-xl border border-line bg-surface p-4">
          <p className="font-semibold">Mission not found</p>
          <p className="mt-1 text-sm text-muted">
            This mission is not in the current list. It may belong to another rank, event or game.
          </p>
        </div>
      </div>
    );
  }

  const { mission, status } = found;
  const { text: ctx, assets, mode, completionTimes } = session;
  const description = describeMission(ctx, mission);
  const iconUrl = missionIconUrl(description, assets);
  const reward = missionRewardIcon(mission, ctx.balance, assets);
  const parts = describeReward(ctx, mission.Reward);
  const completedAt = completionTimes[mission.Id];

  return (
    <div className="space-y-2 pointer-fine:space-y-1.5">
      <BackButton />

      <section
        className={`grid gap-2 rounded-xl border border-l-4 border-line p-3 pointer-fine:p-2.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-6 ${TONE_CLASS[missionTone(mission)]}`}
      >
        <div className="flex items-start gap-3">
          {iconUrl && <img src={iconUrl} alt="" width={40} height={40} className="size-10 shrink-0 object-contain" />}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg leading-snug font-semibold break-words">{description.text}</h1>
            <p className="mt-0.5 text-sm text-muted">
              Rank {mission.Rank} · {STATUS_TEXT[status]}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm lg:max-w-xl lg:border-l lg:border-line lg:pl-4">
          {reward.url ? (
            <img
              src={reward.url}
              alt=""
              width={40}
              height={40}
              className={`size-10 shrink-0 object-contain ${reward.scripted ? 'rounded-full ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}`}
            />
          ) : (
            <Gift aria-hidden size={32} className="shrink-0 text-muted" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Reward</h2>
            <RewardView parts={parts} mode={mode} assets={assets} />
          </div>
        </div>

        {status === 'completed' && completedAt !== undefined && (
          <p className="text-sm text-muted lg:col-span-2">Completed {getTimeStampLocaleString(completedAt)}</p>
        )}
      </section>

      <MissionCalculator mission={mission} />
    </div>
  );
}
