import * as Tabs from '@radix-ui/react-tabs';
import { Calculator, Download } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getEta, getTimeStampLocaleString, upperCaseFirstLetter } from '@/domain/format';
import { getResourceByIndustry, resourceName } from '@/domain/gameText';
import { parseAmount } from '@/domain/inputSteps';
import { hasCalculator } from '@/domain/missionView';
import { getResearchersByIndustry, industryGenerators, sortResearchers } from '@/domain/researchers';
import type { Mission } from '@/domain/types';
import { buildCalculation, calculatorIndustryId, type CalculationOptions, type MissionCounts } from '@/engine/calculate';
import { requestCalculation } from '@/engine/client';
import { industryTiers } from '@/engine/model';
import { projectComrades, projectForward } from '@/engine/project';
import type { EtaRange } from '@/engine/simulate';
import { useSession, useTracker } from '@/state/store';
import { HelpTip } from '@/ui/HelpTip';
import { CalculatorOptions, type OptionsState } from './CalculatorOptions';
import { COMRADES_KEY, countsTimeStamp, CPS_KEY, generatorKey, importedText, PROGRESS_KEY, RESOURCE_KEY, isInvalidAmount } from './fields';
import { GeneratorsPanel } from './GeneratorsPanel';
import { ResearcherGrid } from './ResearcherGrid';
import { cycleProgress } from './timeLeft';
import { timeLeftCandidates, TimeLeftFields } from './TimeLeftFields';
import { TAB_LIST, TAB_TRIGGER } from './tabStyles';
import { TradesPanel } from './TradesPanel';
import { useCountFields } from './useCountFields';
import { useFieldKeyboard } from './useFieldKeyboard';
import { useTradeFields } from './useTradeFields';

type Outcome =
  | { kind: 'running' }
  | { kind: 'fix'; issues: number }
  | { kind: 'done'; seconds: number; range: EtaRange | null }
  | { kind: 'stuck' }
  | { kind: 'unsupported' }
  | { kind: 'failed'; message: string };

const primaryButton =
  'inline-flex min-h-control items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-white enabled:hover:opacity-90 disabled:opacity-50 dark:text-black';
const secondaryButton =
  'inline-flex min-h-control items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium enabled:hover:bg-raised disabled:opacity-50';

const SHOW_IMPORT = false;

const NO_CALCULATOR = 'This mission type has no calculator yet.';

export function MissionCalculator({ mission }: { mission: Mission }) {
  const { text: ctx } = useSession();
  const industryId = hasCalculator(mission) ? calculatorIndustryId(ctx, mission) : null;
  const resource = industryId ? getResourceByIndustry(ctx, industryId) : undefined;

  return (
    <section aria-labelledby="calculator-heading" className="space-y-1 rounded-xl border border-line bg-surface p-3 pointer-fine:p-2.5">
      <div className="flex items-center gap-1">
        <h2 id="calculator-heading" className="flex items-center gap-2 text-base font-semibold">
          <Calculator aria-hidden size={18} className="text-muted" />
          Calculator
        </h2>
        {industryId && resource && (
          <HelpTip label="Using the calculator">
            <p>
              Enter your generators, researchers and trades from the game, then press Calculate to see when this mission will finish. Your numbers
              are saved as you type.
            </p>
          </HelpTip>
        )}
      </div>
      {industryId && resource ? (
        <CalculatorBody key={mission.Id} mission={mission} industryId={industryId} resourceId={resource.Id} />
      ) : (
        <p className="text-sm text-muted">{NO_CALCULATOR}</p>
      )}
    </section>
  );
}

interface BodyProps {
  mission: Mission;
  industryId: string;
  resourceId: string;
}

