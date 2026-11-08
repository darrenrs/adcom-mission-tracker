import * as Popover from '@radix-ui/react-popover';
import { Info, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { bigNum, shortBigNum } from '@/domain/format';
import { hasActiveResearcher } from '@/domain/generatorInfo';
import { describeMission, getResourceByIndustry, resourceName } from '@/domain/gameText';
import type { BoardMission } from '@/domain/missions';
import { inMissionOrder, missionIconUrl, missionRequirement, missionRewardIcon, missionTone } from '@/domain/missionView';
import {
  generatorDetails,
  getPropagandaBoost,
  industryGenerators,
  researcherMaxLevel,
  researcherValueLabel
} from '@/domain/researchers';
import type { Generator } from '@/domain/types';
import { industryTiers, type Tier } from '@/engine/model';
import { applyCount, COMRADES_KEY, generatorKey, RESOURCE_KEY } from '@/features/calculator/fields';
import { GeneratorInfo } from '@/features/calculator/GeneratorInfo';
import { useResearcherActions } from '@/features/calculator/useResearcherActions';
import { Banners } from '@/features/missions/Banners';
import { TONE_CLASS } from '@/features/missions/MissionRow';
import { RewardButton } from '@/features/missions/RewardButton';
import { navigate } from '@/state/navigation';
import { useSession, useTracker } from '@/state/store';
import { AmountInput } from './AmountInput';
import { EditableAmount } from './EditableAmount';
import { isLinkedProgress, missionGoal, readProgress, writeLinkedProgress } from './missionProgress';

/** The icon of what a researcher's value does, as the researcher cards show it. */
const EFFECT_ICON: Readonly<Record<string, string>> = {
  GenManagerAndSpeedMult: 'speed.png',
  GeneratorPayoutMultiplier: 'boost_power.png',
  GeneratorCostReduction: 'discount.png',
  GeneratorCritChance: 'crit_chance.png',
  GeneratorCritPowerMult: 'crit_power.png',
  TradePayoutMultiplier: 'comrades_per_second.png'
};

/** The mission tones with their uneven left stripe taken off, so the margins match on every side. */
const EVEN_TONE: Record<keyof typeof TONE_CLASS, string> = Object.fromEntries(
  Object.entries(TONE_CLASS).map(([tone, classes]) => [tone, classes.replace(/\bborder-l-\S+/g, '').trim()])
) as Record<keyof typeof TONE_CLASS, string>;

const box = 'rounded-xl border border-line bg-surface';
const SCIENCE = 'science';
const HEADING = 'mb-1 text-sm font-semibold tracking-wide text-muted uppercase';

function Stocks() {
  const { text: ctx, assets, form, title, mode } = useSession();
  const updateForm = useTracker((state) => state.updateForm);
  const { powers } = title;
  const comrades = String(resourceName(ctx, 'comrade'));
  const science = String(resourceName(ctx, mode === 'evergreen' ? 'scientist' : 'darkscience'));
  const scienceIcon = assets.active(mode === 'evergreen' ? 'main/darkscience.png' : 'event/darkscience.png');
  const stock = `flex min-w-0 flex-col justify-center gap-0.5 p-1.5 ${box}`;
  const heading = 'truncate text-center text-xs leading-4 font-semibold text-muted tabular-nums';
  const line = 'flex items-center gap-1';
  const icon = 'size-6 shrink-0 object-contain sm:size-8';
  const input = 'flex-1 px-1 text-center';

  return (
    <section aria-label="Stocks" className="grid grid-cols-3 gap-2">
      <div className={stock}>
        <p data-testid="stock-title" className={heading}>
          {comrades} • {shortBigNum(form.Trades.TotalComrades, powers)}/sec
        </p>
        <div className={line}>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Open Trades"
            title="Open Trades"
            onClick={() => navigate({ view: 'production', tab: 'trades' })}
            className="flex min-h-control shrink-0 items-center rounded-lg hover:bg-raised"
          >
            <img src={assets.iconUrl('comrade.png')} alt="" width={32} height={32} className={icon} />
          </button>
          <AmountInput
            label={comrades}
            kind="comrades"
            powers={powers}
            value={form.Counts['comrade']?.['comrade'] ?? 0}
            onValue={(value) => updateForm((next) => applyCount(next, 'comrade', COMRADES_KEY, value, Date.now()))}
            className={input}
          />
        </div>
      </div>
      <div className={stock}>
        <p data-testid="stock-title" className={heading}>
          {science}
        </p>
        <div className={line}>
          <img src={scienceIcon} alt="" width={32} height={32} className={icon} />
          <AmountInput
            label={science}
            powers={powers}
            value={form.Counts[SCIENCE]?.[SCIENCE] ?? 0}
            onValue={(value) =>
              updateForm((next) => {
                next.Counts[SCIENCE] = { ...next.Counts[SCIENCE], [SCIENCE]: value };
              })
            }
            className={input}
          />
        </div>
      </div>
      <div className={stock}>
        <p data-testid="stock-title" className={heading}>
          Gold
        </p>
        <div className={line}>
          <img src={assets.active('shared/gold.png')} alt="" width={32} height={32} className={icon} />
          <AmountInput
            label="Gold"
            powers={powers}
            value={form.Counts['gold']?.['gold'] ?? 0}
            onValue={(value) =>
              updateForm((next) => {
                next.Counts['gold'] = { ...next.Counts['gold'], gold: value };
              })
            }
            className={input}
          />
        </div>
      </div>
    </section>
  );
}

function MissionCard({ mission }: { mission: BoardMission }) {
  const { text: ctx, assets, form, missionProgress, title } = useSession();
  const clickMission = useTracker((state) => state.clickMission);
  const updateForm = useTracker((state) => state.updateForm);
  const setMissionProgress = useTracker((state) => state.setMissionProgress);
  const { powers } = title;
  const description = useMemo(() => describeMission(ctx, mission), [ctx, mission]);
  const iconUrl = useMemo(() => missionIconUrl(description, assets), [description, assets]);
  const reward = useMemo(() => missionRewardIcon(mission, ctx.balance, assets), [mission, ctx.balance, assets]);
  const goal = missionGoal(mission);
  const progress = readProgress(ctx, form, missionProgress, mission);

  const setProgress = (value: number) => {
    if (isLinkedProgress(ctx, mission)) {
      updateForm((next) => void writeLinkedProgress(ctx, next, mission, value, Date.now()));
    } else {
      setMissionProgress(mission.Id, value);
    }
  };

  return (
    <li className={`flex w-full min-w-0 flex-col rounded-lg border sm:w-[calc((100%-1rem)/3)] ${EVEN_TONE[missionTone(mission)]}`}>
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => clickMission(mission.Id)}
          tabIndex={-1}
          className="flex min-h-control min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-raised/60 active:bg-raised"
        >
          {iconUrl && <img src={iconUrl} alt="" width={32} height={32} loading="lazy" className="size-8 shrink-0 object-contain" />}
          <span className="min-w-0 flex-1 text-sm leading-snug font-medium break-words">
            <span className="sr-only">Complete mission: {description.text}</span>
            <span aria-hidden>{missionRequirement(description.text)}</span>
          </span>
        </button>
        <RewardButton
          mission={mission}
          name={description.text}
          reward={reward}
          className="flex min-h-control min-w-control shrink-0 items-center justify-center rounded-lg hover:bg-raised"
        />
      </div>

      <div className="relative mx-1.5 mb-1.5 overflow-hidden rounded-lg bg-raised">
        <span aria-hidden className="absolute inset-y-0 left-0 bg-success/30" style={{ width: `${Math.min(Math.max(progress / goal, 0), 1) * 100}%` }} />
        <EditableAmount
          // Typed progress may go negative to stand in for another goal; Own missions edit real generator counts.
          allowNegative={!isLinkedProgress(ctx, mission)}
          label={`progress of ${description.text}`}
          value={progress}
          onValue={setProgress}
          powers={powers}
          shown={`${bigNum(progress, powers)} / ${bigNum(goal, powers)}`}
          className="relative"
        />
      </div>
    </li>
  );
}

