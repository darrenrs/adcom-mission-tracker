// Compares the comrade trade functions (trade values, trade counts for a cost, the per-industry breakdown,
// the totals and the up/down buttons) with the legacy ones, on every balance of both titles and on many
// next-trade cost strings: exact costs, almost exact ones, other amounts and text that is not a number.
import { afterAll, describe, expect, it } from 'vitest';
import { bigNum } from '@/domain/format';
import { parseAmount } from '@/domain/inputSteps';
import { parseLocalization } from '@/domain/localization';
import type { GameTextContext } from '@/domain/gameText';
import { researcherMaxLevel } from '@/domain/researchers';
import {
  getIndustryTradeBreakdown,
  getTotalTradeValueForResource,
  getTradesForCost,
  tradeInfo,
  tradeLevelDelta,
  tradeResourceIds,
  updateTradesForResource,
  updateTradeTabTotals,
  type TradeInfo
} from '@/domain/trades';
import { TITLES, type TitleKey } from '@/domain/titles';
import type { GameBalance, TrackerMode } from '@/domain/types';
import { emptyFormValues, type FormValues } from '@/engine/model';
import { assetsAvailable, createLegacy, loadBalances, loadLocalizationBase64, stripHtml, TITLE_KEYS } from './harness';

const tally = { values: 0, counts: 0, updates: 0, totals: 0, breakdowns: 0, deltas: 0 };
const seen = { movedButtons: 0, summed: 0 };

afterAll(() => {
  const total = Object.values(tally).reduce((sum, count) => sum + count, 0);
  console.log(`[trades] ${total} comparisons against legacy (${JSON.stringify(tally)}), ${seen.movedButtons} button presses moved a cost, ${seen.summed} totals were recomputed`);
});

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const modeOf = (balanceId: string): TrackerMode => (balanceId === 'evergreen' ? 'evergreen' : 'lte');

function randomForm(balance: GameBalance, random: () => number): FormValues {
  const form = emptyFormValues();
  for (const researcher of balance.Researchers ?? []) {
    const roll = random();
    const max = researcherMaxLevel(balance, researcher) ?? 5;
    if (roll < 0.7) {
      form.ResearcherLevels[researcher.Id] = Math.floor(random() * (max + 1));
    }
  }
  return form;
}

function costTexts(info: TradeInfo, powers: readonly string[], random: () => number): string[] {
  const texts = ['', ' ', 'abc', '0', '-1', '1e3', '12 qq', '5,000', '5 K', '0.5', '1 M', '7 zz'];
  for (const count of [0, 1, 2, 3, 5, 10, 25, 50, 98, 99, 100]) {
    const value = info.CostMultiplier * Math.pow(info.CostExponent, count);
    if (!Number.isFinite(value)) continue;
    texts.push(bigNum(value, powers), String(value));
    for (const factor of [1.00001, 1.001, 2, 0.1]) {
      texts.push(bigNum(value * factor, powers));
    }
  }
  for (let index = 0; index < 15; index++) {
    const power = Math.floor(random() * Math.min(powers.length, 60));
    texts.push(power === 0 ? String(Math.floor(random() * 1e5)) : `${(1 + random() * 998).toFixed(2)} ${powers[power - 1]}`);
  }
  return texts;
}

// A stand-in for jQuery that keeps the value of every field, which is all the trade functions use.
const DOM = `
  var __dom = {};
  var __sets = [];
  $ = function (selector) {
    const key = String(selector).replace('.modal.show ', '');
    const chain = new Proxy({
      val(value) {
        if (arguments.length === 0) return __dom[key];
        __dom[key] = value;
        __sets.push([key, value]);
        return chain;
      }
    }, { get: (target, name) => (name in target ? target[name] : () => chain) });
    return chain;
  };
`;

