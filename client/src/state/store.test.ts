import { describe, expect, it } from 'vitest';
import type { GameData } from '@/domain/gameData';
import type { Balance, Mission } from '@/domain/types';
import { STORAGE_PREFIX, createTrackerStorage } from '@/storage/storage';
import { createTrackerStore, type TrackerDeps } from './store';

const mission = (id: string, rank: number): Mission => ({
  Id: id,
  Rank: rank,
  Condition: { ConditionType: 'ResourceQuantity', ConditionId: 'potato', Threshold: 1 },
  Reward: { Reward: 'Gacha', RewardId: 'wood' }
});

const evergreen: Balance = {
  Missions: [mission('m1', 1), mission('m2', 1), mission('m3', 1), mission('m4', 1), mission('n1', 2), mission('n2', 2)],
  Ranks: [
    { Rank: '1', Missions: '0', ActiveMissionCount: 3 },
    { Rank: '2', Missions: '0', ActiveMissionCount: 1 }
  ]
};

const data: GameData = {
  balances: { evergreen },
  schedule: { LteBalanceData: [], LteOneOff: [], LteSchedule: [] },
  localizationBase64: btoa('a=b')
} as unknown as GameData;

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

function setup(initial: Record<string, string> = {}, search = '?mode=main') {
  const backend = memoryBackend(initial);
  const location = { search };
  const deps: TrackerDeps = {
    storage: createTrackerStorage(backend),
    loadData: async () => data,
    runtime: { titleIds: { adcom: '6bf5', ages: 'dc4bb' }, assetBaseByTitleId: {} },
    now: () => 1000,
    search: () => location.search
  };
  return { backend, location, store: createTrackerStore(deps) };
}

const ids = (list: { Id: string }[] | undefined) => list?.map((m) => m.Id);

describe('tracker store', () => {
  it('moves a mission both ways and saves under the prefix', async () => {
    const { store, backend } = setup();
    await store.getState().boot();

    store.getState().clickMission('m1');
    expect(ids(store.getState().session?.board.completed)).toEqual(['m1']);
    expect(ids(store.getState().session?.board.current)).toEqual(['m2', 'm3', 'm4']);
    expect(backend.map.get(`${STORAGE_PREFIX}main-Completed`)).toBe('m1');
    expect(backend.map.has('main-Completed')).toBe(false);

    store.getState().clickMission('m1');
    expect(ids(store.getState().session?.board.current)).toEqual(['m1', 'm2', 'm3']);
    expect(store.getState().session?.completionTimes).toEqual({});
  });

  it('continues a legacy save', async () => {
    const { store } = setup({ 'main-Completed': 'm2', CurrentMode: 'main', 'main-CurrentRank': '1' }, '');
    await store.getState().boot();

    expect(ids(store.getState().session?.board.completed)).toEqual(['m2']);
    expect(ids(store.getState().session?.board.current)).toEqual(['m1', 'm3', 'm4']);
  });

  it('does not rebuild the board for a page change, but does for a rank change', async () => {
    const { store, location } = setup();
    await store.getState().boot();
    const before = store.getState().session;

    location.search = '?mode=main&view=production';
    store.getState().syncLocation();
    expect(store.getState().session).toBe(before);

    location.search = '?rank=2';
    store.getState().syncLocation();
    expect(store.getState().session?.board.evergreenRank).toBe(2);
    expect(ids(store.getState().session?.board.current)).toEqual(['n1']);
  });

  it('resets one mode without touching other tools', async () => {
    const { store, backend } = setup({ playerId: 'abc' });
    await store.getState().boot();
    store.getState().clickMission('m1');
    store.getState().resetMode();

    expect(store.getState().session?.board.completed).toEqual([]);
    expect(backend.map.get('playerId')).toBe('abc');
  });

  it('keeps theme on system unless the player picks one', async () => {
    const { store, backend } = setup();
    await store.getState().boot();
    expect(store.getState().settings.theme).toBe('system');

    store.getState().setTheme('dark');
    expect(backend.map.get(`${STORAGE_PREFIX}StyleConfig`)).toBe('dark');

    store.getState().setTheme('system');
    expect(backend.map.has(`${STORAGE_PREFIX}StyleConfig`)).toBe(false);
  });

  it('reports a failed load', async () => {
    const { store } = setup();
    const failing = createTrackerStore({
      storage: createTrackerStorage(memoryBackend()),
      loadData: async () => {
        throw new Error('502');
      },
      runtime: { titleIds: { adcom: '6bf5', ages: 'dc4bb' }, assetBaseByTitleId: {} },
      now: () => 0,
      search: () => ''
    });
    await failing.getState().boot();
    expect(failing.getState().status).toBe('error');
    expect(failing.getState().error).toContain('502');
    expect(store.getState().status).toBe('loading');
  });
});
