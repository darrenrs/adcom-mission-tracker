import { useId, type ReactNode } from 'react';
import type { FieldAttributes } from './useFieldKeyboard';

interface Props {
  label: string;
  value: string;
  onChange(text: string): void;
  iconUrl?: string;
  invalid?: boolean;
  /** What is wrong, shown when `invalid`. */
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  attributes?: FieldAttributes;
  /** Something beside the input, such as a Details button. */
  trailing?: ReactNode;
  inputMode?: 'text' | 'numeric';
}

/** One number field on one line: icon, then the input. The label is its accessible name and shows as the placeholder. Amounts accept AdCom notation such as `35.33 EE`. */
export function NumberField({ label, value, onChange, iconUrl, invalid, error, disabled, placeholder, attributes, trailing, inputMode = 'text' }: Props) {
  const id = useId();
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        {iconUrl && <img src={iconUrl} alt="" width={24} height={24} loading="lazy" className="size-6 shrink-0 object-contain" />}
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-label={label}
          title={label}
          value={value}
          disabled={disabled}
          placeholder={placeholder ?? label}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={invalid && error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          {...attributes}
          className="h-control min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 text-base placeholder:text-muted disabled:opacity-50 aria-invalid:border-danger pointer-fine:text-sm"
        />
        {trailing}
      </div>
      {invalid && error && (
        <p id={`${id}-error`} className="mt-0.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