describe.skipIf(!assetsAvailable).each(TITLE_KEYS)('trades match legacy (%s)', (titleKey: TitleKey) => {
  const title = TITLES[titleKey];
  const { powers } = title;
  const balances = loadBalances(titleKey);
  const localizationBase64 = loadLocalizationBase64(titleKey);
  const parsed = parseLocalization(localizationBase64);
  const legacy = createLegacy(titleKey);

  for (const balanceId of Object.keys(balances)) {
    it(`matches on ${balanceId}`, () => {
      const balance = balances[balanceId] as GameBalance;
      const ctx: GameTextContext = { balance, localization: parsed, title, mode: modeOf(balanceId) };
      legacy.configure({ balances: { ...balances, [balanceId]: structuredClone(balance) }, balanceId, localization: localizationBase64 });
      legacy.run(`var __FORM = null; getFormValuesObject = function () { return __FORM; }; ${DOM}`);
      const random = mulberry32(31);
      const resources = tradeResourceIds(ctx);
      expect(resources.length).toBeGreaterThan(0);

      for (const resourceId of resources) {
        const info = tradeInfo(balance, resourceId) as TradeInfo;
        const texts = costTexts(info, powers, random);

        for (const text of texts) {
          const cost = parseAmount(text, powers);
          const expected = legacy.run<number>('getTradesForCost(__cost, __info)', { __cost: cost, __info: info });
          tally.counts++;
          expect(Object.is(getTradesForCost(cost, info), expected), `${resourceId} "${text}" counts ${expected}`).toBe(true);
        }

        for (let round = 0; round < 3; round++) {
          const form = randomForm(balance, random);
          legacy.run('__FORM = __f', { __f: structuredClone(form) });
          const expected = legacy.run<number>('getTotalTradeValueForResource(__id, __FORM, __info)', { __id: resourceId, __info: info });
          tally.values++;
          expect(getTotalTradeValueForResource(balance, resourceId, form), `${resourceId} value`).toBe(expected);

          for (const text of texts) {
            const mine = structuredClone(form);
            const theirs = structuredClone(form);
            updateTradesForResource(balance, resourceId, text, mine, powers);
            legacy.call('updateTradesForResource', resourceId, text, theirs);
            tally.updates++;
            expect(mine.Trades.Resource[resourceId], `${resourceId} "${text}" update`).toEqual(theirs.Trades.Resource[resourceId]);
          }
        }
      }

      // The totals, the breakdown and the buttons read all industries at once.
      for (let round = 0; round < 12; round++) {
        const form = randomForm(balance, random);
        const typed: Record<string, string> = {};
        for (const resourceId of resources) {
          const info = tradeInfo(balance, resourceId) as TradeInfo;
          const options = costTexts(info, powers, random);
          // Mostly costs the game could ask for, so that totals are computed more often than skipped.
          const valid = options.filter((text) => !Number.isNaN(getTradesForCost(parseAmount(text, powers), info)));
          typed[resourceId] = (round % 3 === 0 ? options : valid)[Math.floor(random() * (round % 3 === 0 ? options.length : valid.length))] ?? '';
        }
        // A saved total from before, which an invalid field must leave alone.
        form.Trades.TotalComrades = Math.round(random() * 1000) + 1;

        const mine = structuredClone(form);
        const theirs = structuredClone(form);
        legacy.run('__FORM = __f; __dom = __d;', { __f: theirs, __d: Object.fromEntries(resources.map((id) => [`#${id}-trade-cost`, typed[id]])) });
        updateTradeTabTotals(ctx, mine, typed);
        legacy.call('updateTradeTabTotals');
        tally.totals++;
        if (!Object.values(mine.Trades.Resource).some((trade) => trade?.IsInvalid)) seen.summed++;
        expect(mine.Trades, `round ${round} totals ${JSON.stringify(typed)}`).toEqual(theirs.Trades);

        const legacyBreakdown = legacy.run<{ ResourceId: string; IsInvalid: boolean; NextCost: string; FormulaHtml: string; TotalHtml: string }[]>(
          'getIndustryTradeBreakdown(__FORM)'
        );
        const breakdown = getIndustryTradeBreakdown(ctx, mine);
        tally.breakdowns++;
        expect(breakdown.length).toBe(legacyBreakdown.length);
        breakdown.forEach((row, index) => {
          const other = legacyBreakdown[index]!;
          expect([row.resourceId, row.isInvalid, row.nextCost, row.formula, row.total]).toEqual([
            other.ResourceId,
            other.IsInvalid,
            other.NextCost,
            stripHtml(other.FormulaHtml),
            stripHtml(other.TotalHtml)
          ]);
        });

        // Industries nobody has typed a cost for yet.
        const fresh = structuredClone(form);
        fresh.Trades.Resource = {};
        legacy.run('__FORM = __f', { __f: structuredClone(fresh) });
        const legacyFresh = legacy.run<{ FormulaHtml: string; TotalHtml: string }[]>('getIndustryTradeBreakdown(__FORM)');
        tally.breakdowns++;
        expect(getIndustryTradeBreakdown(ctx, fresh).map((row) => [row.formula, row.total])).toEqual(
          legacyFresh.map((row) => [stripHtml(row.FormulaHtml), stripHtml(row.TotalHtml)])
        );

        // The up and down buttons, from a saved state and from an invalid one.
        const resourceId = resources[Math.floor(random() * resources.length)] as string;
        const info = tradeInfo(balance, resourceId) as TradeInfo;
        for (const text of costTexts(info, powers, random).slice(0, 25)) {
          for (const delta of [1, -1, 5, -25, 125]) {
            const form2 = structuredClone(form);
            legacy.run('__FORM = __f; __dom = __d; __sets = [];', {
              __f: form2,
              __d: Object.fromEntries(resources.map((id) => [`#${id}-trade-cost`, id === resourceId ? text : (typed[id] ?? '')]))
            });
            const result = legacy.run<unknown>('tradeLevelDelta(__id, __delta)', { __id: resourceId, __delta: delta });
            const written = legacy.run<[string, string][]>('__sets').find(([key]) => key === `#${resourceId}-trade-cost`);
            const mineText = tradeLevelDelta(balance, resourceId, text, delta, powers);
            tally.deltas++;
            expect(result === null, `${resourceId} "${text}" ${delta}`).toBe(mineText === null);
            if (mineText !== null) {
              seen.movedButtons++;
              expect(written?.[1], `${resourceId} "${text}" ${delta}`).toBe(mineText);
            }
          }
        }
      }
    });
  }
});

afterAll(() => {
  if (assetsAvailable) {
    expect(seen.movedButtons).toBeGreaterThan(1000);
    expect(seen.summed).toBeGreaterThan(50);
  }
});
