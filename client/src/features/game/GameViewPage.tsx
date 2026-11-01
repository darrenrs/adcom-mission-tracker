import { Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { bigNum, shortBigNum } from '@/domain/format';
import { describeMission, getResourceByIndustry, resourceName } from '@/domain/gameText';
import type { BoardMission } from '@/domain/missions';
import { inMissionOrder, missionIconUrl, missionRequirement, missionRewardIcon, missionTone } from '@/domain/missionView';
import { generatorDetails, getPropagandaBoost, industryGenerators } from '@/domain/researchers';
import type { Generator } from '@/domain/types';
import { industryTiers, type Tier } from '@/engine/model';
import { applyCount, COMRADES_KEY, generatorKey, RESOURCE_KEY } from '@/features/calculator/fields';
import { GeneratorDetailsView } from '@/features/calculator/GeneratorDetailsView';
import { useResearcherActions } from '@/features/calculator/useResearcherActions';
import { Banners } from '@/features/missions/Banners';
import { TONE_CLASS } from '@/features/missions/MissionRow';
import { RewardButton } from '@/features/missions/RewardButton';
import { navigate } from '@/state/navigation';
import { useSession, useTracker } from '@/state/store';
import { AmountInput } from './AmountInput';
import { EditableAmount } from './EditableAmount';
import { isLinkedProgress, missionGoal, readProgress, writeLinkedProgress } from './missionProgress';

const box = 'rounded-xl border border-line bg-surface';
const SCIENCE = 'science';

function Stocks() {
  const { text: ctx, assets, form, title, mode } = useSession();
  const updateForm = useTracker((state) => state.updateForm);
  const { powers } = title;
  const comrades = String(resourceName(ctx, 'comrade'));
  const science = String(resourceName(ctx, mode === 'evergreen' ? 'scientist' : 'darkscience'));
  const scienceIcon = assets.active(mode === 'evergreen' ? 'main/darkscience.png' : 'event/darkscience.png');

  return (
    <section aria-label="Stocks" className="grid grid-cols-2 gap-2">
      <label className={`flex items-center gap-2 p-2 ${box}`}>
        <img src={assets.iconUrl('comrade.png')} alt="" width={32} height={32} className="size-8 shrink-0 object-contain" />
        <AmountInput
          label={comrades}
          kind="comrades"
          powers={powers}
          value={form.Counts['comrade']?.['comrade'] ?? 0}
          onValue={(value) => updateForm((next) => applyCount(next, 'comrade', COMRADES_KEY, value, Date.now()))}
          className="h-11 w-full"
        />
      </label>
      <label className={`flex items-center gap-2 p-2 ${box}`}>
        <img src={scienceIcon} alt="" width={32} height={32} className="size-8 shrink-0 object-contain" />
        <AmountInput
          label={science}
          powers={powers}
          value={form.Counts[SCIENCE]?.[SCIENCE] ?? 0}
          onValue={(value) =>
            updateForm((next) => {
              next.Counts[SCIENCE] = { ...next.Counts[SCIENCE], [SCIENCE]: value };
            })
          }
          className="h-11 w-full"
        />
      </label>
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
    <li className={`flex min-w-0 flex-col rounded-lg border border-l-4 ${TONE_CLASS[missionTone(mission)]}`}>
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => clickMission(mission.Id)}
          className="flex min-h-14 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-raised/60 active:bg-raised"
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
          className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-lg hover:bg-raised"
        />
      </div>

      <div className="relative mx-2 mb-2 overflow-hidden rounded-lg bg-raised">
        <span aria-hidden className="absolute inset-y-0 left-0 bg-success/30" style={{ width: `${Math.min(progress / goal, 1) * 100}%` }} />
        <EditableAmount
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
    return <p className={`p-3 text-sm text-muted ${box}`}>No current missions.</p>;
  }
  return (
    <ul aria-label="Current missions" className="grid gap-2 sm:grid-cols-3">
      {missions.map((mission) => (
        <MissionCard key={mission.Id} mission={mission} />
      ))}
    </ul>
  );
}

