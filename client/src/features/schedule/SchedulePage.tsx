import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import type { EventEntry } from '@/domain/eventList';
import { navigateStartup } from '@/state/navigation';
import { useSession } from '@/state/store';
import { dateRange, lteFullName } from './eventLabels';
import { currentEntry, useEventEntries } from './useEventEntries';

const DAY = 86_400_000;

function startOfDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Picks an event from a calendar, or from the list beside it. */
export function SchedulePage() {
  const session = useSession();
  const { assets, localization, title } = session;
  const entries = useEventEntries();
  const current = currentEntry(session, entries);
  const [selected, setSelected] = useState<Date | undefined>(() => new Date(current?.start ?? Date.now()));
  const list = useRef<HTMLUListElement>(null);

  const eventDays = useMemo(() => {
    const days: Date[] = [];
    for (const entry of entries) {
      for (let day = startOfDay(entry.start); day < entry.end; day += DAY) {
        days.push(new Date(day));
      }
    }
    return days;
  }, [entries]);

  const day = selected ? startOfDay(selected.getTime()) : null;
  const onDay = (entry: EventEntry) => day !== null && entry.start < day + DAY && entry.end > day;

  // Picking a day brings its first event into view in the list.
  useEffect(() => {
    list.current?.querySelector('[data-on-day="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [day]);

  const open = (entry: EventEntry) => navigateStartup({ mode: 'lte', at: String(entry.start + 1), view: null });

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Schedule</h1>
      <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="justify-self-center rounded-xl border border-line bg-surface p-2 md:justify-self-start">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={setSelected}
            defaultMonth={selected}
            modifiers={{ event: eventDays }}
            modifiersClassNames={{ event: 'font-bold text-accent underline underline-offset-4' }}
            style={{ '--rdp-accent-color': 'var(--accent)', '--rdp-accent-background-color': 'var(--accent-soft)' } as CSSProperties}
          />
        </div>
        <ul ref={list} aria-label="Events" className="max-h-[70dvh] space-y-1 overflow-y-auto rounded-xl border border-line bg-surface p-2">
          {entries.map((entry) => (
            <li key={entry.key} data-on-day={onDay(entry)}>
              <button
                type="button"
                onClick={() => open(entry)}
                aria-current={entry === current ? 'true' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-raised aria-[current=true]:bg-raised ${onDay(entry) ? 'ring-1 ring-accent' : ''}`}
              >
                <img src={assets.active(`shared/themeicons/${entry.themeId}.png`)} alt="" width={40} height={40} loading="lazy" className="size-10 shrink-0 object-contain" />
                <span className="min-w-0">
                  <span className="block text-base font-semibold">{lteFullName(entry.themeId, localization, title)}</span>
                  <span className="block text-sm text-muted">{dateRange(entry.start, entry.end)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
