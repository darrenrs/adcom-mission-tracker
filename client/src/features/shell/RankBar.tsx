import { rankProgress, type RankProgress } from '@/domain/missionView';
import { useSession } from '@/state/store';

/** The rank in the middle of the top bar. Tapping it opens the rank controls beneath the bar. */
export function RankBar({ open, onToggle }: { open: boolean; onToggle(): void }) {
  const { board } = useSession();
  const progress = rankProgress(board);
  const { rank, done, total, finished } = progress;

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={finished ? 'All ranks complete. Change rank' : `Rank ${rank}, ${done} of ${total} complete. Change rank`}
      onClick={onToggle}
      className="mx-auto flex min-h-11 w-full max-w-xs min-w-0 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold hover:bg-raised aria-expanded:bg-raised"
    >
      <span className="shrink-0">{finished ? 'Complete!' : `Rank ${rank}`}</span>
      <Bar progress={progress} />
      <span className="shrink-0 font-medium text-muted tabular-nums">
        {done}/{total}
      </span>
    </button>
  );
}

function Bar({ progress: { done, total } }: { progress: RankProgress }) {
  return (
    <span className="h-2 min-w-6 flex-1 overflow-hidden rounded-full bg-line">
      <span className="block h-full rounded-full bg-accent" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
    </span>
  );
}
