import { Calculator } from 'lucide-react';

/** Marks a reward capsule that also opens a calculator, without covering the capsule itself. */
export function CalculatorBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute flex items-center justify-center rounded-full bg-accent text-white ring-1 ring-surface dark:text-black ${
        small ? '-right-1 -bottom-1 size-3' : '-right-1.5 -bottom-1 size-[18px]'
      }`}
    >
      <Calculator size={small ? 8 : 12} strokeWidth={2.5} />
    </span>
  );
}
