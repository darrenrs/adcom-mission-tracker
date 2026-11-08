import { getBasicLteName } from '@/domain/schedule';
import type { TitleConfig } from '@/domain/titles';

/** The event's full name, such as "Spooky State", falling back to the short menu name. */
export function lteFullName(themeId: string, localization: Readonly<Record<string, string>>, title: TitleConfig): string {
  return localization[`lte.${themeId}.name`] ?? getBasicLteName(themeId, title);
}

const RANGE = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const RANGE_WITH_YEAR = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** An event's dates in the browser's language. The schedule list adds the year; the banner leaves it out. */
export function dateRange(start: number, end: number, { year = false }: { year?: boolean } = {}): string {
  return (year ? RANGE_WITH_YEAR : RANGE).formatRange(new Date(start), new Date(end));
}
