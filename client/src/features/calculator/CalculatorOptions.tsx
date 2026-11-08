import { useId } from 'react';
import type { CalculationMode } from '@/engine/calculate';

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
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-describedby={`${id}-hint`}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1.5 size-5 shrink-0 accent-accent"
      />
      <div className="min-w-0">
        <label htmlFor={id} className={`flex min-h-8 items-center text-sm font-medium ${disabled ? 'opacity-50' : ''}`}>
          {label}
        </label>
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      </div>
    </div>
  );
}

const SEGMENT =
  'flex min-h-control flex-1 cursor-pointer items-center justify-center px-4 text-sm font-medium text-muted peer-checked:bg-accent peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-accent dark:peer-checked:text-black';

export function CalculatorOptions({ value, onChange, comradeName, showComradesOnly }: Props) {
  const name = useId();
  const online = value.mode === 'online';

  return (
    <fieldset className="space-y-3 rounded-xl border border-line bg-surface p-3">
      <legend className="px-1 text-sm font-semibold">Options</legend>

      <div role="radiogroup" aria-label="Play style" className="flex overflow-hidden rounded-lg border border-line">
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
      <p className="text-xs text-muted">
        {online
          ? 'Online: you keep the game open. Every generator runs all the time.'
          : 'Offline: the game runs your deepest generator for the whole time, then the next one up, so long breaks can pay off. You cannot check in.'}
      </p>

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
