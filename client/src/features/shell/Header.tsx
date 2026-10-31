import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Settings } from 'lucide-react';
import { useState } from 'react';
import { getCurrentEventInfo, getBasicEventName } from '@/domain/schedule';
import { SettingsSheet } from '@/features/settings/SettingsSheet';
import { navigateStartup } from '@/state/navigation';
import { useSession, useTracker } from '@/state/store';

const menuItem =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm outline-none data-[highlighted]:bg-raised';

export function Header() {
  const session = useSession();
  const switchTitle = useTracker((state) => state.switchTitle);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { title, mode, eventInfo, assets, data } = session;

  const liveEvent = getCurrentEventInfo(data.schedule, Date.now(), title.isAges);
  const displayName = getBasicEventName(mode === 'main' ? 'main' : (eventInfo?.ThemeId ?? 'main'), title);
  const displayIcon = assets.active(`shared/themeicons/${mode === 'main' ? 'main' : eventInfo?.ThemeId}.png`);
  const otherGame = title.isAges ? 'adcom' : 'ages';

  return (
    <header className="mx-auto flex h-14 w-full max-w-360 items-center gap-2 px-3 sm:px-4">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg px-2 font-semibold hover:bg-raised">
          <img src={displayIcon} alt="" className="size-7 shrink-0 object-contain" />
          <span className="truncate">{displayName}</span>
          <ChevronDown aria-hidden size={16} className="shrink-0 text-muted" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={4}
            className="z-30 min-w-56 rounded-xl border border-line bg-surface p-1 shadow-lg"
          >
            <DropdownMenu.Item className={menuItem} onSelect={() => navigateStartup({ mode: 'main' })}>
              <img src={assets.active('shared/themeicons/main.png')} alt="" className="size-6 object-contain" />
              {getBasicEventName('main', title)}
            </DropdownMenu.Item>
            {liveEvent && (
              <DropdownMenu.Item className={menuItem} onSelect={() => navigateStartup({ mode: 'event' })}>
                <img src={assets.active(`shared/themeicons/${liveEvent.ThemeId}.png`)} alt="" className="size-6 object-contain" />
                {getBasicEventName(liveEvent.ThemeId, title)}
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => void switchTitle()}
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

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}
