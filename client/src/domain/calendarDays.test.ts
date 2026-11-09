import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { itemsByDay, nextDay, overlapsDay, startOfDay } from './calendarDays';

// A US time zone, where clocks went forward on 9 March 2025 and back on 2 November 2025.
const originalTz = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'America/Los_Angeles';
});
// Workers can run other test files afterwards, so the time zone goes back.
afterAll(() => {
  if (originalTz === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTz;
  }
});

const local = (month: number, day: number, hour = 0) => new Date(2025, month - 1, day, hour).getTime();
const HOUR = 3_600_000;

describe('calendar days across daylight-saving changes', () => {
  it('runs in a time zone that changes its clocks', () => {
    // Otherwise the tests below would pass without testing anything.
    expect(local(3, 10) - local(3, 9)).toBe(23 * HOUR);
    expect(local(11, 3) - local(11, 2)).toBe(25 * HOUR);
  });

  it('steps to the next midnight, whatever the length of the day', () => {
    expect(nextDay(local(3, 8, 12))).toBe(local(3, 9));
    expect(nextDay(local(3, 9, 12))).toBe(local(3, 10));
    expect(nextDay(local(11, 2, 12))).toBe(local(11, 3));
    expect(startOfDay(local(3, 10, 14))).toBe(local(3, 10));
  });

  it('keeps an event on every day it runs, after the clocks go forward or back', () => {
    // Winter Motherland: 6 March 9:00 to 10 March 14:00, across the March change.
    const spring = { start: local(3, 6, 9), end: local(3, 10, 14) };
    // An event across the November change.
    const autumn = { start: local(10, 31, 9), end: local(11, 4, 14) };
    const days = itemsByDay([spring, autumn], (item) => item);
    for (const day of [6, 7, 8, 9, 10]) {
      expect(days.get(local(3, day)), `March ${day}`).toEqual([spring]);
    }
    for (const [month, day] of [[10, 31], [11, 1], [11, 2], [11, 3], [11, 4]] as const) {
      expect(days.get(local(month, day)), `${month}/${day}`).toEqual([autumn]);
    }
    expect(days.size).toBe(10);
  });

  it('treats the change day as the 23 or 25 hours it really has', () => {
    // Starts 30 minutes into 10 March: not on 9 March, which ends after 23 hours.
    expect(overlapsDay(local(3, 10) + HOUR / 2, local(3, 12), local(3, 9, 12))).toBe(false);
    // Starts in the last hour of 2 November, which has 25 hours.
    expect(overlapsDay(local(11, 2) + 24.5 * HOUR, local(11, 5), local(11, 2, 12))).toBe(true);
  });
});
