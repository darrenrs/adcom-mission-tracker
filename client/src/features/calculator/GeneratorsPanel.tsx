import { Info } from 'lucide-react';
import { useId, useState } from 'react';
import { getResourceByIndustry, resourceName } from '@/domain/gameText';
import { generatorDetails, industryGenerators } from '@/domain/researchers';
import type { Mission } from '@/domain/types';
import { useSession } from '@/state/store';
import { COMRADES_KEY, CPS_KEY, generatorKey, PROGRESS_KEY, RESOURCE_KEY } from './fields';
import { GeneratorDetailsView } from './GeneratorDetailsView';
import { NumberField } from './NumberField';
import type { CountFields } from './useCountFields';

interface Props {
  mission: Mission;
  industryId: string;
  fields: CountFields;
  /** Fields that "limited by comrades only" switches off. */
  disabled: ReadonlySet<string>;
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function GeneratorsPanel({ mission, industryId, fields, disabled }: Props) {
  const session = useSession();
  const { text: ctx, assets, form, abGroups } = session;
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
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Type plain numbers or the game&apos;s notation, such as <span className="font-medium text-ink">35.33 EE</span>. What you type is saved as you go.
        Use Up and Down on a field to nudge it.
      </p>

      <FieldGroup>
        {generators.map((generator) => {
          const key = generatorKey(generator.Id);
          const name = String(resourceName(ctx, generator.Id));
          const isOpen = open === generator.Id;
          return (
            <div key={generator.Id} className="min-w-0">
              {field(key, `# of ${name}`, assets.iconUrl(`${generator.Id}.png`), {
                attributes: { 'data-field': 'count', 'data-field-key': key, 'data-shortcut': 'item' },
                trailing: (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${detailsId}-${generator.Id}`}
                    aria-label={`Details of ${name}`}
                    onClick={() => setOpen(isOpen ? null : generator.Id)}
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:bg-raised hover:text-ink aria-expanded:bg-raised aria-expanded:text-ink"
                  >
                    <Info aria-hidden size={18} />
                  </button>
                )
              })}
              <div id={`${detailsId}-${generator.Id}`} hidden={!isOpen} className="mt-2 rounded-lg border border-line bg-surface p-3">
                {isOpen && <GeneratorDetailsView details={generatorDetails(ctx, assets, generator, form, abGroups)} />}
              </div>
            </div>
          );
        })}
      </FieldGroup>

      <hr className="border-line" />

      <FieldGroup>
        {field(RESOURCE_KEY, `# of ${resourceLabel}`, assets.iconUrl(`${resource?.Id ?? ''}.png`), {
          attributes: { 'data-field': 'count', 'data-field-key': RESOURCE_KEY, 'data-shortcut': 'resource' }
        })}
        {mission.Condition.ConditionType === 'ResourcesEarnedSinceSubscription' &&
          field(PROGRESS_KEY, 'Mission Progress', assets.iconUrl(`${resource?.Id ?? ''}.png`), {
            attributes: { 'data-field': 'count', 'data-field-key': PROGRESS_KEY, 'data-shortcut': 'progress' }
          })}
      </FieldGroup>

      <hr className="border-line" />

      <FieldGroup>
        {field(COMRADES_KEY, `# of ${comrade}`, assets.iconUrl('comrade.png'), {
          attributes: { 'data-field': 'comrades', 'data-field-key': COMRADES_KEY, 'data-shortcut': 'comrades' }
        })}
        {field(CPS_KEY, `${comrade} per second`, assets.active('shared/comrades_per_second.png'), {
          attributes: { 'data-field': 'comradesPerSecond', 'data-field-key': CPS_KEY, 'data-shortcut': 'cps' }
        })}
      </FieldGroup>
    </div>
  );
}
