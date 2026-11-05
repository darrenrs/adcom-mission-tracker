import * as Tabs from '@radix-ui/react-tabs';
import { useMemo, useRef, useState } from 'react';
import { upperCaseFirstLetter } from '@/domain/format';
import { getResourceByIndustry } from '@/domain/gameText';
import { getResearchersByIndustry, sortResearchers } from '@/domain/researchers';
import { ResearcherGrid } from '@/features/calculator/ResearcherGrid';
import { TradesPanel } from '@/features/calculator/TradesPanel';
import { TAB_LIST, TAB_TRIGGER } from '@/features/calculator/tabStyles';
import { useFieldKeyboard } from '@/features/calculator/useFieldKeyboard';
import { useTradeFields } from '@/features/calculator/useTradeFields';
import { useSearchParam } from '@/state/navigation';
import { useSession } from '@/state/store';
import { AllGenerators } from './AllGenerators';
import { ResearcherBulkActions } from './ResearcherBulkActions';

const TABS = ['generators', 'researchers', 'trades'];

/** `?tab=` picks the tab, and a `researcher` link opens Researchers. */
function initialTab(tab: string | null, researcher: string | null): string {
  if (tab && TABS.includes(tab)) {
    return tab;
  }
  return researcher ? 'researchers' : 'generators';
}

export function ProductionPage() {
  const { text: ctx, assets } = useSession();
  const tradeFields = useTradeFields();
  const tabParam = useSearchParam('tab');
  const researcherParam = useSearchParam('researcher');
  const [tab, setTab] = useState(() => initialTab(tabParam, researcherParam));
  const root = useRef<HTMLDivElement>(null);

  // Only the trade cost fields live here, but they take the same keys as in the calculator.
  useFieldKeyboard(root, {
    powers: ctx.title.powers,
    setField: () => undefined,
    stepTrade: (resourceId, delta, shown) => void tradeFields.step(resourceId, delta, shown)
  });

  const researchers = useMemo(() => sortResearchers(ctx, getResearchersByIndustry(ctx, null)), [ctx]);
  const firstResource = getResourceByIndustry(ctx, ctx.balance.Industries?.[0]?.Id ?? '');
  const researchersWord = ctx.localization['gachapurchaseconfirmation.content.panel.go_researchers.txt_name'] ?? 'Researchers';
  const tradesWord = upperCaseFirstLetter(ctx.localization['conditionmodel.trade.plural'] ?? 'trades');

  return (
    <div ref={root} className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold">Production</h1>
        <p className="text-sm text-muted">
          Every generator, researcher and trade in one place. Levels you set here are the same ones the mission calculators use.
        </p>
      </div>

      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List aria-label="Production sections" className={TAB_LIST}>
          <Tabs.Trigger value="generators" className={TAB_TRIGGER}>
            {firstResource && <img src={assets.iconUrl(`${firstResource.Id}.png`)} alt="" className="size-5 object-contain" />}
            Generators
          </Tabs.Trigger>
          <Tabs.Trigger value="researchers" className={TAB_TRIGGER}>
            <img src={assets.active('shared/card.png')} alt="" className="size-5 object-contain" />
            {researchersWord}
          </Tabs.Trigger>
          <Tabs.Trigger value="trades" className={TAB_TRIGGER}>
            <img src={assets.active('shared/comrades_per_second.png')} alt="" className="size-5 object-contain" />
            {tradesWord}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="generators" className="pt-4">
          <AllGenerators />
        </Tabs.Content>
        <Tabs.Content value="researchers" className="pt-4">
          <div className="space-y-3">
            <ResearcherBulkActions researchers={researchers} word={researchersWord} />
            <ResearcherGrid researchers={researchers} propaganda label={researchersWord} />
          </div>
        </Tabs.Content>
        <Tabs.Content value="trades" className="pt-4">
          <TradesPanel fields={tradeFields} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
