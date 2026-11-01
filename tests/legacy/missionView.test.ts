// Compares the mission screen helpers (tone, icons, rank labels, schedule rewards) with the legacy
// functions, for every mission of every balance and every reward of every schedule.
import { afterAll, describe, expect, it } from 'vitest';
import { createAssetResolver, type AssetResolver } from '@/domain/assets';
import { describeMission, type GameTextContext } from '@/domain/gameText';
import { parseLocalization } from '@/domain/localization';
import { advanceLteToRank, clickMission, createBoard, normalizeAbGroups, type MissionBoard } from '@/domain/missions';
import {
  rankProgress,
  describeScheduleReward,
  hasCalculator,
  missionIconUrl,
  missionRewardIcon,
  missionTone,
  parseRankInput,
  rewardIconUrl
} from '@/domain/missionView';
import { TITLES, type TitleKey } from '@/domain/titles';
import type { GameBalance, ScheduleReward, TrackerMode } from '@/domain/types';
import {
  assetsAvailable,
  createLegacy,
  loadBalances,
  loadCommon,
  loadLocalizationBase64,
  loadSchedule,
  stripHtml,
  TITLE_IDS,
  TITLE_KEYS,
  type Legacy
} from './harness';

const tally = { calculator: 0, tone: 0, missionIcons: 0, rewardIcons: 0, scheduleIcons: 0, scheduleText: 0, rankLabels: 0 };
const anomalies = new Map<string, number>();

function note(kind: string) {
  anomalies.set(kind, (anomalies.get(kind) ?? 0) + 1);
}

afterAll(() => {
  const total = Object.values(tally).reduce((sum, count) => sum + count, 0);
  console.log(`[missionView] ${total} comparisons against legacy (${JSON.stringify(tally)})`);
  for (const [kind, count] of anomalies) {
    console.log(`[missionView] legacy anomaly x${count}: ${kind}`);
  }
});

/** The legacy result, or null (after noting why) when legacy itself throws. */
function legacyValue<T>(label: string, run: () => T): T | null {
  try {
    return run();
  } catch (error) {
    note(`${label} throws ${error instanceof Error ? error.constructor.name : 'an error'}`);
    return null;
  }
}

const modeOf = (balanceId: string): TrackerMode => (balanceId === 'evergreen' ? 'evergreen' : 'lte');
const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

function allScheduleRewards(schedule: ReturnType<typeof loadSchedule>): ScheduleReward[] {
  const rewards: ScheduleReward[] = [];
  for (const list of schedule.LteRewards ?? []) {
    rewards.push(...list.Rewards);
  }
  for (const milestone of schedule.LteMilestones ?? []) {
    for (const rank of milestone.MilestoneRanks) {
      for (const [key, value] of Object.entries(rank)) {
        if (key.includes('MilestoneReward')) rewards.push(value as ScheduleReward);
      }
    }
  }
  return rewards;
}

/** The label legacy showed, built from the numbers the top bar now uses. */
function currentRankLabel(board: MissionBoard): string {
  const { rank, done, total, finished } = rankProgress(board);
  if (finished) {
    return 'Complete!';
  }
  return total ? `${rank} (${done}/${total})` : String(rank);
}

const STUBS = `
  renderMissions = function () {};
  updateMissionButtonTitles = function () {};
`;

/** Plays the same clicks on a legacy page and on a TypeScript board, comparing the rank label after each. */
function compareRankLabels(legacy: Legacy, board: MissionBoard, label: string, seed: number, steps: number) {
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const legacyLabel = () => {
    if (board.mode === 'lte') {
      return legacy.run<string | undefined>('getEventCurrentRankTitle()');
    }
    return legacy.run<string>(
      `(function () {
        const m = missionData[currentMainRank];
        return currentMainRank + ' (' + (m.StartingCount - m.Remaining.length - missionData.Current.Remaining.length) + '/' + m.StartingCount + ')';
      })()`
    );
  };

  const check = (when: string) => {
    tally.rankLabels++;
    // Legacy has no title once every mission is done: it prints "Rank undefined".
    expect(currentRankLabel(board), `${label} ${when}`).toBe(legacyLabel() ?? 'Complete!');
  };

  check('initially');
  for (let step = 0; step < steps; step++) {
    const pool = random() < 0.7 || board.completed.length === 0 ? board.current : board.completed;
    const mission = pool[Math.floor(random() * pool.length)];
    if (!mission) continue;
    clickMission(board, mission.Id);
    legacy.run('clickMission(__id)', { __id: mission.Id });
    check(`after clicking ${mission.Id}`);
  }
}

