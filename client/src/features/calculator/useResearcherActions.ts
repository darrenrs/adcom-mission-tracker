import { useCallback } from 'react';
import { tradeResourceIds, updateTradeTabTotals } from '@/domain/trades';
import type { Researcher } from '@/domain/types';
import { useSession, useTracker } from '@/state/store';

/** Researcher levels in the legacy shape: ResearcherLevels, with -1 for a custom value kept in ResearcherOverrides. */
export function useResearcherActions() {
  const { text: ctx } = useSession();
  const updateForm = useTracker((state) => state.updateForm);

  const change = useCallback(
    (researcher: Researcher | null, apply: (levels: Record<string, number>, overrides: Record<string, number>) => void) => {
      updateForm((form) => {
        form.ResearcherOverrides ??= {};
        apply(form.ResearcherLevels, form.ResearcherOverrides);
        // A trade researcher changes what every trade gives, which in turn sets comrades per second.
        if (researcher?.ModType === 'TradePayoutMultiplier') {
          const costs = Object.fromEntries(tradeResourceIds(ctx).map((id) => [id, form.Trades.Resource[id]?.NextCost ?? '']));
          updateTradeTabTotals(ctx, form, costs);
        }
      });
    },
    [ctx, updateForm]
  );

  const setLevel = useCallback(
    (researcher: Researcher, level: number) => change(researcher, (levels) => void (levels[researcher.Id] = level)),
    [change]
  );

  const setCustom = useCallback(
    (researcher: Researcher, value: number) =>
      change(researcher, (levels, overrides) => {
        levels[researcher.Id] = -1;
        overrides[researcher.Id] = value;
      }),
    [change]
  );

  const setPropaganda = useCallback(
    (on: boolean) => change(null, (levels) => void (levels['PropagandaBoost'] = on ? 1 : 0)),
    [change]
  );

  return { setLevel, setCustom, setPropaganda };
}