function IndustrySelector({ activeId }: { activeId: string }) {
  const { text: ctx, assets, form, title } = useSession();
  const updateForm = useTracker((state) => state.updateForm);
  const setActiveIndustry = useTracker((state) => state.setActiveIndustry);

  return (
    <ul aria-label="Industries" className="flex gap-1">
      {(ctx.balance.Industries ?? []).map((industry) => {
        const resource = getResourceByIndustry(ctx, industry.Id);
        if (!resource) {
          return null;
        }
        const name = String(resourceName(ctx, resource.Id));
        const icon = <img src={assets.iconUrl(`${resource.Id}.png`)} alt="" width={32} height={32} className="size-8 shrink-0 object-contain" />;

        if (industry.Id === activeId) {
          return (
            <li key={industry.Id} className={`flex min-w-0 flex-1 items-center gap-1 px-2 ${box}`} aria-current="true">
              {icon}
              <EditableAmount
                label={`${name} amount`}
                value={form.Counts[resource.Id]?.[resource.Id] ?? 0}
                onValue={(value) => updateForm((next) => applyCount(next, resource.Id, RESOURCE_KEY, value, Date.now()))}
                powers={title.powers}
                className="text-left text-base"
              />
            </li>
          );
        }
        return (
          <li key={industry.Id} className="shrink-0">
            <button
              type="button"
              aria-label={`Show ${name}`}
              title={name}
              onClick={() => setActiveIndustry(industry.Id)}
              className={`flex size-14 items-center justify-center hover:bg-raised ${box}`}
            >
              {icon}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function BoostRow() {
  const { text: ctx, assets, form } = useSession();
  const { setPropaganda } = useResearcherActions();
  const boost = getPropagandaBoost(ctx, assets);
  const on = Boolean(form.ResearcherLevels['PropagandaBoost']);

  return (
    <section aria-label="Boosts" className="flex items-stretch gap-2">
      <p className="flex min-h-14 flex-1 items-center justify-center rounded-xl border border-dashed border-line px-3 text-center text-sm text-muted">
        RevRushes coming soon
      </p>
      {boost && (
        <button
          type="button"
          aria-pressed={on}
          aria-label={boost.name}
          onClick={() => setPropaganda(!on)}
          className={`flex min-h-14 shrink-0 items-center gap-2 px-3 text-sm font-semibold aria-pressed:border-success aria-pressed:bg-success-soft ${box}`}
        >
          <img src={on ? boost.onIconUrl : boost.offIconUrl} alt="" width={32} height={32} className="size-8 object-contain" />
          x{boost.power} {on ? 'On' : 'Off'}
        </button>
      )}
    </section>
  );
}

/** Under this cycle time the bar would only flicker, so it stays full and the rate shows per second, as in the game. */
const FAST_CYCLE_SECONDS = 0.5;

function CycleBar({ tier, details, count }: { tier: Tier | undefined; details: ReturnType<typeof generatorDetails>; count: number }) {
  const { title } = useSession();
  const { powers } = title;
  const running = count > 0 && tier !== undefined && Number.isFinite(tier.cycleSeconds);
  const fast = running && (tier?.cycleSeconds ?? 0) < FAST_CYCLE_SECONDS;
  const seconds = tier?.cycleSeconds ?? 0;
  const perCycle = (tier?.outputPerCycle ?? 0) * count;

  return (
    <div className="relative flex h-9 items-center justify-between overflow-hidden rounded-lg bg-raised px-3 text-sm font-semibold">
      {running && (
        <span
          aria-hidden
          data-testid="generator-bar"
          className={`absolute inset-0 bg-success/30 ${fast ? '' : 'generator-bar'}`}
          style={fast ? undefined : { animationDuration: `${seconds}s` }}
        />
      )}
      <span className="relative">{running ? '' : details.output.cycleText}</span>
      <span className="relative flex items-center gap-1 tabular-nums">
        <img src={details.output.iconUrl} alt="" width={20} height={20} className="size-5 object-contain" />
        {shortBigNum(fast ? perCycle / seconds : perCycle, powers)}
        {fast && '/sec'}
      </span>
    </div>
  );
}

function GeneratorRow({ generator, resourceId, tier }: { generator: Generator; resourceId: string; tier: Tier | undefined }) {
  const { text: ctx, assets, form, abGroups, title } = useSession();
  const updateForm = useTracker((state) => state.updateForm);
  const [open, setOpen] = useState(false);
  const name = String(resourceName(ctx, generator.Id));
  const details = generatorDetails(ctx, assets, generator, form, abGroups);
  const count = form.Counts[resourceId]?.[generator.Id] ?? 0;
  const automator = details.automator;

  return (
    <li className={`p-2 ${box}`}>
      <div className="flex items-start gap-3">
        <div className="flex w-20 shrink-0 flex-col items-center">
          <img src={details.iconUrl} alt="" width={56} height={56} className="size-14 rounded-full bg-raised object-contain p-1" />
          <EditableAmount
            label={`number of ${name}`}
            value={count}
            onValue={(value) => updateForm((next) => applyCount(next, resourceId, generatorKey(generator.Id), value, Date.now()))}
            powers={title.powers}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <CycleBar tier={tier} details={details} count={count} />
          <div className="flex items-stretch gap-2">
            <p className="flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-lg border border-success/30 bg-success-soft px-2 text-center text-sm font-semibold break-words">
              {name}
            </p>
            {automator && (
              <button
                type="button"
                aria-label={`${automator.name}, level ${form.ResearcherLevels[automator.id] ?? 0}. Open researcher`}
                onClick={() => navigate({ view: 'production', researcher: automator.id })}
                className={`flex min-h-11 min-w-14 shrink-0 items-center justify-center gap-1 text-sm font-semibold hover:bg-raised ${box}`}
              >
                <img src={assets.active('shared/card.png')} alt="" width={20} height={20} className="size-5 object-contain" />
                {form.ResearcherLevels[automator.id] ?? 0}
              </button>
            )}
            <button
              type="button"
              aria-label={`${name} details`}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className={`flex size-11 shrink-0 items-center justify-center text-muted hover:bg-raised hover:text-ink aria-expanded:bg-raised ${box}`}
            >
              <Info aria-hidden size={20} />
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="mt-2 border-t border-line pt-2">
          <GeneratorDetailsView details={details} />
        </div>
      )}
    </li>
  );
}

function Generators({ industryId }: { industryId: string }) {
  const { text: ctx, balance, form } = useSession();
  const resource = getResourceByIndustry(ctx, industryId);
  const tiers = useMemo(() => industryTiers(balance, industryId, form), [balance, industryId, form]);

  if (!resource) {
    return null;
  }
  return (
    <ul aria-label="Generators" className="space-y-2">
      {industryGenerators(ctx, industryId).map((generator) => (
        <GeneratorRow
          key={generator.Id}
          generator={generator}
          resourceId={resource.Id}
          tier={tiers.find((tier) => tier.id === generator.Id)}
        />
      ))}
    </ul>
  );
}

/** The player's game at a glance, laid out the way the game does. Only the generator bars move on their own. */
export function GameViewPage() {
  const session = useSession();
  const industries = session.balance.Industries ?? [];
  const activeId = industries.find((industry) => industry.Id === session.activeIndustry)?.Id ?? industries[0]?.Id;

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <Banners session={session} />
      <Stocks />
      <CurrentMissions />
      {activeId && <IndustrySelector activeId={activeId} />}
      <BoostRow />
      {activeId && <Generators industryId={activeId} />}
    </div>
  );
}
