// Runs the legacy tracker (public/mission-tracker.js and the title config, as on master) inside
// node:vm, so tests can call the real old functions and compare them with the TypeScript ports.
// The sandbox technique is the one scripts/capture-golden.mjs uses.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import type { TitleKey } from '@/domain/titles';
import type { GameBalance, LteScheduleData } from '@/domain/types';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const ASSETS = process.env.ADCOM_ASSETS_DATA ?? path.resolve(ROOT, '../adcom-assets/data');
export const TITLE_IDS: Record<TitleKey, string> = { adcom: '6bf5', ages: 'dc4bb' };
export const TITLE_KEYS: TitleKey[] = ['adcom', 'ages'];
const LEGACY_REF = 'master';

export const assetsAvailable = TITLE_KEYS.every((key) =>
  fs.existsSync(path.join(ASSETS, TITLE_IDS[key], 'balance_manifest.json'))
);

const sources = new Map<string, string>();

/** A file from public/ as it is on master, without the byte order mark. */
function legacyFile(name: string): string {
  let source = sources.get(name);
  if (source === undefined) {
    source = execFileSync('git', ['show', `${LEGACY_REF}:public/${name}`], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 1 << 26
    }).replace(/^﻿/, '');
    sources.set(name, source);
  }
  return source;
}

/** A call on a jQuery selection, such as `$('#overrideWarning').addClass('show')`. `$(fn)` is logged as `ready`. */
export interface JqueryCall {
  selector: string;
  method: string;
  args: unknown[];
}

function makeJquery(calls: JqueryCall[]) {
  const $ = (selector: unknown) => {
    if (typeof selector === 'function') {
      calls.push({ selector: 'ready', method: 'call', args: [] });
      selector();
    }
    const chain: unknown = new Proxy(function () {}, {
      get: (_, method) => (...args: unknown[]) => {
        calls.push({ selector: String(selector), method: String(method), args });
        return chain;
      },
      apply: () => chain
    });
    return chain;
  };
  return $;
}

function makeStorage() {
  const map = new Map<string, string>();
  const writes: [string, string][] = [];
  return {
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key: string, value: unknown) => {
      writes.push([key, String(value)]);
      map.set(key, String(value));
    },
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
    /** Every `setItem` so far, in order. */
    writes,
    entries: () => [...map.entries()]
  };
}

export interface LegacyOptions {
  balances: Record<string, GameBalance>;
  /** `evergreen` is Motherland (main mode); any other id is an event. */
  balanceId: string;
  /** Base64 of the localization text, as the API serves it. */
  localization: string;
}

/** What the page gets from its environment. */
export interface LegacyPageOptions {
  /** `window.__RUNTIME_CONFIG__`, as /js/runtime-config.js sets it. */
  runtimeConfig?: unknown;
  /** `window.location.href`. Defaults to `http://tracker.test/`. */
  href?: string;
}

export interface Legacy {
  /** The browser storage legacy writes to. `writes` lists every `setItem` in order. */
  storage: ReturnType<typeof makeStorage>;
  /** Every jQuery call so far, in order. */
  jquery: JqueryCall[];
  /** Runs code in the legacy context and returns the result. `vars` become temporary globals. */
  run<T = unknown>(code: string, vars?: Record<string, unknown>): T;
  /** Calls a legacy global function and returns what it returns. */
  call<T = unknown>(name: string, ...args: unknown[]): T;
  /** Points the legacy code at one balance (as main or event, as the tracker does) and loads its text. */
  configure(options: LegacyOptions): void;
  /** Fixes the time legacy code sees from `new Date()` and `Date.now()` (epoch milliseconds), or restores the clock with null. */
  setNow(ms: number | null): void;
  /** Reads a legacy global, such as `POWERS`. */
  read<T = unknown>(expression: string): T;
}

