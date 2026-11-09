import { Info } from 'lucide-react';
import { useId, useState } from 'react';
import { getResourceByIndustry, resourceName } from '@/domain/gameText';
import { bigNum } from '@/domain/format';
import { industryGenerators } from '@/domain/researchers';
import type { Mission } from '@/domain/types';
import { useSession } from '@/state/store';
import { HelpTip } from '@/ui/HelpTip';
import { COMRADES_KEY, generatorKey, PROGRESS_KEY, RESOURCE_KEY } from './fields';
import { GeneratorInfo } from './GeneratorInfo';
import { NumberField } from './NumberField';
import type { CountFields } from './useCountFields';

interface Props {
  mission: Mission;
  industryId: string;
  fields: CountFields;
  /** Fields that "limited by comrades only" switches off. */
  disabled: ReadonlySet<string>;
}

const groupHeading = 'mb-1 text-xs font-semibold tracking-wide text-muted uppercase';

export function GeneratorsPanel({ mission, industryId, fields, disabled }: Props) {
  const session = useSession();
  const { text: ctx, assets, form } = session;
  const [open, setOpen] = useState<string | null>(null);
  const detailsId = useId();
  const resource = getResourceByIndustry(ctx, industryId);
  const resourceLabel = String(resourceName(ctx, resource?.Id ?? ''));
  const comrade = String(resourceName(ctx, 'comrade'));
  const error = 'Not a number. Use digits, or notation like 35.33 EE.';
  const generators = industryGenerators(ctx, industryId);

  const field = (key: string, label: string, iconUrl: string, extra: Partial<Parameters<typeof NumberField>[0]> = {}) => (
    <NumberField
      key={key}
      label={label}
      iconUrl={iconUrl}
      value={fields.texts[key] ?? ''}
      onChange={(text) => fields.setText(key, text)}
      invalid={fields.invalid(key)}
      error={error}
      disabled={disabled.has(key)}
      {...extra}
    />
  );

  return (
    <div>
      <div className="flex items-center gap-1">
        <h3 className="text-sm font-semibold">Your counts</h3>
        <HelpTip label="Typing numbers">
          <p>
            Type plain numbers or the game&apos;s notation, such as <span className="font-medium">35.33 EE</span>. What you type is saved as you go.
          </p>
          <p>Use Up and Down on a field to nudge it.</p>
        </HelpTip>
      </div>

      <div className="space-y-2">
        <section aria-labelledby={`${detailsId}-generators`}>
          <h4 id={`${detailsId}-generators`} className={groupHeading}>
            Generators
          </h4>
          <div className="space-y-1.5 pointer-fine:space-y-1">
            {generators.map((generator) => {
              const key = generatorKey(generator.Id);
              const name = String(resourceName(ctx, generator.Id));
              const isOpen = open === generator.Id;
              return (
                <div key={generator.Id} className="min-w-0">
                  {field(key, `# of ${name}`, assets.iconUrl(`${generator.Id}.png`), {
                    attributes: { 'data-field': 'count', 'data-field-key': key },
                    trailing: (
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-expanded={isOpen}
                        aria-controls={`${detailsId}-${generator.Id}`}
                        aria-label={`Details of ${name}`}
                        onClick={() => setOpen(isOpen ? null : generator.Id)}
                        className="flex size-control shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:bg-raised hover:text-ink aria-expanded:bg-raised aria-expanded:text-ink"
                      >
                        <Info aria-hidden size={16} />
                      </button>
                    )
                  })}
                  <div id={`${detailsId}-${generator.Id}`} hidden={!isOpen} className="mt-1.5 rounded-lg border border-line bg-surface p-3">
                    {isOpen && <GeneratorInfo generator={generator} />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby={`${detailsId}-resources`}>
          <h4 id={`${detailsId}-resources`} className={groupHeading}>
            Resources
          </h4>
          <div className="space-y-1.5 pointer-fine:space-y-1">
            {field(RESOURCE_KEY, `# of ${resourceLabel}`, assets.iconUrl(`${resource?.Id ?? ''}.png`), {
              attributes: { 'data-field': 'count', 'data-field-key': RESOURCE_KEY }
            })}
            {mission.Condition.ConditionType === 'ResourcesEarnedSinceSubscription' &&
              field(PROGRESS_KEY, 'Mission Progress', assets.iconUrl(`${resource?.Id ?? ''}.png`), {
                allowNegative: true,
                attributes: { 'data-field': 'count', 'data-field-key': PROGRESS_KEY }
              })}
          </div>
        </section>

        <section aria-labelledby={`${detailsId}-comrades`}>
          <h4 id={`${detailsId}-comrades`} className={groupHeading}>
            Comrades
          </h4>
          <div className="space-y-1.5 pointer-fine:space-y-1">
            {field(COMRADES_KEY, `# of ${comrade}`, assets.iconUrl('comrade.png'), {
              attributes: { 'data-field': 'comrades', 'data-field-key': COMRADES_KEY }
            })}
            <div className="flex min-h-control min-w-0 items-center gap-1.5 text-sm">
              <img src={assets.active('shared/comrades_per_second.png')} alt="" width={24} height={24} className="size-6 shrink-0 object-contain" />
              <span className="min-w-0 font-medium">{comrade} per second</span>
              <span className="font-semibold" data-testid="comrades-per-second">
                {bigNum(form.Trades.TotalComrades || 0, ctx.title.powers)}
              </span>
              <HelpTip label={`${comrade} per second`}>
                <p>Worked out from your trades.</p>
              </HelpTip>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
