import * as Popover from '@radix-ui/react-popover';
import { useState } from 'react';
import { rankProgress, type RankProgress } from '@/domain/missionView';
import { useSession } from '@/state/store';
import { RankControls } from './RankControls';

/** The rank in the middle of the top bar. Tapping it opens the rank controls in a popover, so nothing below moves. */
export function RankBar() {
  const { board } = useSession();
  const [open, setOpen] = useState(false);
  const progress = rankProgress(board);
  const { rank, done, total, finished } = progress;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={finished ? 'All ranks complete. Change rank' : `Rank ${rank}, ${done} of ${total} complete. Change rank`}
        className="mx-auto flex min-h-control w-full max-w-xs min-w-0 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold hover:bg-raised data-[state=open]:bg-raised"
      >
        <span className="shrink-0">{finished ? 'Complete!' : `Rank ${rank}`}</span>
        <Bar progress={progress} />
        <span className="shrink-0 font-medium text-muted tabular-nums">
          {done}/{total}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={4} collisionPadding={8} className="z-40 rounded-xl border border-line bg-surface shadow-lg">
          <RankControls progress={progress} onClose={() => setOpen(false)} />
          <Popover.Arrow className="fill-surface" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Bar({ progress: { done, total } }: { progress: RankProgress }) {
  return (
    <span className="h-2 min-w-6 flex-1 overflow-hidden rounded-full bg-line">
      <span className="block h-full rounded-full bg-accent" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
    </span>
  );
}
