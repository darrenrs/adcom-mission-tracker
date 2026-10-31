// All tracker data lives under one prefix so that other idlegametools.com tools are left alone.

export const STORAGE_PREFIX = 'adcom-mission-tracker:';

const LEGACY_EXACT_KEYS = new Set(['activeTitle', 'StyleConfig', 'IconConfig', 'ListStyleActiveConfig']);
const LEGACY_KEY_PATTERN =
  /^(?:Ages-)?(?:CurrentMode|abTestGroups|main-(?:Completed|CompletedVisible|CurrentRank|CompletionTimes|FormValues|MissionEtas-\d+)|event-\d+-(?:Completed|CompletionTimes|FormValues|MissionEtas))$/;

export function isLegacyKey(key: string): boolean {
  return LEGACY_EXACT_KEYS.has(key) || LEGACY_KEY_PATTERN.test(key);
}

type Backend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

export interface TrackerStorage {
  get(name: string): string | null;
  set(name: string, value: string): void;
  remove(name: string): void;
  /** Copies legacy saves whose new key is missing. Legacy keys stay in place for rollback. */
  migrateLegacyKeys(): void;
  /** Removes all tracker data, including legacy keys, and nothing else. */
  resetAll(): void;
}

function allKeys(backend: Backend): string[] {
  const keys: string[] = [];
  for (let index = 0; index < backend.length; index++) {
    const key = backend.key(index);
    if (key !== null) {
      keys.push(key);
    }
  }
  return keys;
}

// Storage can throw in private windows or when the quota is full. The tracker keeps working
// for the session; progress just is not saved.
function guarded<T>(action: () => T, fallback: T): T {
  try {
    return action();
  } catch (error) {
    console.warn('Tracker storage is unavailable.', error);
    return fallback;
  }
}

export function createTrackerStorage(backend: Backend): TrackerStorage {
  return {
    get: (name) => guarded(() => backend.getItem(STORAGE_PREFIX + name), null),
    set: (name, value) => guarded(() => backend.setItem(STORAGE_PREFIX + name, value), undefined),
    remove: (name) =>
      guarded(() => {
        backend.removeItem(STORAGE_PREFIX + name);
        // Otherwise the next migration would bring the deleted value back.
        if (isLegacyKey(name)) {
          backend.removeItem(name);
        }
      }, undefined),
    migrateLegacyKeys: () =>
      guarded(() => {
        for (const key of allKeys(backend)) {
          if (isLegacyKey(key) && backend.getItem(STORAGE_PREFIX + key) === null) {
            backend.setItem(STORAGE_PREFIX + key, backend.getItem(key) as string);
          }
        }
      }, undefined),
    resetAll: () =>
      guarded(() => {
        for (const key of allKeys(backend)) {
          if (key.startsWith(STORAGE_PREFIX) || isLegacyKey(key)) {
            backend.removeItem(key);
          }
        }
      }, undefined)
  };
}
