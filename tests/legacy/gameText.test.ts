// Compares the TypeScript game text (mission, reward and researcher descriptions, names and
// lookups) with the legacy functions, for every mission and researcher of every balance.
import { afterAll, describe, expect, it } from 'vitest';
import {
  describeMission,
  describeReward,
  getGenerator,
  getIndustryByResource,
  getResearcherBasicDetails,
  getResource,
  getResourceByIndustry,
  getValueForResearcherLevel,
  industryName,
  researcherName,
  resourceName,
  rewardText,
  type GameTextContext
} from '@/domain/gameText';
import { parseLocalization } from '@/domain/localization';
import { TITLES, type TitleKey } from '@/domain/titles';
import type { GameBalance, Mission, TrackerMode } from '@/domain/types';
import {
  assetsAvailable,
  createLegacy,
  loadBalances,
  loadLocalizationBase64,
  stripHtml,
  TITLE_KEYS,
  type Legacy
} from './harness';

let comparisons = 0;
const tally = { missions: 0, rewards: 0, researchers: 0 };
/** Places where legacy throws or prints "undefined" for real data. */
const anomalies = new Map<string, number>();

function note(kind: string) {
  anomalies.set(kind, (anomalies.get(kind) ?? 0) + 1);
}

afterAll(() => {
  console.log(`[gameText] ${comparisons} comparisons against legacy (${JSON.stringify(tally)})`);
  for (const [kind, count] of anomalies) {
    console.log(`[gameText] legacy anomaly x${count}: ${kind}`);
  }
});

type Outcome<T> = { value: T } | { error: string };

function attempt<T>(run: () => T): Outcome<T> {
  try {
    return { value: run() };
  } catch (error) {
    return { error: error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error) };
  }
}

/** The legacy result, or null (after noting why) when legacy itself throws. */
function legacyValue<T>(label: string, run: () => T): T | null {
  const result = attempt(run);
  if ('error' in result) {
    note(`${label} throws ${result.error.split(':')[0]}`);
    return null;
  }
  return result.value;
}

function modeOf(balanceId: string): TrackerMode {
  return balanceId === 'evergreen' ? 'evergreen' : 'lte';
}

/** Where legacy's icon URL points, in the terms `describeMission` reports. */
function iconSourceOfUrl(directory: string, mode: TrackerMode): 'balance' | 'shared' | 'event' {
  if (directory === 'shared') return 'shared';
  if (directory === 'event') return 'event';
  if (directory === 'main' && mode === 'evergreen') return 'balance';
  if (directory.startsWith('event/') && mode === 'lte') return 'balance';
  throw new Error(`unexpected icon directory ${directory}`);
}

const ICON = /^<span style="background-image: url\('img\/[a-z]+\/(.*)\/([^/]+)\.png'\);" class="resourceIcon">&nbsp;<\/span> /;

function checkMission(legacy: Legacy, ctx: GameTextContext, mission: Mission) {
  const label = `${mission.Id} (${ctx.title.key} ${ctx.mode})`;
  const ours = describeMission(ctx, mission);
  tally.missions++;
  const unknown = ours.iconResourceId === null;

  // With the icon switched off, legacy prints a space and then the text.
  const plain = legacyValue(`describeMission ${mission.Condition.ConditionType}`, () => legacy.call<string>('describeMission', mission, 'none'));
  if (plain !== null) {
    comparisons++;
    expect(stripHtml(plain), label).toBe(unknown ? ours.text : ` ${ours.text}`);
  }

  // With icons on, the span names the icon file and folder.
  const withIcon = legacyValue('describeMission with icon', () => legacy.call<string>('describeMission', mission));
  if (withIcon !== null && !unknown) {
    comparisons += 3;
    const match = ICON.exec(withIcon);
    expect(match, label).not.toBeNull();
    expect(match?.[2], label).toBe(ours.iconResourceId);
    expect(iconSourceOfUrl(match?.[1] ?? '', ctx.mode), label).toBe(ours.iconSource);
    expect(stripHtml(withIcon), label).toBe(`  ${ours.text}`);
  }

  for (const includeCapType of [true, false]) {
    const reward = legacyValue('describeReward', () => legacy.call<string>('describeReward', mission.Reward, includeCapType));
    if (reward !== null) {
      comparisons++;
      tally.rewards++;
      expect(rewardText(describeReward(ctx, mission.Reward, includeCapType)), `${label} reward`).toBe(stripHtml(reward));
    }
  }

  if (ours.text.includes('undefined')) note('mission text contains "undefined" (same in legacy)');
}

