import { afterAll, describe, expect, it } from 'vitest';
import { parseLocalization } from '@/domain/localization';
import { getResourceByIndustry, type GameTextContext } from '@/domain/gameText';
import { TITLES } from '@/domain/titles';
import type { GameBalance } from '@/domain/types';
import { assetsAvailable, createLegacy, loadBalances, loadLocalizationBase64, TITLE_KEYS } from '../../../tests/legacy/harness';
import { emptyFormValues, industryTiers, tierRate, type Tier } from './model';
import { projectComrades, projectForward } from './project';

const tier = (id: string, output: number, cycle: number, extra: Partial<Tier> = {}): Tier => ({
  id,
  cycleSeconds: cycle,
  outputPerCycle: output,
  critChance: 0,
  critMultiplier: 1,
  costs: [],
  unlockQty: 0,
  ...extra
});

/** Legacy's loop: tiers shallow to deep, each adding to the one below from the counts it has right now. */
function steps(rates: readonly number[], counts: readonly number[], seconds: number, delta: number): number[] {
  const state = [...counts];
  for (let time = 0; time < seconds; time += delta) {
    rates.forEach((rate, index) => {
      state[index] = (state[index] as number) + (state[index + 1] as number) * rate * delta;
    });
  }
  return state;
}

const chain = [tier('a', 3, 2), tier('b', 4, 4), tier('c', 5, 8)];
const rates = chain.map(tierRate);

describe('projectForward', () => {
  it('leaves counts alone for no time, negative time and bad time', () => {
    const counts = [5, 1, 2, 3];
    for (const seconds of [0, -10, NaN, Infinity]) {
      expect(projectForward(chain, counts, seconds)).toEqual(counts);
    }
  });

  it('does not change the input', () => {
    const counts = [5, 1, 2, 3];
    projectForward(chain, counts, 60);
    expect(counts).toEqual([5, 1, 2, 3]);
  });

  it('adds one tier at a time when a single generator is owned', () => {
    // 10 generators of tier 0 make 1.5 a second each.
    expect(projectForward(chain, [100, 10, 0, 0], 60)[0]).toBeCloseTo(100 + 10 * 1.5 * 60, 9);
  });

  it('agrees with a very fine one-step-per-instant run', () => {
    const counts = [1000, 50, 20, 7];
    const fine = steps(rates, counts, 600, 0.002);
    const projected = projectForward(chain, counts, 600);
    projected.forEach((value, index) => expect(value / (fine[index] as number)).toBeCloseTo(1, 2));
  });

  it('is never below legacy, which stepped a whole second at a time and so undershot', () => {
    const counts = [1000, 50, 20, 7];
    for (const seconds of [10, 100, 3600]) {
      const legacy = steps(rates, counts, seconds, 1);
      const projected = projectForward(chain, counts, seconds);
      projected.forEach((value, index) => expect(value).toBeGreaterThanOrEqual((legacy[index] as number) * (1 - 1e-12)));
      // ... and not by much for a short wait.
      if (seconds === 10) {
        expect((projected[0] as number) / (legacy[0] as number)).toBeLessThan(1.2);
      }
    }
  });

  it('keeps counts of tiers that do not run', () => {
    const stalled = [tier('a', 3, Infinity), tier('b', 4, Infinity)];
    expect(projectForward(stalled, [10, 4, 9], 100)).toEqual([10, 4, 9]);
    // Only the deeper tier runs: the resource stands still while tier a grows.
    expect(projectForward([tier('a', 3, Infinity), tier('b', 4, 4)], [10, 4, 9], 100)).toEqual([10, 904, 9]);
  });

  it('is fast for a month of waiting', () => {
    const started = performance.now();
    projectForward(chain, [0, 10, 10, 10], 30 * 24 * 3600);
    expect(performance.now() - started).toBeLessThan(20);
  });
});

describe('projectComrades', () => {
  it('adds the steady rate for the time since the numbers were typed', () => {
    expect(projectComrades(100, 2.5, 60)).toBe(250);
    expect(projectComrades(100, 2.5, -5)).toBe(100);
  });
});

let compared = 0;
let worstLegacyRatio = 1;

afterAll(() => {
  if (compared > 0) {
    console.log(`[project] ${compared} comparisons against legacy rates, legacy one-second stepping reaches at worst ${worstLegacyRatio.toFixed(4)} of the projection`);
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

describe.skipIf(!assetsAvailable).each(TITLE_KEYS)('projection against the legacy generators (%s)', (titleKey) => {
  const title = TITLES[titleKey];
  const balances = loadBalances(titleKey);
  const localizationBase64 = loadLocalizationBase64(titleKey);
  const parsed = parseLocalization(localizationBase64);
  const legacy = createLegacy(titleKey);

  for (const balanceId of Object.keys(balances)) {
    it(`uses legacy's rates on ${balanceId}`, () => {
      const balance = balances[balanceId] as GameBalance;
      const ctx: GameTextContext = { balance, localization: parsed, title, mode: balanceId === 'evergreen' ? 'evergreen' : 'lte' };
      legacy.configure({ balances: { ...balances, [balanceId]: structuredClone(balance) }, balanceId, localization: localizationBase64 });
      const random = mulberry(17);

      for (const industry of balance.Industries ?? []) {
        const form = emptyFormValues();
        form.Counts[getResourceByIndustry(ctx, industry.Id)?.Id ?? ''] = {};
        for (const researcher of balance.Researchers ?? []) {
          form.ResearcherLevels[researcher.Id] = Math.floor(random() * 4);
        }
        const tiers = industryTiers(ctx.balance, industry.Id, form);
        const owned = [Math.round(10 ** (random() * 3)), ...tiers.map(() => Math.round(10 ** (random() * 3)))];
        const seconds = Math.round(10 ** (1 + random() * 2.5));

        const sim = legacy.run<{ QtyPerSec: number }[]>(
          `(() => {
            const simData = { Generators: [], Counts: {} };
            setupSimDataGenerators(simData, __industry, __form, true);
            return simData.Generators.map(g => ({ QtyPerSec: g.QtyPerSec }));
          })()`,
          { __industry: industry.Id, __form: form }
        );
        expect(sim.length).toBe(tiers.length);
        sim.forEach((generator, index) => {
          compared++;
          const mine = tierRate(tiers[index] as Tier);
          // A Common researcher at level 0 stops a generator, which the new model says with an infinite cycle.
          if (mine === 0) return;
          expect(mine / generator.QtyPerSec, `${industry.Id} tier ${index}`).toBeCloseTo(1, 12);
        });

        const legacyRates = sim.map((generator) => generator.QtyPerSec);
        const fine = steps(legacyRates, owned, seconds, 0.01);
        const oneSecond = steps(legacyRates, owned, seconds, 1);
        const projected = projectForward(tiers, owned, seconds);
        compared++;
        // Rates that legacy zeroes (a Common at level 0) are zero here too, so the two runs describe the same game.
        if (tiers.every((t) => tierRate(t) > 0)) {
          expect((projected[0] as number) / (fine[0] as number), `${industry.Id} ${seconds}s`).toBeCloseTo(1, 1);
          worstLegacyRatio = Math.min(worstLegacyRatio, (oneSecond[0] as number) / (projected[0] as number));
          expect(projected[0] as number).toBeGreaterThanOrEqual((oneSecond[0] as number) * (1 - 1e-9));
        }
      }
    });
  }
});
