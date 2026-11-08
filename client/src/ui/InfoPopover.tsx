import * as Popover from '@radix-ui/react-popover';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

/** An "i" button with details in a small popover beside it. Tab skips it, like the other helper buttons. */
export function InfoPopover({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        tabIndex={-1}
        aria-label={label}
        className={`inline-flex size-control shrink-0 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink data-[state=open]:bg-raised data-[state=open]:text-ink ${className}`}
      >
        <Info aria-hidden size={16} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={4} collisionPadding={8} className="z-40 max-w-xs rounded-lg border border-line bg-surface p-3 text-sm shadow-lg">
          {children}
          <Popover.Arrow className="fill-surface" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
