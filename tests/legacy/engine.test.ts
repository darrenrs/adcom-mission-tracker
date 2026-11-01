// Runs the new engine and the real legacy calculator on the same missions and saves.
// They are meant to differ a little: legacy steps in whole seconds, which undershoots. This test
// bounds the gap and logs its size, so that any real difference has to be explained.
import { afterAll, describe, expect, it } from 'vitest';
import { hasCalculator } from '@/domain/missionView';
import { parseLocalization } from '@/domain/localization';
import type { GameTextContext } from '@/domain/gameText';
import { calculatorIndustryId, buildCalculation, calculate, type MissionCounts } from '@/engine/calculate';
import { emptyFormValues, type FormValues } from '@/engine/model';
import { getResourceByIndustry } from '@/domain/gameText';
import { TITLES, type TitleKey } from '@/domain/titles';
import type { GameBalance, Mission, TrackerMode } from '@/domain/types';
import { assetsAvailable, createLegacy, loadBalances, loadLocalizationBase64, TITLE_KEYS } from './harness';

const report: Record<string, number[]> = { online: [], offlineResourceGoals: [], offlineGeneratorGoals: [] };
const worst: Record<string, string> = {};

afterAll(() => {
  for (const [name, ratios] of Object.entries(report)) {
    const sorted = [...ratios].sort((a, b) => a - b);
    const at = (fraction: number) => sorted[Math.floor((sorted.length - 1) * fraction)]?.toFixed(3);
    console.log(`[engine] ${name}: n=${sorted.length} new/legacy p5=${at(0.05)} median=${at(0.5)} p95=${at(0.95)} min=${at(0)} max=${at(1)} ${worst[name] ?? ''}`);
  }
});

function mulberry(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formFor(balance: GameBalance, industryId: string, resourceId: string, counts: MissionCounts): FormValues {
  const form = emptyFormValues();
  for (const researcher of balance.Researchers ?? []) {
    form.ResearcherLevels[researcher.Id] = researcher.Rarity === 'Common' || researcher.Rarity === 'LteCommon' ? 3 : 2;
  }
  const generators = (balance.Generators ?? []).filter((g) => g.IndustryId === industryId);
  form.Counts[resourceId] = Object.fromEntries(generators.map((g, index) => [g.Id, counts.generators[index] ?? 0]));
  return form;
}

describe.skipIf(!assetsAvailable).each(TITLE_KEYS)('engine against the legacy calculator (%s)', (titleKey: TitleKey) => {
  const title = TITLES[titleKey];
  const balances = loadBalances(titleKey);
  const localization = parseLocalization(loadLocalizationBase64(titleKey));
  const legacy = createLegacy(titleKey);
  const random = mulberry(99);

  const sample = (balanceId: string, mode: TrackerMode, missions: Mission[]) => {
    const balance = balances[balanceId] as GameBalance;
    const ctx: GameTextContext = { balance, localization, title, mode };
    legacy.configure({ balances, balanceId, mode, localization: loadLocalizationBase64(titleKey) } as never);

    const usable = missions.filter(hasCalculator);
    for (let index = 0; index < 12 && usable.length > 0; index++) {
      const mission = usable[Math.floor(random() * usable.length)] as Mission;
      const industryId = calculatorIndustryId(ctx, mission);
      if (!industryId) {
        continue;
      }
      const resourceId = getResourceByIndustry(ctx, industryId)?.Id as string;
      const tierCount = (balance.Generators ?? []).filter((g) => g.IndustryId === industryId).length;
      const owned = 2 + Math.floor(random() * Math.max(1, Math.min(tierCount - 1, 5)));
      const generators = Array.from({ length: tierCount }, (_, tier) => (tier < owned ? Math.round(10 ** (1 + random() * 2)) : 0));
      const counts: MissionCounts = { generators, resource: 0, earned: 0, comrades: 0, comradesPerSecond: 1e3 };
      const form = formFor(balance, industryId, resourceId, counts);

      const prepare = (mode: 'online' | 'offline') =>
        buildCalculation(ctx, mission, resourceId, industryId, counts, form, { mode, autobuy: false, comradesOnly: false, progress: [] });
      const onlineInput = prepare('online');
      const offlineInput = prepare('offline');
      if (!onlineInput || !offlineInput) {
        continue;
      }
      const mineOnline = calculate(onlineInput, mulberry(1)).seconds;
      const mineOffline = calculate(offlineInput, mulberry(1)).seconds;
      const needsGenerators = offlineInput.model.goals.some((goal) => goal.kind === 'tier');

      const legacySim = legacy.run<{ online: number; offline: number }>(
        `(() => {
          const simData = { Generators: [], Counts: {}, Mission: mission, IndustryId: industryId, Errors: 0, Config: { MaxSimSeconds: 1 } };
          simData.Generators.push({ Id: 'comradegenerator', Resource: 'comrade', QtyPerSec: cps, Cost: [] });
          simData.Counts.comradegenerator = 1;
          setupSimDataGenerators(simData, industryId, form, true);
          simData.Counts[resourceId] = resource;
          simData.Counts.comrade = comrades;
          simData.Counts.resourceProgress = 0;
          const copy = () => JSON.parse(JSON.stringify(simData));
          const off = calcOffline(Object.assign(copy(), { Mission: mission }));
          const on = runOnline ? simulateProductionMission(Object.assign(copy(), { Mission: mission })) : -1;
          return { online: on, offline: off };
        })()`,
        {
          mission,
          industryId,
          form,
          resourceId,
          resource: counts.resource,
          comrades: counts.comrades,
          cps: counts.comradesPerSecond,
          runOnline: mineOnline < 2e6
        }
      );

      const compare = (name: string, mine: number, theirs: number) => {
        if (!Number.isFinite(mine) || theirs <= 60 || mine <= 60) {
          return;
        }
        const ratio = mine / theirs;
        report[name]?.push(ratio);
        const limit = report[name]?.reduce((far, value) => Math.max(far, Math.abs(Math.log(value))), 0) ?? 0;
        if (Math.abs(Math.log(ratio)) >= limit) {
          worst[name] = `worst ${title.key} ${balanceId} ${mission.Id} ${mission.Condition.ConditionType} new=${mine.toFixed(0)} legacy=${theirs.toFixed(0)}`;
        }
      };
      compare('online', mineOnline, legacySim.online);
      compare(needsGenerators ? 'offlineGeneratorGoals' : 'offlineResourceGoals', mineOffline, legacySim.offline);
    }
  };

  it('matches on sampled missions', () => {
    for (const [balanceId, balance] of Object.entries(balances)) {
      if (balanceId === 'evergreen') {
        sample(balanceId, 'evergreen', balance.Missions);
      } else {
        sample(balanceId, 'lte', balance.Missions);
      }
    }
    expect(report['online']?.length).toBeGreaterThan(20);
    const online = report['online'] ?? [];
    const closeOnline = online.filter((ratio) => ratio > 0.97 && ratio < 1.03).length / online.length;
    expect(closeOnline).toBeGreaterThan(0.95);

    // Legacy offline ignored generator costs, so with those goals it can only be too optimistic.
    const resourceOnly = report['offlineResourceGoals'] ?? [];
    const closeOffline = resourceOnly.filter((ratio) => ratio > 0.97 && ratio < 1.03).length / resourceOnly.length;
    expect(closeOffline).toBeGreaterThan(0.95);
    expect(Math.min(...(report['offlineGeneratorGoals'] ?? [1]))).toBeGreaterThan(0.97);
  }, 180_000);
});
