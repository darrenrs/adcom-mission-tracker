import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import { useTracker, type Session } from '@/state/store';
import { CalculatorBadge } from './CalculatorBadge';

function Capsule({ src, ringed, calculator }: { src: string; ringed?: boolean; calculator?: boolean }) {
  return (
    <span className="relative mx-0.5 inline-block size-5 align-text-bottom">
      <img
        src={src}
        alt=""
        width={20}
        height={20}
        className={`size-5 object-contain ${ringed ? 'rounded-full ring-2 ring-accent ring-offset-1 ring-offset-surface' : ''}`}
      />
      {calculator && <CalculatorBadge small />}
    </span>
  );
}

export function HowToUse({ session }: { session: Session }) {
  const { mode, assets } = session;
  const open = useTracker((state) => state.settings.howToUseVisible);
  const setOpen = useTracker((state) => state.setHowToUseVisible);
  const capsule = assets.active(`shared/gacha/${mode === 'main' ? 'wood' : 'plastic'}.png`);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} asChild>
      <section className="group rounded-xl border border-line bg-surface">
        <h2>
          <Collapsible.Trigger className="flex min-h-14 w-full items-center gap-3 rounded-xl px-4 py-2 text-left hover:bg-raised/60">
            <span className="text-base font-semibold">How to use</span>
            <ChevronDown aria-hidden size={20} className="ml-auto text-muted transition-transform group-data-[state=open]:rotate-180" />
          </Collapsible.Trigger>
        </h2>
        <Collapsible.Content>
          <ul className="list-disc space-y-1.5 px-4 pb-4 pl-9 text-sm">
            <li>
              Tap a <strong>Current</strong> mission to complete it.
            </li>
            <li>
              Tap a <strong>Completed</strong> mission to move it back to Current.
            </li>
            <li>
              Tap the capsule <Capsule src={capsule} calculator /> beside a mission to open its <strong>calculator</strong>. A ringed
              capsule <Capsule src={capsule} ringed /> means the <strong>rewards are scripted</strong>.
            </li>
            <li>
              Use the arrow in the Completed header to <strong>hide</strong> this list.
            </li>
          </ul>
        </Collapsible.Content>
      </section>
    </Collapsible.Root>
  );
}
