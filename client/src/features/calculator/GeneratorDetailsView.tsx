import { Fragment, type ReactNode } from 'react';
import { shortBigNum } from '@/domain/format';
import { formatAmount, formatCycleTime, generatesFigures } from '@/domain/generatorInfo';
import { researcherName } from '@/domain/gameText';
import { EFFECT_ICON } from '@/domain/researcherInfo';
import { researcherMaxLevel, researcherValueLabel, type GeneratorDetails } from '@/domain/researchers';
import { useSession } from '@/state/store';

const heading = 'mt-2 text-xs font-semibold tracking-wide text-muted uppercase';

/** A picture with its value underneath, so a row of them lines up in columns. */
function Item({ iconUrl, name, children }: { iconUrl: string; name: string; children: ReactNode }) {
  return (
    <div className="flex min-w-12 flex-col items-center gap-0.5 text-center">
      <img src={iconUrl} alt="" title={name} width={28} height={28} className="size-7 object-contain" />
      <span className="tabular-nums">{children}</span>
      <span className="sr-only">{name}</span>
    </div>
  );
}

/** What legacy's generator popover said, laid out inline. It follows the researcher levels as they change. */
export function GeneratorDetailsView({ details }: { details: GeneratorDetails }) {
  const { text: ctx, assets, form, title } = useSession();
  const { powers } = title;
  const shared = (file: string) => assets.active(`shared/${file}`);
  const description = ctx.localization[`resource.${details.id}.longdesc`];
  const { output } = details;
  const figures = generatesFigures(output.perCycle, output.cycleSeconds, details.critChance, details.critPower);
  const cycle = formatCycleTime(output.cycleSeconds, powers);

  const automator = details.automator;
  const researcher = automator ? (ctx.balance.Researchers ?? []).find((candidate) => candidate.Id === automator.id) : undefined;
  const automatorLevel = automator ? (form.ResearcherLevels[automator.id] ?? 0) : 0;
  const automatorMax = researcher ? researcherMaxLevel(ctx.balance, researcher) : null;
  const automatorLabel = researcher ? researcherValueLabel(ctx, researcher, automatorLevel) : null;
  const automatorEffectIcon = researcher ? EFFECT_ICON[researcher.ModType] : undefined;

  const generates: [string, string][] = [
    [`Base per cycle (${cycle})`, formatAmount(figures.basePerCycle, powers)],
    ['Average per cycle, with crits', formatAmount(figures.averagePerCycle, powers)],
    ['Base per second', formatAmount(figures.basePerSecond, powers)],
    ['Average per second, with crits', formatAmount(figures.averagePerSecond, powers)]
  ];

  const modifiers: [string, string, string][] = [
    ['Power', 'boost_power.png', `x${shortBigNum(details.power, powers)}`],
    ['Discount', 'discount.png', `x${shortBigNum(details.discount, powers)}`],
    ['Speed', 'speed.png', `x${shortBigNum(details.speed, powers)}`],
    ['Crit chance', 'crit_chance.png', `${shortBigNum(details.critChance * 100, powers)}%`],
    ['Crit power', 'crit_power.png', `x${shortBigNum(details.critPower, powers)}`]
  ];

  return (
    <div className="space-y-2 text-sm">
      {description && <p className="italic">{description}</p>}

      <div className="flex justify-between gap-4">
        <section>
          <h4 className={heading}>Costs</h4>
          <div className="mt-0.5 flex flex-wrap gap-2">
            {details.costs.map((cost) => (
              <Item key={cost.resourceId} iconUrl={cost.iconUrl} name={cost.name}>
                {cost.text}
              </Item>
            ))}
          </div>
        </section>

        <section>
          <h4 className={`${heading} text-right`}>Outputs</h4>
          <div className="mt-0.5 flex flex-wrap justify-end gap-2">
            <Item iconUrl={output.iconUrl} name={output.name}>
              {output.perCycleText}
            </Item>
            <Item iconUrl={details.bubble.iconUrl} name="Science per bubble">
              {details.bubble.text}
            </Item>
          </div>
        </section>
      </div>

      <section>
        <h4 className={heading}>Generates</h4>
        <dl className="mt-0.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
          {generates.map(([label, value]) => (
            <Fragment key={label}>
              <dt>{label}</dt>
              <dd className="flex items-center gap-1 tabular-nums">
                <img src={output.iconUrl} alt="" className="size-5 object-contain" />
                {value}
              </dd>
            </Fragment>
          ))}
        </dl>
      </section>

      <section>
        <h4 className={heading}>Modifiers</h4>
        <div className="mt-0.5 flex flex-wrap justify-between gap-2">
          {modifiers.map(([label, file, value]) => (
            <Item key={label} iconUrl={shared(file)} name={label}>
              {value}
            </Item>
          ))}
        </div>
      </section>

      {automator && researcher && automatorLabel && (
        <section>
          <h4 className={heading}>Automator</h4>
          <div className="mt-1 flex items-center gap-2">
            <img src={assets.iconUrl(`${automator.id}.png`)} alt="" width={80} height={80} className="size-20 shrink-0 rounded-lg object-contain" />
            <div className="min-w-0">
              <p className="font-medium">{researcherName(ctx, researcher)}</p>
              <p className="flex items-center gap-1.5">
                <span className="font-semibold whitespace-nowrap">
                  {automatorMax === null ? automatorLabel.level : `${automatorLabel.level} / ${automatorMax}`}
                </span>
                {automatorEffectIcon && <img src={shared(automatorEffectIcon)} alt="" className="size-4 shrink-0 object-contain" />}
                <span>{automatorLabel.value}</span>
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
