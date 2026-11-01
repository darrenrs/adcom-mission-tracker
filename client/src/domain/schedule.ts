// Event schedule maths, ported from public/mission-tracker.js. tests/legacy/schedule.test.ts runs both
// versions over the real schedules and compares every result.

import { upperCaseFirstLetter } from './format';
import type { LteInfo, EventRewards, LteCycle, LteOneOff, LteScheduleData } from './types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOUR_MILLIS = 3600000;

/** Keeps the `maxSize` values with the lowest priority. `pop` returns the highest of those first. */
export class PriorityQueue<T> {
  private readonly heap: T[] = [];
  private readonly top = 0;

  /** With `maxSize` 0 the queue is unbounded. */
  constructor(
    readonly maxSize: number,
    private readonly priorityFunction: (value: T) => number
  ) {}

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  peek(): T | undefined {
    return this.heap[this.top];
  }

  push(...values: T[]): number {
    for (const value of values) {
      if (this.maxSize <= 0 || this.size() < this.maxSize || this.priority(this.peek() as T) > this.priority(value)) {
        this.heap.push(value);
        this.siftUp();
      }
    }
    while (this.maxSize > 0 && this.size() > this.maxSize) {
      this.pop();
    }
    return this.size();
  }

  pop(): T | undefined {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > this.top) {
      this.swap(this.top, bottom);
    }
    this.heap.pop();
    this.siftDown();
    return poppedValue;
  }

  replace(value: T): T | undefined {
    const replacedValue = this.peek();
    this.heap[this.top] = value;
    this.siftDown();
    return replacedValue;
  }

  private priority(value: T): number {
    return this.priorityFunction(value);
  }

  private greaterIndex(i: number, j: number): boolean {
    return this.priority(this.heap[i] as T) > this.priority(this.heap[j] as T);
  }

  private swap(i: number, j: number): void {
    const first = this.heap[i] as T;
    this.heap[i] = this.heap[j] as T;
    this.heap[j] = first;
  }

  private siftUp(): void {
    let node = this.size() - 1;
    while (node > this.top && this.greaterIndex(node, this.parent(node))) {
      this.swap(node, this.parent(node));
      node = this.parent(node);
    }
  }

  private siftDown(): void {
    let node = this.top;
    while (
      (this.left(node) < this.size() && this.greaterIndex(this.left(node), node)) ||
      (this.right(node) < this.size() && this.greaterIndex(this.right(node), node))
    ) {
      const maxChild =
        this.right(node) < this.size() && this.greaterIndex(this.right(node), this.left(node))
          ? this.right(node)
          : this.left(node);
      this.swap(node, maxChild);
      node = maxChild;
    }
  }

  private parent(i: number): number {
    return ((i + 1) >>> 1) - 1;
  }

  private left(i: number): number {
    return (i << 1) + 1;
  }

  private right(i: number): number {
    return (i + 1) << 1;
  }
}

/** Cleans up HH's date format (such as `EndTime`) and returns millis from Epoch. */
export function getScheduleTimeMillis(hhDateString: string): number {
  // Without the Z the string would be read as local time.
  const iso = hhDateString.slice(-1) !== 'Z' ? `${hhDateString}Z` : hhDateString;
  return new Date(iso).getTime();
}

/** Returns a dictionary like `{ 'crusade-bal-1': 100, 'power-bal-20': 3 }`. */
export function getHoursPerBalanceId(schedule: LteScheduleData): Record<string, number> {
  const hoursPerBalanceType: Record<string, number> = {};

  for (const balance of schedule.LteBalanceData) {
    hoursPerBalanceType[balance.BalanceId] = balance.DurationHours;
  }

  return hoursPerBalanceType;
}

/**
 * Returns just the rank rewards for a reward id: the milestone ranks on AdCom, the reward list on Ages.
 * Legacy crashes on an unknown id. An empty list is returned here.
 */
export function getMilestoneRewardsById(
  rewardId: string | undefined,
  schedule: LteScheduleData,
  isAges: boolean
): EventRewards {
  if (!isAges) {
    return schedule.LteMilestones?.find((r) => r.MilestoneId === rewardId)?.MilestoneRanks ?? [];
  }
  return schedule.LteRewards?.find((r) => r.RewardId === rewardId)?.Rewards ?? [];
}

function hoursFor(hoursPerBalanceId: Record<string, number>, balanceId: string | undefined): number {
  return balanceId === undefined ? NaN : (hoursPerBalanceId[balanceId] ?? NaN);
}

