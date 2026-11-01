import { useId } from 'react';
import { getPropagandaBoost } from '@/domain/researchers';
import { useSession } from '@/state/store';
import { useResearcherActions } from './useResearcherActions';

/** The propaganda boost, which is not a researcher but is handled like one: on or off. */
export function PropagandaCard() {
  const { text: ctx, assets, form } = useSession();
  const { setPropaganda } = useResearcherActions();
  const id = useId();
  const boost = getPropagandaBoost(ctx, assets);
  if (!boost) {
    return null;
  }
  const on = Boolean(form.ResearcherLevels['PropagandaBoost']);

  return (
    <li className="flex min-w-0 flex-col rounded-xl border-2 border-line bg-surface p-2">
      <div className="relative mx-auto aspect-4/5 w-3/4 overflow-hidden rounded-lg bg-black sm:w-full">
        <img src={on ? boost.onIconUrl : boost.offIconUrl} alt="" loading="lazy" className="size-full object-contain" />
        <img src={boost.targetIconUrl} alt="" loading="lazy" className="absolute top-0 right-0 size-9 rounded-bl-lg bg-black/50 object-contain p-0.5" />
        <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-xs font-bold text-white">{on ? 'Active' : 'Inactive'}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 min-h-8 text-xs leading-4 font-medium">{boost.name}</p>
      <p className="mt-1 min-h-5 text-center text-sm">{on ? `x${boost.power} output` : ' '}</p>
      <button
        type="button"
        aria-pressed={on}
        aria-describedby={id}
        onClick={() => setPropaganda(!on)}
        className="mt-1 min-h-11 rounded-lg border border-line text-sm font-medium aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent enabled:hover:bg-raised"
      >
        {on ? `${boost.name}: on` : `${boost.name}: off`}
      </button>
      <p id={id} className="mt-1 text-xs text-muted">
        {boost.description}
      </p>
    </li>
  );
}
