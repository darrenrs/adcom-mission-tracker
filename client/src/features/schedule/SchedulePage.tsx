import { createContext, useContext, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { DayPicker, UI, useDayPicker, type CalendarDay, type Modifiers, type NavProps } from 'react-day-picker';
import 'react-day-picker/style.css';
import type { AssetResolver } from '@/domain/assets';
import { itemsByDay, overlapsDay, startOfDay } from '@/domain/calendarDays';
import type { EventEntry } from '@/domain/eventList';
import { navigateStartup } from '@/state/navigation';
import { useSession, useTracker } from '@/state/store';
import { dateRange, lteFullName } from './eventLabels';
import { currentEntry, useEventEntries } from './useEventEntries';

interface DayEvents {
  byDay: ReadonlyMap<number, readonly EventEntry[]>;
  assets: AssetResolver;
  onToday: () => void;
}

const DayEventsContext = createContext<DayEvents | null>(null);

/** A calendar day: its number, and the icon of each event running that day. */
function DayButton({ day, modifiers, children, ...props }: { day: CalendarDay; modifiers: Modifiers } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const events = useContext(DayEventsContext);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus();
    }
  }, [modifiers.focused]);
  const running = events?.byDay.get(startOfDay(day.date.getTime())) ?? [];

  return (
    <button ref={ref} {...props} className={`${props.className ?? ''} flex-col gap-0.5 py-1`}>
      <span>{children}</span>
      <span className="flex h-6 items-center justify-center gap-0.5 sm:h-8">
        {running.slice(0, 2).map((entry) => (
          <img
            key={entry.key}
            src={events?.assets.active(`shared/themeicons/${entry.themeId}.png`)}
            alt=""
            loading="lazy"
            className={`${running.length > 1 ? 'size-4 sm:size-5' : 'size-6 sm:size-8'} object-contain`}
          />
        ))}
      </span>
    </button>
  );
}

/** The month arrows with Today between them. Mirrors the day picker's own Nav, plus the Today button. */
function Nav({ onPreviousClick, onNextClick, previousMonth, nextMonth, ...navProps }: NavProps) {
  const { components, classNames, labels } = useDayPicker();
  const events = useContext(DayEventsContext);

  return (
    <nav {...navProps} className={`${navProps.className ?? ''} gap-1`}>
      <components.PreviousMonthButton
        type="button"
        className={classNames[UI.PreviousMonthButton]}
        tabIndex={previousMonth ? undefined : -1}
        aria-disabled={previousMonth ? undefined : true}
        aria-label={labels.labelPrevious(previousMonth)}
        onClick={(event) => previousMonth && onPreviousClick?.(event)}
      >
        <components.Chevron disabled={previousMonth ? undefined : true} className={classNames[UI.Chevron]} orientation="left" />
      </components.PreviousMonthButton>
      <button
        type="button"
        onClick={events?.onToday}
        className="h-control rounded-lg border border-line bg-surface px-4 text-sm font-medium hover:bg-raised"
      >
        Today
      </button>
      <components.NextMonthButton
        type="button"
        className={classNames[UI.NextMonthButton]}
        tabIndex={nextMonth ? undefined : -1}
        aria-disabled={nextMonth ? undefined : true}
        aria-label={labels.labelNext(nextMonth)}
        onClick={(event) => nextMonth && onNextClick?.(event)}
      >
        <components.Chevron disabled={nextMonth ? undefined : true} className={classNames[UI.Chevron]} orientation="right" />
      </components.NextMonthButton>
    </nav>
  );
}

type Found = 'found' | 'not found' | 'unknown';

const DOT_CLASS: Record<Found, string> = { found: 'bg-success', 'not found': 'bg-danger', unknown: 'bg-muted/50' };

function Dot({ source, state }: { source: string; state: Found }) {
  const label = `${source}: ${state}`;
  return <span role="img" aria-label={label} title={label} className={`size-3 rounded-full ${DOT_CLASS[state]}`} />;
}

