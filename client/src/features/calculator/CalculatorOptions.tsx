import { useId } from 'react';
import type { CalculationMode } from '@/engine/calculate';
import { HelpTip } from '@/ui/HelpTip';

export interface OptionsState {
  mode: CalculationMode;
  autobuy: boolean;
  comradesOnly: boolean;
}

interface Props {
  value: OptionsState;
  onChange(next: OptionsState): void;
  comradeName: string;
  /** Only Own missions can be limited by comrades alone. */
  showComradesOnly: boolean;
}

function Check({ checked, disabled, onChange, label, hint }: { checked: boolean; disabled?: boolean; onChange(checked: boolean): void; label: string; hint: string }) {
  const id = useId();
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 shrink-0 accent-accent"
      />
      <label htmlFor={id} className={`flex min-h-control items-center pr-1 pl-2 text-sm font-medium ${disabled ? 'opacity-50' : ''}`}>
        {label}
      </label>
      <HelpTip label={label}>
        <p>{hint}</p>
      </HelpTip>
    </div>
  );
}

const SEGMENT =
  'flex min-h-control flex-1 cursor-pointer items-center justify-center px-3 text-sm font-medium text-muted peer-checked:bg-accent peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-accent dark:peer-checked:text-black';

export function CalculatorOptions({ value, onChange, comradeName, showComradesOnly }: Props) {
  const name = useId();
  const online = value.mode === 'online';

  return (
    <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-0 rounded-xl border border-line bg-surface px-3 pb-1 pointer-fine:px-2.5">
      <legend className="px-1 text-sm font-semibold">Options</legend>

      <div className="flex items-center">
        <div role="radiogroup" aria-label="Play style" className="flex w-52 overflow-hidden rounded-lg border border-line">
          {(['online', 'offline'] as const).map((mode) => (
            <div key={mode} className="relative flex flex-1">
              <input
                id={`${name}-${mode}`}
                type="radio"
                name={name}
                value={mode}
                checked={value.mode === mode}
                onChange={() => onChange({ ...value, mode })}
                className="peer sr-only"
              />
              <label className={SEGMENT} htmlFor={`${name}-${mode}`}>
                {mode === 'online' ? 'Online' : 'Offline'}
              </label>
            </div>
          ))}
        </div>
        <HelpTip label="Play style">
          <p>
            {online
              ? 'Online: you keep the game open. Every generator runs all the time.'
              : 'Offline: the game runs your deepest generator for the whole time, then the next one up, so long breaks can pay off. You cannot check in.'}
          </p>
        </HelpTip>
      </div>

      <Check
        checked={online && value.autobuy}
        disabled={!online}
        onChange={(autobuy) => onChange({ ...value, autobuy })}
        label="Auto-buy deepest generator"
        hint="Keeps buying as many of your deepest automated generator as you can afford. Online only."
      />
      {showComradesOnly && (
        <Check
          checked={online && value.comradesOnly}
          disabled={!online}
          onChange={(comradesOnly) => onChange({ ...value, comradesOnly })}
          label={`Limited by ${comradeName} only`}
          hint="Assumes production is not the problem. Faster, and the other count fields are switched off."
        />
      )}
    </fieldset>
  );
}
