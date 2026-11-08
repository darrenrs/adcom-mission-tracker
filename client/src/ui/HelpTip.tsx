import * as Popover from '@radix-ui/react-popover';
import { CircleHelp } from 'lucide-react';
import type { ReactNode } from 'react';

const content = 'z-40 max-w-xs rounded-lg border border-line bg-surface p-3 text-sm shadow-lg';

/**
 * A "?" beside a heading that shows its explanation in a small popover, so the text costs no space until wanted.
 * Tab skips it, so moving between fields stays quick.
 */
export function HelpTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        tabIndex={-1}
        aria-label={`Help: ${label}`}
        className="inline-flex size-control shrink-0 items-center justify-center rounded-full text-muted hover:bg-raised hover:text-ink data-[state=open]:text-ink"
      >
        <CircleHelp aria-hidden size={16} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={4} collisionPadding={8} className={content}>
          <div className="space-y-2">{children}</div>
          <Popover.Arrow className="fill-surface" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
