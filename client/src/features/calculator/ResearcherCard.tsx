import * as Popover from '@radix-ui/react-popover';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { amountValue, formatAmount, stepDirection } from '@/domain/inputSteps';
import { EFFECT_ICON, firstGuaranteedText, nextLevelCost } from '@/domain/researcherInfo';
import { researcherName } from '@/domain/gameText';
import { researcherCornerIcons, researcherDetails, researcherMaxLevel, researcherValueLabel } from '@/domain/researchers';
import type { Researcher } from '@/domain/types';
import { useSearchParam } from '@/state/navigation';
import { useSession } from '@/state/store';
import { inputClass as fieldClass } from '@/ui/inputStyles';
import { useResearcherActions } from './useResearcherActions';

/**
 * Fallback rarity backgrounds, for game data without a palette. With one, the card uses the game's own rarity colour
 * (`palette.rarity`), whatever the page theme.
 */
const RARITY_CLASS: Readonly<Record<string, string>> = {
  Common: 'bg-stone-300 dark:bg-stone-600',
  LteCommon: 'bg-stone-300 dark:bg-stone-600',
  Rare: 'bg-yellow-100 dark:bg-yellow-900',
  LteRare: 'bg-sky-200 dark:bg-sky-900',
  Epic: 'bg-purple-300 dark:bg-purple-900',
  Supreme: 'bg-pink-200 dark:bg-pink-900'
};

/** Rarity sets the border colour, as in the game; every border is solid. */
const RARITY_BORDER: Readonly<Record<string, string>> = {
  Common: 'border-line',
  LteCommon: 'border-line',
  Rare: 'border-orange-500',
  LteRare: 'border-orange-500',
  Epic: 'border-purple-500',
  Supreme: 'border-red-500'
};

const stepButton =
  'flex size-control shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink enabled:hover:bg-raised disabled:opacity-40';
const cornerIcon = 'absolute top-0 size-5 bg-black/50 object-contain p-px';

/** The level field. It follows the same number rules as every field: fractions round, and leaving it tidies the text. */
function LevelInput({ researcher, level, max, label }: { researcher: Researcher; level: number; max: number | null; label: string }) {
  const { setLevel } = useResearcherActions();
  const { title } = useSession();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? formatAmount(level, title.powers);
  const clamp = (value: number) => Math.min(Math.max(value, 0), max ?? Number.MAX_SAFE_INTEGER);

  const commit = (text: string) => {
    setDraft(text);
    const value = amountValue(text, title.powers);
    if (Number.isFinite(value) && value >= 0) {
      setLevel(researcher, clamp(value));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-label={label}
      value={shown}
      aria-invalid={draft !== null && !(amountValue(draft, title.powers) >= 0) ? true : undefined}
      onChange={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          setDraft(null);
        }
        const direction = stepDirection(event);
        if (direction !== 0) {
          event.preventDefault();
          setDraft(null);
          setLevel(researcher, clamp(level + direction));
        }
      }}
      onFocus={(event) => event.target.select()}
      onBlur={() => setDraft(null)}
      className={`${fieldClass} w-control px-0.5 text-center pointer-fine:w-11`}
    />
  );
}

/** The level as a bar under the portrait: `level / max`, filled by how far along it is. Without a maximum, no fill. */
function LevelBar({ level, max }: { level: number; max: number | null }) {
  const { title } = useSession();
  const share = max ? Math.min(level / max, 1) : 0;
  return (
    <div className="relative h-5 overflow-hidden rounded-md bg-raised" role="presentation">
      <span aria-hidden className="absolute inset-y-0 left-0 bg-success/40" style={{ width: `${share * 100}%` }} />
      <span data-testid="researcher-level" className="relative block text-center text-xs leading-5 font-semibold tabular-nums">
        {max === null ? formatAmount(level, title.powers) : `${formatAmount(level, title.powers)} / ${formatAmount(max, title.powers)}`}
      </span>
    </div>
  );
}

/** What the next level costs, on one line after "To next:", or that the researcher is not owned or maxed. */
function NextCost({ researcher, level, max }: { researcher: Researcher; level: number; max: number | null }) {
  const { text: ctx, assets } = useSession();
  const powers = ctx.title.powers;
  if (max !== null && level >= max) {
    return <p className="text-xs text-muted">Max level</p>;
  }
  const cost = nextLevelCost(ctx.balance, researcher, level);
  if (!cost) {
    return <p className="text-xs text-muted">Not owned yet</p>;
  }
  const scienceIcon = assets.active(ctx.mode === 'evergreen' ? 'main/darkscience.png' : 'event/darkscience.png');
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-xs" aria-label="Cost of the next level">
      <span className="text-muted">To next:</span>
      <span className="inline-flex items-center gap-0.5 whitespace-nowrap" data-testid="next-cost-cards">
        <img src={assets.active('shared/card.png')} alt="Cards" className="size-4 object-contain" />
        {formatAmount(cost.cards, powers)}
      </span>
      <span className="inline-flex items-center gap-0.5 whitespace-nowrap" data-testid="next-cost-science">
        <img src={scienceIcon} alt="Science" className="size-4 object-contain" />
        {formatAmount(cost.science, powers)}
      </span>
    </p>
  );
}

