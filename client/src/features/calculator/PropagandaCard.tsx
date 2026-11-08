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
    <li className="flex min-w-0 items-center gap-2 rounded-xl border-2 border-line bg-surface p-1.5 pointer-fine:p-1">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg pointer-fine:size-12">
        <img src={on ? boost.onIconUrl : boost.offIconUrl} alt="" loading="lazy" className="size-full object-contain" />
        <img src={boost.targetIconUrl} alt="" loading="lazy" className="absolute top-0 right-0 size-5 rounded-bl-md bg-black/50 object-contain p-px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-4 font-medium" title={boost.name}>
          {boost.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <p className="flex items-center gap-1 text-xs" data-testid="propaganda-power">
            <img src={assets.active('shared/boost_power.png')} alt="" className="size-4 object-contain" />
            <span>{on ? `x${boost.power}` : 'x1'}</span>
          </p>
          <button
            type="button"
            aria-pressed={on}
            aria-label={`${boost.name}: ${on ? 'on' : 'off'}`}
            onClick={() => setPropaganda(!on)}
            className="h-control min-w-24 rounded-lg border border-line px-3 text-sm font-medium aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent enabled:hover:bg-raised"
          >
            {on ? 'Active' : 'Boost'}
          </button>
        </div>
      </div>
    </li>
  );
}
