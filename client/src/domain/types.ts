// Shapes of the game data served by /api/data/:title. Only fields the tracker reads are listed.

export interface MissionCondition {
  ConditionType: string;
  ConditionId: string;
  Threshold: number;
}

export interface MissionReward {
  Reward: string;
  RewardId: string;
  Value?: number;
}

export interface Mission {
  Id: string;
  /** Present on Motherland missions. Event ranks are derived from `Ranks`. */
  Rank?: number;
  Condition: MissionCondition;
  Reward: MissionReward;
  AbTestConfig?: string;
}

export interface RankInfo {
  Rank: string;
  Missions: string;
  ActiveMissionCount: number;
}

export interface Balance {
  Missions: Mission[];
  Ranks?: RankInfo[];
  [key: string]: unknown;
}

export type TrackerMode = 'main' | 'event';

export interface Resource {
  Id: string;
  Singular: string;
  Plural: string;
}

export interface Industry {
  Id: string;
}

export interface Generator {
  Id: string;
  Name: string;
  IndustryId?: string;
}

export interface Researcher {
  Id: string;
  Name: string;
  ModType: string;
  TargetIds: string[];
  ExpoMultiplier: number;
  ExpoGrowth: number;
  UpgradePower: number;
  CurveModifier: number;
  BasePower: number;
  PlayerRankUnlock: number;
}

export interface GachaScriptCard {
  Id: string;
  Value: number;
}

export interface GachaScript {
  GachaId: string;
  MimicGachaId: string;
  Gold?: number;
  Science?: number;
  Card: GachaScriptCard[];
}

export interface GachaLootTableEntry {
  Id: string;
  Type: string;
}

export interface Experiment {
  Id: string;
  Name?: string;
  IconKey?: string;
}

/** A balance with the lists the text helpers read. Event balances may lack some of them. */
export interface GameBalance extends Balance {
  Generators?: Generator[];
  Resources?: Resource[];
  Industries?: Industry[];
  Researchers?: Researcher[];
  GachaScripts?: GachaScript[];
  GachaLootTable?: GachaLootTableEntry[];
  Experiments?: Experiment[];
}

// The LTESchedule part of the data response, and the events derived from it by domain/schedule.ts.

/** One reward in an Ages schedule reward list, or inside a Motherland milestone rank. */
export interface ScheduleReward {
  Reward: string;
  RewardId: string;
  Value?: number | string;
  [key: string]: unknown;
}

/** A rank of an AdCom milestone track. */
export interface MilestoneRank {
  Rank: number;
  MilestoneReward: ScheduleReward;
  [key: string]: unknown;
}

export interface LteBalanceDatum {
  BalanceId: string;
  DurationHours: number;
  ThemeId: string;
  [key: string]: unknown;
}

/** An event that replaces its slot in the weekly cycle. Times are ISO 8601 in UTC, with or without the Z. */
export interface LteOneOff {
  BalanceId: string;
  ThemeId: string;
  StartTime: string;
  EndTime: string;
  RewardId: string;
  LegacyLteId?: string;
  LeaderboardId?: string;
  LteShortLeaderboardId?: string;
  [key: string]: unknown;
}

/** A repeating weekly rotation of balances between `StartTime` and `EndTime`. */
export interface LteCycle {
  StartDayOfTheWeek: string;
  StartHourUTC: number;
  StartTime: string;
  EndTime: string;
  LteBalanceIds: string[];
  LteRewardIds: string[];
  [key: string]: unknown;
}

export interface LteMilestone {
  MilestoneId: string;
  MilestoneRanks: MilestoneRank[];
}

export interface LteRewardList {
  RewardId: string;
  Rewards: ScheduleReward[];
}

export interface LteScheduleData {
  LteBalanceData: LteBalanceDatum[];
  LteOneOff: LteOneOff[];
  LteSchedule: LteCycle[];
  /** AdCom only. */
  LteMilestones?: LteMilestone[];
  /** Ages only. */
  LteRewards?: LteRewardList[];
  [key: string]: unknown;
}

/** Empty slots appear when an event is opened by `eventOverride`, which has no reward data. */
export type EventRewards = (MilestoneRank | ScheduleReward | undefined)[];

export interface EventInfo {
  LteId: string | number;
  BalanceId: string;
  ThemeId: string;
  StartTimeMillis: number;
  EndTimeMillis: number;
  Rewards: EventRewards;
  LeaderboardId?: string;
  GlobalLeaderboardId?: string;
}

/** One step of a balance's free capsule cycle. The first step is the free capsule of event rank 1. */
export interface GachaFreeCycleEntry {
  ScriptId?: string;
  [key: string]: unknown;
}

export interface GameBalance {
  GachaFreeCycle?: GachaFreeCycleEntry[];
}
