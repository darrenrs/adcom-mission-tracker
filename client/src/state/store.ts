// The single source of tracker state. Domain modules hold the rules; this file wires them to storage.
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { createAssetResolver, type AssetResolver } from '@/domain/assets';
import { loadGameData, readRuntimeConfig, type GameData, type RuntimeConfig } from '@/domain/gameData';
import type { GameTextContext } from '@/domain/gameText';
import { parseLocalization } from '@/domain/localization';
import {
  advanceEventToRank,
  applyAbGroups,
  applySave,
  clickMission,
  createBoard,
  nextAbGroups,
  normalizeAbGroups,
  serializeCompleted,
  type MissionBoard
} from '@/domain/missions';
import { TITLES, type TitleConfig } from '@/domain/titles';
import type { EventInfo, GameBalance, TrackerMode } from '@/domain/types';
import { parseStartupParams, resolveStartup, type Startup } from '@/domain/urlParams';
import { createTrackerStorage, type TrackerStorage } from '@/storage/storage';
import { startupSearch } from './navigation';

export type TitleKey = 'adcom' | 'ages';
export type ThemeSetting = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemeSetting;
  completedVisible: boolean;
}

/** Everything derived from one title, mode and event. Replaced as a whole when any of those change. */
export interface Session {
  title: TitleConfig;
  data: GameData;
  localization: Readonly<Record<string, string>>;
  startup: Startup;
  mode: TrackerMode;
  eventInfo: EventInfo | null;
  balance: GameBalance;
  text: GameTextContext;
  assets: AssetResolver;
  abGroups: string[];
  board: MissionBoard;
  completionTimes: Record<string, number>;
  etas: Record<string, number>;
}

export interface TrackerState {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  session: Session | null;
  settings: Settings;
  boot(): Promise<void>;
  syncLocation(): void;
  clickMission(missionId: string): void;
  switchAbGroup(missionId: string): void;
  advanceEvent(rank: number): void;
  switchTitle(): Promise<void>;
  setTheme(theme: ThemeSetting): void;
  setCompletedVisible(visible: boolean): void;
  resetMode(): void;
  resetAll(): void;
}

export interface TrackerDeps {
  storage: TrackerStorage;
  loadData(titleId: string): Promise<GameData>;
  runtime: RuntimeConfig;
  now(): number;
  search(): string;
}

const EMPTY_BALANCE: GameBalance = { Missions: [] };

function readTitle(storage: TrackerStorage): TitleConfig {
  return storage.get('activeTitle') === 'ages' ? TITLES.ages : TITLES.adcom;
}

/** Storage key for data that belongs to Motherland or one event of one game. */
function modeKey(title: TitleConfig, mode: TrackerMode, eventInfo: EventInfo | null, key: string): string {
  const scope = mode === 'event' ? `event-${eventInfo?.EndTimeMillis ?? 0}` : 'main';
  return `${title.gameSaveKeyPrefix}${scope}-${key}`;
}

function etaKey(session: Pick<Session, 'mode' | 'board'>): string {
  return session.mode === 'main' ? `MissionEtas-${session.board.mainRank}` : 'MissionEtas';
}

function readJson<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readSettings(storage: TrackerStorage, title: TitleConfig): Settings {
  const theme = storage.get('StyleConfig');
  const visibleKey = `${title.gameSaveKeyPrefix}main-CompletedVisible`;
  let completedVisible = storage.get(visibleKey);
  if (completedVisible === null) {
    // New saves start open, so that first-time players see the help text.
    completedVisible = String(storage.get(`${title.gameSaveKeyPrefix}main-Completed`) === null);
    storage.set(visibleKey, completedVisible);
  }

  return {
    theme: theme === 'light' || theme === 'dark' ? theme : 'system',
    completedVisible: completedVisible === 'true'
  };
}

function buildSession(deps: TrackerDeps, title: TitleConfig, data: GameData): Session {
  const { storage } = deps;
  const prefix = title.gameSaveKeyPrefix;
  const startup = resolveStartup({
    params: parseStartupParams(deps.search()),
    savedMode: storage.get(`${prefix}CurrentMode`),
    savedRank: storage.get(`${prefix}main-CurrentRank`),
    schedule: data.schedule,
    balances: data.balances,
    now: deps.now(),
    title
  });

  for (const write of startup.writes) {
    storage.set(`${prefix}${write.key}`, write.value);
  }

  const mode = startup.mode;
  const eventInfo = startup.eventInfo;
  const balance = ((mode === 'main' ? data.balances['evergreen'] : startup.eventBalance) ?? EMPTY_BALANCE) as GameBalance;
  const localization = parseLocalization(data.localizationBase64);

  const savedGroups = storage.get(`${prefix}abTestGroups`);
  const abGroups = normalizeAbGroups(savedGroups ? savedGroups.split('||') : [], balance);
  storage.set(`${prefix}abTestGroups`, abGroups.join('||'));

  const board = createBoard(mode, balance, abGroups, startup.mainRank);
  applySave(board, storage.get(modeKey(title, mode, eventInfo, 'Completed')));

  const session: Session = {
    title,
    data,
    localization,
    startup,
    mode,
    eventInfo,
    balance,
    text: { balance, localization, title, mode },
    assets: createAssetResolver({
      assetBaseByTitleId: deps.runtime.assetBaseByTitleId,
      title,
      mode,
      balanceId: eventInfo?.BalanceId ?? null,
      themeId: eventInfo?.ThemeId ?? null,
      experiments: balance.Experiments ?? null,
      titleIds: deps.runtime.titleIds
    }),
    abGroups,
    board,
    completionTimes: {},
    etas: {}
  };

  session.completionTimes = readJson(storage.get(modeKey(title, mode, eventInfo, 'CompletionTimes')), {});
  session.etas = readJson(storage.get(modeKey(title, mode, eventInfo, etaKey(session))), {});
  return session;
}

