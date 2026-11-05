import { useCallback, useState } from 'react';
import { bigNum } from '@/domain/format';
import { tradeInfo, tradeLevelDelta, updateTradeTabTotals, tradeResourceIds } from '@/domain/trades';
import { trackerStore, useSession, useTracker } from '@/state/store';

/**
 * The next-trade cost fields. A field shows what was typed while it is being edited and what the form
 * saved otherwise, so up and down buttons and trade researchers can change it from outside.
 */
export function useTradeFields() {
  const session = useSession();
  const updateForm = useTracker((state) => state.updateForm);
  const { text: ctx } = session;
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const write = useCallback(
    (resourceId: string, text: string) => {
      updateForm((form) => {
        const costs = Object.fromEntries(tradeResourceIds(ctx).map((id) => [id, form.Trades.Resource[id]?.NextCost ?? '']));
        updateTradeTabTotals(ctx, form, { ...costs, [resourceId]: text });
      });
    },
    [ctx, updateForm]
  );

  const type = useCallback(
    (resourceId: string, text: string) => {
      setDrafts((previous) => ({ ...previous, [resourceId]: text }));
      write(resourceId, text);
    },
    [write]
  );

  /** When the player leaves a field it goes back to showing the saved, tidied-up cost. */
  const finish = useCallback((resourceId: string) => {
    setDrafts(({ [resourceId]: _done, ...rest }) => rest);
  }, []);

  /** Moves the next trade up or down by whole trades, from the text a field shows now. */
  const step = useCallback(
    (resourceId: string, delta: number, shown?: string) => {
      const form = trackerStore().getState().session?.form;
      const text = shown ?? form?.Trades.Resource[resourceId]?.NextCost ?? '';
      const next = tradeLevelDelta(ctx.balance, resourceId, text, delta, ctx.title.powers);
      if (next === null) {
        return false;
      }
      finish(resourceId);
      write(resourceId, next);
      return true;
    },
    [ctx, finish, write]
  );

  /** What a field shows: what is being typed, else the saved cost, else the first trade's cost while there are no trades. */
  const shown = (resourceId: string, savedCost: string, tradeCount: number) => {
    const draft = drafts[resourceId];
    if (draft !== undefined) {
      return draft;
    }
    const base = tradeInfo(ctx.balance, resourceId)?.CostMultiplier;
    return tradeCount === 0 && base !== undefined ? bigNum(base, ctx.title.powers) : savedCost;
  };

  return { type, finish, step, shown };
}

export type TradeFields = ReturnType<typeof useTradeFields>;
