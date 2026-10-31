import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { parseRankInput } from '@/domain/missionView';
import { navigateStartup } from '@/state/navigation';
import { useTracker } from '@/state/store';

const iconButton =
  'flex size-11 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:bg-raised hover:text-ink';

interface AdvanceFormProps {
  isEvent: boolean;
  max: number;
  onClose(): void;
  onAdvanced(): void;
}

function AdvanceForm({ isEvent, max, onClose, onAdvanced }: AdvanceFormProps) {
  const advanceEvent = useTracker((state) => state.advanceEvent);
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => input.current?.focus(), []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const rank = parseRankInput(value, max);
    if (rank === null) {
      setInvalid(true);
      return;
    }
    onClose();
    if (isEvent) {
      advanceEvent(rank);
      onAdvanced();
    } else {
      navigateStartup({ rank: String(rank) });
    }
  };

  return (
    <form onSubmit={submit} className="basis-full space-y-2" noValidate>
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="sr-only">
          Rank to advance to, from 1 to {max}
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
          onKeyDown={(event) => event.key === 'Escape' && onClose()}
          className="h-11 w-32 min-w-0 rounded-lg border border-line bg-canvas px-3 text-base"
        />
        <button type="submit" className="h-11 rounded-lg bg-accent px-4 text-sm font-medium text-white dark:text-black">
          Go
        </button>
        <button type="button" aria-label="Close advance to rank" onClick={onClose} className={iconButton}>
          <X aria-hidden size={18} />
        </button>
      </div>
      {isEvent && <p className="text-sm text-muted">All missions in earlier ranks will be marked as complete.</p>}
      {invalid && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          Invalid rank. Enter a whole number from 1 to {max}.
        </p>
      )}
    </form>
  );
}

/** Motherland gets previous and next as well. An event only moves forward, by advancing. */
export function RankControls({ isEvent, rank, max, onAdvanced }: { isEvent: boolean; rank: number; max: number; onAdvanced(): void }) {
  const [advancing, setAdvancing] = useState(false);

  return (
    <>
      <div className="flex w-full items-center gap-1.5 sm:w-auto">
        {!isEvent && rank > 1 && (
          <button
            type="button"
            aria-label={`Go back to Rank ${rank - 1}`}
            title={`Go back to Rank ${rank - 1}`}
            onClick={() => navigateStartup({ rank: String(rank - 1) })}
            className={iconButton}
          >
            <ChevronLeft aria-hidden size={20} />
          </button>
        )}
        <button
          type="button"
          aria-expanded={advancing}
          onClick={() => setAdvancing((open) => !open)}
          className="h-11 flex-1 rounded-lg border border-line px-3 text-sm font-medium text-muted hover:bg-raised hover:text-ink aria-expanded:bg-raised aria-expanded:text-ink sm:flex-none"
        >
          Advance to rank
        </button>
        {!isEvent && rank < max && (
          <button
            type="button"
            aria-label={`Go forward to Rank ${rank + 1}`}
            title={`Go forward to Rank ${rank + 1}`}
            onClick={() => navigateStartup({ rank: String(rank + 1) })}
            className={iconButton}
          >
            <ChevronRight aria-hidden size={20} />
          </button>
        )}
      </div>
      {advancing && <AdvanceForm isEvent={isEvent} max={max} onClose={() => setAdvancing(false)} onAdvanced={onAdvanced} />}
    </>
  );
}
