import { Factory, Gamepad2, ListChecks, LibraryBig, Trophy, type LucideIcon } from 'lucide-react';
import { useLeaderboardAvailable } from '@/features/leaderboard/useLeaderboard';
import { navigate, useView, type ViewName } from '@/state/navigation';

const TABS: { view: ViewName; label: string; icon: LucideIcon }[] = [
  { view: 'game', label: 'Game View', icon: Gamepad2 },
  { view: 'missions', label: 'Missions', icon: ListChecks },
  { view: 'production', label: 'Production', icon: Factory },
  { view: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { view: 'reference', label: 'Reference', icon: LibraryBig }
];

/** The main tabs: a bottom bar on phones, a row under the header on tablets, and part of the header on wide screens. */
export function Tabs({ className }: { className: string }) {
  const active = useView();
  const showLeaderboard = useLeaderboardAvailable();
  return (
    <nav aria-label="Main" className={className}>
      {TABS.filter(({ view }) => view !== 'leaderboard' || showLeaderboard).map(({ view, label, icon: Icon }) => (
        <button
          key={view}
          type="button"
          aria-current={active === view ? 'page' : undefined}
          onClick={() =>
            navigate({
              view: view === 'game' ? null : view,
              mission: null,
              researcher: null,
              tab: null
            })
          }
          className="flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium whitespace-nowrap text-muted transition-colors hover:text-ink aria-[current=page]:text-accent sm:min-h-control sm:flex-none sm:flex-row sm:gap-2 sm:border-b-2 sm:border-transparent sm:px-3 sm:text-sm sm:aria-[current=page]:border-accent"
        >
          <Icon aria-hidden size={20} />
          {label}
        </button>
      ))}
    </nav>
  );
}
