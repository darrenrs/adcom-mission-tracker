import { useMemo } from 'react';
import { navigateStartup } from '@/state/navigation';
import { useSession } from '@/state/store';
import { lteFullName } from './eventLabels';

const NOT_EVENTS = new Set(['evergreen', 'main', 'common']);

/** Every event balance in the data, by name, so any of them can be opened outside the schedule. */
export function AllEventsPage() {
  const { data, assets, localization, title, lteInfo, mode } = useSession();
  const balances = useMemo(
    () =>
      Object.keys(data.balances)
        .filter((id) => !NOT_EVENTS.has(id))
        .map((id) => {
          const themeId = id.split('-')[0] ?? id;
          return { id, themeId, name: lteFullName(themeId, localization, title) };
        })
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id, undefined, { numeric: true })),
    [data, localization, title]
  );

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">All Events</h1>
      <ul aria-label="All events" className="grid gap-1 rounded-xl border border-line bg-surface p-2 sm:grid-cols-2 lg:grid-cols-3">
        {balances.map((balance) => (
          <li key={balance.id}>
            <button
              type="button"
              aria-current={mode === 'lte' && lteInfo?.BalanceId === balance.id ? 'true' : undefined}
              onClick={() => navigateStartup({ balance: balance.id, view: null })}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-raised aria-[current=true]:bg-raised"
            >
              <img src={assets.active(`shared/themeicons/${balance.themeId}.png`)} alt="" width={32} height={32} loading="lazy" className="size-8 shrink-0 object-contain" />
              <span className="min-w-0">
                <span className="block font-medium">{balance.name}</span>
                <span className="block text-sm text-muted">{balance.id}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
