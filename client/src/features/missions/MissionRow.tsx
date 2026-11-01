import { ArrowLeftRight, Circle, CircleCheck, Lock } from 'lucide-react';
import { memo, useMemo } from 'react';
import type { AssetResolver } from '@/domain/assets';
import { getMissionEtaString } from '@/domain/format';
import { describeMission, type GameTextContext } from '@/domain/gameText';
import type { BoardMission } from '@/domain/missions';
import { abSwitchLabel, missionIconUrl, missionRewardIcon, missionTone, type MissionTone } from '@/domain/missionView';
import { RewardButton } from './RewardButton';
import { useMinuteClock } from './useMinuteClock';

export type RowState = 'current' | 'completed' | 'locked';

/** Everything a row needs besides its mission. Held steady between renders so that rows can be memoised. */
export interface RowShared {
  ctx: GameTextContext;
  assets: AssetResolver;
  etas: Record<string, number>;
  onToggle(missionId: string): void;
  onRequestCompleteBefore(missionId: string): void;
  onSwitchAb(missionId: string): void;
}

// Spend/Upgrade and Cards/Dark Science missions keep the colours legacy gave them.
export const TONE_CLASS: Record<MissionTone, string> = {
  danger: 'border-danger/30 border-l-danger bg-danger-soft',
  success: 'border-success/30 border-l-success bg-success-soft',
  neutral: 'border-line border-l-line bg-surface'
};

const sideButton =
  'flex min-h-12 min-w-11 shrink-0 items-center justify-center rounded-lg text-muted enabled:hover:bg-raised enabled:hover:text-ink disabled:cursor-not-allowed';

function Eta({ timestamp, powers }: { timestamp: number; powers: readonly string[] }) {
  const now = useMinuteClock();
  return <span className="mt-0.5 block text-xs text-muted">ETA: {getMissionEtaString(timestamp, powers, now)}</span>;
}

function StatusIcon({ state }: { state: RowState }) {
  if (state === 'completed') {
    return <CircleCheck aria-hidden size={22} className="shrink-0 text-accent" />;
  }
  if (state === 'locked') {
    return <Lock aria-hidden size={18} className="shrink-0 text-muted" />;
  }
  return <Circle aria-hidden size={22} className="shrink-0 text-muted" />;
}

const STATE_PREFIX: Record<RowState, string> = {
  current: 'Complete mission: ',
  completed: 'Undo completed mission: ',
  locked: 'Upcoming mission: '
};

interface MissionRowProps extends Omit<RowShared, 'etas'> {
  mission: BoardMission;
  state: RowState;
  eta: number | undefined;
}

function MissionRowView({ mission, state, eta, ctx, assets, onToggle, onRequestCompleteBefore, onSwitchAb }: MissionRowProps) {
  const description = useMemo(() => describeMission(ctx, mission), [ctx, mission]);
  const iconUrl = useMemo(() => missionIconUrl(description, assets), [description, assets]);
  const reward = useMemo(() => missionRewardIcon(mission, ctx.balance, assets), [mission, ctx.balance, assets]);
  const locked = state === 'locked';
  const done = state === 'completed';
  const abLabel = mission.AbTestConfig ? abSwitchLabel(ctx.balance, mission.AbTestConfig) : null;

  return (
    <li
      className={`flex items-stretch rounded-lg border border-l-4 ${TONE_CLASS[missionTone(mission)]}`}
    >
      <button
        type="button"
        onClick={() => (locked ? onRequestCompleteBefore(mission.Id) : onToggle(mission.Id))}
        className={`flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-raised/60 active:bg-raised ${locked ? 'opacity-60' : ''}`}
      >
        <StatusIcon state={state} />
        {iconUrl && (
          <img src={iconUrl} alt="" width={32} height={32} loading="lazy" decoding="async" className="size-8 shrink-0 object-contain" />
        )}
        <span className="min-w-0 flex-1">
          <span className={`block text-sm leading-snug font-medium break-words ${done ? 'text-muted' : ''}`}>
            <span className="sr-only">{STATE_PREFIX[state]}</span>
            {description.text}
          </span>
          {eta !== undefined && <Eta timestamp={eta} powers={ctx.title.powers} />}
        </span>
      </button>

      {abLabel && (
        <button type="button" onClick={() => onSwitchAb(mission.Id)} aria-label={abLabel} title={abLabel} className={sideButton}>
          <ArrowLeftRight aria-hidden size={18} />
        </button>
      )}

      {/* Future missions stay open to planning, as in legacy. */}
      <RewardButton mission={mission} name={description.text} reward={reward} className={`${sideButton} min-w-14 pr-1`} />
    </li>
  );
}

export const MissionRow = memo(MissionRowView);
