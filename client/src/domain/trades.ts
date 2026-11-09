// Comrade trades: how many comrades each industry's trades give, from the next trade's cost and the trade
// researchers. Ported from getTradesTab and the functions around it; tests/legacy/trades.test.ts compares them.

import { shortBigNum } from './format';
import { getResourceByIndustry, getValueForResearcherLevel, type GameTextContext } from './gameText';
import { formatAmount, parseAmount } from './inputSteps';
import type { GameBalance, Researcher } from './types';
import type { FormValues, TradeValues } from '@/engine/model';

export interface TradeInfo {
  Resource: string;
  CostExponent: number;
  CostMultiplier: number;
  ComradeAdd: number;
  MaxLevel?: number;
}

export function tradeInfo(balance: GameBalance, resourceId: string): TradeInfo | undefined {
  const trades = (balance['Trades'] ?? []) as TradeInfo[];
  return trades.find((trade) => trade.Resource === resourceId);
}

function researcherValue(researcher: Researcher, form: FormValues): number {
  return getValueForResearcherLevel(researcher, form.ResearcherLevels[researcher.Id] ?? 0);
}

/** Comrades one trade of this resource gives, from the trade researchers' levels. */
export function getTotalTradeValueForResource(balance: GameBalance, resourceId: string, form: FormValues): number {
  let multiplier = 1;
  for (const researcher of balance.Researchers ?? []) {
    if (researcher.ModType === 'TradePayoutMultiplier' && (researcher.TargetIds[0] ?? '').split(/, ?/).includes(resourceId)) {
      multiplier *= researcherValue(researcher, form);
    }
  }
  return multiplier * (tradeInfo(balance, resourceId)?.ComradeAdd ?? NaN);
}

/**
 * How many trades have been made when the next one costs `cost`. NaN when the cost is not one the game can
 * ask for, which is how an invalid field is told from a valid one.
 */
export function getTradesForCost(cost: number, info: TradeInfo | undefined): number {
  if (Number.isNaN(cost) || !info) {
    return NaN;
  }
  // Legacy compared with `== ""`, which also catches 0: nothing typed means no trades yet.
  if (cost === 0) {
    return 0;
  }

  const count = Math.log(cost / info.CostMultiplier) / Math.log(info.CostExponent);
  // The exact count is a whole number, but logarithms are not exact.
  const rounded = Math.round(count);
  return rounded >= 0 && Math.abs(count - rounded) < 0.0001 ? rounded : NaN;
}

/**
 * The next-trade cost text after moving `delta` trades up or down, or null when that is not possible
 * (below zero trades, too large to write, or the field is invalid).
 */
export function tradeLevelDelta(
  balance: GameBalance,
  resourceId: string,
  costText: string,
  delta: number,
  powers: readonly string[]
): string | null {
  const info = tradeInfo(balance, resourceId);
  const count = getTradesForCost(parseAmount(costText, powers), info) + delta;
  const next = info ? info.CostMultiplier * Math.pow(info.CostExponent, count) : NaN;

  if (count < 0 || next === Infinity || Number.isNaN(next)) {
    return null;
  }
  return formatAmount(next, powers);
}

/** Reads a typed cost into the form, as the next-trade cost fields do when they change. */
export function updateTradesForResource(
  balance: GameBalance,
  resourceId: string,
  costText: string,
  form: FormValues,
  powers: readonly string[]
): void {
  const cost = parseAmount(costText, powers);
  const comradesPerTrade = getTotalTradeValueForResource(balance, resourceId, form);
  const count = getTradesForCost(cost, tradeInfo(balance, resourceId));

  form.Trades.Resource[resourceId] = Number.isNaN(count)
    ? { NextCost: costText, Count: 0, ComradesPerTrade: comradesPerTrade, TotalComrades: 0, IsInvalid: true }
    : {
        // Normalised into the one number format. Legacy used plain bigNum, which kept up to three decimals under 1 M.
        NextCost: formatAmount(cost, powers),
        Count: count,
        ComradesPerTrade: comradesPerTrade,
        TotalComrades: count * comradesPerTrade,
        IsInvalid: false
      };
}

/** The resource each industry's trades are paid in, in industry order. */
export function tradeResourceIds(ctx: GameTextContext): string[] {
  return (ctx.balance.Industries ?? []).flatMap((industry) => getResourceByIndustry(ctx, industry.Id)?.Id ?? []);
}

/**
 * Reads every cost field into the form again and, when none is invalid, sets the total to 1 comrade a second
 * plus every trade's share. `costTexts` holds what the fields show; a missing one counts as empty.
 */
export function updateTradeTabTotals(ctx: GameTextContext, form: FormValues, costTexts: Readonly<Record<string, string>>): void {
  for (const resourceId of tradeResourceIds(ctx)) {
    updateTradesForResource(ctx.balance, resourceId, costTexts[resourceId] ?? '', form, ctx.title.powers);
  }

  const trades = Object.values(form.Trades.Resource) as TradeValues[];
  if (!trades.some((trade) => trade.IsInvalid)) {
    form.Trades.TotalComrades = trades.reduce((sum, trade) => sum + (trade.TotalComrades || 0), 1);
  }
}

export interface IndustryTrade {
  resourceId: string;
  isInvalid: boolean;
  /** The text of the next-trade cost field: what was typed when invalid, the normalised cost otherwise. */
  nextCost: string;
  count: number;
  comradesPerTrade: number;
  totalComrades: number;
  /** Share of the total comrades per second, a whole percent. */
  percent: number;
  /** `12 x 3.5`, as legacy printed it. */
  formula: string;
  /** `42 (12%)`, as legacy printed it. */
  total: string;
}

/** One row per industry for the trades tab. Industries without saved values show what a first trade would give. */
export function getIndustryTradeBreakdown(ctx: GameTextContext, form: FormValues): IndustryTrade[] {
  const { powers } = ctx.title;
  return tradeResourceIds(ctx).map((resourceId) => {
    const saved: TradeValues = form.Trades.Resource[resourceId] ?? {
      NextCost: '',
      Count: 0,
      ComradesPerTrade: getTotalTradeValueForResource(ctx.balance, resourceId, form),
      TotalComrades: 0,
      IsInvalid: false
    };
    const percent = Math.round((saved.TotalComrades / form.Trades.TotalComrades) * 100) || 0;

    return {
      resourceId,
      isInvalid: saved.IsInvalid,
      nextCost: saved.NextCost,
      count: saved.Count,
      comradesPerTrade: saved.ComradesPerTrade,
      totalComrades: saved.TotalComrades,
      percent,
      formula: `${saved.Count} x ${shortBigNum(saved.ComradesPerTrade, powers)}`,
      total: `${shortBigNum(saved.TotalComrades, powers)} (${percent}%)`
    };
  });
}
