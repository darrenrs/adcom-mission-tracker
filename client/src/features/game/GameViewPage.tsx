import * as Popover from '@radix-ui/react-popover';
import { Info, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { bigNum, shortBigNum } from '@/domain/format';
import { formatAmount } from '@/domain/inputSteps';
import { formatCycleTime, hasActiveResearcher } from '@/domain/generatorInfo';
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

/**
 * One stock: its title, icon, amount and a footer line. On phones the icon sits in the title row so the field gets the
 * whole box width; from 640px up it sits beside the field. With `open`, the icon is a shortcut: on phones the whole
 * title row is the button, so it keeps a 44px tap target. The three boxes share the section's three rows (a subgrid), so
 * titles, fields and footers line up even when one title wraps.
 */
function Stock({
  title,
  iconSrc,
  open,
  footer,
  children
}: {
  title: string;
  iconSrc: string;
  open?: { label: string; action: () => void };
  footer?: ReactNode;
  children: ReactNode;
}) {
  const text = (
    <span data-testid="stock-title" className="min-w-0 text-center text-sm leading-snug font-medium break-words tabular-nums sm:truncate">
      {title}
    </span>
  );
  const image = (size: string) => <img src={iconSrc} alt="" width={32} height={32} className={`${size} shrink-0 object-contain`} />;
  const shortcut = { type: 'button' as const, tabIndex: -1, 'aria-label': open?.label, title: open?.label, onClick: open?.action };

  return (
    <div className={`row-span-3 grid min-w-0 grid-rows-subgrid items-center gap-y-0.5 p-1 sm:p-1.5 ${box}`}>
      {open ? (
        // One cell of the subgrid: the phone button and the wider screens' plain title take turns.
        <div className="min-w-0">
          <button {...shortcut} className="flex min-h-control w-full items-center justify-center gap-1 rounded-lg hover:bg-raised sm:hidden">
            {image('size-5')}
            {text}
          </button>
          <p className="hidden justify-center sm:flex">{text}</p>
        </div>
      ) : (
        <p className="flex items-center justify-center gap-1">
          <span className="flex shrink-0 sm:hidden">{image('size-5')}</span>
          {text}
        </p>
      )}
      <div className="flex items-center gap-1">
        {open ? (
          <button {...shortcut} className="hidden min-h-control shrink-0 items-center rounded-lg hover:bg-raised sm:flex">
            {image('size-8')}
          </button>
        ) : (
          <span className="hidden shrink-0 sm:flex">{image('size-8')}</span>
        )}
        {children}
      </div>
      <p data-testid="stock-footer" className="min-h-4 text-center text-xs leading-4 text-muted tabular-nums">
        {footer}
      </p>
    </div>
  );
}

function Stocks() {
  const { text: ctx, assets, form, title, mode } = useSession();
  const updateForm = useTracker((state) => state.updateForm);
  const { powers } = title;
  const comrades = String(resourceName(ctx, 'comrade'));
  const science = String(resourceName(ctx, mode === 'evergreen' ? 'scientist' : 'darkscience'));
  // AdCom calls it Gold, Ages calls it Gems; both use the `gold` resource.
  const gold = resourceName(ctx, 'gold') ?? 'Gold';
  const scienceIcon = assets.active(mode === 'evergreen' ? 'main/darkscience.png' : 'event/darkscience.png');
  // Narrow side padding, so the longest amount ("999.99 AAAAA") fits the box on a 360px phone at the normal width.
  const input = 'w-full min-w-0 flex-1 px-0.5 text-center sm:px-1';

  return (
    <section aria-label="Stocks" className="grid grid-cols-3 grid-rows-[auto_auto_auto] gap-x-1 gap-y-0 sm:gap-x-2">
      <Stock
        title={comrades}
        iconSrc={assets.iconUrl('comrade.png')}
        open={{ label: 'Open Trades', action: () => navigate({ view: 'production', tab: 'trades' }) }}
        footer={`${shortBigNum(form.Trades.TotalComrades, powers)}/sec`}
      >
        <AmountInput
          label={comrades}
          powers={powers}
          value={form.Counts['comrade']?.['comrade'] ?? 0}
          onValue={(value) => updateForm((next) => applyCount(next, 'comrade', COMRADES_KEY, value, Date.now()))}
          className={input}
        />
      </Stock>
      <Stock title={science} iconSrc={scienceIcon}>
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
      </Stock>
      <Stock title={gold} iconSrc={assets.active('shared/gold.png')}>
        <AmountInput
          label={gold}
          powers={powers}
          value={form.Counts['gold']?.['gold'] ?? 0}
          onValue={(value) =>
            updateForm((next) => {
              next.Counts['gold'] = { ...next.Counts['gold'], gold: value };
            })
          }
          className={input}
        />
      </Stock>
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
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-raised/60 active:bg-raised"
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
          className="flex min-h-11 min-w-12 shrink-0 items-center justify-center rounded-lg pr-1 hover:bg-raised"
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
          shown={`${formatAmount(progress, powers)} / ${formatAmount(goal, powers)}`}
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
      {/* Industries stay in the game's order; the active one widens to hold its amount, so the field moves with it. */}
      <ul aria-label="Industries" className={`flex items-center gap-0.5 p-1 ${box}`}>
        {industries.map((industry) =>
          industry.Id === activeId ? (
            <li key={industry.Id} data-testid="active-resource" className="mx-1 flex min-w-0 flex-1 items-center gap-1 first:ml-0 last:mr-0">
              {iconButton(industry.Id, true)}
              {active && (
                <AmountInput
                  label={`${String(resourceName(ctx, active.Id))} amount`}
                  powers={title.powers}
                  value={form.Counts[active.Id]?.[active.Id] ?? 0}
                  onValue={(value) => updateForm((next) => applyCount(next, active.Id, RESOURCE_KEY, value, Date.now()))}
                  className="w-full min-w-0 flex-1 px-1 text-left sm:px-2"
                />
              )}
            </li>
          ) : (
            <li key={industry.Id} className="shrink-0">
              {iconButton(industry.Id, false)}
            </li>
          )
        )}
      </ul>
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

/** From this cycle time a running bar counts down each cycle; shorter ones show their cycle time, which would only blur. */
const COUNTDOWN_FROM_SECONDS = 1;

/** One run of the bar that the player started by tapping an idle generator. `id` restarts it on a second tap. */
interface ManualRun {
  id: number;
  seconds: number;
}

/** Whole seconds left in the cycle, rounded up as a game timer does, so a 5s cycle reads 5s, 4s … 1s. */
function secondsLeft(cycleSeconds: number, elapsedSeconds: number): number {
  return Math.max(1, Math.ceil(cycleSeconds - (elapsedSeconds % cycleSeconds) - 1e-9));
}

/**
 * Counts a timer down from `seconds`, once (a manual run) or every cycle (a running generator), in step with the bar's
 * fill, which starts at the same moment. Null when nothing is counting.
 */
function useCountdown(seconds: number, active: boolean, repeat: boolean, restartKey: number, onDone: () => void): number | null {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!active || !(seconds > 0) || !Number.isFinite(seconds)) {
      setLeft(null);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      if (!repeat && elapsed >= seconds) {
        setLeft(null);
        onDone();
        return;
      }
      setLeft(secondsLeft(seconds, elapsed));
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [seconds, active, repeat, restartKey]);
  return left;
}

function CycleBar({
  tier,
  details,
  count,
  manual,
  onManualDone
}: {
  tier: Tier | undefined;
  details: ReturnType<typeof generatorDetails>;
  count: number;
  manual: ManualRun | null;
  onManualDone: () => void;
}) {
  const { title } = useSession();
  const { powers } = title;
  const running = count > 0 && tier !== undefined && Number.isFinite(tier.cycleSeconds);
  const seconds = tier?.cycleSeconds ?? 0;
  const fast = running && seconds < FAST_CYCLE_SECONDS;
  const perCycle = (tier?.outputPerCycle ?? 0) * count;
  const crits = (tier?.critChance ?? 0) > 0;
  const manualRun = !running && manual !== null;
  const countsDown = running && seconds >= COUNTDOWN_FROM_SECONDS;
  const runningLeft = useCountdown(seconds, countsDown, true, 0, () => undefined);
  const manualLeft = useCountdown(manual?.seconds ?? 0, manualRun, false, manual?.id ?? 0, onManualDone);

  // The timer always shows: a countdown while a long cycle runs or a manual run is going, otherwise the cycle time.
  let timer = formatCycleTime(running ? seconds : details.output.cycleSeconds, powers);
  if (countsDown && runningLeft !== null) {
    timer = formatCycleTime(runningLeft, powers);
  } else if (manualRun && manualLeft !== null && (manual?.seconds ?? 0) >= COUNTDOWN_FROM_SECONDS) {
    timer = formatCycleTime(manualLeft, powers);
  }

  return (
    <div className="relative flex h-control min-w-0 items-center justify-between gap-2 overflow-hidden rounded-lg bg-raised px-2 text-sm font-semibold">
      {running && (
        <span
          // A new cycle time restarts the fill, together with the countdown.
          key={seconds}
          aria-hidden
          data-testid="generator-bar"
          className={`absolute inset-0 bg-success/30 ${fast ? '' : 'generator-bar'}`}
          style={fast ? undefined : { animationDuration: `${seconds}s` }}
        />
      )}
      {manualRun && manual && (
        <span
          key={manual.id}
          aria-hidden
          data-testid="generator-bar"
          className="absolute inset-0 bg-success/30"
          style={{ transformOrigin: 'left', animation: `generator-cycle ${manual.seconds}s linear 1 forwards` }}
        />
      )}
      <span data-testid="generator-timer" className="relative tabular-nums">
        {timer}
      </span>
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
          <img src={assets.iconUrl(`${researcherId}.png`)} alt="" className="aspect-[4/5] h-20 rounded-lg object-fill" />
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

  // Two rows on one grid: the picture and its bar, then the count, the name box and the card button. Row one is the
  // height of an active mission's progress bar; row two's three boxes share one height and line up under row one.
  return (
    <li className={`mb-1.5 grid grid-cols-[7rem_minmax(0,1fr)_auto] items-stretch gap-x-2 gap-y-1 p-1.5 sm:grid-cols-[8rem_minmax(0,1fr)_auto] ${box}`}>
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Run ${name} once`}
        onClick={runOnce}
        className="flex h-control items-center justify-center rounded-lg"
      >
        <img src={details.iconUrl} alt="" width={40} height={40} className="size-control rounded-full bg-raised object-contain p-0.5" />
      </button>
      <div className="col-span-2 min-w-0">
        <CycleBar tier={tier} details={details} count={count} manual={manual} onManualDone={() => setManual(null)} />
      </div>

      <AmountInput
        label={`number of ${name}`}
        powers={title.powers}
        value={count}
        onValue={(value) => updateForm((next) => applyCount(next, resourceId, generatorKey(generator.Id), value, Date.now()))}
        className="h-auto! min-h-control w-full px-1 text-center"
      />
      {/* The name box opens the details panel below; the (i) after the name says so. */}
      <button
        type="button"
        tabIndex={-1}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-control min-w-0 items-center justify-center gap-1.5 rounded-lg border border-success/30 bg-success-soft px-2 text-center text-sm leading-tight font-semibold break-words hover:border-success/60 aria-expanded:border-success/60 ${automator ? '' : 'col-span-2'}`}
      >
        <span className="min-w-0">
          {name} - Tier {tierNumber}
          <span className="sr-only"> details</span>
        </span>
        <Info aria-hidden size={16} className="shrink-0 text-muted" />
      </button>
      {automator && <CardPopover researcherId={automator.id} name={automator.name} />}

      {open && (
        <div className="col-span-3 mt-0.5 border-t border-line pt-1.5">
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
    <section aria-labelledby="generators-heading" className="mt-3 space-y-1.5">
      <h2 id="generators-heading" className={HEADING}>
        Generators
      </h2>
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
    </section>
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