export function createLegacy(title: TitleKey, page: LegacyPageOptions = {}): Legacy {
  const storage = makeStorage();
  const jquery: JqueryCall[] = [];
  const element = { innerHTML: '', innerText: '', style: {}, classList: { add() {}, remove() {} } };
  const sandbox: Record<string, unknown> = {
    console,
    atob: globalThis.atob,
    $: makeJquery(jquery),
    URL,
    localStorage: storage,
    setTimeout: () => 0,
    setInterval: () => 0,
    document: {
      documentElement: element,
      getElementById: () => element,
      querySelector: () => element,
      querySelectorAll: () => []
    },
    window: {
      __RUNTIME_CONFIG__: page.runtimeConfig ?? {},
      localStorage: storage,
      location: { href: page.href ?? 'http://tracker.test/', origin: 'http://tracker.test', assign() {} }
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(legacyFile(`config_${title}.js`), sandbox);
  vm.runInContext(legacyFile('mission-tracker.js').replace(/\nmain\(\);\s*$/, '\n'), sandbox);
  vm.runInContext(
    `
    var __now = null;
    var __RealDate = Date;
    Date = class extends __RealDate {
      constructor(...args) {
        if (args.length === 0 && __now !== null) super(__now); else super(...args);
      }
      static now() { return __now !== null ? __now : __RealDate.now(); }
    };
    function __setNow(ms) { __now = ms; }
    `,
    sandbox
  );

  return {
    storage,
    jquery,
    run(code, vars = {}) {
      Object.assign(sandbox, vars);
      try {
        return vm.runInContext(code, sandbox);
      } finally {
        for (const key of Object.keys(vars)) delete sandbox[key];
      }
    },
    call(name, ...args) {
      sandbox.__args = args;
      return vm.runInContext(`${name}(...__args)`, sandbox);
    },
    read: (expression) => vm.runInContext(expression, sandbox),
    setNow(ms) {
      sandbox.__args = [ms];
      vm.runInContext('__setNow(...__args)', sandbox);
    },
    configure({ balances, balanceId, localization }) {
      // Legacy code still calls the modes main and event.
      const mode = balanceId === 'evergreen' ? 'main' : 'event';
      const data: Record<string, GameBalance> = { ...balances };
      if (mode === 'event') {
        data.event = balances[balanceId] as GameBalance;
      }
      sandbox.__data = data;
      sandbox.__localization = localization;
      sandbox.__schedule = {
        EndTimeMillis: 1700000000000,
        BalanceId: balanceId,
        ThemeId: balanceId.split('-')[0],
        Rewards: []
      };
      sandbox.__mode = mode;
      sandbox.__titleKey = title;
      sandbox.__titleId = TITLE_IDS[title];
      vm.runInContext(
        `
        DATA = __data;
        currentMode = __mode;
        eventScheduleInfo = __schedule;
        ACTIVE_TITLE = __titleKey;
        ACTIVE_TITLE_ID = __titleId;
        IsAges = __titleKey === 'ages';
        // Legacy keeps lookup tables for the first balance it sees. Clear them between balances.
        generatorsById = null;
        resourcesById = null;
        scriptedRewardIds = null;
        cachedIndustryMap = null;
        ENGLISH_MAP = {};
        ENGLISH_LOCALIZATION_STRING = __localization;
        initializeLocalization();
        `,
        sandbox
      );
    }
  };
}

const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, 'utf8')) as T;

/** Every balance of a title by balance id (`evergreen` plus each event), as the API serves them. */
export function loadBalances(title: TitleKey): Record<string, GameBalance> {
  const base = path.join(ASSETS, TITLE_IDS[title]);
  const manifest = readJson<{ balances: { balanceId: string; assetBalanceId: string }[] }>(
    path.join(base, 'balance_manifest.json')
  );
  const balances: Record<string, GameBalance> = {};
  for (const { balanceId, assetBalanceId } of manifest.balances) {
    if (balanceId === 'common') continue;
    const file = path.join(base, assetBalanceId, 'balance.json');
    if (fs.existsSync(file)) balances[balanceId] = readJson<GameBalance>(file);
  }
  return balances;
}

/** The schedule, which the API serves as `LTESchedule`. */
export function loadSchedule(title: TitleKey): LteScheduleData {
  return readJson<LteScheduleData>(path.join(ASSETS, TITLE_IDS[title], 'schedule.json'));
}

/** The `common` balance (avatars and store data), which the API serves next to the event balances. */
export function loadCommon(title: TitleKey): Record<string, unknown> {
  return readJson<Record<string, unknown>>(path.join(ASSETS, TITLE_IDS[title], 'common.json'));
}

/** The title's English text, base64 encoded like the API's. */
export function loadLocalizationBase64(title: TitleKey): string {
  const text = fs.readFileSync(path.join(ASSETS, TITLE_IDS[title], 'localization.txt'));
  return text.toString('base64');
}

/**
 * Visible text of legacy HTML: tags (including ones whose attributes contain markup) are removed
 * and `&nbsp;` becomes a normal space.
 */
export function stripHtml(html: string): string {
  return html.replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, '').replace(/&nbsp;/g, ' ');
}
