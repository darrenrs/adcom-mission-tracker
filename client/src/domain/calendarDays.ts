// Calendar days in the viewer's own time zone. A day is not always 24 hours: where clocks change for daylight
// saving, one day a year has 23 hours and another 25. So days are stepped by calendar date, never by adding 24 hours.

/** Midnight at the start of the day `time` falls on. */
export function startOfDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Midnight at the start of the next day: 23, 24 or 25 hours after `startOfDay(time)`. */
export function nextDay(time: number): number {
  const date = new Date(startOfDay(time));
  date.setDate(date.getDate() + 1);
  return date.getTime();
}

/** Whether something running from `start` to `end` overlaps the day `time` falls on. */
export function overlapsDay(start: number, end: number, time: number): boolean {
  return start < nextDay(time) && end > startOfDay(time);
}

/** Each item under the midnight of every day it overlaps, the way the calendar looks days up. */
export function itemsByDay<T>(items: readonly T[], span: (item: T) => { start: number; end: number }): Map<number, T[]> {
  const days = new Map<number, T[]>();
  for (const item of items) {
    const { start, end } = span(item);
    for (let day = startOfDay(start); day < end; day = nextDay(day)) {
      days.set(day, [...(days.get(day) ?? []), item]);
    }
  }
  return days;
}