export function updateSoonestOneOff(
  oneOffLte: LteOneOff,
  now: number,
  soonestLtes: PriorityQueue<LteInfo>,
  mostRecentLte: PriorityQueue<LteInfo>,
  oneOffHours: Set<number>,
  schedule: LteScheduleData,
  isAges: boolean
): void {
  const startTimeMillis = getScheduleTimeMillis(oneOffLte.StartTime);
  const endTimeMillis = getScheduleTimeMillis(oneOffLte.EndTime);
  oneOffHours.add(endTimeMillis);

  for (
    const fakeEndTime = new Date(endTimeMillis);
    fakeEndTime.getTime() > startTimeMillis;
    fakeEndTime.setUTCHours(fakeEndTime.getUTCHours() - 1)
  ) {
    oneOffHours.add(fakeEndTime.getTime());
  }

  // Non-legacy one-offs don't have a unique identifier, so the end time's timestamp is used.
  const lteId = oneOffLte.LegacyLteId || endTimeMillis;

  const event: LteInfo = {
    LteId: lteId,
    BalanceId: oneOffLte.BalanceId,
    ThemeId: oneOffLte.ThemeId,
    StartTimeMillis: startTimeMillis,
    EndTimeMillis: endTimeMillis,
    Rewards: getMilestoneRewardsById(oneOffLte.RewardId, schedule, isAges),
    LeaderboardId: oneOffLte.LteShortLeaderboardId,
    GlobalLeaderboardId: oneOffLte.LeaderboardId
  };

  if (now < endTimeMillis) {
    soonestLtes.push(event);
  } else {
    // In the past, but might be more recent than the best guess. The queue keeps the lowest end time, so
    // this is really the oldest past one-off: legacy behaviour, which only matters when nothing is upcoming.
    mostRecentLte.push(event);
  }
}

export function updateSoonestCycle(
  cycle: LteCycle,
  now: number,
  soonestLtes: PriorityQueue<LteInfo>,
  oneOffHours: Set<number>,
  hoursPerBalanceId: Record<string, number>,
  schedule: LteScheduleData,
  isAges: boolean
): void {
  // Get the first StartTime of the event (increase days from StartTime until we hit StartDayOfTheWeek)
  const goalDayOfWeek = DAYS.indexOf(cycle.StartDayOfTheWeek);
  const firstStartTime = new Date(getScheduleTimeMillis(cycle.StartTime));

  if (goalDayOfWeek === -1) {
    console.error(`ERROR: Cannot understand day of week: ${cycle.StartDayOfTheWeek}`);
    return;
  }
  // Legacy never leaves the day search below when StartTime does not parse.
  if (Number.isNaN(firstStartTime.getTime())) {
    return;
  }

  while (firstStartTime.getUTCDay() !== goalDayOfWeek) {
    firstStartTime.setUTCDate(firstStartTime.getUTCDate() + 1);
  }

  firstStartTime.setUTCHours(cycle.StartHourUTC);

  // From the first start time, calculate the first end time, then step through the end times until now < EndTime.
  const balanceIds = cycle.LteBalanceIds;
  let curCycleIndex = 0;
  let ltesFound = 0;
  const curEndTime = new Date(firstStartTime);
  let durationHours = hoursFor(hoursPerBalanceId, balanceIds[0]);
  curEndTime.setUTCHours(curEndTime.getUTCHours() + durationHours);
  const durationMillis = durationHours * HOUR_MILLIS;

  const cycleEndTime = getScheduleTimeMillis(cycle.EndTime);

  while (curEndTime.getTime() <= cycleEndTime && ltesFound < soonestLtes.maxSize) {
    // Move forward one week at a time until it's not replaced with a one-off.
    while (oneOffHours.has(curEndTime.getTime()) || oneOffHours.has(curEndTime.getTime() - durationMillis)) {
      curEndTime.setUTCDate(curEndTime.getUTCDate() + 7);
    }

    const balanceId = balanceIds[curCycleIndex % balanceIds.length];
    durationHours = hoursFor(hoursPerBalanceId, balanceId);
    const nextBalanceId = balanceIds[(curCycleIndex + 1) % balanceIds.length];
    const nextDurationHours = hoursFor(hoursPerBalanceId, nextBalanceId);

    if (balanceId !== undefined && now < curEndTime.getTime() && curEndTime.getTime() < cycleEndTime) {
      ltesFound += 1;

      const rewardId = cycle.LteRewardIds[curCycleIndex % cycle.LteRewardIds.length];
      // Legacy crashes when the schedule names a balance it has no data for. Such an event is left out here.
      const balanceData = schedule.LteBalanceData.find((bal) => bal.BalanceId === balanceId);
      const curStartTime = new Date(curEndTime);
      curStartTime.setUTCHours(curStartTime.getUTCHours() - durationHours);

      if (balanceData) {
        soonestLtes.push({
          LteId: curEndTime.getTime(),
          BalanceId: balanceId,
          ThemeId: balanceData.ThemeId,
          StartTimeMillis: curStartTime.getTime(),
          EndTimeMillis: curEndTime.getTime(),
          Rewards: getMilestoneRewardsById(rewardId, schedule, isAges)
        });
      }
    }

    const hourDifference = nextDurationHours - durationHours;
    curEndTime.setUTCDate(curEndTime.getUTCDate() + 7);
    curEndTime.setUTCHours(curEndTime.getUTCHours() + hourDifference);

    curCycleIndex += 1;
  }
}