function CalculatorBody({ mission, industryId, resourceId }: BodyProps) {
  const session = useSession();
  const saveEta = useTracker((state) => state.saveEta);
  const { text: ctx, assets, form } = session;
  const { powers } = ctx.title;

  const generators = useMemo(() => industryGenerators(ctx, industryId), [ctx, industryId]);
  const counts = useCountFields({ resourceId, generatorIds: generators.map((generator) => generator.Id), missionId: mission.Id });
  const tradeFields = useTradeFields();
  const [options, setOptions] = useState<OptionsState>({ mode: 'online', autobuy: false, comradesOnly: false });
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({});
  const [tab, setTab] = useState('generators');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const latestRun = useRef(0);
  const root = useRef<HTMLDivElement>(null);

  const isCollect = mission.Condition.ConditionType === 'ResourcesEarnedSinceSubscription';
  const isOwn = mission.Condition.ConditionType === 'ResourceQuantity';
  const online = options.mode === 'online';
  const comradesOnly = online && options.comradesOnly && isOwn;

  const researchers = useMemo(() => sortResearchers(ctx, getResearchersByIndustry(ctx, industryId)), [ctx, industryId]);
  const tiers = useMemo(() => industryTiers(ctx.balance, industryId, form), [ctx.balance, industryId, form]);
  const owned = (index: number) => parseAmount(counts.texts[generatorKey((tiers[index] as { id: string }).id)] ?? '', powers) > 0;
  const candidates = timeLeftCandidates(tiers, owned);

  // Anything the result was worked out from has changed, so a calculation still running is out of date.
  useEffect(() => {
    latestRun.current++;
    setOutcome(null);
  }, [counts.texts, options, timeLeft, form]);
  useEffect(
    () => () => {
      latestRun.current++;
    },
    []
  );

  const disabledKeys = useMemo(() => {
    if (!comradesOnly) {
      return new Set<string>();
    }
    const keep = generatorKey(mission.Condition.ConditionId);
    return new Set([...generators.map((generator) => generatorKey(generator.Id)).filter((key) => key !== keep), RESOURCE_KEY, PROGRESS_KEY]);
  }, [comradesOnly, generators, mission.Condition.ConditionId]);

  function calculate(texts: Readonly<Record<string, string>> = counts.latest.current) {
    const read = (key: string) => parseAmount(texts[key] ?? '', powers);
    const keys = [...generators.map((generator) => generatorKey(generator.Id)), RESOURCE_KEY, COMRADES_KEY, CPS_KEY, ...(isCollect ? [PROGRESS_KEY] : [])];
    const progress = tiers.map((tier, index) => {
      const text = candidates.includes(index) ? (timeLeft[tier.id] ?? '') : '';
      return cycleProgress(text, tier.cycleSeconds);
    });
    const issues =
      keys.filter((key) => isInvalidAmount(texts[key] ?? '', powers) && !disabledKeys.has(key)).length +
      progress.filter((entry) => entry.error !== null).length +
      Object.values(form.Trades.Resource).filter((trade) => trade?.IsInvalid).length;
    if (issues > 0) {
      setOutcome({ kind: 'fix', issues });
      return;
    }

    const missionCounts: MissionCounts = {
      generators: tiers.map((tier) => read(generatorKey(tier.id)) || 0),
      resource: read(RESOURCE_KEY) || 0,
      earned: isCollect ? read(PROGRESS_KEY) || 0 : 0,
      comrades: read(COMRADES_KEY) || 0,
      comradesPerSecond: read(CPS_KEY) || 0
    };
    const calculationOptions: CalculationOptions = {
      mode: options.mode,
      autobuy: online && options.autobuy,
      comradesOnly,
      progress: progress.map((entry) => entry.progress)
    };
    const input = buildCalculation(ctx, mission, resourceId, industryId, missionCounts, form, calculationOptions);
    if (!input) {
      setOutcome({ kind: 'unsupported' });
      return;
    }

    const run = ++latestRun.current;
    setOutcome({ kind: 'running' });
    requestCalculation(input).then(
      ({ seconds, range }) => {
        if (run !== latestRun.current) {
          return;
        }
        if (!Number.isFinite(seconds)) {
          setOutcome({ kind: 'stuck' });
          return;
        }
        saveEta(mission.Id, seconds);
        setOutcome({ kind: 'done', seconds, range });
      },
      (error: unknown) => {
        if (run === latestRun.current) {
          setOutcome({ kind: 'failed', message: error instanceof Error ? error.message : String(error) });
        }
      }
    );
  }

  const stamp = countsTimeStamp(form, resourceId);

  /** Moves the saved counts forward to now and puts them in the fields. Returns the new field texts. */
  function importCounts(): Record<string, string> | null {
    if (!stamp) {
      return null;
    }
    const saved = form.Counts[resourceId] ?? {};
    const now = Date.now();
    const start = [saved[resourceId] ?? 0, ...tiers.map((tier) => saved[tier.id] ?? 0)];
    const projected = projectForward(tiers, start, (now - stamp) / 1000);
    const comrades = form.Counts['comrade'];
    const comradeSeconds = (now - (comrades?.['TimeStamp'] ?? stamp)) / 1000;

    const next: Record<string, string> = {
      [RESOURCE_KEY]: importedText(projected[0] as number, powers),
      [COMRADES_KEY]: importedText(projectComrades(comrades?.['comrade'] ?? 0, form.Trades.TotalComrades, comradeSeconds), powers)
    };
    tiers.forEach((tier, index) => {
      next[generatorKey(tier.id)] = importedText(projected[index + 1] as number, powers);
    });
    if (isCollect) {
      next[PROGRESS_KEY] = importedText((saved['resourceProgress'] ?? 0) + (projected[0] as number) - start[0]!, powers);
    }
    counts.setMany(next);
    setTab('generators');
    return next;
  }

  useFieldKeyboard(root, {
    powers,
    setField: counts.setText,
    stepTrade: (resourceKey, delta, shown) => void tradeFields.step(resourceKey, delta, shown)
  });

  const comrade = String(resourceName(ctx, 'comrade'));
  const researchersWord = ctx.localization['gachapurchaseconfirmation.content.panel.go_researchers.txt_name'] ?? 'Researchers';
  const tradesWord = upperCaseFirstLetter(ctx.localization['conditionmodel.trade.plural'] ?? 'trades');
  const running = outcome?.kind === 'running';

  return (
    <div ref={root} className="space-y-2">
      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List aria-label="Calculator sections" className={TAB_LIST}>
          <Tabs.Trigger value="generators" className={TAB_TRIGGER}>
            <img src={assets.iconUrl(`${resourceId}.png`)} alt="" className="size-5 object-contain" />
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

        <Tabs.Content value="generators" className="space-y-2 pt-2">
          <GeneratorsPanel mission={mission} industryId={industryId} fields={counts} disabled={disabledKeys} />
          <TimeLeftFields
            ctx={ctx}
            tiers={tiers}
            candidates={candidates}
            texts={timeLeft}
            onChange={(id, text) => setTimeLeft((previous) => ({ ...previous, [id]: text }))}
          />
        </Tabs.Content>
        <Tabs.Content value="researchers" className="pt-2">
          <ResearcherGrid researchers={researchers} propaganda label={researchersWord} />
        </Tabs.Content>
        <Tabs.Content value="trades" className="pt-2">
          <TradesPanel fields={tradeFields} />
        </Tabs.Content>
      </Tabs.Root>

      <CalculatorOptions
        value={options}
        onChange={setOptions}
        comradeName={comrade}
        showComradesOnly={isOwn}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => calculate()} disabled={running} className={primaryButton}>
          {running ? 'Calculating…' : 'Calculate'}
        </button>
        {/* Import Counts is hidden for now. importCounts and its note stay so it can come back. */}
        {SHOW_IMPORT && (
          <button type="button" onClick={() => void importCounts()} disabled={!stamp} aria-describedby="import-note" className={secondaryButton}>
            <Download aria-hidden size={16} />
            Import Counts
          </button>
        )}
      </div>
      {SHOW_IMPORT && (
        <p id="import-note" className="text-xs text-muted">
          {stamp
            ? `Import Counts moves the numbers you saved on ${getTimeStampLocaleString(stamp)} forward to now.`
            : 'Import Counts is available once you have entered some counts.'}
        </p>
      )}

      <div role="status" aria-live="polite" className="min-h-5 text-sm">
        {outcome && <OutcomeText outcome={outcome} powers={powers} researchers={researchersWord.toLowerCase()} comrades={comrade.toLowerCase()} />}
      </div>
    </div>
  );
}

function OutcomeText({ outcome, powers, researchers, comrades }: { outcome: Outcome; powers: readonly string[]; researchers: string; comrades: string }) {
  switch (outcome.kind) {
    case 'running':
      return <p>Working out the ETA…</p>;
    case 'fix':
      return (
        <p className="text-danger">
          Please fix {outcome.issues} issue{outcome.issues > 1 ? 's' : ''}, and calculate again.
        </p>
      );
    case 'stuck':
      return (
        <p className="text-danger">
          This mission cannot finish with these inputs. Check your generators, {researchers} and {comrades}.
        </p>
      );
    case 'unsupported':
      return <p className="text-danger">This mission cannot be calculated from here.</p>;
    case 'failed':
      return <p className="text-danger">The calculation failed: {outcome.message}</p>;
    case 'done':
      return (
        <div className="space-y-0.5">
          <p className="text-base font-semibold">ETA: {getEta(outcome.seconds, powers)}</p>
          {outcome.range && getEta(outcome.range.low, powers) !== getEta(outcome.range.high, powers) && (
            <p className="text-muted">
              Likely between {getEta(outcome.range.low, powers)} and {getEta(outcome.range.high, powers)}
            </p>
          )}
        </div>
      );
  }
}
