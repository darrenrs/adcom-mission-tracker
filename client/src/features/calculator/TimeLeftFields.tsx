import { getEta } from '@/domain/format';
import { resourceName } from '@/domain/gameText';
import { cycleProgress } from './timeLeft';
import { NumberField } from './NumberField';
import type { GameTextContext } from '@/domain/gameText';
import type { Tier } from '@/engine/model';

/** Generators worth asking about: the deepest owned ones with a long enough cycle to matter. */
export function timeLeftCandidates(tiers: readonly Tier[], owned: (index: number) => boolean): number[] {
  const long = tiers.flatMap((tier, index) => (owned(index) && tier.cycleSeconds >= 60 && Number.isFinite(tier.cycleSeconds) ? [index] : []));
  return long.slice(-2);
}

interface Props {
  ctx: GameTextContext;
  tiers: readonly Tier[];
  candidates: readonly number[];
  texts: Readonly<Record<string, string>>;
  onChange(generatorId: string, text: string): void;
}

export function TimeLeftFields({ ctx, tiers, candidates, texts, onChange }: Props) {
  if (candidates.length === 0) {
    return null;
  }
  return (
    <section className="space-y-3 rounded-xl border border-line bg-surface p-3" aria-label="Time left">
      <div>
        <h3 className="text-sm font-semibold">Time left (optional)</h3>
        <p className="text-xs text-muted">
          If you can see how long a long cycle has left in the game, enter it. This tightens the result. Examples: 24m, 1h 5m, 90s.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {candidates.map((index) => {
          const tier = tiers[index] as Tier;
          const text = texts[tier.id] ?? '';
          const { error } = cycleProgress(text, tier.cycleSeconds);
          return (
            <NumberField
              key={tier.id}
              label={`Time left on ${String(resourceName(ctx, tier.id))}`}
              value={text}
              onChange={(next) => onChange(tier.id, next)}
              invalid={error !== null}
              error={error ?? undefined}
              placeholder={`Up to ${getEta(tier.cycleSeconds, ctx.title.powers)}`}
              inputMode="text"
            />
          );
        })}
      </div>
    </section>
  );
}
