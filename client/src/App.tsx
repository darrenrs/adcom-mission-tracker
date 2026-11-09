import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { inGameColours, type InGameColours } from '@/domain/eventColours';
import type { Palette } from '@/domain/palette';
import type { TitleKey } from '@/domain/titles';
import { GameViewPage } from '@/features/game/GameViewPage';
import { MissionPage } from '@/features/mission/MissionPage';
import { MissionsPage } from '@/features/missions/MissionsPage';
import { ProductionPage } from '@/features/production/ProductionPage';
import { ReferencePage } from '@/features/reference/ReferencePage';
import { AllEventsPage } from '@/features/schedule/AllEventsPage';
import { SchedulePage } from '@/features/schedule/SchedulePage';
import { LeaderboardPage } from '@/features/leaderboard/LeaderboardPage';
import { AppShell } from '@/features/shell/AppShell';
import { subscribeToLocation, useSearchParam, useView } from '@/state/navigation';
import { trackerStore, useTracker, type ThemeSetting } from '@/state/store';

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function subscribeToSystemTheme(listener: () => void) {
  darkQuery.addEventListener('change', listener);
  return () => darkQuery.removeEventListener('change', listener);
}

/**
 * The page's light or dark base, plus the In-Game theme's colours when it applies. In-Game takes its base from the
 * balance's palette; without a palette it behaves like System.
 */
function usePageTheme(setting: ThemeSetting, palette: Palette | null, title: TitleKey | null): { theme: 'light' | 'dark'; colours: InGameColours | null } {
  const systemDark = useSyncExternalStore(subscribeToSystemTheme, () => darkQuery.matches);
  const colours = useMemo(
    () => (setting === 'ingame' && palette && title ? inGameColours(palette, title) : null),
    [setting, palette, title]
  );
  if (colours) {
    return { theme: colours.base, colours };
  }
  return { theme: setting === 'light' || setting === 'dark' ? setting : systemDark ? 'dark' : 'light', colours: null };
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
      return <AllEventsPage />;
    case 'schedule':
      return <SchedulePage />;
    case 'leaderboard':
      return <LeaderboardPage />;
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
  const { theme, colours } = usePageTheme(themeSetting, session?.palette ?? null, session?.title.key ?? null);
  const boot = useTracker((state) => state.boot);
  const applied = useRef<string[]>([]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset['theme'] = theme;
    // The In-Game colours replace the theme's own custom properties; anything set before is cleared first.
    for (const name of applied.current) {
      root.style.removeProperty(name);
    }
    applied.current = Object.keys(colours?.vars ?? {});
    for (const [name, value] of Object.entries(colours?.vars ?? {})) {
      root.style.setProperty(name, value);
    }
  }, [theme, colours]);

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
