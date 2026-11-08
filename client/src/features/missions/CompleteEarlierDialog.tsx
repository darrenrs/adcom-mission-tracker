import * as Dialog from '@radix-ui/react-dialog';
import { useMemo } from 'react';
import { describeMission } from '@/domain/gameText';
import { missionsBefore, upcomingMissions } from '@/domain/missions';
import { useTracker, type Session } from '@/state/store';

interface CompleteEarlierDialogProps {
  session: Session;
  missionId: string | null;
  onClose(): void;
}

/** Shown when a future mission is clicked: lets a player catch up without clicking through every mission. */
export function CompleteEarlierDialog({ session, missionId, onClose }: CompleteEarlierDialogProps) {
  const completeMissionsBefore = useTracker((state) => state.completeMissionsBefore);
  const { board, text } = session;
  const earlier = useMemo(() => (missionId ? missionsBefore(board, missionId) : []), [board, missionId]);
  const target = upcomingMissions(board).find((m) => m.Id === missionId);

  if (!target || earlier.length === 0) {
    return null;
  }

  const count = earlier.length;
  const missions = `${count} mission${count === 1 ? '' : 's'}`;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-xl border border-line bg-surface p-5 shadow-xl">
          <Dialog.Title className="text-base font-semibold">Mark all previous missions as complete?</Dialog.Title>
          <Dialog.Description className="text-sm text-muted">
            This completes the {missions} before <strong className="text-ink">{describeMission(text, target).text}</strong>.
            You can undo any of them from Completed.
          </Dialog.Description>
          <div className="flex flex-wrap justify-end gap-2">
            <Dialog.Close className="min-h-control rounded-lg border border-line px-4 text-sm font-medium hover:bg-raised">Cancel</Dialog.Close>
            <button
              type="button"
              onClick={() => {
                completeMissionsBefore(target.Id);
                onClose();
              }}
              className="min-h-control rounded-lg bg-accent px-4 text-sm font-medium text-white dark:text-black"
            >
              Mark {missions} complete
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
