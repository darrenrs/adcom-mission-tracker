import { useState } from 'react';
import { getBasicLteName } from '@/domain/schedule';
import { dateRange, lteFullName } from '@/features/schedule/eventLabels';
import { useSession } from '@/state/store';

/** The event or Motherland banner as the top of the page background, fading into it, with the name, description and dates over it. */
export function PageBanner() {
  const { text: ctx, assets, mode, lteInfo, title } = useSession();
  const [broken, setBroken] = useState<string | null>(null);
  const themeId = lteInfo?.ThemeId ?? '';
  const isEvent = mode === 'lte';
  const name = isEvent ? lteFullName(themeId, ctx.localization, title) : getBasicLteName('main', title);
  const description = isEvent ? ctx.localization[`lte.${themeId}.desc`] : undefined;
  // The banner sits beside the icon folder, one level up from where the icons are.
  const icon = assets.iconUrl('banner.png');
  const url = icon.includes('/icon/banner.png') ? icon.replace('/icon/banner.png', '/banner.png') : '';
  const banner = url && broken !== url ? url : '';
  const dates = isEvent && lteInfo && lteInfo.StartTimeMillis !== lteInfo.EndTimeMillis ? dateRange(lteInfo.StartTimeMillis, lteInfo.EndTimeMillis) : '';

  if (!name) {
    return null;
  }
  return (
    <header data-testid="page-banner" className="relative grid">
      {banner && (
        <>
          <img
            src={banner}
            alt=""
            data-testid="banner-image"
            onError={() => setBroken(url)}
            className="col-start-1 row-start-1 block h-auto max-h-80 min-h-44 w-full object-cover object-top sm:max-h-88 lg:max-h-70"
          />
          <span aria-hidden className="col-start-1 row-start-1 bg-linear-to-r from-canvas/80 via-canvas/40 to-transparent" />
          <span aria-hidden className="col-start-1 row-start-1 bg-linear-to-b from-transparent via-transparent to-canvas" />
        </>
      )}
      <div className="col-start-1 row-start-1 mx-auto w-full max-w-360 self-end px-3 pt-16 pb-9 [text-shadow:0_1px_10px_var(--canvas),0_0_3px_var(--canvas)] sm:px-4">
        <div className="flex items-start justify-between gap-3">
          <h1
            data-testid="banner-title"
            className="min-w-0 font-display text-4xl leading-none font-semibold tracking-wide break-words uppercase scale-y-110 origin-bottom-left sm:text-5xl"
          >
            {name}
          </h1>
          {dates && (
            <p data-testid="banner-dates" className="shrink-0 text-right text-xs font-semibold sm:text-sm">
              {dates}
            </p>
          )}
        </div>
        {description && <p className="mt-2 text-sm font-medium break-words sm:text-base">{description}</p>}
      </div>
    </header>
  );
}
