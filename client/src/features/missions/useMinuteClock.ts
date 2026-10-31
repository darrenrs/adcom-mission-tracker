import { useSyncExternalStore } from 'react';

// One timer for every ETA on the page, however many rows show one.
const listeners = new Set<() => void>();
let timer: number | undefined;
let snapshot = Date.now();

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    snapshot = Date.now();
    timer = window.setInterval(() => {
      snapshot = Date.now();
      listeners.forEach((notify) => notify());
    }, 60_000);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

/** The time, refreshed every 60 seconds, as legacy refreshed mission ETAs. */
export function useMinuteClock(): number {
  return useSyncExternalStore(subscribe, () => snapshot);
}
