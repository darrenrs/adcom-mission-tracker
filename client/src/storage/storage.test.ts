import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_PREFIX, createTrackerStorage, isLegacyKey } from './storage';

function memoryBackend(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key)
  };
}

const LEGACY_SAVE = {
  activeTitle: 'adcom',
  StyleConfig: 'dark',
  IconConfig: 'image',
  ListStyleActiveConfig: 'false',
  CurrentMode: 'event',
  abTestGroups: 'Test|A',
  'main-Completed': 'M0001,M0002',
  'main-CompletedVisible': 'true',
  'main-CurrentRank': '12',
  'main-CompletionTimes': '{"M0001":1}',
  'main-FormValues': '{"ResearcherLevels":{}}',
  'main-MissionEtas-12': '{}',
  'event-1700000000000-Completed': 'E1',
  'event-1700000000000-CompletionTimes': '{}',
  'event-1700000000000-FormValues': '{}',
  'event-1700000000000-MissionEtas': '{}',
  'Ages-CurrentMode': 'main',
  'Ages-abTestGroups': '',
  'Ages-main-Completed': 'A1',
  'Ages-event-1700000000000-Completed': 'A2'
};

const OTHER_TOOLS = { playerId: 'ABC123', 'gng-save': '{}', theme: 'dark', 'flowfree-progress': '1' };

describe('tracker storage', () => {
  let backend: ReturnType<typeof memoryBackend>;

  beforeEach(() => {
    backend = memoryBackend({ ...LEGACY_SAVE, ...OTHER_TOOLS, surveyModalAck: '1' });
  });

  it('recognises every legacy key family and nothing else', () => {
    for (const key of Object.keys(LEGACY_SAVE)) {
      expect(isLegacyKey(key), key).toBe(true);
    }
    for (const key of [...Object.keys(OTHER_TOOLS), 'surveyModalAck', 'event-Completed', 'main-Other']) {
      expect(isLegacyKey(key), key).toBe(false);
    }
  });

  it('copies legacy saves under the prefix and keeps the originals', () => {
    createTrackerStorage(backend).migrateLegacyKeys();

    for (const [key, value] of Object.entries(LEGACY_SAVE)) {
      expect(backend.map.get(STORAGE_PREFIX + key)).toBe(value);
      expect(backend.map.get(key)).toBe(value);
    }
    expect(backend.map.has(`${STORAGE_PREFIX}surveyModalAck`)).toBe(false);
    expect(backend.map.has(`${STORAGE_PREFIX}playerId`)).toBe(false);
  });

  it('does not overwrite newer data on later visits', () => {
    const storage = createTrackerStorage(backend);
    storage.migrateLegacyKeys();
    storage.set('main-Completed', 'M0001,M0002,M0003');
    storage.migrateLegacyKeys();

    expect(storage.get('main-Completed')).toBe('M0001,M0002,M0003');
  });

  it('does not bring removed values back', () => {
    const storage = createTrackerStorage(backend);
    storage.migrateLegacyKeys();
    storage.remove('main-Completed');
    storage.migrateLegacyKeys();

    expect(storage.get('main-Completed')).toBeNull();
    expect(backend.map.has('main-Completed')).toBe(false);
  });

  it('reset removes tracker data and leaves other tools alone', () => {
    const storage = createTrackerStorage(backend);
    storage.migrateLegacyKeys();
    storage.resetAll();

    expect([...backend.map.keys()].sort()).toEqual([...Object.keys(OTHER_TOOLS), 'surveyModalAck'].sort());
    storage.migrateLegacyKeys();
    expect(storage.get('main-Completed')).toBeNull();
  });

  it('keeps working when the browser refuses storage', () => {
    const storage = createTrackerStorage({
      length: 0,
      key: () => null,
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      }
    });

    expect(storage.get('main-Completed')).toBeNull();
    expect(() => storage.set('main-Completed', 'x')).not.toThrow();
  });
});