/** Picks an event from a calendar, or from the list beside it. A row highlights its dates, and Open goes to the event. */
export function SchedulePage() {
  const session = useSession();
  const { assets, localization, title } = session;
  const entries = useEventEntries();
  const apiStatus = useTracker((state) => state.leaderboardStatus);
  const current = currentEntry(session, entries);
  const [selected, setSelected] = useState<Date>(() => new Date(current?.start ?? Date.now()));
  const [month, setMonth] = useState<Date>(selected);
  const [chosenKey, setChosenKey] = useState<string | undefined>(current?.key);
  const list = useRef<HTMLUListElement>(null);

  // Stepped by calendar date, so events across a daylight-saving change keep their later days.
  const byDay = useMemo(() => itemsByDay(entries, (entry) => entry), [entries]);

  const day = startOfDay(selected.getTime());
  const onDay = (entry: EventEntry) => overlapsDay(entry.start, entry.end, day);
  const chosen = entries.find((entry) => entry.key === chosenKey);
  const range = chosen ? { from: new Date(startOfDay(chosen.start)), to: new Date(startOfDay(Math.max(chosen.start, chosen.end - 1))) } : undefined;

  // Opening the page or picking a day puts that day's first event at the top of the list. Only the list scrolls,
  // never the page. It runs again when the leaderboard's events arrive, since they can change the rows.
  useEffect(() => {
    const box = list.current;
    const row = box?.querySelector<HTMLElement>('[data-on-day="true"]');
    if (box && row) {
      box.scrollTop += row.getBoundingClientRect().top - box.getBoundingClientRect().top - 8;
    }
  }, [day, entries]);

  const pickDay = (date: Date) => {
    setSelected(date);
    setMonth(date);
    setChosenKey(byDay.get(startOfDay(date.getTime()))?.[0]?.key);
  };
  const choose = (entry: EventEntry) => {
    setChosenKey(entry.key);
    setMonth(new Date(entry.start));
  };
  const open = (entry: EventEntry) => navigateStartup({ mode: 'lte', at: String(entry.start), view: null });
  const apiState = (entry: EventEntry): Found => (apiStatus !== 'connected' ? 'unknown' : entry.api ? 'found' : 'not found');

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Schedule</h1>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-2">
          <DayEventsContext.Provider value={{ byDay, assets, onToday: () => pickDay(new Date()) }}>
            <DayPicker
              mode="single"
              required
              selected={selected}
              onSelect={(date) => pickDay(date)}
              month={month}
              onMonthChange={setMonth}
              modifiers={{ chosen: range ?? [] }}
              modifiersClassNames={{ chosen: 'bg-accent-soft' }}
              components={{ DayButton, Nav }}
              className="w-full"
              classNames={{ months: 'w-full', month: 'w-full', month_caption: 'rdp-month_caption pl-3', month_grid: 'w-full table-fixed', today: 'font-bold text-accent' }}
              style={
                {
                  '--rdp-accent-color': 'var(--accent)',
                  '--rdp-accent-background-color': 'var(--accent-soft)',
                  '--rdp-day-width': 'auto',
                  '--rdp-day-height': '4.5rem',
                  '--rdp-day_button-width': '100%',
                  '--rdp-day_button-height': '100%',
                  '--rdp-day_button-border-radius': '0.5rem'
                } as CSSProperties
              }
            />
          </DayEventsContext.Provider>
        </div>
        <ul ref={list} aria-label="Events" className="max-h-[70dvh] space-y-1 overflow-y-auto rounded-xl border border-line bg-surface p-2">
          {entries.map((entry) => (
            <li
              key={entry.key}
              data-on-day={onDay(entry)}
              className={`flex items-center gap-1 rounded-lg ${onDay(entry) ? 'ring-1 ring-accent' : ''} ${entry.key === chosenKey ? 'bg-accent-soft' : ''}`}
            >
              <button
                type="button"
                onClick={() => choose(entry)}
                aria-pressed={entry.key === chosenKey}
                aria-current={entry === current ? 'true' : undefined}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-raised aria-[current=true]:bg-raised"
              >
                <img src={assets.active(`shared/themeicons/${entry.themeId}.png`)} alt="" width={40} height={40} loading="lazy" className="size-10 shrink-0 object-contain" />
                <span className="min-w-0">
                  <span className="block text-base font-semibold">{lteFullName(entry.themeId, localization, title)}</span>
                  <span className="block text-sm text-muted">{dateRange(entry.start, entry.end, { year: true })}</span>
                </span>
              </button>
              <span className="flex shrink-0 items-center gap-1.5 px-1">
                <Dot source="Schedule file" state={entry.schedule ? 'found' : 'not found'} />
                <Dot source="Leaderboard API" state={apiState(entry)} />
              </span>
              <button
                type="button"
                onClick={() => open(entry)}
                aria-label={`Open ${lteFullName(entry.themeId, localization, title)}`}
                className="h-control shrink-0 rounded-lg border border-line px-3 text-sm font-medium hover:bg-raised"
              >
                Open
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
