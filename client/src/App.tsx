import { useEffect, useLayoutEffect, useSyncExternalStore } from 'react';
import { EventsPage } from '@/features/events/EventsPage';
import { GameViewPage } from '@/features/game/GameViewPage';
import { MissionPage } from '@/features/mission/MissionPage';
import { MissionsPage } from '@/features/missions/MissionsPage';
import { ProductionPage } from '@/features/production/ProductionPage';
import { ReferencePage } from '@/features/reference/ReferencePage';
import { AppShell } from '@/features/shell/AppShell';
import { subscribeToLocation, useSearchParam, useView } from '@/state/navigation';
import { trackerStore, useTracker, type ThemeSetting } from '@/state/store';

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function subscribeToSystemTheme(listener: () => void) {
  darkQuery.addEventListener('change', listener);
  return () => darkQuery.removeEventListener('change', listener);
}

function useResolvedTheme(setting: ThemeSetting): 'light' | 'dark' {
  const systemDark = useSyncExternalStore(subscribeToSystemTheme, () => darkQuery.matches);
  if (setting === 'system') {
    return systemDark ? 'dark' : 'light';
  }
  return setting;
}

function Page() {
  const view = useView();
  const missionId = useSearchParam('mission');

  if (missionId) {
    return <MissionPage missionId={missionId} />;
  }
  switch (view) {
    case 'production':
      return <ProductionPage />;
    case 'events':
      return <EventsPage />;
    case 'reference':
      return <ReferencePage />;
    case 'missions':
      return <MissionsPage />;
    default:
      return <GameViewPage />;
  }
}

export function App() {
  const status = useTracker((state) => state.status);
  const error = useTracker((state) => state.error);
  const session = useTracker((state) => state.session);
  const themeSetting = useTracker((state) => state.settings.theme);
  const theme = useResolvedTheme(themeSetting);
  const boot = useTracker((state) => state.boot);

  useLayoutEffect(() => {
    document.documentElement.dataset['theme'] = theme;
  }, [theme]);

  useEffect(() => {
    void boot();
    return subscribeToLocation(() => trackerStore().getState().syncLocation());
  }, [boot]);

  useEffect(() => {
    if (!session) {
      return;
    }
    document.documentElement.dataset['title'] = session.title.key;
    document.title = session.title.isAges ? 'AdVenture Ages Mission Tracker' : 'AdVenture Communist Mission Tracker';
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon) {
      icon.href = session.assets.active('shared/gacha/stone.png');
    }
  }, [session]);

  if (session && status !== 'error') {
    return (
      <AppShell>
        <Page />
      </AppShell>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-6 text-center">
      {status === 'error' ? (
        <div role="alert" className="max-w-sm space-y-3">
          <p className="font-semibold">The tracker could not load its game data.</p>
          <p className="text-sm text-muted">{error}</p>
          <button type="button" onClick={() => void boot()} className="rounded-lg bg-accent px-4 py-2 font-medium text-white dark:text-black">
            Try again
          </button>
        </div>
      ) : (
        <p role="status" className="text-muted">
          Loading missions…
        </p>
      )}
    </div>
  );
}