function context(key: TitleKey, balance: GameBalance, mode: TrackerMode, localization: Record<string, string>): GameTextContext {
  return { balance, localization, title: TITLES[key], mode };
}

describe.skipIf(!assetsAvailable)('game text matches legacy', () => {
  for (const key of TITLE_KEYS) {
    // The suite body still runs when skipped, so it must not read missing files.
    const balances = assetsAvailable ? loadBalances(key) : {};
    const localization = assetsAvailable ? loadLocalizationBase64(key) : '';
    const parsed = parseLocalization(localization);

    describe(key, () => {
      const legacy = createLegacy(key);

      it('parses the localization the way legacy does', () => {
        legacy.configure({ balances, balanceId: 'evergreen', localization });
        const expected = legacy.read<Record<string, string>>('ENGLISH_MAP');
        const entries = Object.entries(expected);
        expect(entries.length).toBeGreaterThan(1000);
        comparisons += entries.length + 1;
        expect(Object.keys(parsed).length).toBe(entries.length);
        for (const [k, v] of entries) {
          expect(parsed[k], k).toBe(v);
        }
      });

      for (const [balanceId, balance] of Object.entries(balances)) {
        const mode = modeOf(balanceId);

        describe(balanceId, () => {
          const ctx = context(key, balance, mode, parsed);
          const configure = () => legacy.configure({ balances, balanceId, localization });

          it('describes every mission and reward', () => {
            configure();
            for (const mission of balance.Missions) {
              checkMission(legacy, ctx, mission);
            }
          });

          it('describes every researcher', () => {
            configure();
            for (const researcher of balance.Researchers ?? []) {
              const expected = legacyValue('getResearcherBasicDetails', () => legacy.call<string>('getResearcherBasicDetails', researcher));
              if (expected !== null) {
                comparisons++;
                tally.researchers++;
                expect(getResearcherBasicDetails(ctx, researcher), researcher.Id).toBe(expected);
                if (expected.includes('undefined')) note('researcher details contain "undefined" (same in legacy)');
              }

              for (const level of [0, 1, 2, 3, 4, 5, 10, 25, 100]) {
                comparisons++;
                expect(getValueForResearcherLevel(researcher, level), `${researcher.Id} level ${level}`).toBe(
                  legacy.call('getValueForResearcherLevel', researcher, level)
                );
              }

              const expectedName = legacyValue('researcherName', () => legacy.call<string>('researcherName', researcher.Id));
              if (expectedName !== null) {
                comparisons += 2;
                expect(researcherName(ctx, researcher.Id), researcher.Id).toBe(expectedName);
                expect(researcherName(ctx, researcher), researcher.Id).toBe(expectedName);
              }
            }
          });

          it('names and finds resources, industries and generators', () => {
            configure();
            const resources = balance.Resources ?? [];
            const ids = new Set<string>([
              ...resources.map((r) => r.Id),
              ...(balance.Experiments ?? []).flatMap((e) => [e.Id, e.Id.toLowerCase(), e.IconKey ?? '']),
              ...balance.Missions.flatMap((m) => [m.Reward.RewardId, m.Condition.ConditionId]),
              'gold', 'science', 'scientist', 'darkscience', 'comrade', 'timehack_4', 'timehack_30', 'unknown_thing'
            ]);

            for (const id of ids) {
              for (const plural of [true, false]) {
                comparisons++;
                expect(resourceName(ctx, id, plural), `${id} ${plural}`).toBe(legacy.call('resourceName', id, plural));
              }
            }

            for (const industry of balance.Industries ?? []) {
              comparisons += 3;
              expect(industryName(ctx, industry.Id), industry.Id).toBe(legacy.call('industryName', industry.Id));
              expect(industryName(ctx, industry.Id.toUpperCase()), industry.Id).toBe(legacy.call('industryName', industry.Id.toUpperCase()));
              expect(getResourceByIndustry(ctx, industry.Id)?.Id, industry.Id).toBe(
                legacy.call<{ Id: string }>('getResourceByIndustry', industry.Id).Id
              );
            }

            for (const resource of resources) {
              comparisons++;
              expect(getIndustryByResource(ctx, resource.Id)?.Id, resource.Id).toBe(
                legacy.call<{ Id: string } | undefined>('getIndustryByResource', resource.Id)?.Id
              );
              comparisons++;
              expect(getResource(ctx, resource.Id)?.Singular, resource.Id).toBe(
                legacy.call<{ Singular: string } | undefined>('getResource', resource.Id)?.Singular
              );
            }

            for (const generator of balance.Generators ?? []) {
              comparisons++;
              expect(getGenerator(ctx, generator.Id)?.Name, generator.Id).toBe(
                legacy.call<{ Name: string } | undefined>('getGenerator', generator.Id)?.Name
              );
            }

            for (const id of ['', 'nope', 'constructor', '__proto__']) {
              comparisons++;
              expect(getResource(ctx, id)?.Id, id).toBeUndefined();
            }
          });
        });
      }
    });
  }

  it('does not carry lookups from one balance to the next', () => {
    for (const key of TITLE_KEYS) {
      const balances = Object.values(loadBalances(key));
      const first = balances[0] as GameBalance;
      const second = balances.find((b) => b.Resources?.[0] && b.Resources[0].Id !== first.Resources?.[0]?.Id) ?? first;
      const localization = parseLocalization(loadLocalizationBase64(key));
      for (const balance of [first, second, first]) {
        const ctx = context(key, balance, 'evergreen', localization);
        for (const resource of balance.Resources ?? []) {
          comparisons++;
          expect(getResource(ctx, resource.Id)).toBe(resource);
        }
        for (const generator of balance.Generators ?? []) {
          expect(getGenerator(ctx, generator.Id)).toBe(generator);
        }
      }
    }
  });
});

