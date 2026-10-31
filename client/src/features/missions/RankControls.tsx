import { ChevronLeft, ChevronRight, Hash, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { parseRankInput } from '@/domain/missionView';
import { navigateStartup } from '@/state/navigation';

const iconButton =
  'flex size-11 items-center justify-center rounded-lg border border-line text-muted hover:bg-raised hover:text-ink aria-expanded:bg-raised aria-expanded:text-ink';

function RankJump({ max, onClose }: { max: number; onClose: () => void }) {
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
    navigateStartup({ rank: String(rank) });
  };

  return (
    <form onSubmit={submit} className="flex basis-full flex-wrap items-center gap-2" noValidate>
      <label htmlFor={id} className="sr-only">
        Rank to jump to, from 1 to {max}
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
        className="h-11 w-32 rounded-lg border border-line bg-canvas px-3 text-base"
      />
      <button type="submit" className="h-11 rounded-lg bg-accent px-4 text-sm font-medium text-white dark:text-black">
        Go
      </button>
      <button type="button" aria-label="Close rank jump" onClick={onClose} className={iconButton}>
        <X aria-hidden size={18} />
      </button>
      {invalid && (
        <p id={`${id}-error`} role="alert" className="basis-full text-sm text-danger">
          Invalid rank. Enter a whole number from 1 to {max}.
        </p>
      )}
    </form>
  );
}

/** Previous, jump and next for Motherland. The jump field opens inline, where the buttons are. */
export function RankControls({ rank, max }: { rank: number; max: number }) {
  const [jumping, setJumping] = useState(false);

  return (
    <>
      <div className="ml-auto flex items-center gap-1.5">
        {rank > 1 && (
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
          aria-label="Jump to a specific rank"
          title="Jump to a specific rank"
          aria-expanded={jumping}
          onClick={() => setJumping((open) => !open)}
          className={iconButton}
        >
          <Hash aria-hidden size={18} />
        </button>
        {rank < max && (
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
      {jumping && <RankJump max={max} onClose={() => setJumping(false)} />}
    </>
  );
}
