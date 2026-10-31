import type { ReactNode } from 'react';
import { useSession } from '@/state/store';
import { shortBigNum } from '@/domain/format';
import type { GeneratorAmount, GeneratorDetails } from '@/domain/researchers';

function Amount({ item }: { item: GeneratorAmount }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <img src={item.iconUrl} alt="" title={item.name} className="size-5 object-contain" />
      {item.text}
      <span className="sr-only"> {item.name}</span>
    </span>
  );
}

function Stat({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <img src={icon} alt="" className="size-5 object-contain" />
      <dt className="sr-only">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const heading = 'text-xs font-semibold tracking-wide text-muted uppercase';

/** What legacy's generator popover said, laid out inline. It follows the researcher levels as they change. */
export function GeneratorDetailsView({ details }: { details: GeneratorDetails }) {
  const { assets, title } = useSession();
  const { powers } = title;
  const shared = (file: string) => assets.active(`shared/${file}`);

  return (
    <div className="space-y-3 text-sm">
      <section>
        <h4 className={heading}>Costs</h4>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {details.costs.map((cost) => (
            <Amount key={cost.resourceId} item={cost} />
          ))}
        </p>
      </section>

      <section>
        <h4 className={heading}>Generates</h4>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5">
          <img src={details.output.iconUrl} alt="" title={details.output.name} className="size-5 object-contain" />
          {details.output.perCycleText}
          <span className="sr-only">{details.output.name}</span>
          per
          <img src={shared('speed.png')} alt="" className="size-5 object-contain" />
          {details.output.cycleText}
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
          <Stat icon={shared('boost_power.png')} label="Power">
            x{shortBigNum(details.power, powers)}
          </Stat>
          <Stat icon={shared('discount.png')} label="Discount">
            x{shortBigNum(details.discount, powers)}
          </Stat>
          <Stat icon={shared('speed.png')} label="Speed">
            x{shortBigNum(details.speed, powers)}
          </Stat>
          <Stat icon={shared('crit_chance.png')} label="Crit chance">
            {shortBigNum(details.critChance * 100, powers)}%
          </Stat>
          <Stat icon={shared('crit_power.png')} label="Crit power">
            x{shortBigNum(details.critPower, powers)}
          </Stat>
        </dl>
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5">
          Each outputs
          <img src={details.output.iconUrl} alt="" className="size-5 object-contain" />
          {details.perSecondText}/sec
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5">
          <img src={details.bubble.iconUrl} alt="" className="size-5 object-contain" />
          {details.bubble.text} per bubble earned
        </p>
      </section>

      {details.unlock && (
        <section>
          <h4 className={heading}>Unlocks at</h4>
          <p className="mt-1">
            <Amount item={details.unlock} />
          </p>
        </section>
      )}

      {details.automator && (
        <section>
          <h4 className={heading}>Automator</h4>
          <p className="mt-1 font-medium">{details.automator.name}</p>
          <p className="italic">{details.automator.details.description}</p>
          <p>Unlocks at Rank {details.automator.details.unlockRank}</p>
          <p>
            {details.automator.details.firstGuaranteed.kind === 'mission' && `First guaranteed: ${details.automator.details.firstGuaranteed.text}`}
            {details.automator.details.firstGuaranteed.kind === 'freeCapsule' && 'First guaranteed: First free capsule'}
            {details.automator.details.firstGuaranteed.kind === 'none' && 'No guaranteed copies.'}
          </p>
        </section>
      )}
    </div>
  );
}
