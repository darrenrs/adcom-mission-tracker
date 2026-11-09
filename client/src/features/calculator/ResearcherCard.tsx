import { Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { bigNum } from '@/domain/format';
import { EFFECT_ICON, firstGuaranteedText, nextLevelCost } from '@/domain/researcherInfo';
import { researcherName } from '@/domain/gameText';
import { stepDirection } from '@/domain/inputSteps';
import {
  getResearcherTargetIconUrl,
  researcherDetails,
  researcherMaxLevel,
  researcherValueLabel
} from '@/domain/researchers';
import type { Researcher } from '@/domain/types';
import { useSearchParam } from '@/state/navigation';
import { useSession } from '@/state/store';
import { InfoPopover } from '@/ui/InfoPopover';
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
const inputClass = `${fieldClass} w-12 px-1 text-center pointer-fine:w-11`;

function LevelInput({ researcher, level, max, label }: { researcher: Researcher; level: number; max: number | null; label: string }) {
  const { setLevel } = useResearcherActions();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (level > 0 ? String(level) : '0');

  const commit = (text: string) => {
    const typed = text.replace(/[^\d]/g, '');
    const clamped = typed === '' ? 0 : Math.min(Number(typed), max ?? Number.MAX_SAFE_INTEGER);
    setDraft(typed === '' ? '' : String(clamped));
    setLevel(researcher, clamped);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-label={label}
      value={shown}
      onChange={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        const direction = stepDirection(event);
        if (direction !== 0) {
          event.preventDefault();
          setDraft(null);
          setLevel(researcher, Math.min(Math.max(level + direction, 0), max ?? Number.MAX_SAFE_INTEGER));
        }
      }}
      onFocus={(event) => event.target.select()}
      onBlur={() => setDraft(null)}
      className={inputClass}
    />
  );
}

/** What the next level costs: cards and science (dark science in events), or that there is nothing left to buy. */
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
    <div>
      <p className="text-[11px] leading-3 text-muted">To next:</p>
      <p className="flex items-center gap-x-2 text-xs whitespace-nowrap" aria-label="Cost of the next level">
        <span className="inline-flex items-center gap-1" data-testid="next-cost-cards">
          <img src={assets.active('shared/card.png')} alt="Cards" className="size-4 object-contain" />
          {bigNum(cost.cards, powers)}
        </span>
        <span className="inline-flex items-center gap-1" data-testid="next-cost-science">
          <img src={scienceIcon} alt="Science" className="size-4 object-contain" />
          {bigNum(cost.science, powers)}
        </span>
      </p>
    </div>
  );
}

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
  const targetIcon = getResearcherTargetIconUrl(ctx, assets, researcher);
  const effectIcon = EFFECT_ICON[researcher.ModType];
  const rarity = researcher.Rarity ?? '';
  const gameRarityColour = session.palette?.rarity?.[rarity]?.main;
  const details = useMemo(() => researcherDetails(ctx, researcher, abGroups), [ctx, researcher, abGroups]);
  const guaranteed = firstGuaranteedText(ctx, details.firstGuaranteed, abGroups);
  const quote = ctx.title.isAges ? undefined : ctx.localization[`researcher.${researcher.Id}.flavor`];
  const levelText = max === null ? label.level : `${label.level} / ${max}`;

  return (
    <li
      ref={card}
      className={`flex min-w-0 items-stretch gap-1.5 rounded-xl border-2 bg-surface p-1 ${RARITY_BORDER[rarity] ?? 'border-line'} ${highlighted ? 'ring-2 ring-accent' : ''}`}
    >
      <div
        className={`relative aspect-[3/4] h-28 shrink-0 self-start overflow-hidden rounded-lg pointer-fine:h-24 ${gameRarityColour ? '' : (RARITY_CLASS[rarity] ?? 'bg-raised')}`}
        style={gameRarityColour ? { backgroundColor: gameRarityColour } : undefined}
        data-testid="researcher-portrait"
      >
        {/* The art is stored square but drawn narrower in the game, so it is squeezed to 3:4, not cropped. */}
        <img src={assets.iconUrl(`${researcher.Id}.png`)} alt="" loading="lazy" className="h-full w-full object-fill" />
        {targetIcon && (
          <img src={targetIcon} alt="" loading="lazy" className="absolute top-0 right-0 size-5 rounded-bl-md bg-black/50 object-contain p-px" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div>
          <div className="flex items-center gap-1">
            <p className="min-w-0 flex-1 truncate text-sm leading-4 font-medium" title={name}>
              {name}
            </p>
            <InfoPopover label={`Details for ${name}`} className="relative z-10 -my-3.5 pointer-fine:-my-2">
              <div className="space-y-1">
                <p>Unlocks at Rank {details.unlockRank}</p>
                {guaranteed && <p>{guaranteed}</p>}
                {quote && <p className="text-muted italic">&ldquo;{quote}&rdquo;</p>}
              </div>
            </InfoPopover>
          </div>

          <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs">
            <span className="font-semibold whitespace-nowrap" data-testid="researcher-level">
              {levelText}
            </span>
            {effectIcon && <img src={assets.active(`shared/${effectIcon}`)} alt="" className="size-4 shrink-0 object-contain" />}
            <span className="min-w-0 truncate" aria-label={label.value ? `Value ${label.value}` : undefined}>
              {label.value}
            </span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-1">
          <NextCost researcher={researcher} level={level} max={max} />
          <div className="flex items-center gap-1">
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
            <LevelInput researcher={researcher} level={level} max={max} label={`Level of ${name}${max ? `, 0 to ${max}` : ''}`} />
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
          </div>
        </div>
      </div>
    </li>
  );
}
