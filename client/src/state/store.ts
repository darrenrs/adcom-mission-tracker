// The single source of tracker state. Domain modules hold the rules; this file wires them to storage.
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { createAssetResolver, type AssetResolver } from '@/domain/assets';
import { loadGameData, readRuntimeConfig, type GameData, type RuntimeConfig } from '@/domain/gameData';
import type { GameTextContext } from '@/domain/gameText';
import { parseLocalization } from '@/domain/localization';
import {
  advanceLteToRank,
  applyAbGroups,
  applySave,
  clickMission,
  completeMissionsBefore,
  createBoard,
  nextAbGroups,
  normalizeAbGroups,
  serializeCompleted,
  type MissionBoard
} from '@/domain/missions';
import { TITLES, type TitleConfig } from '@/domain/titles';
import type { LteInfo, GameBalance, TrackerMode } from '@/domain/types';
import { entryAsLteInfo, reconcileEvents, scheduleEvents } from '@/domain/eventList';
import type { LeaderboardEvent } from '@/domain/leaderboard';
import type { Palette } from '@/domain/palette';
import { parseStartupParams, resolveStartup, type Startup } from '@/domain/urlParams';
import { emptyFormValues, type FormValues } from '@/engine/model';
import { createTrackerStorage, type TrackerStorage } from '@/storage/storage';
import { showInUrl, startupSearch } from './navigation';

export type TitleKey = 'adcom' | 'ages';
/** `ingame` takes the page colours from the balance's palette (see domain/eventColours.ts). */
export type ThemeSetting = 'system' | 'light' | 'dark' | 'ingame';

export interface Settings {
  theme: ThemeSetting;
  completedVisible: boolean;
  howToUseVisible: boolean;
  /** The PlayFab ID the Leaderboard tab looks up, kept across events. */
  playerId: string;
}

/** Everything derived from one title, mode and event. Replaced as a whole when any of those change. */
export interface Session {
  title: TitleConfig;
  data: GameData;
  localization: Readonly<Record<string, string>>;
  startup: Startup;
  mode: TrackerMode;
  lteInfo: LteInfo | null;
  balance: GameBalance;
  text: GameTextContext;
  assets: AssetResolver;
  abGroups: string[];
  board: MissionBoard;
  completionTimes: Record<string, number>;
  etas: Record<string, number>;
  /** Progress typed for a mission, by mission id. Own missions read the entered amounts instead. */
  missionProgress: Record<string, number>;
  /** The industry open on Game View. */
  activeIndustry: string | null;
  /** The calculator's saved inputs for this mode, in the legacy `FormValues` shape. */
  form: FormValues;
  /** The theme colours of the balance on screen (evergreen for Motherland), or null when the data has none. */
  palette: Palette | null;
}

export type LeaderboardStatus = 'checking' | 'connected' | 'unavailable' | 'none';

export interface TrackerState {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  session: Session | null;
  settings: Settings;
  /** Events from the leaderboard API: null until loaded, and always null for Ages, which has no leaderboard. */
  leaderboardEvents: LeaderboardEvent[] | null;
  /** Whether the leaderboard API answered: `none` for Ages, which has no leaderboard. */
  leaderboardStatus: LeaderboardStatus;
  boot(): Promise<void>;
  syncLocation(): void;
  clickMission(missionId: string): void;
  completeMissionsBefore(missionId: string): void;
  switchAbGroup(missionId: string): void;
  updateForm(change: (form: FormValues) => void): void;
  saveEta(missionId: string, seconds: number): void;
  setMissionProgress(missionId: string, value: number): void;
  setActiveIndustry(industryId: string): void;
  advanceLte(rank: number): void;
  setTheme(theme: ThemeSetting): void;
  setCompletedVisible(visible: boolean): void;
  setHowToUseVisible(visible: boolean): void;
  setPlayerId(playerId: string): void;
  resetMode(): void;
  resetAll(): void;
}

export interface TrackerDeps {
  storage: TrackerStorage;
  loadData(titleId: string): Promise<GameData>;
  runtime: RuntimeConfig;
  now(): number;
  search(): string;
  /** Puts the game and mode on show in the URL once they are decided. */
  showInUrl?(title: string, mode: string): void;
  /** The leaderboard API's events. Rejects when the server has no leaderboard set up. */
  loadLeaderboardEvents?(): Promise<LeaderboardEvent[]>;
  /** The ID the old leaderboard site saved, copied once so players need not type it again. */
  legacyPlayerId?(): string | null;
}

