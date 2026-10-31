import { useMemo } from 'react';
import { boardSections } from '@/domain/missions';
import { useSession, useTracker } from '@/state/store';
import { Banners } from './Banners';
import { ListView } from './ListView';
import type { RowShared } from './MissionRow';
import { CompletedSection, CurrentSection, EventRankSection, MainRankSection } from './MissionSections';

export function MissionsPage() {
  const session = useSession();
  const icons = useTracker((state) => state.settings.icons);
  const listView = useTracker((state) => state.settings.listView);
  const onToggle = useTracker((state) => state.clickMission);
  const onSwitchAb = useTracker((state) => state.switchAbGroup);

  const sections = useMemo(() => boardSections(session.board), [session.board]);
  const { text: ctx, assets, etas } = session;
  const shared = useMemo<RowShared>(
    () => ({ ctx, assets, etas, showIcon: icons !== 'none', onToggle, onSwitchAb }),
    [ctx, assets, etas, icons, onToggle, onSwitchAb]
  );

  return (
    <div className="space-y-3">
      <Banners session={session} />
      {listView ? (
        <ListView session={session} showIcon={icons !== 'none'} />
      ) : (
        sections.map(({ key, missions }) => {
          const props = { session, missions, shared };
          if (key === 'Completed') {
            return <CompletedSection key={key} {...props} />;
          }
          if (key === 'Current') {
            return <CurrentSection key={key} {...props} />;
          }
          return session.mode === 'main' ? (
            <MainRankSection key={key} rank={key} {...props} />
          ) : (
            <EventRankSection key={key} rank={key} {...props} />
          );
        })
      )}
    </div>
  );
}
