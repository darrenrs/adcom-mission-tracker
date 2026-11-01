import { useCallback } from 'react';
import { researcherMaxLevel } from '@/domain/researchers';
import { tradeResourceIds, updateTradeTabTotals } from '@/domain/trades';
import type { Researcher } from '@/domain/types';
import { useSession, useTracker } from '@/state/store';

/** Changes to researcher levels. Trade researchers also refresh what every trade gives. */
export function useResearcherActions() {
  const { text: ctx } = useSession();
  const updateForm = useTracker((state) => state.updateForm);

  const change = useCallback(
    (researchers: readonly Researcher[], apply: (levels: Record<string, number>) => void) => {
      updateForm((form) => {
        apply(form.ResearcherLevels);
        // A trade researcher changes what every trade gives, which in turn sets comrades per second.
        if (researchers.some((researcher) => researcher.ModType === 'TradePayoutMultiplier')) {
          const costs = Object.fromEntries(tradeResourceIds(ctx).map((id) => [id, form.Trades.Resource[id]?.NextCost ?? '']));
          updateTradeTabTotals(ctx, form, costs);
        }
      });
    },
    [ctx, updateForm]
  );

  const setLevel = useCallback(
    (researcher: Researcher, level: number) => change([researcher], (levels) => void (levels[researcher.Id] = level)),
    [change]
  );

  /** Sets every researcher in the list at once, to its own max level or to 0. */
  const setAll = useCallback(
    (researchers: readonly Researcher[], target: 'max' | 0) =>
      change(researchers, (levels) => {
        for (const researcher of researchers) {
          const max = researcherMaxLevel(ctx.balance, researcher);
          levels[researcher.Id] = target === 'max' ? (max ?? levels[researcher.Id] ?? 0) : 0;
        }
      }),
    [change, ctx.balance]
  );

  const setPropaganda = useCallback(
    (on: boolean) => change([], (levels) => void (levels['PropagandaBoost'] = on ? 1 : 0)),
    [change]
  );

  return { setLevel, setAll, setPropaganda };
}