/**
 * A researcher card. Left: the portrait (industry icon top left, generator icon top right), which opens the details,
 * with the level bar under it. Middle: name, rarity, current effect and the next level's cost. Right: plus, the level
 * field and minus, top to bottom.
 */
export function ResearcherCard({ researcher }: { researcher: Researcher }) {
  const session = useSession();
  const { text: ctx, assets, form, abGroups } = session;
  const { setLevel } = useResearcherActions();
  const card = useRef<HTMLLIElement>(null);
  const highlighted = useSearchParam('researcher') === researcher.Id;

  // Game View's card button lands here.
  useEffect(() => {
    if (highlighted) {
      requestAnimationFrame(() => card.current?.scrollIntoView({ block: 'center' }));
    }
  }, [highlighted]);

  const name = researcherName(ctx, researcher);
  const level = form.ResearcherLevels[researcher.Id] ?? 0;
  const max = researcherMaxLevel(ctx.balance, researcher);
  const label = researcherValueLabel(ctx, researcher, level);
  const corners = researcherCornerIcons(ctx, assets, researcher);
  const effectIcon = EFFECT_ICON[researcher.ModType];
  const rarity = researcher.Rarity ?? '';
  const rarityName = ctx.localization[`researcher.rarity.${rarity.toLowerCase()}.name`] ?? rarity;
  const gameRarityColour = session.palette?.rarity?.[rarity]?.main;
  const details = useMemo(() => researcherDetails(ctx, researcher, abGroups), [ctx, researcher, abGroups]);
  const guaranteed = firstGuaranteedText(ctx, details.firstGuaranteed, abGroups);
  const quote = ctx.title.isAges ? undefined : ctx.localization[`researcher.${researcher.Id}.flavor`];

  return (
    <li
      ref={card}
      className={`flex min-w-0 items-stretch gap-2 rounded-xl border-2 bg-surface p-1 ${RARITY_BORDER[rarity] ?? 'border-line'} ${highlighted ? 'ring-2 ring-accent' : ''}`}
    >
      <div className="flex w-[5.6rem] shrink-0 flex-col gap-1 pointer-fine:w-[4.8rem]">
        <Popover.Root>
          <Popover.Trigger
            tabIndex={-1}
            aria-label={`Details for ${name}`}
            data-testid="researcher-portrait"
            className={`relative aspect-[4/5] w-full overflow-hidden rounded-lg hover:brightness-110 data-[state=open]:ring-2 data-[state=open]:ring-accent ${gameRarityColour ? '' : (RARITY_CLASS[rarity] ?? 'bg-raised')}`}
            style={gameRarityColour ? { backgroundColor: gameRarityColour } : undefined}
          >
            {/* The art is stored square but drawn narrower in the game, so it is squeezed to 4:5, not cropped. */}
            <img src={assets.iconUrl(`${researcher.Id}.png`)} alt="" loading="lazy" className="h-full w-full object-fill" />
            {corners.industry && <img src={corners.industry} alt="" loading="lazy" data-testid="industry-icon" className={`${cornerIcon} left-0 rounded-br-md`} />}
            {corners.generator && <img src={corners.generator} alt="" loading="lazy" data-testid="generator-icon" className={`${cornerIcon} right-0 rounded-bl-md`} />}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content sideOffset={4} collisionPadding={8} className="z-40 max-w-xs space-y-1 rounded-lg border border-line bg-surface p-3 text-sm shadow-lg">
              <p className="font-semibold">{name}</p>
              <p>Unlocks at Rank {details.unlockRank}</p>
              {guaranteed && <p>{guaranteed}</p>}
              {quote && <p className="text-muted italic">&ldquo;{quote}&rdquo;</p>}
              <Popover.Arrow className="fill-surface" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <LevelBar level={level} max={max} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-0.5">
        <p className="text-sm leading-tight font-medium break-words" title={name}>
          {name}
        </p>
        <p className="text-xs text-muted" data-testid="researcher-rarity">
          {rarityName}
        </p>
        <p className="flex min-h-4 min-w-0 items-center gap-1 text-xs">
          {effectIcon && <img src={assets.active(`shared/${effectIcon}`)} alt="" className="size-4 shrink-0 object-contain" />}
          <span className="min-w-0 truncate" aria-label={label.value ? `Value ${label.value}` : undefined}>
            {label.value || 'No effect yet'}
          </span>
        </p>
        <div className="mt-auto">
          <NextCost researcher={researcher} level={level} max={max} />
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center justify-between gap-1">
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Raise ${name}`}
          disabled={max !== null && level >= max}
          onClick={() => setLevel(researcher, level + 1)}
          className={stepButton}
        >
          <Plus aria-hidden size={16} />
        </button>
        <LevelInput researcher={researcher} level={level} max={max} label={`Level of ${name}${max ? `, 0 to ${max}` : ''}`} />
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Lower ${name}`}
          disabled={level <= 0}
          onClick={() => setLevel(researcher, level - 1)}
          className={stepButton}
        >
          <Minus aria-hidden size={16} />
        </button>
      </div>
    </li>
  );
}