/**
 * The soonest events whose end time is after `now`, soonest first. At most `maxLteCount` are searched,
 * and the list is cut after the last new theme, but never below `minLteCount`.
 */
export function getSoonestLteInfos(
  schedule: LteScheduleData,
  now: number,
  isAges: boolean,
  minLteCount = 10,
  maxLteCount = 20
): LteInfo[] {
  // Search events where EndTime > Now and keep the ones with the lowest EndTime.
  const soonestLtes = new PriorityQueue<LteInfo>(maxLteCount, (value) => value.EndTimeMillis);
  // The most recent concluded event no matter what, as a failsafe
  const mostRecentLte = new PriorityQueue<LteInfo>(1, (value) => value.EndTimeMillis);

  // oneOffHours holds each hour (millis from Epoch) contained in all one-offs, so cycles can see where one interrupts.
  const oneOffHours = new Set<number>();

  for (const oneOffLte of schedule.LteOneOff) {
    updateSoonestOneOff(oneOffLte, now, soonestLtes, mostRecentLte, oneOffHours, schedule, isAges);
  }

  const currentCycles = schedule.LteSchedule.filter((cycle) => now < getScheduleTimeMillis(cycle.EndTime));
  const hoursPerBalanceId = getHoursPerBalanceId(schedule);

  for (const cycle of currentCycles) {
    updateSoonestCycle(cycle, now, soonestLtes, oneOffHours, hoursPerBalanceId, schedule, isAges);
  }

  // Popping goes from latest to soonest, so each goes to the front.
  const results: LteInfo[] = [];
  while (soonestLtes.size() > 0) {
    results.unshift(soonestLtes.pop() as LteInfo);
  }

  // Cut after the last new theme: the least needed to see every theme, or at least `minLteCount`.
  const foundThemes = new Set<string>();
  let lastNewIndex = 0;

  results.forEach((result, index) => {
    if (!foundThemes.has(result.ThemeId)) {
      foundThemes.add(result.ThemeId);
      lastNewIndex = index;
    }
  });

  if (results.length > 0) {
    return results.slice(0, Math.max(minLteCount, lastNewIndex + 1));
  }

  const failsafe = mostRecentLte.pop();
  return failsafe ? [failsafe] : [];
}

/** The event running at `now`, or the next to end. `undefined` only for a schedule with no events at all. */
export function getCurrentLteInfo(schedule: LteScheduleData, now: number, isAges: boolean): LteInfo | undefined {
  return getSoonestLteInfos(schedule, now, isAges, 1, 1)[0];
}

export interface ThemeNames {
  /** Canonical theme id to the id the game uses elsewhere (Ages only in practice). */
  themeIdOverrides: Readonly<Record<string, string>>;
  /** Event names in the nav menu for themes whose id reads poorly. */
  themeIdTitleOverrides: Readonly<Record<string, string>>;
}

// Own properties only, so a theme named like an Object method cannot return a function.
function lookup(map: Readonly<Record<string, string>>, key: string): string | undefined {
  return Object.hasOwn(map, key) ? map[key] : undefined;
}

/** The name shown for a theme or balance id (`crusade-bal-1`, `crusade`, `main`, `evergreen`). */
export function getBasicLteName(themeIdInput: string, title: ThemeNames): string {
  let themeId = themeIdInput.toLowerCase();

  if (themeId.includes('-bal-')) {
    themeId = themeId.substring(0, themeId.indexOf('-bal-'));
  }

  if (themeId === 'evergreen' || themeId === 'main') {
    return lookup(title.themeIdTitleOverrides, 'main') ?? '';
  }

  themeId = lookup(title.themeIdOverrides, themeId) || themeId;
  themeId = lookup(title.themeIdTitleOverrides, themeId) || themeId;
  return upperCaseFirstLetter(themeId);
}
