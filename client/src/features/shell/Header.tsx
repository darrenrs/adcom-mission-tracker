import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Settings } from 'lucide-react';
import { useState } from 'react';
import { getCurrentLteInfo, getBasicLteName } from '@/domain/schedule';
import { SettingsSheet } from '@/features/settings/SettingsSheet';
import { navigateStartup } from '@/state/navigation';
import { useSession } from '@/state/store';

const menuItem =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm outline-none data-[highlighted]:bg-raised';

export function Header() {
  const session = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { title, mode, lteInfo, assets, data } = session;

  const liveLte = getCurrentLteInfo(data.schedule, Date.now(), title.isAges);
  const displayName = getBasicLteName(mode === 'evergreen' ? 'main' : (lteInfo?.ThemeId ?? 'main'), title);
  const displayIcon = assets.active(`shared/themeicons/${mode === 'evergreen' ? 'main' : lteInfo?.ThemeId}.png`);
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
            <DropdownMenu.Item className={menuItem} onSelect={() => navigateStartup({ mode: 'evergreen' })}>
              <img src={assets.active('shared/themeicons/main.png')} alt="" className="size-6 object-contain" />
              {getBasicLteName('main', title)}
            </DropdownMenu.Item>
            {liveLte && (
              <DropdownMenu.Item className={menuItem} onSelect={() => navigateStartup({ mode: 'lte' })}>
                <img src={assets.active(`shared/themeicons/${liveLte.ThemeId}.png`)} alt="" className="size-6 object-contain" />
                {getBasicLteName(liveLte.ThemeId, title)}
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <div className="ml-auto flex items-center gap-1">
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

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}
