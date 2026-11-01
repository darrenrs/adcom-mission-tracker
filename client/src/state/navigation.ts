// URL state uses query parameters, so the app needs no server routes and works under any sub-path.
import { useSyncExternalStore } from 'react';

export type ViewName = 'game' | 'missions' | 'production' | 'events' | 'reference';

const VIEWS: readonly ViewName[] = ['game', 'missions', 'production', 'events', 'reference'];
const CHANGE_EVENT = 'tracker:navigate';

/** Query parameters that select what the tracker shows. `view` and `mission` only choose a page. */
const STARTUP_PARAMS = ['mode', 'rank', 'at', 'balance'];
const SESSION_PARAMS = ['title', ...STARTUP_PARAMS];

export function subscribeToLocation(listener: () => void): () => void {
  window.addEventListener('popstate', listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

const currentSearch = () => window.location.search;

export function useSearch(): string {
  return useSyncExternalStore(subscribeToLocation, currentSearch);
}

export function useSearchParam(name: string): string | null {
  return new URLSearchParams(useSearch()).get(name);
}

export function useView(): ViewName {
  const view = useSearchParam('view');
  return VIEWS.find((candidate) => candidate === view) ?? 'game';
}

export function searchWith(changes: Record<string, string | null>, search = window.location.search): string {
  const params = new URLSearchParams(search);
  for (const [name, value] of Object.entries(changes)) {
    if (value === null) {
      params.delete(name);
    } else {
      params.set(name, value);
    }
  }
  const text = params.toString();
  return text ? `?${text}` : window.location.pathname;
}

export function navigate(changes: Record<string, string | null>, options: { replace?: boolean } = {}): void {
  const target = searchWith(changes);
  if (options.replace) {
    window.history.replaceState(null, '', target);
  } else {
    window.history.pushState(null, '', target);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  window.scrollTo?.({ top: 0 });
}

/** Puts the game and mode on show in the URL, without adding a history entry or notifying anyone. */
export function showInUrl(title: string, mode: string): void {
  window.history.replaceState(null, '', searchWith({ title, mode }));
}

/** Clears every startup parameter except those in `changes`, so one link cannot fight another. The game stays. */
export function navigateStartup(changes: Record<string, string | null>): void {
  navigate({ ...Object.fromEntries(STARTUP_PARAMS.map((name) => [name, null])), mission: null, ...changes });
}

/** The part of the query that decides game, mode, rank and event. */
export function startupSearch(search: string): string {
  const params = new URLSearchParams(search);
  const kept = [...params].filter(([name]) => SESSION_PARAMS.includes(name));
  return kept.map(([name, value]) => `${name}=${value}`).join('&');
}
