import { useState } from 'react';
import { bigNum } from '@/domain/format';
import { AmountInput } from './AmountInput';

interface Props {
  label: string;
  value: number;
  onValue(value: number): void;
  powers: readonly string[];
  className?: string;
  /** The text to show instead of the plain amount, such as `3 / 20`. */
  shown?: string;
}

/** Shows an amount, and turns into a field when tapped. */
export function EditableAmount({ label, value, onValue, powers, className = '', shown }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <AmountInput
        autoFocus
        label={label}
        value={value}
        onValue={onValue}
        powers={powers}
        onBlur={() => setEditing(false)}
        onFocus={(event) => event.target.select()}
        className={`h-11 w-full text-center ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Edit ${label}`}
      onClick={() => setEditing(true)}
      className={`min-h-11 w-full min-w-0 cursor-text rounded-lg px-1 text-center text-sm font-semibold tabular-nums hover:bg-raised ${className}`}
    >
      <span className="block truncate">{shown ?? (value > 0 ? bigNum(value, powers) : '0')}</span>
    </button>
  );
}