describe.skipIf(!assetsAvailable).each(TITLE_KEYS)('mission view matches legacy (%s)', (titleKey: TitleKey) => {
  const title = TITLES[titleKey];
  const balances = loadBalances(titleKey);
  const common = loadCommon(titleKey);
  const schedule = loadSchedule(titleKey);
  const localization = loadLocalizationBase64(titleKey);
  const parsed = parseLocalization(localization);
  const runtimeConfig = {
    titleIds: { adcom: TITLE_IDS.adcom, ages: TITLE_IDS.ages },
    assetBaseByTitleId: { [TITLE_IDS.adcom]: '/assets/6bf5', [TITLE_IDS.ages]: 'https://cdn.test/assets/dc4bb/' }
  };
  const legacy = createLegacy(titleKey, { runtimeConfig });
  // Legacy takes an avatar that has no ThemeId for any event whose theme has no duplicate (undefined == undefined),
  // so it shows the wrong avatar. This port does not. Without those avatars legacy and the port agree.
  const avatars = (common['Avatars'] ?? []) as { UnlockLocation?: { ThemeId?: string } }[];
  const legacyAvatars = avatars.filter((avatar) => !avatar.UnlockLocation || avatar.UnlockLocation.ThemeId !== undefined);
  const themeOf = (balanceId: string) =>
    schedule.LteBalanceData.find((datum) => datum.BalanceId === balanceId)?.ThemeId ?? balanceId.split('-')[0] ?? balanceId;

  function setUp(balanceId: string) {
    const mode = modeOf(balanceId);
    // Legacy writes ranks and indexes into the missions it loads, so it gets its own copies.
    const copies: Record<string, GameBalance> = { ...balances, evergreen: structuredClone(balances['evergreen'] as GameBalance) };
    copies[balanceId] = structuredClone(balances[balanceId] as GameBalance);
    legacy.configure({ balances: copies, balanceId, localization });
    // configure() derives the theme from the balance id. The schedule can name another one.
    legacy.run(
      `${STUBS}
       DATA.common = __common;
       eventScheduleInfo.ThemeId = __theme;
       missionData = { Current: { Remaining: [] }, Completed: { Remaining: [] } };`,
      { __common: { Avatars: legacyAvatars }, __theme: mode === 'lte' ? themeOf(balanceId) : balanceId.split('-')[0] }
    );

    const balance = balances[balanceId] as GameBalance;
    const assets: AssetResolver = createAssetResolver({
      assetBaseByTitleId: runtimeConfig.assetBaseByTitleId,
      title,
      mode,
      balanceId: mode === 'lte' ? balanceId : null,
      themeId: mode === 'lte' ? themeOf(balanceId) : null,
      experiments: balance.Experiments,
      titleIds: runtimeConfig.titleIds
    });
    const ctx: GameTextContext = { balance, localization: parsed, title, mode };
    return { balance, assets, ctx, mode };
  }

  for (const balanceId of Object.keys(balances)) {
    describe(balanceId, () => {
      it('matches the tone and icons of every mission', () => {
        const { balance, assets, ctx } = setUp(balanceId);

        for (const mission of balance.Missions) {
          const label = `${mission.Id} (${titleKey} ${balanceId})`;
          const calculator = legacyValue('renderCalculator', () => legacy.call<string>('renderCalculator', mission));
          if (calculator !== null) {
            tally.calculator++;
            expect(hasCalculator(mission), label).toBe(calculator !== 'Mission type currently unsupported.');
          }

          const button = legacyValue('renderMissionButton', () =>
            legacy.call<string>('renderMissionButton', mission, 'Current', {})
          );
          if (button !== null) {
            const tone = /btn-outline-(danger|success|secondary)/.exec(button)?.[1];
            tally.tone++;
            expect(missionTone(mission), label).toBe(tone === 'secondary' ? 'neutral' : tone);

            const legacyReward = /background-image:url\('([^']*)'\)/.exec(button)?.[1];
            const reward = missionRewardIcon(mission, balance, assets);
            tally.rewardIcons += 2;
            expect(reward.url, `${label} reward icon`).toBe(legacyReward);
            expect(reward.scripted, `${label} scripted`).toBe(button.includes('scriptedRewardInfo'));
          }

          const html = legacyValue('describeMission', () => legacy.call<string>('describeMission', mission));
          const description = describeMission(ctx, mission);
          if (html !== null && description.iconResourceId !== null) {
            const raw = /url\('([^']*)'\)/.exec(html)?.[1] as string;
            tally.missionIcons++;
            expect(missionIconUrl(description, assets), label).toBe(legacy.call<string>('resolveAssetPathByLegacyPath', raw));
          } else {
            tally.missionIcons++;
            expect(missionIconUrl(description, assets), label).toBeNull();
          }
        }
      });

      it('matches the schedule reward icons and text', () => {
        const { assets, ctx } = setUp(balanceId);
        const lteInfo = { BalanceId: balanceId, ThemeId: themeOf(balanceId) };

        for (const reward of allScheduleRewards(schedule)) {
          const label = `${JSON.stringify(reward)} (${titleKey} ${balanceId})`;

          const icon = legacyValue('getRewardIcon', () => legacy.call<string>('getRewardIcon', reward, true));
          if (icon !== null) {
            tally.scheduleIcons++;
            expect(rewardIconUrl(reward, assets), label).toBe(/src='([^']*)'/.exec(icon)?.[1]);
          }

          const html = legacyValue('describeScheduleRankReward', () =>
            legacy.call<string | undefined>('describeScheduleRankReward', reward, true, lteInfo)
          );
          const ours = describeScheduleReward(reward, ctx, assets, lteInfo, { Avatars: common['Avatars'] });

          if (reward.Reward === 'Avatar') {
            // Legacy returns nothing for an avatar it cannot find, and this says so in words.
            tally.scheduleText++;
            if (html === undefined || html === 'Unknown Avatar Reward') {
              expect(ours.text, label).toBe('Unknown Avatar Reward');
            } else if (html !== null) {
              expect(ours.text, label).toBe(stripHtml(html));
              expect(ours.iconUrl, label).toBe(/src='([^']*)'/.exec(html)?.[1]);
            }
          } else if (typeof html === 'string') {
            // The icon wraps the amount again as an overlay, which the text does not repeat.
            const visible = stripHtml(html.replace(/<span class='rewardIconText'>.*?<\/span>/, ''));
            if (visible.includes('undefined')) {
              note('schedule reward text contains "undefined" (legacy has no text for it)');
              continue;
            }
            tally.scheduleText += 2;
            expect(squash(ours.text), label).toBe(squash(visible));
            expect(ours.iconUrl, label).toBe(/src='([^']*)'/.exec(html)?.[1]);
          }
        }
      });

      it('shows the same rank label as legacy while missions are completed', () => {
        const { balance, mode } = setUp(balanceId);
        const abGroups = normalizeAbGroups([], balance);
        const initialize = (rank: number) => {
          legacy.run(
            `currentMainRank = __rank; eventRankTitles = null; initializeAbTestGroups(); initializeMissionData();`,
            { __rank: rank }
          );
        };

        if (mode === 'lte') {
          if (!balance.Ranks?.[1] || balance.Missions.length === 0) return;
          const ok = legacyValue('initializeMissionData', () => initialize(1));
          if (ok === null && !legacy.read<boolean>('typeof missionData.Current !== "undefined"')) return;
          compareRankLabels(legacy, createBoard('lte', balance, abGroups), `${titleKey} ${balanceId}`, 7, 80);

          // Advancing completes everything below a rank. Legacy does it in advanceProgressTo, with a form.
          const board = createBoard('lte', balance, abGroups);
          const rank = Math.min(3, board.rankCount);
          advanceLteToRank(board, rank);
          tally.rankLabels++;
          expect(currentRankLabel(board)).toMatch(new RegExp(`^${rank} \\(`));
          return;
        }

        const lastRank = Math.max(...balance.Missions.map((mission) => mission.Rank ?? 0));
        for (const rank of new Set([1, 2, Math.ceil(lastRank / 2), lastRank])) {
          initialize(rank);
          compareRankLabels(legacy, createBoard('evergreen', balance, abGroups, rank), `${titleKey} main rank ${rank}`, rank, 30);
        }
      });
    });
  }
});

