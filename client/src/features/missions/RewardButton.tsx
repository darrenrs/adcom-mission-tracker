import { Gift } from 'lucide-react';
import { hasCalculator, type missionRewardIcon } from '@/domain/missionView';
import type { BoardMission } from '@/domain/missions';
import { navigate } from '@/state/navigation';
import { CalculatorBadge } from './CalculatorBadge';

interface Props {
  mission: BoardMission;
  /** The mission's text, for the button's label. */
  name: string;
  reward: ReturnType<typeof missionRewardIcon>;
  className: string;
}

/** The capsule beside a mission. It opens the mission page, with the calculator when the mission has one. */
export function RewardButton({ mission, name, reward, className }: Props) {
  const calculator = hasCalculator(mission);

  return (
    <button
      type="button"
      onClick={() => navigate({ mission: mission.Id })}
      aria-label={`${calculator ? 'Reward and calculator' : 'Reward'} for ${name}${reward.scripted ? ' (scripted reward)' : ''}`}
      title={calculator ? 'Open calculator and reward' : 'Open reward'}
      className={className}
    >
      <span className="relative">
        {reward.url ? (
          <img
            src={reward.url}
            alt=""
            width={32}
            height={32}
            loading="lazy"
            decoding="async"
            className={`size-8 object-contain ${reward.scripted ? 'rounded-full ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}`}
          />
        ) : (
          <Gift aria-hidden size={24} />
        )}
        {calculator && <CalculatorBadge />}
      </span>
    </button>
  );
}
