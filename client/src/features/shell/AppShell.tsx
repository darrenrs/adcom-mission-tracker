import { CalendarDays, Factory, ListChecks, LibraryBig, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { navigate, useView, type ViewName } from '@/state/navigation';
import { Footer } from './Footer';
import { Header } from './Header';

const TABS: { view: ViewName; label: string; icon: LucideIcon }[] = [
  { view: 'missions', label: 'Missions', icon: ListChecks },
  { view: 'production', label: 'Production', icon: Factory },
  { view: 'events', label: 'Events', icon: CalendarDays },
  { view: 'reference', label: 'Reference', icon: LibraryBig }
];

function Tabs({ className }: { className: string }) {
  const active = useView();
  return (
    <nav aria-label="Main" className={className}>
      {TABS.map(({ view, label, icon: Icon }) => (
        <button
          key={view}
          type="button"
          aria-current={active === view ? 'page' : undefined}
          onClick={() => navigate({ view: view === 'missions' ? null : view, mission: null })}
          className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted transition-colors hover:text-ink aria-[current=page]:text-accent sm:min-h-11 sm:flex-none sm:flex-row sm:gap-2 sm:border-b-2 sm:border-transparent sm:px-3 sm:text-sm sm:aria-[current=page]:border-accent"
        >
          <Icon aria-hidden size={20} />
          {label}
        </button>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="sticky top-0 z-20 border-b border-line bg-surface">
        <Header />
        <Tabs className="mx-auto hidden w-full max-w-6xl gap-1 px-4 sm:flex" />
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pt-3 pb-24 sm:px-4 sm:pb-6">{children}</main>
      <Footer />
      <Tabs className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden" />
    </div>
  );
}
