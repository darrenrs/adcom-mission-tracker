import { useState } from 'react';
import { formatAmount } from '@/domain/inputSteps';
import { AmountInput } from './AmountInput';

interface Props {
  label: string;
  value: number;
  onValue(value: number): void;
  powers: readonly string[];
  className?: string;
  /** The text to show instead of the plain amount, such as `3 / 20`. */
  shown?: string;
  allowNegative?: boolean;
}

/** Shows an amount, and turns into a field when tapped. */
export function EditableAmount({ label, value, onValue, powers, className = '', shown, allowNegative = false }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <AmountInput
        allowNegative={allowNegative}
        autoFocus
        label={label}
        value={value}
        onValue={onValue}
        powers={powers}
        onBlur={() => setEditing(false)}
        onFocus={(event) => event.target.select()}
        className={`w-full text-center ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Edit ${label}`}
      onClick={() => setEditing(true)}
      className={`min-h-control w-full min-w-0 cursor-text rounded-lg px-1 text-center text-sm font-semibold tabular-nums hover:bg-raised ${className}`}
    >
      <span className="block truncate">{shown ?? formatAmount(value, powers)}</span>
    </button>
  );
}
