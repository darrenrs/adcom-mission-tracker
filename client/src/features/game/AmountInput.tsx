import { useEffect, useState, type InputHTMLAttributes } from 'react';
import { amountValue, settleAmount, stepAmount, stepDirection } from '@/domain/inputSteps';
import { inputClass } from '@/ui/inputStyles';
import { amountText, isInvalidAmount } from '@/features/calculator/fields';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label: string;
  value: number;
  onValue(value: number): void;
  powers: readonly string[];
  /** Mission progress only: players use negative values to stand in for other goals. */
  allowNegative?: boolean;
}

/**
 * A number field that saves each valid change, rounded to the one number format. Takes plain numbers or the game's
 * notation, and plain Up and Down. Leaving it or Enter settles the text into the format, so `12.5` becomes `13`.
 */
export function AmountInput({ label, value, onValue, powers, className = '', onBlur, onKeyDown, allowNegative = false, ...rest }: Props) {
  const [text, setText] = useState(() => amountText(value, powers));
  const invalid = isInvalidAmount(text, powers, allowNegative);

  // Another field may change the same number, such as an Own mission and its generator.
  useEffect(() => {
    setText((shown) => (amountValue(shown, powers) === value ? shown : amountText(value, powers)));
  }, [value, powers]);

  const change = (next: string) => {
    setText(next);
    if (!isInvalidAmount(next, powers, allowNegative)) {
      onValue(amountValue(next, powers));
    }
  };

  const settle = () => {
    const settled = settleAmount(text, powers, allowNegative);
    if (settled && settled.text !== text) {
      setText(settled.text);
    }
  };

  return (
    <input
      type="text"
      inputMode="text"
      autoComplete="off"
      autoCapitalize="characters"
      spellCheck={false}
      aria-label={label}
      aria-invalid={invalid ? true : undefined}
      value={text}
      placeholder="0"
      onChange={(event) => change(event.target.value)}
      onBlur={(event) => {
        settle();
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          settle();
        }
        const direction = stepDirection(event);
        if (direction !== 0) {
          event.preventDefault();
          const next = stepAmount(text, direction, powers);
          if (next !== null) {
            change(next);
          }
        }
        onKeyDown?.(event);
      }}
      className={`${inputClass} ${className}`}
      {...rest}
    />
  );
}
