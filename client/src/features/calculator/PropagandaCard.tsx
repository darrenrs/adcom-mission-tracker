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
    <li className="flex min-w-0 items-stretch gap-1.5 rounded-xl border-2 border-line bg-surface p-1">
      <div className="relative aspect-[3/4] h-28 shrink-0 self-start overflow-hidden rounded-lg pointer-fine:h-24">
        <img src={on ? boost.onIconUrl : boost.offIconUrl} alt="" loading="lazy" className="h-full w-full object-fill" />
        <img src={boost.targetIconUrl} alt="" loading="lazy" className="absolute top-0 right-0 size-5 rounded-bl-md bg-black/50 object-contain p-px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm leading-4 font-medium" title={boost.name}>
          {boost.name}
        </p>
        <div className="mt-auto flex flex-col gap-1">
          <p className="flex items-center gap-1 text-xs" data-testid="propaganda-power">
            <img src={assets.active('shared/boost_power.png')} alt="" className="size-4 object-contain" />
            <span>{on ? `x${boost.power}` : 'x1'}</span>
          </p>
          <button
            type="button"
            aria-pressed={on}
            aria-label={`${boost.name}: ${on ? 'on' : 'off'}`}
            onClick={() => setPropaganda(!on)}
            className="h-control min-w-24 self-start rounded-lg border border-line px-3 text-sm font-medium aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent enabled:hover:bg-raised"
          >
            {on ? 'Active' : 'Boost'}
          </button>
        </div>
      </div>
    </li>
  );
}
