import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import type { Researcher } from '@/domain/types';
import { useResearcherActions } from '@/features/calculator/useResearcherActions';

const button = 'min-h-control rounded-lg border border-line px-4 text-sm font-medium hover:bg-raised';

/** Max all, and Set all to 0 behind a confirmation, because it throws away every level entered. */
export function ResearcherBulkActions({ researchers, word }: { researchers: readonly Researcher[]; word: string }) {
  const { setAll } = useResearcherActions();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setAll(researchers, 'max')} className={button}>
        Max all
      </button>
      <button type="button" onClick={() => setConfirming(true)} className={button}>
        Set all to 0
      </button>

      <Dialog.Root open={confirming} onOpenChange={setConfirming}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-surface p-4 shadow-xl">
            <Dialog.Title className="text-base font-semibold">Set all {word.toLowerCase()} to 0?</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted">
              This clears every level entered for this game mode. The propaganda boost is not affected.
            </Dialog.Description>
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close className={button}>Cancel</Dialog.Close>
              <button
                type="button"
                onClick={() => {
                  setAll(researchers, 0);
                  setConfirming(false);
                }}
                className="min-h-control rounded-lg bg-accent px-4 text-sm font-medium text-white dark:text-black"
              >
                Set all to 0
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
