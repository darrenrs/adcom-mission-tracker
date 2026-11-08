import { ChevronDown, ChevronUp } from 'lucide-react';
import { useId } from 'react';
import { bigNum } from '@/domain/format';
import { resourceName } from '@/domain/gameText';
import { getIndustryTradeBreakdown } from '@/domain/trades';
import { getTradeResearchers } from '@/domain/researchers';
import { useSession } from '@/state/store';
import { ResearcherGrid } from './ResearcherGrid';
import type { TradeFields } from './useTradeFields';

const arrowButton =
  'flex size-control shrink-0 items-center justify-center rounded-lg border border-line bg-surface enabled:hover:bg-raised';

/** Next trade costs, what the trades add up to, and the trade researchers. Shared by the calculator and Production. */
export function TradesPanel({ fields }: { fields: TradeFields }) {
  const { text: ctx, assets, form } = useSession();
  const baseId = useId();
  const { powers } = ctx.title;
  const rows = getIndustryTradeBreakdown(ctx, form);
  const trades = ctx.localization['conditionmodel.trade.singular'] ?? 'trade';
  const comrade = String(resourceName(ctx, 'comrade'));

  return (
    <div className="space-y-2">
      <p className="flex items-center justify-center gap-2 text-center text-sm">
        <img src={assets.active('shared/comrades_per_second.png')} alt="" className="size-5 object-contain" />
        <span>
          <strong data-testid="total-comrades">{bigNum(form.Trades.TotalComrades || 0, powers)}</strong> {comrade} per second
        </span>
      </p>

      <ul className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row, index) => {
          const name = String(resourceName(ctx, row.resourceId));
          const id = `${baseId}-${index}`;
          const costLabel = `Next ${trades} cost (${name})`;
          const value = fields.shown(row.resourceId, row.nextCost, row.isInvalid ? NaN : row.count);
          const invalid = row.isInvalid;
          return (
            <li key={row.resourceId} className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-xl border border-line bg-surface p-1.5 pointer-fine:p-1">
              <img src={assets.iconUrl(`${row.resourceId}.png`)} alt="" className="size-6 shrink-0 object-contain" />
              <input
                id={id}
                type="text"
                inputMode="text"
                autoComplete="off"
                aria-label={costLabel}
                title={costLabel}
                value={value}
                aria-invalid={invalid}
                aria-describedby={`${id}-result`}
                data-field="tradeCost"
                data-field-key={row.resourceId}
                onChange={(event) => fields.type(row.resourceId, event.target.value)}
                onBlur={() => fields.finish(row.resourceId)}
                className="h-control w-32 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 text-base aria-invalid:border-danger pointer-fine:flex-none pointer-fine:text-sm"
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Increase ${name} ${trades}`}
                onClick={() => fields.step(row.resourceId, 1, value)}
                className={arrowButton}
              >
                <ChevronUp aria-hidden size={16} className="text-success" />
              </button>
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Decrease ${name} ${trades}`}
                onClick={() => fields.step(row.resourceId, -1, value)}
                className={arrowButton}
              >
                <ChevronDown aria-hidden size={16} className="text-danger" />
              </button>
              <p id={`${id}-result`} className={`min-w-0 basis-full text-xs sm:flex-1 sm:basis-0 ${invalid ? 'text-danger' : 'text-muted'}`}>
                {invalid ? 'Not a cost the game would ask for. Check the number.' : `${row.formula} = ${row.total}`}
              </p>
            </li>
          );
        })}
      </ul>

      <ResearcherGrid researchers={getTradeResearchers(ctx)} label="Trade researchers" />
    </div>
  );
}
