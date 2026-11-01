import { TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Session } from '@/state/store';

function Banner({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm">
      <TriangleAlert aria-hidden size={18} className="mt-0.5 shrink-0 text-warning" />
      <p>{children}</p>
    </div>
  );
}

export function Banners({ session }: { session: Session }) {
  const { title, mode, board, lteInfo, startup } = session;
  const datamined =
    (mode === 'evergreen' && title.datamineWarningMinRank !== undefined && board.evergreenRank >= title.datamineWarningMinRank) ||
    (mode === 'lte' && title.datamineWarningThemeId !== undefined && lteInfo?.ThemeId === title.datamineWarningThemeId);

  return (
    <>
      {lteInfo === null && (
        <Banner>There is no additional schedule data. Please contact @enigma.code or @catster via Discord to update the schedule.</Banner>
      )}
      {datamined && (
        <Banner>
          This mission list has been <strong>datamined</strong> from a future version and may not be final.
        </Banner>
      )}
      {startup.isFakeLte && <Banner>This event is new content, and will be added to the Tracker shortly before the event begins.</Banner>}
      {startup.overrideActive && (
        <Banner>
          You are in <strong>Event Override</strong> mode. Event progress is temporary.
        </Banner>
      )}
    </>
  );
}
