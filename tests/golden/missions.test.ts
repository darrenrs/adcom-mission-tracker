import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  advanceEventToRank,
  applyAbGroups,
  applySave,
  boardSections,
  clickMission,
  createBoard,
  nextAbGroups,
  normalizeAbGroups,
  serializeCompleted,
  type MissionBoard
} from '@/domain/missions';
import type { Balance, TrackerMode } from '@/domain/types';

interface Snapshot {
  sections: [string, string[]][];
  save: string | null;
}

interface Trace {
  title: string;
  mode: TrackerMode;
  balanceId: string;
  rank: number;
  seed: number;
  initial: Snapshot;
  final?: Snapshot;
  ops: [string, string | number | null, string][];
  stoppedBy?: [string, unknown];
}

interface Fixture {
  source: string;
  balances: Record<string, string>;
  traces: Trace[];
}

const ROOT = path.resolve(import.meta.dirname, '../..');
const ASSETS = process.env.ADCOM_ASSETS_DATA ?? path.resolve(ROOT, '../adcom-assets/data');
const TITLE_IDS: Record<string, string> = { adcom: '6bf5', ages: 'dc4bb' };

const fixture = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'mission-traces.json'), 'utf8')) as Fixture;
const hash = (value: unknown) => createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 12);

function loadBalance(title: string, balanceId: string): Balance {
  const titleDir = path.join(ASSETS, TITLE_IDS[title] as string);
  const manifest = JSON.parse(fs.readFileSync(path.join(titleDir, 'balance_manifest.json'), 'utf8')) as {
    balances: { balanceId: string; assetBalanceId: string }[];
  };
  const entry = manifest.balances.find((b) => b.balanceId === balanceId);
  return JSON.parse(fs.readFileSync(path.join(titleDir, entry?.assetBalanceId as string, 'balance.json'), 'utf8')) as Balance;
}

function snapshot(board: MissionBoard, save: string | null): Snapshot {
  const sections = boardSections(board).map(({ key, missions }): [string, string[]] => [String(key), missions.map((m) => m.Id)]);
  return { sections, save };
}

function replay(trace: Trace, balance: Balance): void {
  let abGroups = normalizeAbGroups([], balance);
  let rank = trace.rank;
  let save: string | null = null;
  // Motherland saves persist across ranks, as in localStorage.
  const boot = () => {
    abGroups = normalizeAbGroups(abGroups, balance);
    const board = createBoard(trace.mode, balance, abGroups, rank);
    applySave(board, save);
    return board;
  };

  let board = boot();
  expect(snapshot(board, save)).toEqual(trace.initial);

  for (const [index, [op, arg, expected]] of trace.ops.entries()) {
    if (op === 'click') {
      clickMission(board, arg as string);
      save = serializeCompleted(board);
    } else if (op === 'reload') {
      board = boot();
    } else if (op === 'rank') {
      rank = arg as number;
      board = boot();
    } else if (op === 'advance') {
      advanceEventToRank(board, arg as number);
      save = serializeCompleted(board);
    } else if (op === 'ab') {
      const next = nextAbGroups(balance, abGroups, arg as string);
      if (next) {
        abGroups = next;
        applyAbGroups(board, balance, abGroups);
      }
    }

    const state = snapshot(board, save);
    if (hash(state) !== expected) {
      throw new Error(`Diverged at step ${index} (${op} ${String(arg)}): ${JSON.stringify(state).slice(0, 600)}`);
    }
  }

  if (trace.final) {
    expect(snapshot(board, save)).toEqual(trace.final);
  }
}

const hasAssets = fs.existsSync(ASSETS);

describe.skipIf(!hasAssets)('mission order matches the legacy tracker', () => {
  for (const trace of fixture.traces) {
    it(`${trace.title} ${trace.mode} ${trace.balanceId} rank ${trace.rank} seed ${trace.seed}`, () => {
      const balance = loadBalance(trace.title, trace.balanceId);
      const current = hash([balance.Missions, balance.Ranks]);
      if (current !== fixture.balances[`${trace.title}:${trace.balanceId}`]) {
        throw new Error(`Balance data changed since capture. Run "npm run golden" on the matching master.`);
      }
      replay(trace, balance);
    });
  }
});