/** A PlayFab ID as the game shows it. */
export const PLAYER_ID = /^[0-9A-F]{1,16}$/;

const EMPTY_BALANCE: GameBalance = { Missions: [] };

/** The URL decides the game, then the saved choice. */
function readTitle(storage: TrackerStorage, search: string): TitleConfig {
  const wanted = parseStartupParams(search).title ?? storage.get('activeTitle');
  return wanted === 'ages' ? TITLES.ages : TITLES.adcom;
}

/** Storage key for data that belongs to Motherland or one event of one game. */
function modeKey(title: TitleConfig, mode: TrackerMode, lteInfo: LteInfo | null, key: string): string {
  const scope = mode === 'lte' ? `event-${lteInfo?.EndTimeMillis ?? 0}` : 'main';
  return `${title.gameSaveKeyPrefix}${scope}-${key}`;
}

function etaKey(session: Pick<Session, 'mode' | 'board'>): string {
  return session.mode === 'evergreen' ? `MissionEtas-${session.board.evergreenRank}` : 'MissionEtas';
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

function readForm(raw: string | null): FormValues {
  const form = readJson<Partial<FormValues>>(raw, {});
  // Saves without researcher levels are an old format that legacy also discarded.
  if (!form.ResearcherLevels) {
    return emptyFormValues();
  }
  const { ResearcherOverrides: _custom, ...kept } = form as Partial<FormValues> & { ResearcherOverrides?: unknown };
  // Custom researcher values no longer exist. They were saved as level -1.
  const levels = Object.fromEntries(Object.entries(form.ResearcherLevels).map(([id, level]) => [id, Math.max(level, 0)]));
  return { ...emptyFormValues(), ...kept, ResearcherLevels: { PropagandaBoost: 1, ...levels } };
}

function readSettings(storage: TrackerStorage, title: TitleConfig): Settings {
  const theme = storage.get('StyleConfig');
  const visibleKey = `${title.gameSaveKeyPrefix}main-CompletedVisible`;
  let completedVisible = storage.get(visibleKey);
  if (completedVisible === null) {
    // New saves start open, as in legacy.
    completedVisible = String(storage.get(`${title.gameSaveKeyPrefix}main-Completed`) === null);
    storage.set(visibleKey, completedVisible);
  }

  return {
    theme: theme === 'light' || theme === 'dark' || theme === 'ingame' ? theme : 'system',
    completedVisible: completedVisible === 'true',
    howToUseVisible: storage.get('HowToUseVisible') !== 'false',
    playerId: storage.get('PlayerId') ?? ''
  };
}

/** Events only the leaderboard API knows about, so a link to one opens it. */
function apiOnlyLtes(title: TitleConfig, data: GameData, events: readonly LeaderboardEvent[] | null): LteInfo[] {
  if (!events?.length) {
    return [];
  }
  return reconcileEvents(scheduleEvents(data.schedule, title.isAges), events, Object.keys(data.balances))
    .filter((entry) => !entry.schedule)
    .map(entryAsLteInfo);
}

function buildSession(deps: TrackerDeps, title: TitleConfig, data: GameData, events: readonly LeaderboardEvent[] | null = null): Session {
  const { storage } = deps;
  const prefix = title.gameSaveKeyPrefix;
  const startup = resolveStartup({
    params: parseStartupParams(deps.search()),
    savedMode: storage.get(`${prefix}CurrentMode`),
    savedRank: storage.get(`${prefix}main-CurrentRank`),
    schedule: data.schedule,
    balances: data.balances,
    now: deps.now(),
    title,
    extraLtes: apiOnlyLtes(title, data, events)
  });

  for (const write of startup.writes) {
    storage.set(`${prefix}${write.key}`, write.value);
  }

  const mode = startup.mode;
  const lteInfo = startup.lteInfo;
  const balance = ((mode === 'evergreen' ? data.balances['evergreen'] : startup.lteBalance) ?? EMPTY_BALANCE) as GameBalance;
  const localization = parseLocalization(data.localizationBase64);

  const savedGroups = storage.get(`${prefix}abTestGroups`);
  const abGroups = normalizeAbGroups(savedGroups ? savedGroups.split('||') : [], balance);
  storage.set(`${prefix}abTestGroups`, abGroups.join('||'));

  const board = createBoard(mode, balance, abGroups, startup.evergreenRank);
  applySave(board, storage.get(modeKey(title, mode, lteInfo, 'Completed')));

  const session: Session = {
    title,
    data,
    localization,
    startup,
    mode,
    lteInfo,
    balance,
    text: { balance, localization, title, mode },
    assets: createAssetResolver({
      assetBaseByTitleId: deps.runtime.assetBaseByTitleId,
      title,
      mode,
      balanceId: lteInfo?.BalanceId ?? null,
      themeId: lteInfo?.ThemeId ?? null,
      experiments: balance.Experiments ?? null,
      titleIds: deps.runtime.titleIds
    }),
    abGroups,
    board,
    completionTimes: {},
    etas: {},
    missionProgress: readJson(storage.get(modeKey(title, mode, lteInfo, 'MissionProgress')), {}),
    palette: data.palettes?.[mode === 'evergreen' ? 'evergreen' : (lteInfo?.BalanceId ?? '')] ?? null,
    activeIndustry: storage.get(modeKey(title, mode, lteInfo, 'ActiveIndustry')),
    form: readForm(storage.get(modeKey(title, mode, lteInfo, 'FormValues')))
  };

  session.completionTimes = readJson(storage.get(modeKey(title, mode, lteInfo, 'CompletionTimes')), {});
  session.etas = readJson(storage.get(modeKey(title, mode, lteInfo, etaKey(session))), {});
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
  if (storage.get('PlayerId') === null) {
    const legacy = deps.legacyPlayerId?.()?.trim().toUpperCase();
    if (legacy && PLAYER_ID.test(legacy)) {
      storage.set('PlayerId', legacy);
    }
  }
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
    // A `balance` session is a preview: its progress is temporary, as the banner says.
    const persist = (session: Session) => {
      if (session.startup.preview) {
        return;
      }
      const { title, mode, lteInfo, board, completionTimes } = session;
      storage.set(modeKey(title, mode, lteInfo, 'Completed'), serializeCompleted(board));
      storage.set(modeKey(title, mode, lteInfo, 'CompletionTimes'), JSON.stringify(completionTimes));
    };

    const startSession = (title: TitleConfig, data: GameData): Session => {
      const session = buildSession(deps, title, data, get().leaderboardEvents);
      deps.showInUrl?.(title.key, session.mode);
      lastStartup = startupSearch(deps.search());
      return session;
    };

    const loadEvents = async (title: TitleConfig) => {
      let events: LeaderboardEvent[] = [];
      let status: LeaderboardStatus = 'unavailable';
      try {
        events = (await deps.loadLeaderboardEvents?.()) ?? [];
        status = deps.loadLeaderboardEvents ? 'connected' : 'unavailable';
      } catch {
        // No leaderboard: the schedule file still drives the calendar.
      }
      const session = get().session;
      if (session?.title.key !== title.key) {
        return;
      }
      set({ leaderboardEvents: events, leaderboardStatus: status });
      // A link to an event only the API knows about can only open now.
      if (events.length > 0 && parseStartupParams(deps.search()).at !== null) {
        set({ session: startSession(title, session.data) });
      }
    };

    const updateSettings = (change: Partial<Settings>) => set({ settings: { ...get().settings, ...change } });

    const open = async (title: TitleConfig) => {
      set({ status: 'loading', error: null });
      try {
        storage.migrateLegacyKeys();
        storage.set('activeTitle', title.key);
        const data = await dataFor(title);
        if (title.isAges) {
          set({ leaderboardEvents: null, leaderboardStatus: 'none' });
        } else if (get().leaderboardEvents === null) {
          set({ leaderboardStatus: 'checking' });
        }
        set({ status: 'ready', session: startSession(title, data), settings: readSettings(storage, title) });
        if (!title.isAges && get().leaderboardEvents === null) {
          void loadEvents(title);
        }
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
      leaderboardEvents: null,
      leaderboardStatus: 'checking',
      settings: readSettings(storage, readTitle(storage, deps.search())),

      boot: () => open(readTitle(storage, deps.search())),

      syncLocation() {
        const session = get().session;
        if (!session || startupSearch(deps.search()) === lastStartup) {
          return;
        }
        const title = readTitle(storage, deps.search());
        if (title.key === session.title.key) {
          set({ session: startSession(title, session.data) });
        } else {
          void open(title);
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

      completeMissionsBefore(missionId) {
        const session = get().session;
        if (!session) {
          return;
        }
        const board = cloneBoard(session.board);
        const completed = completeMissionsBefore(board, missionId);
        const now = deps.now();
        const completionTimes = { ...session.completionTimes, ...Object.fromEntries(completed.map((m) => [m.Id, now])) };

        const next = { ...session, board, completionTimes };
        persist(next);
        set({ session: next });
      },

      updateForm(change) {
        const session = get().session;
        if (!session) {
          return;
        }
        const form = structuredClone(session.form);
        change(form);
        if (!session.startup.preview) {
          storage.set(modeKey(session.title, session.mode, session.lteInfo, 'FormValues'), JSON.stringify(form));
        }
        set({ session: { ...session, form } });
      },

      setMissionProgress(missionId, value) {
        const session = get().session;
        if (!session) {
          return;
        }
        const missionProgress = { ...session.missionProgress, [missionId]: value };
        if (!session.startup.preview) {
          storage.set(modeKey(session.title, session.mode, session.lteInfo, 'MissionProgress'), JSON.stringify(missionProgress));
        }
        set({ session: { ...session, missionProgress } });
      },

      setActiveIndustry(activeIndustry) {
        const session = get().session;
        if (!session) {
          return;
        }
        if (!session.startup.preview) {
          storage.set(modeKey(session.title, session.mode, session.lteInfo, 'ActiveIndustry'), activeIndustry);
        }
        set({ session: { ...session, activeIndustry } });
      },

      saveEta(missionId, seconds) {
        const session = get().session;
        const finish = deps.now() + seconds * 1000;
        // Date cannot represent very distant finishes, and legacy does not save those either.
        if (!session || Number.isNaN(new Date(finish).getTime())) {
          return;
        }
        const etas = { ...session.etas, [missionId]: finish };
        if (!session.startup.preview) {
          storage.set(modeKey(session.title, session.mode, session.lteInfo, etaKey(session)), JSON.stringify(etas));
        }
        set({ session: { ...session, etas } });
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

      advanceLte(rank) {
        const session = get().session;
        if (!session || session.mode !== 'lte') {
          return;
        }
        const board = cloneBoard(session.board);
        advanceLteToRank(board, rank);
        const next = { ...session, board };
        persist(next);
        set({ session: next });
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
        const title = get().session?.title ?? readTitle(storage, deps.search());
        storage.set(`${title.gameSaveKeyPrefix}main-CompletedVisible`, String(completedVisible));
        updateSettings({ completedVisible });
      },

      setPlayerId(playerId) {
        storage.set('PlayerId', playerId);
        updateSettings({ playerId });
      },

      setHowToUseVisible(howToUseVisible) {
        storage.set('HowToUseVisible', String(howToUseVisible));
        updateSettings({ howToUseVisible });
      },

      resetMode() {
        const session = get().session;
        if (!session) {
          return;
        }
        const { title, mode, lteInfo } = session;
        for (const key of ['Completed', 'FormValues', 'CompletionTimes', 'MissionProgress', 'ActiveIndustry', etaKey(session)]) {
          storage.remove(modeKey(title, mode, lteInfo, key));
        }
        set({ session: buildSession(deps, title, session.data) });
      },

      resetAll() {
        storage.resetAll();
        void open(readTitle(storage, deps.search()));
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
    search: () => window.location.search,
    showInUrl,
    legacyPlayerId: () => {
      try {
        return window.localStorage.getItem('playerId');
      } catch {
        return null;
      }
    },
    loadLeaderboardEvents: async () => {
      const response = await fetch('api/leaderboard/events');
      if (!response.ok) {
        throw new Error(`Leaderboard events: ${response.status}`);
      }
      const body = (await response.json()) as { events?: LeaderboardEvent[]; unavailable?: boolean };
      if (body.unavailable) {
        throw new Error('Leaderboard events: unavailable');
      }
      return body.events ?? [];
    }
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
