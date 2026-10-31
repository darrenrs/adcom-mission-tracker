// Records how the legacy tracker orders and moves missions, using its real code from master.
// The React mission logic must reproduce these traces exactly (tests/golden/missions.test.ts).
// Fixtures hold mission IDs and hashes only; balance data stays in adcom-assets.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..');
const ASSETS = process.env.ADCOM_ASSETS_DATA ?? path.resolve(ROOT, '../adcom-assets/data');
const LEGACY_REF = 'master';
const TITLES = [
  { key: 'adcom', titleId: '6bf5', config: 'config_adcom.js' },
  { key: 'ages', titleId: 'dc4bb', config: 'config_ages.js' }
];

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
const legacyFile = (name) => git('show', `${LEGACY_REF}:public/${name}`).replace(/^﻿/, '');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const shortHash = (value) => createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 12);

function makeJquery() {
  const values = {};
  const $ = (selector) => {
    const chain = new Proxy(function () {}, {
      get: (_, prop) => (prop === 'val' ? () => values[selector] : () => chain),
      apply: () => chain
    });
    return chain;
  };
  $.values = values;
  return $;
}

function makeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
    entries: () => [...map.entries()]
  };
}

function makeLegacy(title) {
  const localStorage = makeStorage();
  const $ = makeJquery();
  const element = { innerHTML: '', innerText: '', style: {}, classList: { add() {}, remove() {} } };
  const sandbox = {
    console,
    $,
    localStorage,
    setTimeout: () => 0,
    setInterval: () => 0,
    document: { documentElement: element, getElementById: () => element, querySelector: () => element, querySelectorAll: () => [] },
    window: { __RUNTIME_CONFIG__: {}, localStorage, location: { href: 'http://tracker.test/', assign() {} } }
  };
  vm.createContext(sandbox);
  vm.runInContext(legacyFile(title.config), sandbox);
  vm.runInContext(legacyFile('mission-tracker.js').replace(/\nmain\(\);\s*$/, '\n'), sandbox);
  vm.runInContext(
    `
    renderMissions = function () {};
    updateMissionButtonTitles = function () {};
    globalThis.__legacy = {
      configure(data, mode, balanceId, rank) {
        DATA = data;
        currentMode = mode;
        currentMainRank = rank;
        eventScheduleInfo = {
          EndTimeMillis: 1700000000000,
          BalanceId: balanceId,
          ThemeId: balanceId.split('-')[0],
          Rewards: []
        };
        if (mode === 'event') {
          DATA.event = DATA[balanceId];
        }
      },
      boot() {
        initializeAbTestGroups();
        initializeMissionData();
        loadSaveData();
      },
      setRank(rank) {
        currentMainRank = rank;
        setLocal('main', 'CurrentRank', String(rank));
      },
      click: (id) => clickMission(id),
      switchGroup: (id) => switchToNextAbGroup(id),
      advance: () => advanceProgressTo(),
      save: () => getLocal(currentMode, 'Completed'),
      sections() {
        const ids = (key) => missionData[key].Remaining.map((m) => (m ? m.Id : null));
        let keys;
        if (currentMode === 'event') {
          keys = Object.keys(missionData).filter((k) => k !== 'Completed' && k !== 'Current');
          keys.unshift('Current');
          keys.unshift('Completed');
        } else {
          keys = ['Completed', 'Current', currentMainRank];
        }
        return keys
          .filter((k) => !(missionData[k].Remaining.length === 0 && currentMode === 'event' && k !== 'Completed'))
          .map((k) => [String(k), ids(k)]);
      },
      abMissionIds() {
        return getMissions().filter((m) => 'AbTestConfig' in m).map((m) => m.Id);
      }
    };
    `,
    sandbox
  );
  return { api: sandbox.__legacy, storage: localStorage, $ };
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedFrom = (text) => parseInt(createHash('sha1').update(text).digest('hex').slice(0, 8), 16);
const pick = (random, list) => list[Math.floor(random() * list.length)];

function loadTitleData(title) {
  const base = path.join(ASSETS, title.titleId);
  const data = {};
  for (const { balanceId, assetBalanceId } of readJson(path.join(base, 'balance_manifest.json')).balances) {
    if (balanceId === 'common') continue;
    const file = path.join(base, assetBalanceId, 'balance.json');
    if (fs.existsSync(file)) data[balanceId] = readJson(file);
  }
  return data;
}

function runTrace(title, data, spec, steps) {
  const legacy = makeLegacy(title);
  const trace = { ...spec, ops: [] };
  const snapshot = () => ({ sections: legacy.api.sections(), save: legacy.api.save() });
  let currentRank = spec.rank;
  const hasGap = (state) => state.sections.some(([, ids]) => ids.includes(null));
  // Legacy bugs can leave undefined entries behind. Those states crash the old page, so they are
  // not behaviour to preserve: stop the trace there and note why.
  const record = (op, arg) => {
    const state = snapshot();
    if (hasGap(state)) {
      trace.stoppedBy = [op, arg];
      return false;
    }
    trace.ops.push([op, arg, shortHash(state)]);
    return true;
  };

  legacy.api.configure(data, spec.mode, spec.balanceId, spec.rank);
  legacy.api.boot();
  trace.initial = snapshot();

  if (hasGap(trace.initial)) {
    trace.stoppedBy = ['boot', null];
    return trace;
  }

  const random = mulberry32(seedFrom(`${title.key}:${spec.balanceId}:${spec.rank}:${spec.seed}`));
  for (let step = 0; step < steps; step++) {
    const sections = legacy.api.sections();
    const completed = sections.find(([k]) => k === 'Completed')[1];
    const current = sections.find(([k]) => k === 'Current')[1];
    const roll = random();
    const abIds = legacy.api.abMissionIds();
    let keepGoing = true;

    try {
      if (roll < 0.1) {
        legacy.api.boot();
        keepGoing = record('reload', null);
      } else if (roll < 0.15 && abIds.length > 0) {
        const id = pick(random, abIds);
        legacy.api.switchGroup(id);
        keepGoing = record('ab', id);
      } else if (roll < 0.2 && spec.advance) {
        const rankCount = data[spec.balanceId].Ranks.length;
        const rank = 1 + Math.floor(random() * Math.max(1, rankCount - 1));
        legacy.$.values['#rank-event'] = String(rank);
        legacy.api.advance();
        keepGoing = record('advance', rank);
      } else if (roll < 0.25 && spec.walkRanks) {
        const rank = Math.max(1, Math.min(spec.walkRanks, currentRank + Math.floor(random() * 5) - 2));
        legacy.api.setRank(rank);
        currentRank = rank;
        legacy.api.boot();
        keepGoing = record('rank', rank);
      } else if (roll < 0.45 && completed.length > 0) {
        const id = pick(random, completed);
        legacy.api.click(id);
        keepGoing = record('click', id);
      } else if (current.length > 0) {
        const id = pick(random, current);
        legacy.api.click(id);
        keepGoing = record('click', id);
      }
    } catch (error) {
      trace.stoppedBy = ['exception', error.message];
      return trace;
    }

    if (!keepGoing) {
      return trace;
    }
  }

  trace.final = snapshot();
  return trace;
}

const fixture = {
  source: `${LEGACY_REF}@${git('rev-parse', '--short=8', LEGACY_REF).trim()}`,
  balances: {},
  traces: []
};

for (const title of TITLES) {
  const data = loadTitleData(title);
  const key = (balanceId) => `${title.key}:${balanceId}`;
  for (const [balanceId, balance] of Object.entries(data)) {
    fixture.balances[key(balanceId)] = shortHash([balance.Missions, balance.Ranks]);
  }

  const evergreen = data.evergreen;
  const maxRank = Math.max(...evergreen.Missions.map((m) => m.Rank));
  for (let rank = 1; rank <= maxRank; rank++) {
    const spec = { title: title.key, mode: 'main', balanceId: 'evergreen', rank, seed: 1 };
    fixture.traces.push(runTrace(title, data, spec, 10));
  }
  const walk = { title: title.key, mode: 'main', balanceId: 'evergreen', rank: 2, seed: 2, walkRanks: maxRank };
  fixture.traces.push(runTrace(title, data, walk, 300));

  for (const balanceId of Object.keys(data).filter((id) => id !== 'evergreen')) {
    for (const seed of [1, 2]) {
      const spec = { title: title.key, mode: 'event', balanceId, rank: 1, seed, advance: seed === 2 };
      fixture.traces.push(runTrace(title, data, spec, 120));
    }
  }
}

const out = path.join(ROOT, 'tests/golden/mission-traces.json');
fs.writeFileSync(out, JSON.stringify(fixture));
const opCount = fixture.traces.reduce((total, trace) => total + trace.ops.length, 0);
console.log(`${fixture.traces.length} traces, ${opCount} steps, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
const stops = new Map();
for (const trace of fixture.traces.filter((t) => t.stoppedBy)) {
  const label = `${trace.mode}: ${trace.stoppedBy[0]}${trace.stoppedBy[0] === 'exception' ? ` (${trace.stoppedBy[1]})` : ''}`;
  stops.set(label, (stops.get(label) ?? 0) + 1);
}
console.log('stopped by legacy bugs:', Object.fromEntries(stops));
