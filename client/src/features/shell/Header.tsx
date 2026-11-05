import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CalendarDays, Check, ChevronDown, List, Settings } from 'lucide-react';
import { useState } from 'react';
import { rankProgress } from '@/domain/missionView';
import { getCurrentLteInfo, getBasicLteName } from '@/domain/schedule';
import { SettingsSheet } from '@/features/settings/SettingsSheet';
import type { LteInfo } from '@/domain/types';
import { navigate, navigateStartup, useView, type ViewName } from '@/state/navigation';
import { useSession } from '@/state/store';
import { RankBar } from './RankBar';
import { RankControls } from './RankControls';

function Indicator() {
  return (
    <DropdownMenu.ItemIndicator className="ml-auto">
      <Check aria-hidden size={16} />
    </DropdownMenu.ItemIndicator>
  );
}

/** Which menu option matches what is on screen. An event opened from the calendar matches none of them. */
function menuSelection(view: ViewName, mode: string, lteInfo: LteInfo | null, liveLte: LteInfo | undefined): string {
  if (view === 'schedule' || view === 'events') {
    return view;
  }
  if (mode === 'evergreen') {
    return 'evergreen';
  }
  return liveLte && lteInfo?.EndTimeMillis === liveLte.EndTimeMillis && lteInfo.BalanceId === liveLte.BalanceId ? 'live' : '';
}

const menuItem =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm outline-none data-[highlighted]:bg-raised';

export function Header() {
  const session = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const { title, mode, lteInfo, assets, data } = session;

  const liveLte = getCurrentLteInfo(data.schedule, Date.now(), title.isAges);
  const displayName = getBasicLteName(mode === 'evergreen' ? 'main' : (lteInfo?.ThemeId ?? 'main'), title);
  const displayIcon = assets.active(`shared/themeicons/${mode === 'evergreen' ? 'main' : lteInfo?.ThemeId}.png`);
  const otherGame = title.isAges ? 'adcom' : 'ages';
  const selected = menuSelection(useView(), mode, lteInfo, liveLte);

  return (
    <header className="mx-auto w-full max-w-360">
      <div className="grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 px-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,20rem)_minmax(0,1fr)] sm:gap-2 sm:px-4">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger aria-label={`Mode: ${displayName}`} className="flex min-h-11 max-w-full min-w-0 items-center gap-2 justify-self-start rounded-lg px-1 font-semibold hover:bg-raised sm:px-2">
            <img src={displayIcon} alt="" className="size-7 shrink-0 object-contain" />
            <span className="hidden truncate sm:inline">{displayName}</span>
            <ChevronDown aria-hidden size={16} className="shrink-0 text-muted" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={4}
              className="z-30 min-w-56 rounded-xl border border-line bg-surface p-1 shadow-lg"
            >
              <DropdownMenu.RadioGroup value={selected}>
                <DropdownMenu.RadioItem value="evergreen" className={menuItem} onSelect={() => navigateStartup({ mode: 'evergreen', view: null })}>
                  <img src={assets.active('shared/themeicons/main.png')} alt="" className="size-6 object-contain" />
                  {getBasicLteName('main', title)}
                  <Indicator />
                </DropdownMenu.RadioItem>
                {liveLte && (
                  <DropdownMenu.RadioItem value="live" className={menuItem} onSelect={() => navigateStartup({ mode: 'lte', view: null })}>
                    <img src={assets.active(`shared/themeicons/${liveLte.ThemeId}.png`)} alt="" className="size-6 object-contain" />
                    {getBasicLteName(liveLte.ThemeId, title)}
                    <Indicator />
                  </DropdownMenu.RadioItem>
                )}
                <DropdownMenu.Separator className="my-1 h-px bg-line" />
                <DropdownMenu.RadioItem value="schedule" className={menuItem} onSelect={() => navigate({ view: 'schedule', mission: null })}>
                  <CalendarDays aria-hidden size={24} className="text-muted" />
                  Schedule
                  <Indicator />
                </DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="events" className={menuItem} onSelect={() => navigate({ view: 'events', mission: null })}>
                  <List aria-hidden size={24} className="text-muted" />
                  All Events
                  <Indicator />
                </DropdownMenu.RadioItem>
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <RankBar open={rankOpen} onToggle={() => setRankOpen((open) => !open)} />

        <div className="flex items-center justify-self-end sm:gap-1">
          <button
            type="button"
            onClick={() => navigateStartup({ title: otherGame })}
            title={`Switch to ${title.isAges ? 'AdVenture Communist' : 'AdVenture Ages'}`}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-raised"
          >
            <img src={assets.forTitle(otherGame, 'shared/themeicons/main.png')} alt="Switch game" className="size-7 object-contain" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink"
          >
            <Settings aria-hidden size={22} />
          </button>
        </div>

      </div>
      {rankOpen && <RankControls progress={rankProgress(session.board)} onClose={() => setRankOpen(false)} />}

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}
