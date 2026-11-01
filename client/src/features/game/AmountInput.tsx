import { useEffect, useState, type InputHTMLAttributes } from 'react';
import { stepDirection, stepValue, parseAmount, type StepKind } from '@/domain/inputSteps';
import { amountText, isInvalidAmount } from '@/features/calculator/fields';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label: string;
  value: number;
  onValue(value: number): void;
  powers: readonly string[];
  kind?: StepKind;
}

/** A number field that saves each valid change. Takes plain numbers or the game's notation, and plain Up and Down. */
export function AmountInput({ label, value, onValue, powers, kind = 'count', className = '', ...rest }: Props) {
  const [text, setText] = useState(() => amountText(value, powers));
  const invalid = isInvalidAmount(text, powers);

  // Another field may change the same number, such as an Own mission and its generator.
  useEffect(() => {
    setText((shown) => (parseAmount(shown, powers) === value ? shown : amountText(value, powers)));
  }, [value, powers]);

  const change = (next: string) => {
    setText(next);
    if (!isInvalidAmount(next, powers)) {
      onValue(parseAmount(next, powers));
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
      onKeyDown={(event) => {
        const direction = stepDirection(event);
        if (direction !== 0) {
          event.preventDefault();
          const next = stepValue(kind, text, direction, powers);
          if (next !== null) {
            change(next);
          }
        }
      }}
      className={`min-w-0 rounded-lg border border-line bg-canvas px-2 text-base aria-invalid:border-danger ${className}`}
      {...rest}
    />
  );
}
