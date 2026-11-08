import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { parseRankInput, type RankProgress } from '@/domain/missionView';
import { CURRENT_SECTION_ID } from '@/features/missions/MissionSections';
import { inputClass } from '@/ui/inputStyles';
import { navigateStartup } from '@/state/navigation';
import { useSession, useTracker } from '@/state/store';

const iconButton =
  'flex size-control shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:bg-raised hover:text-ink';

/** Motherland moves freely between ranks. An event only moves forward, which completes what comes before. */
export function RankControls({ progress, onClose }: { progress: RankProgress; onClose(): void }) {
  const { mode, balance } = useSession();
  const advanceLte = useTracker((state) => state.advanceLte);
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const isLte = mode === 'lte';
  const max = balance.Ranks?.length ?? 0;
  const { rank } = progress;

  useEffect(() => input.current?.focus(), []);

  const goTo = (target: number) => {
    if (isLte) {
      advanceLte(target);
      // Advancing fills Completed, which sits above Current and would push it off screen.
      requestAnimationFrame(() => document.getElementById(CURRENT_SECTION_ID)?.scrollIntoView());
    } else {
      navigateStartup({ mode: 'evergreen', rank: String(target) });
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const target = parseRankInput(value, max);
    if (target === null) {
      setInvalid(true);
      return;
    }
    onClose();
    goTo(target);
  };

  return (
    <form onSubmit={submit} noValidate aria-label="Change rank" className="w-80 max-w-[calc(100vw-1rem)] space-y-2 p-3">
      <div className="flex items-center justify-center gap-2">
        {!isLte && (
          <button
            type="button"
            aria-label={`Go back to Rank ${rank - 1}`}
            title={`Go back to Rank ${rank - 1}`}
            disabled={rank <= 1}
            onClick={() => goTo(rank - 1)}
            className={`${iconButton} disabled:opacity-40`}
          >
            <ChevronLeft aria-hidden size={20} />
          </button>
        )}
        <label htmlFor={id} className="sr-only">
          Rank to go to, from 1 to {max}
        </label>
        <input
          ref={input}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          placeholder={`1 to ${max}`}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setInvalid(false);
          }}
          className={`${inputClass} w-24 text-center`}
        />
        <button type="submit" className="h-control rounded-lg bg-accent px-4 text-sm font-medium text-white dark:text-black">
          Go
        </button>
        <button
          type="button"
          aria-label={`Go forward to Rank ${rank + 1}`}
          title={`Go forward to Rank ${rank + 1}`}
          disabled={rank >= max}
          onClick={() => goTo(rank + 1)}
          className={`${iconButton} disabled:opacity-40`}
        >
          <ChevronRight aria-hidden size={20} />
        </button>
      </div>
      {isLte && <p className="text-center text-sm text-muted">All missions in earlier ranks will be marked as complete.</p>}
      {invalid && (
        <p id={`${id}-error`} role="alert" className="sr-only">
          Invalid rank. Enter a whole number from 1 to {max}.
        </p>
      )}
    </form>
  );
}