describe('rankProgress', () => {
  const balance = {
    Missions: Array.from({ length: 4 }, (_, index) => ({
      Id: `m${index}`,
      Rank: 1,
      Condition: { ConditionType: 'ResourceQuantity', ConditionId: 'potato', Threshold: 1 },
      Reward: { Reward: 'Resources', RewardId: 'gold', Value: 1 }
    })),
    Ranks: [
      { Rank: '1', Missions: '4', ActiveMissionCount: 3 },
      { Rank: '2', Missions: '4', ActiveMissionCount: 3 }
    ]
  };

  it('counts completed missions of the rank in Motherland', () => {
    const board = createBoard('evergreen', balance, [], 1);
    expect(currentRankLabel(board)).toBe('1 (0/4)');
    clickMission(board, 'm0');
    expect(currentRankLabel(board)).toBe('1 (1/4)');
  });

  it('falls back to the bare rank when the rank has no missions', () => {
    expect(currentRankLabel(createBoard('evergreen', balance, [], 9))).toBe('9');
  });
});

describe('parseRankInput', () => {
  it('accepts whole numbers in range only', () => {
    expect(parseRankInput('5', 10)).toBe(5);
    expect(parseRankInput(' 10 ', 10)).toBe(10);
    for (const bad of ['', '0', '11', '-1', '2.5', 'abc', '1e1']) {
      expect(parseRankInput(bad, 10), bad).toBeNull();
    }
  });
});