function cloneBoard(board: MissionBoard): MissionBoard {
  return {
    ...board,
    completed: [...board.completed],
    current: [...board.current],
    ranks: new Map([...board.ranks].map(([rank, missions]) => [rank, [...missions]])),
    otherRankMissionIds: [...board.otherRankMissionIds]
  };
}

export function createTrackerStore(deps: TrackerDeps): StoreApi<TrackerState> {
  const { storage } = deps;
  const loaded = new Map<string, Promise<GameData>>();
  let lastStartup = '';

  const dataFor = (title: TitleConfig) => {
    let pending = loaded.get(title.titleId);
    if (!pending) {
      pending = deps.loadData(title.titleId);
      loaded.set(title.titleId, pending);
    }
    return pending;
  };

  return createStore<TrackerState>((set, get) => {
    // An `eventOverride` session is a preview: its progress is temporary, as the banner says.
    const persist = (session: Session) => {
      if (session.startup.overrideActive) {
        return;
      }
      const { title, mode, eventInfo, board, completionTimes } = session;
      storage.set(modeKey(title, mode, eventInfo, 'Completed'), serializeCompleted(board));
      storage.set(modeKey(title, mode, eventInfo, 'CompletionTimes'), JSON.stringify(completionTimes));
    };

    const updateSettings = (change: Partial<Settings>) => set({ settings: { ...get().settings, ...change } });

    const open = async (title: TitleConfig) => {
      set({ status: 'loading', error: null });
      try {
        storage.migrateLegacyKeys();
        const data = await dataFor(title);
        lastStartup = startupSearch(deps.search());
        set({ status: 'ready', session: buildSession(deps, title, data), settings: readSettings(storage, title) });
      } catch (error) {
        loaded.delete(title.titleId);
        console.error(error);
        set({ status: 'error', error: error instanceof Error ? error.message : String(error) });
      }
    };

    return {
      status: 'loading',
      error: null,
      session: null,
      settings: readSettings(storage, readTitle(storage)),

      boot: () => open(readTitle(storage)),

      syncLocation() {
        const session = get().session;
        const startup = startupSearch(deps.search());
        if (session && startup !== lastStartup) {
          lastStartup = startup;
          set({ session: buildSession(deps, session.title, session.data) });
        }
      },

      clickMission(missionId) {
        const session = get().session;
        if (!session) {
          return;
        }
        const board = cloneBoard(session.board);
        const result = clickMission(board, missionId);
        if (!result) {
          return;
        }

        const completionTimes = { ...session.completionTimes };
        if (result === 'completed') {
          completionTimes[missionId] = deps.now();
        } else {
          delete completionTimes[missionId];
        }

        const next = { ...session, board, completionTimes };
        persist(next);
        set({ session: next });
      },

      switchAbGroup(missionId) {
        const session = get().session;
        const abGroups = session && nextAbGroups(session.balance, session.abGroups, missionId);
        if (!session || !abGroups) {
          return;
        }
        const board = cloneBoard(session.board);
        applyAbGroups(board, session.balance, abGroups);
        storage.set(`${session.title.gameSaveKeyPrefix}abTestGroups`, abGroups.join('||'));
        set({ session: { ...session, board, abGroups } });
      },

      advanceEvent(rank) {
        const session = get().session;
        if (!session || session.mode !== 'event') {
          return;
        }
        const board = cloneBoard(session.board);
        advanceEventToRank(board, rank);
        const next = { ...session, board };
        persist(next);
        set({ session: next });
      },

      async switchTitle() {
        const title = get().session?.title ?? readTitle(storage);
        const target = title.key === 'ages' ? TITLES.adcom : TITLES.ages;
        storage.set('activeTitle', target.key);
        await open(target);
      },

      setTheme(theme) {
        if (theme === 'system') {
          storage.remove('StyleConfig');
        } else {
          storage.set('StyleConfig', theme);
        }
        updateSettings({ theme });
      },

      setCompletedVisible(completedVisible) {
        const title = get().session?.title ?? readTitle(storage);
        storage.set(`${title.gameSaveKeyPrefix}main-CompletedVisible`, String(completedVisible));
        updateSettings({ completedVisible });
      },

      resetMode() {
        const session = get().session;
        if (!session) {
          return;
        }
        const { title, mode, eventInfo } = session;
        for (const key of ['Completed', 'FormValues', 'CompletionTimes', etaKey(session)]) {
          storage.remove(modeKey(title, mode, eventInfo, key));
        }
        set({ session: buildSession(deps, title, session.data) });
      },

      resetAll() {
        storage.resetAll();
        void open(readTitle(storage));
      }
    };
  });
}

function browserDeps(): TrackerDeps {
  return {
    storage: createTrackerStorage(window.localStorage),
    loadData: (titleId) => loadGameData(titleId),
    runtime: readRuntimeConfig(window),
    now: () => Date.now(),
    search: () => window.location.search
  };
}

let store: StoreApi<TrackerState> | null = null;

export function trackerStore(): StoreApi<TrackerState> {
  store ??= createTrackerStore(browserDeps());
  return store;
}

export function useTracker<T>(selector: (state: TrackerState) => T): T {
  return useStore(trackerStore(), selector);
}

/** For components that only render once the tracker has loaded. */
export function useSession(): Session {
  const session = useTracker((state) => state.session);
  if (!session) {
    throw new Error('useSession used before the tracker loaded');
  }
  return session;
}
