import { useMemo, useState } from 'react';
import { useSession, useTracker } from '@/state/store';
import { Banners } from './Banners';
import { CompleteEarlierDialog } from './CompleteEarlierDialog';
import { HowToUse } from './HowToUse';
import type { RowShared } from './MissionRow';
import { CompletedSection, CurrentSection, UpcomingSection } from './MissionSections';

export function MissionsPage() {
  const session = useSession();
  const onToggle = useTracker((state) => state.clickMission);
  const onSwitchAb = useTracker((state) => state.switchAbGroup);

  const { text: ctx, assets, etas } = session;
  const [targetId, setTargetId] = useState<string | null>(null);
  const shared = useMemo<RowShared>(
    () => ({ ctx, assets, etas, onToggle, onRequestCompleteBefore: setTargetId, onSwitchAb }),
    [ctx, assets, etas, onToggle, onSwitchAb]
  );

  return (
    <div className="space-y-3">
      <Banners session={session} />
      <HowToUse session={session} />
      <CompletedSection session={session} shared={shared} />
      <CurrentSection session={session} shared={shared} />
      <UpcomingSection session={session} shared={shared} />
      <CompleteEarlierDialog session={session} missionId={targetId} onClose={() => setTargetId(null)} />
    </div>
  );
}
