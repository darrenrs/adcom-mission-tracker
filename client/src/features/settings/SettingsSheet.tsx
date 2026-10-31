import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { parseRankInput } from '@/domain/missionView';
import { getBasicEventName } from '@/domain/schedule';
import { navigateStartup } from '@/state/navigation';
import { useSession, useTracker, type ThemeSetting } from '@/state/store';

const primaryButton = 'min-h-11 rounded-lg bg-accent px-4 text-sm font-medium text-white dark:text-black';
const quietButton = 'min-h-11 rounded-lg border border-line px-4 text-sm font-medium hover:bg-raised';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

interface SegmentedProps<T extends string> {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange(value: T): void;
}

/** Radio buttons that look like a segmented control, so arrow keys and screen readers work natively. */
function Segmented<T extends string>({ legend, value, options, onChange }: SegmentedProps<T>) {
  const name = useId();
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-lg bg-raised p-1">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="flex min-h-11 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium text-muted peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const ON_OFF = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' }
] as const;

const THEMES: { value: ThemeSetting; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
];

function AdvanceToRank({ onDone }: { onDone: () => void }) {
  const { mode, balance, eventInfo, assets } = useSession();
  const advanceEvent = useTracker((state) => state.advanceEvent);
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);
  const id = useId();
  const max = balance.Ranks?.length ?? 0;
  const iconUrl = assets.active(`shared/themeicons/${mode === 'main' ? 'main' : (eventInfo?.ThemeId ?? 'main')}.png`);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const rank = parseRankInput(value, max);
    if (rank === null) {
      setInvalid(true);
      return;
    }
    if (mode === 'main') {
      navigateStartup({ rank: String(rank) });
    } else {
      advanceEvent(rank);
    }
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <p id={`${id}-help`} className="text-sm text-muted">
        Please enter the rank to navigate to.
        {mode === 'event' && ' All previous missions will be marked as complete.'}
      </p>
      <div className="flex items-center gap-2">
        <img src={iconUrl} alt="" width={32} height={32} className="size-8 shrink-0 object-contain" />
        <label htmlFor={id} className="sr-only">
          Rank to advance to
        </label>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          placeholder={`Range: [1, ${max}]`}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error ${id}-help` : `${id}-help`}
          onChange={(event) => {
            setValue(event.target.value);
            setInvalid(false);
          }}
          className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 text-base"
        />
        <button type="submit" className={primaryButton}>
          OK
        </button>
      </div>
      {invalid && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          Invalid rank. Enter a whole number from 1 to {max}.
        </p>
      )}
    </form>
  );
}

interface ResetRowProps {
  label: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm(): void;
}

/** A destructive action that needs a second click, in place, before it runs. */
function ResetRow({ label, description, confirmLabel, onConfirm }: ResetRowProps) {
  const [armed, setArmed] = useState(false);

  return (
    <div className="space-y-2">
      <p className="text-sm">{description}</p>
      {armed ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onConfirm} className="min-h-11 rounded-lg bg-danger px-4 text-sm font-medium text-white dark:text-black">
            {confirmLabel}
          </button>
          <button type="button" onClick={() => setArmed(false)} className={quietButton}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="min-h-11 rounded-lg border border-danger bg-danger-soft px-4 text-sm font-medium text-danger"
        >
          {label}
        </button>
      )}
    </div>
  );
}

function SettingsBody({ onClose }: { onClose: () => void }) {
  const session = useSession();
  const settings = useTracker((state) => state.settings);
  const setTheme = useTracker((state) => state.setTheme);
  const setIcons = useTracker((state) => state.setIcons);
  const setListView = useTracker((state) => state.setListView);
  const resetMode = useTracker((state) => state.resetMode);
  const resetAll = useTracker((state) => state.resetAll);
  const { mode, eventInfo, title } = session;

  const modeName =
    mode === 'main' ? getBasicEventName('main', title) : `${getBasicEventName(eventInfo?.ThemeId ?? 'main', title)} event`;

  return (
    <div className="space-y-4">
      <Group title="Theme">
        <Segmented legend="Theme" value={settings.theme} options={THEMES} onChange={setTheme} />
      </Group>

      <Group title="Mission icons">
        <Segmented
          legend="Mission icons"
          value={settings.icons === 'none' ? 'off' : 'on'}
          options={[...ON_OFF]}
          onChange={(value) => setIcons(value === 'on' ? 'image' : 'none')}
        />
      </Group>

      <Group title="List view">
        <Segmented
          legend="List view"
          value={settings.listView ? 'on' : 'off'}
          options={[...ON_OFF]}
          onChange={(value) => setListView(value === 'on')}
        />
      </Group>

      <Group title="Advance to rank">
        <AdvanceToRank onDone={onClose} />
      </Group>

      <Group title="Reset data">
        <p className="text-sm text-muted">Please exercise caution here. Once you delete data, it cannot be restored.</p>
        <ResetRow
          label={`Reset ${modeName} data`}
          description={<strong>{modeName} data</strong>}
          confirmLabel={`Yes, reset ${modeName} data`}
          onConfirm={() => {
            resetMode();
            onClose();
          }}
        />
        <ResetRow
          label="Reset all tracker data"
          description={
            <>
              <strong>All tracker data</strong> for both games. Other idlegametools.com tools are not affected.
            </>
          }
          confirmLabel="Yes, reset all tracker data"
          onConfirm={() => {
            resetAll();
            onClose();
          }}
        />
      </Group>
    </div>
  );
}

/** Settings as a side sheet: from the bottom on phones, from the right on larger screens. */
export function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl border-t border-line bg-surface shadow-xl transition-transform duration-200 starting:translate-y-full sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-96 sm:rounded-none sm:border-t-0 sm:border-l sm:starting:translate-x-full sm:starting:translate-y-0">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
            <Dialog.Title className="text-base font-semibold">Settings</Dialog.Title>
            <Dialog.Close
              aria-label="Close settings"
              className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink"
            >
              <X aria-hidden size={20} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Display options, rank shortcuts and data reset.</Dialog.Description>
          <div className="overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <SettingsBody onClose={() => onOpenChange(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