function CurrentMissions() {
  const { board } = useSession();
  const missions = inMissionOrder(board.current);

  if (missions.length === 0) {
    return (
      <section aria-labelledby="missions-heading" className="mt-3">
        <h2 id="missions-heading" className={HEADING}>
          Active Missions
        </h2>
        <p className={`p-3 text-sm text-muted ${box}`}>No current missions.</p>
      </section>
    );
  }
  return (
    <section aria-labelledby="missions-heading" className="mt-3">
      <h2 id="missions-heading" className={HEADING}>
        Active Missions
      </h2>
      <ul aria-label="Current missions" className="flex flex-wrap justify-center gap-1.5">
        {missions.map((mission) => (
          <MissionCard key={mission.Id} mission={mission} />
        ))}
      </ul>
    </section>
  );
}

function Resources({ activeId }: { activeId: string }) {
  const { text: ctx, assets, form, title } = useSession();
  const updateForm = useTracker((state) => state.updateForm);
  const setActiveIndustry = useTracker((state) => state.setActiveIndustry);
  const active = getResourceByIndustry(ctx, activeId);
  const industries = ctx.balance.Industries ?? [];
  const iconButton = (industryId: string, current: boolean) => {
    const resource = getResourceByIndustry(ctx, industryId);
    if (!resource) {
      return null;
    }
    const name = String(resourceName(ctx, resource.Id));
    return (
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Show ${name}`}
        aria-current={current ? 'true' : undefined}
        title={name}
        onClick={() => setActiveIndustry(industryId)}
        className="flex h-control w-9 items-center justify-center rounded-lg border border-transparent hover:bg-raised aria-[current=true]:border-line aria-[current=true]:bg-raised sm:w-control"
      >
        <img src={assets.iconUrl(`${resource.Id}.png`)} alt="" width={28} height={28} className="size-7 object-contain" />
      </button>
    );
  };

  return (
    <section aria-labelledby="resources-heading" className="mt-3">
      <h2 id="resources-heading" className={HEADING}>
        Resources
      </h2>
      <div className={`flex items-center gap-4 p-1 ${box}`}>
        <div data-testid="active-resource" className="flex min-w-0 flex-1 items-center gap-1">
          {iconButton(activeId, true)}
          {active && (
            <AmountInput
              label={`${String(resourceName(ctx, active.Id))} amount`}
              powers={title.powers}
              value={form.Counts[active.Id]?.[active.Id] ?? 0}
              onValue={(value) => updateForm((next) => applyCount(next, active.Id, RESOURCE_KEY, value, Date.now()))}
              className="flex-1 px-1 text-left sm:px-2"
            />
          )}
        </div>
        <ul aria-label="Industries" className="flex shrink-0 gap-0.5">
          {industries
            .filter((industry) => industry.Id !== activeId)
            .map((industry) => (
              <li key={industry.Id}>{iconButton(industry.Id, false)}</li>
            ))}
        </ul>
      </div>
    </section>
  );
}

function BoostRow() {
  const { text: ctx, assets, form } = useSession();
  const { setPropaganda } = useResearcherActions();
  const boost = getPropagandaBoost(ctx, assets);
  const on = Boolean(form.ResearcherLevels['PropagandaBoost']);

  return (
    <section aria-label="Boosts" className="flex items-stretch gap-2">
      <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line px-3 text-center text-sm text-muted">
        RevRushes coming soon
      </p>
      {boost && (
        <button
          type="button"
          tabIndex={-1}
          aria-pressed={on}
          aria-label={boost.name}
          onClick={() => setPropaganda(!on)}
          className={`group flex w-12 shrink-0 flex-col overflow-hidden text-sm font-semibold aria-pressed:border-success ${box}`}
        >
          <img src={on ? boost.onIconUrl : boost.offIconUrl} alt="" className="aspect-square w-full rounded-t-xl object-cover" />
          <span className="block w-full bg-raised py-0.5 text-center text-xs group-aria-pressed:bg-success-soft">
            {on ? `x${boost.power}` : 'Boost'}
          </span>
        </button>
      )}
    </section>
  );
}

/** Under this cycle time the bar would only flicker, so it stays full and the rate shows per second, as in the game. */
const FAST_CYCLE_SECONDS = 0.5;

/** One run of the bar that the player started by tapping an idle generator. `id` restarts it on a second tap. */
interface ManualRun {
  id: number;
  seconds: number;
}

function CycleBar({
  tier,
  details,
  count,
  manual
}: {
  tier: Tier | undefined;
  details: ReturnType<typeof generatorDetails>;
  count: number;
  manual: ManualRun | null;
}) {
  const { title } = useSession();
  const { powers } = title;
  const running = count > 0 && tier !== undefined && Number.isFinite(tier.cycleSeconds);
  const fast = running && (tier?.cycleSeconds ?? 0) < FAST_CYCLE_SECONDS;
  const seconds = tier?.cycleSeconds ?? 0;
  const perCycle = (tier?.outputPerCycle ?? 0) * count;
  const crits = (tier?.critChance ?? 0) > 0;

  return (
    <div className="relative flex h-8 items-center justify-between overflow-hidden rounded-lg bg-raised px-2 text-sm pointer-fine:h-6 font-semibold">
      {running && (
        <span
          aria-hidden
          data-testid="generator-bar"
          className={`absolute inset-0 bg-success/30 ${fast ? '' : 'generator-bar'}`}
          style={fast ? undefined : { animationDuration: `${seconds}s` }}
        />
      )}
      {!running && manual && (
        <span
          key={manual.id}
          aria-hidden
          data-testid="generator-bar"
          className="absolute inset-0 bg-success/30"
          style={{ transformOrigin: 'left', animation: `generator-cycle ${manual.seconds}s linear 1 forwards` }}
        />
      )}
      <span className="relative">{running ? '' : details.output.cycleText}</span>
      <span className="relative flex items-center gap-1 tabular-nums">
        <img src={details.output.iconUrl} alt="" width={20} height={20} className="size-5 object-contain" />
        {shortBigNum(fast ? perCycle / seconds : perCycle, powers)}
        {fast && '/sec'}
        {crits && '*'}
      </span>
    </div>
  );
}

/** The researcher card of a generator's automator, with buttons to change its level in place. */
function CardPopover({ researcherId, name }: { researcherId: string; name: string }) {
  const { text: ctx, assets, form, title } = useSession();
  const { powers } = title;
  const { setLevel } = useResearcherActions();
  const researcher = (ctx.balance.Researchers ?? []).find((candidate) => candidate.Id === researcherId);
  if (!researcher) {
    return null;
  }
  const level = form.ResearcherLevels[researcherId] ?? 0;
  const max = researcherMaxLevel(ctx.balance, researcher) ?? level;
  const value = researcherValueLabel(ctx, researcher, level).value;
  const effectIcon = EFFECT_ICON[researcher.ModType];
  const step = 'flex size-control items-center justify-center rounded-lg border border-line bg-surface hover:bg-raised disabled:opacity-40';

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          tabIndex={-1}
          aria-label={`${name}, level ${bigNum(level, powers)}. Show card`}
          className={`flex min-h-control min-w-14 shrink-0 items-center justify-center gap-1 text-sm font-semibold hover:bg-raised aria-expanded:bg-raised ${box}`}
        >
          <img src={assets.active('shared/card.png')} alt="" width={20} height={20} className="size-5 object-contain" />
          {bigNum(level, powers)}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          collisionPadding={8}
          aria-label={`${name} card`}
          className="z-50 flex w-52 max-w-[calc(100vw-1rem)] flex-col items-center gap-1.5 rounded-xl border border-line bg-surface p-2 text-center text-ink shadow-lg"
        >
          <img src={assets.iconUrl(`${researcherId}.png`)} alt="" width={80} height={80} className="size-20 rounded-lg object-contain" />
          <p className="text-sm font-semibold">
            {name}
            <br />
            <span data-testid="card-level">Level {bigNum(level, powers)}</span>
          </p>
          <p className="flex min-h-5 items-center gap-1 text-sm tabular-nums">
            {effectIcon && <img src={assets.active(`shared/${effectIcon}`)} alt="" width={20} height={20} className="size-5 object-contain" />}
            {value || 'No effect yet'}
          </p>
          <div className="flex gap-1.5">
            <button type="button" aria-label="Lower level" disabled={level <= 0} onClick={() => setLevel(researcher, Math.max(0, level - 1))} className={step}>
              <Minus aria-hidden size={18} />
            </button>
            <button type="button" aria-label="Raise level" disabled={level >= max} onClick={() => setLevel(researcher, Math.min(max, level + 1))} className={step}>
              <Plus aria-hidden size={18} />
            </button>
          </div>
          <Popover.Arrow className="fill-surface stroke-line" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function GeneratorRow({
  generator,
  resourceId,
  tier,
  tierNumber
}: {
  generator: Generator;
  resourceId: string;
  tier: Tier | undefined;
  tierNumber: number;
}) {
  const { text: ctx, assets, form, abGroups, title } = useSession();
  const updateForm = useTracker((state) => state.updateForm);
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState<ManualRun | null>(null);
  const name = String(resourceName(ctx, generator.Id));
  const details = generatorDetails(ctx, assets, generator, form, abGroups);
  const count = form.Counts[resourceId]?.[generator.Id] ?? 0;
  const automator = details.automator;
  const level = automator ? (form.ResearcherLevels[automator.id] ?? 0) : 0;
  const automated = tier !== undefined && Number.isFinite(tier.cycleSeconds);

  // A card level change ends the manual run, because the generator may now run on its own.
  useEffect(() => setManual(null), [level]);

  // Easter egg: an idle generator runs one cycle at its base time when its picture is tapped.
  const runOnce = () => {
    if (!automated) {
      setManual((previous) => ({ id: (previous?.id ?? 0) + 1, seconds: generator.BaseCompletionTime ?? 1 }));
    }
  };

  return (
    <li className={`mb-1.5 p-1.5 ${box}`}>
      <div className="flex items-center gap-2">
        <div className="flex w-20 shrink-0 flex-col items-center gap-0.5 sm:w-32 sm:flex-row sm:gap-1.5">
          <button type="button" tabIndex={-1} aria-label={`Run ${name} once`} onClick={runOnce} className="flex size-11 shrink-0 items-center justify-center rounded-full pointer-fine:size-10">
            <img src={details.iconUrl} alt="" width={40} height={40} className="size-10 rounded-full bg-raised object-contain p-0.5" />
          </button>
          <AmountInput
            label={`number of ${name}`}
            powers={title.powers}
            value={count}
            onValue={(value) => updateForm((next) => applyCount(next, resourceId, generatorKey(generator.Id), value, Date.now()))}
            className="w-full px-1 text-center"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <CycleBar tier={tier} details={details} count={count} manual={manual} />
          <div className="flex items-stretch gap-1.5">
            <p className="flex min-h-control min-w-0 flex-1 items-center justify-center rounded-lg border border-success/30 bg-success-soft px-2 text-center text-sm leading-tight font-semibold break-words">
              {name} - Tier {tierNumber}
            </p>
            {automator && <CardPopover researcherId={automator.id} name={automator.name} />}
            <button
              type="button"
              tabIndex={-1}
              aria-label={`${name} details`}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className={`flex size-control shrink-0 items-center justify-center text-muted hover:bg-raised hover:text-ink aria-expanded:bg-raised ${box}`}
            >
              <Info aria-hidden size={20} />
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="mt-1.5 border-t border-line pt-1.5">
          <GeneratorInfo generator={generator} />
        </div>
      )}
    </li>
  );
}

function Generators({ industryId }: { industryId: string }) {
  const { text: ctx, balance, form, assets } = useSession();
  const resource = getResourceByIndustry(ctx, industryId);
  const tiers = useMemo(() => industryTiers(balance, industryId, form), [balance, industryId, form]);

  if (!resource) {
    return null;
  }
  const researchersActive = hasActiveResearcher(ctx, industryId, form.ResearcherLevels);
  const anyCrits = tiers.some((tier) => tier.critChance > 0);

  return (
    <div className="mt-3 space-y-1.5">
      {(researchersActive || anyCrits) && (
        <div className="space-y-1 text-xs text-muted">
          {researchersActive && <p>Generator progress bars do not update values; only manual updating is supported.</p>}
          {anyCrits && (
            <p>
              Each generators&apos; visible output is the base value (not accounting for{' '}
              <img src={assets.active('shared/crit_chance.png')} alt="crits" width={14} height={14} className="inline size-3.5 align-text-bottom" />)
            </p>
          )}
        </div>
      )}
      <ul aria-label="Generators">
        {industryGenerators(ctx, industryId).map((generator, index) => (
          <GeneratorRow
            key={generator.Id}
            generator={generator}
            resourceId={resource.Id}
            tier={tiers.find((tier) => tier.id === generator.Id)}
            tierNumber={index + 1}
          />
        ))}
      </ul>
    </div>
  );
}

/** The player's game at a glance, laid out the way the game does. Only the generator bars move on their own. */
export function GameViewPage() {
  const session = useSession();
  const industries = session.balance.Industries ?? [];
  const activeId = industries.find((industry) => industry.Id === session.activeIndustry)?.Id ?? industries[0]?.Id;

  return (
    <div className="mx-auto max-w-5xl space-y-2">
      <Banners session={session} />
      <Stocks />
      <CurrentMissions />
      {activeId && <Resources activeId={activeId} />}
      <BoostRow />
      {activeId && <Generators industryId={activeId} />}
    </div>
  );
}