describe('researcher levels with a custom value', () => {
  const researcher = {
    Id: 'RS0001', Name: 'Test', ModType: 'GeneratorPayoutMultiplier', TargetIds: ['farmer'],
    ExpoMultiplier: 2, ExpoGrowth: 1.5, UpgradePower: 0.1, CurveModifier: 0.2, BasePower: 3, PlayerRankUnlock: 1
  };

  it('matches legacy for the other levels, including the common researcher special case', () => {
    const legacy = createLegacy('adcom');
    const commons = { ...researcher, ModType: 'GenManagerAndSpeedMult' };
    const flat = { ...researcher, ExpoMultiplier: 0 };
    for (const r of [researcher, commons, flat]) {
      for (const level of [0, 1, 2, 7, 50, undefined as unknown as number]) {
        comparisons++;
        expect(getValueForResearcherLevel(r, level)).toBe(legacy.call('getValueForResearcherLevel', r, level));
      }
    }
  });
});

describe('parseLocalization edge cases', () => {
  const legacy = createLegacy('adcom');
  const encode = (text: string) => Buffer.from(text, 'utf8').toString('base64');

  function legacyMap(base64: string): Record<string, string> {
    legacy.configure({ balances: { evergreen: { Missions: [] } }, balanceId: 'evergreen', localization: base64 });
    return legacy.read('ENGLISH_MAP');
  }

  const cases: Record<string, string> = {
    'multibyte text': 'a=café\nb=中文\nc=\u{1F600} emoji\nd=People’s',
    'crlf and blank lines': 'a=1\r\n\r\nb=2\r\nc=3',
    'equals inside the value': 'a=b=c\nd==e\nf= spaced ',
    'lines without equals': 'no equals here\na=1\n=\n=empty key\nkey=',
    'duplicate keys': 'a=1\na=2',
    'byte order mark': '﻿first=1\nsecond=2',
    'unicode line separators': 'a=1 2=x\nb=2 c=3',
    'empty input': '',
    'only newlines': '\n\n\n'
  };

  for (const [name, text] of Object.entries(cases)) {
    it(`matches legacy: ${name}`, () => {
      comparisons++;
      const expected = legacyMap(encode(text));
      expect({ ...parseLocalization(encode(text)) }).toEqual({ ...expected });
    });
  }

  it('differs from legacy on invalid UTF-8: replaces bytes instead of throwing', () => {
    const invalid = Buffer.concat([Buffer.from('a=ok\nb='), Buffer.from([0xff, 0xfe]), Buffer.from('\n')]).toString('base64');
    expect(() => legacyMap(invalid)).toThrow();
    expect(parseLocalization(invalid).a).toBe('ok');
    expect(parseLocalization(invalid).b).toBe('��');
  });

  it('keeps names such as "constructor" and "__proto__" as plain entries', () => {
    const map = parseLocalization(encode('constructor=c\n__proto__=p\nhasOwnProperty=h'));
    expect(map.constructor).toBe('c');
    expect(map.hasOwnProperty).toBe('h');
    expect(Object.keys(map)).toEqual(['constructor', '__proto__', 'hasOwnProperty']);
    expect(parseLocalization(encode('a=1')).toString).toBeUndefined();
  });
});
