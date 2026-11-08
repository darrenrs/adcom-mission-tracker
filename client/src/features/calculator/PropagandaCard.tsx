import { getPropagandaBoost } from '@/domain/researchers';
import { useSession } from '@/state/store';
import { useResearcherActions } from './useResearcherActions';

/** The propaganda boost, which is not a researcher but is handled like one: on or off. */
export function PropagandaCard() {
  const { text: ctx, assets, form } = useSession();
  const { setPropaganda } = useResearcherActions();
  const boost = getPropagandaBoost(ctx, assets);
  if (!boost) {
    return null;
  }
  const on = Boolean(form.ResearcherLevels['PropagandaBoost']);

  return (
    <li className="flex min-w-0 flex-col rounded-xl border-2 border-line bg-surface p-2 text-center">
      <div className="relative mx-auto aspect-4/5 w-3/4 overflow-hidden rounded-lg sm:w-full">
        <img src={on ? boost.onIconUrl : boost.offIconUrl} alt="" loading="lazy" className="size-full object-contain" />
        <img src={boost.targetIconUrl} alt="" loading="lazy" className="absolute top-0 right-0 size-9 rounded-bl-lg bg-black/50 object-contain p-0.5" />
      </div>
      <p className="mt-1.5 line-clamp-2 min-h-8 text-xs leading-4 font-medium">{boost.name}</p>
      <p className="mt-1 flex min-h-5 items-center justify-center gap-1 text-sm" data-testid="propaganda-power">
        <img src={assets.active('shared/boost_power.png')} alt="" className="size-5 object-contain" />
        <span>{on ? `x${boost.power}` : 'x1'}</span>
      </p>
      <button
        type="button"
        aria-pressed={on}
        aria-label={`${boost.name}: ${on ? 'on' : 'off'}`}
        onClick={() => setPropaganda(!on)}
        className="mt-1 min-h-control rounded-lg border border-line text-sm font-medium aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent enabled:hover:bg-raised"
      >
        {on ? 'Active' : 'Boost'}
      </button>
    </li>
  );
}
