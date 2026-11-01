// Compares the TypeScript asset resolver with the legacy path rewriting, run from master. The paths are
// every shape the legacy page builds from the real balances, plus random combinations of its path parts.
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  createAssetResolver,
  ensurePngFileName,
  looksLikeResearcherAsset,
  mapBalanceIdForAssetPath,
  mapThemeIdForAssetPath,
  type AssetResolver,
  type TitleIds
} from '@/domain/assets';
import { TITLES, type TitleKey } from '@/domain/titles';
import type { GameBalance, LteScheduleData, TrackerMode } from '@/domain/types';
import {
  ASSETS,
  assetsAvailable,
  createLegacy,
  loadBalances,
  loadCommon,
  loadSchedule,
  TITLE_IDS,
  TITLE_KEYS,
  type Legacy
} from './harness';

const counts = { paths: 0, rewritten: 0, directories: 0, experiments: 0, helpers: 0, configs: 0 };
const missingOnDisk = new Map<string, Set<string>>();

interface BaseVariant {
  name: string;
  assetBaseByTitleId: Record<string, string>;
  titleIds?: TitleIds;
}

const BASE_VARIANTS: BaseVariant[] = [
  {
    name: 'title-scoped bases',
    assetBaseByTitleId: { '6bf5': '/assets/6bf5', dc4bb: 'https://cdn.test/assets/dc4bb/' }
  },
  {
    // Bases that do not end in the title id, with extra slashes.
    name: 'plain bases',
    assetBaseByTitleId: { '6bf5': 'https://cdn.test/media', dc4bb: '/media//' }
  },
  { name: 'no bases', assetBaseByTitleId: {} },
  {
    name: 'custom title ids',
    assetBaseByTitleId: { AbCd1: '/assets/AbCd1', ef2: '/assets/ef2' },
    titleIds: { adcom: 'AbCd1', ages: 'ef2' }
  }
];

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ids the page turns into icon file names: the keys that hold resource, generator, researcher, reward and gacha ids.
const ID_KEYS = new Set([
  'Id',
  'ConditionId',
  'RewardId',
  'Resource',
  'ResourceId',
  'MimicGachaId',
  'IconKey',
  'UnlockCostResourceId',
  'GachaId',
  'VisualKey'
]);
const ID_LISTS = ['Resources', 'Generators', 'Researchers', 'Industries', 'Trades', 'GachaLootTable', 'GachaScripts', 'Experiments'];

/** Ids that become icon names. A mission's own id does not, only the ids of its condition and reward. */
function collectBalanceIds(balance: GameBalance, into: Set<string>) {
  for (const list of ID_LISTS) collectIds((balance as Record<string, unknown>)[list], into);
  for (const mission of balance.Missions) {
    into.add(mission.Condition.ConditionId);
    into.add(mission.Reward.RewardId);
  }
}

function collectIds(value: unknown, into: Set<string>) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectIds(item, into));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (ID_KEYS.has(key) && typeof child === 'string' && child) into.add(child);
      else collectIds(child, into);
    }
  }
}

const SHARED_FILES = [
  'calendar.png',
  'switch_ab_test.png',
  'boost_power.png',
  'comrade.png',
  'comrades_per_second.png',
  'crit_chance.png',
  'crit_power.png',
  'discount.png',
  'gold.png',
  'speed.png',
  'trophy.png',
  'card.png',
  'propaganda_boost_off.png',
  'propaganda_boost_on.png',
  'leaderboard-global.png',
  'leaderboard-segment.png',
  'leaderboard-milestone.png',
  'leaderboard-shortboard.png',
  'gold',
  'speed',
  'card'
];

/** Paths relative to `img/<title>/`, in the forms the legacy page builds them. */
function relativePaths(balance: GameBalance, schedule: LteScheduleData, common: Record<string, unknown>, themeDir: string) {
  const ids = new Set<string>(['card', 'upgrade', 'comrade', 'multi-industry', 'propaganda_boost_on', 'darkscience', 'scientist', 'science', 'gold', 'potato']);
  collectBalanceIds(balance, ids);

  const paths = new Set<string>();
  const dirs = ['main', 'event', `event/${themeDir}`, 'shared'];
  for (const id of ids) {
    for (const dir of dirs) {
      paths.add(`${dir}/${id}.png`);
      paths.add(`${dir}/${id}`);
    }
    for (const kind of ['gacha', 'timewarps', 'card', 'experiments', 'blitz', 'surge']) {
      paths.add(`shared/${kind}/${id}.png`);
      paths.add(`shared/${kind}/${id}`);
    }
    paths.add(`shared/card/card-${id}`);
    paths.add(`shared/${id}.png`);
  }

  const themes = new Set<string>(['main', 'evergreen', themeDir]);
  for (const datum of schedule.LteBalanceData) {
    themes.add(datum.ThemeId);
    themes.add(datum.BalanceId);
  }
  for (const oneOff of schedule.LteOneOff) themes.add(oneOff.ThemeId);
  for (const theme of themes) paths.add(`shared/themeicons/${theme}.png`);

  for (const file of SHARED_FILES) paths.add(`shared/${file}`);
  for (const file of ['darkscience.png', 'upgrade.png', 'propaganda_boost_on.png', 'scientist.png']) {
    paths.add(`event/${file}`);
    paths.add(`main/${file}`);
    paths.add(`event/${themeDir}/${file}`);
  }
  for (const id of ['timehack_4', 'timehack_24', 'timehack_1']) {
    paths.add(`shared/timewarps/${id}.png`);
    paths.add(`shared/timewarps/${id}`);
  }
  // Researcher-looking and ordinary file names under the folders that branch on that.
  for (const name of ['RS001.png', 'rs01.png', 'AB12', 'A1.png', 'ABC1.png', 'ZZ99.PNG', 'x.y.png', 'plain', 'AB12.5.png']) {
    for (const dir of ['event', 'main', `event/${themeDir}`]) paths.add(`${dir}/${name}`);
  }

  const avatars = (common['Avatars'] ?? []) as { VisualKey?: string }[];
  for (const avatar of avatars) {
    const key = avatar.VisualKey ?? '';
    paths.add(`shared/avatars/${ensurePngFileName(key)}`);
  }
  return [...paths];
}

const VOCAB = {
  prefix: ['img/{K}/', 'img/{O}/', 'img/{KID}/', 'img/{OID}/', 'img/{OIDUP}/', 'img/', '/img/{K}/', 'https://h.test/img/{K}/', 'foo/img/{K}/', 'img/{K}/../{K}/', 'img//{K}//', 'IMG/{K}/', 'img/{K}/./'],
  first: ['event', 'main', 'shared', 'other', 'event', 'shared', 'main'],
  second: ['timewarps', 'themeicons', 'avatars', 'blitz', 'surge', 'experiments', 'card', 'gacha', 'calendar.png', 'switch_ab_test.png', 'sub', 'effects', 'leaderboard-x'],
  file: [
    'darkscience.png', 'upgrade.png', 'propaganda_boost_on.png', 'propaganda_boost_off.png', 'timehack_4.png', 'timehack',
    'card.png', 'boost_power.png', 'comrades_per_second.png', 'crit_chance.png', 'crit_power.png', 'discount.png', 'speed.png',
    'gold.png', 'trophy.png', 'comrade.png', 'leaderboard-global.png', 'propaganda_a.png', 'RS001.png', 'AB12', 'x.png', 'a b.png',
    'x.png?v=1', 'x.png#frag', 'caf%C3%A9.png', 'Wood.PNG', 'crusade.png', 'fusionarchitecture.png', 'architecture', 'main.png', 'evergreen.png', '.png', 'a.b.c.png'
  ]
};

function randomPaths(count: number, seed: number, titleKey: TitleKey) {
  const random = mulberry32(seed);
  const other = titleKey === 'adcom' ? 'ages' : 'adcom';
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)] as T;
  const fill = (template: string) =>
    template
      .replaceAll('{KID}', TITLE_IDS[titleKey])
      .replaceAll('{OIDUP}', TITLE_IDS[other].toUpperCase())
      .replaceAll('{OID}', TITLE_IDS[other])
      .replaceAll('{K}', titleKey)
      .replaceAll('{O}', other);

  const paths: string[] = [];
  for (let i = 0; i < count; i++) {
    const parts = [pick(VOCAB.first)];
    if (random() < 0.7) parts.push(pick(VOCAB.second));
    if (random() < 0.3) parts.push(pick(VOCAB.second));
    if (random() < 0.9) parts.push(pick(VOCAB.file));
    const prefix = random() < 0.85 ? `img/${titleKey}/` : fill(pick(VOCAB.prefix));
    paths.push(`${fill(prefix)}${parts.join('/')}`);
  }
  // Inputs without an img folder, or with nothing after it, come back unchanged.
  paths.push('', 'img/', 'img', '/img/', `img/${titleKey}`, `img/${titleKey}/`, 'css/x.png', 'data:image/gif;base64,AAAA', 'http://h.test/other/x.png');
  return paths;
}

/** The icons the legacy page shows for a balance, built the way renderMissionButton and describeMission do. */
function pageIconUrls(config: { balance: GameBalance; themeId: string | null }, resolver: AssetResolver): string[] {
  const { balance } = config;
  const urls: string[] = [
    resolver.active('shared/gold.png'),
    resolver.active('shared/comrades_per_second.png'),
    resolver.active('shared/themeicons/main.png'),
    resolver.active(`shared/themeicons/${config.themeId ?? 'main'}.png`),
    resolver.active('event/darkscience.png'),
    resolver.active('main/scientist.png')
  ];
  for (const researcher of balance.Researchers ?? []) urls.push(resolver.iconUrl(`${researcher.Id}.png`));
  // Generators show the resources they make and cost, not their own id (describeGenerator).
  const generators = (balance.Generators ?? []) as { Generate?: { Resource?: string }; Cost?: { Resource: string }[] }[];
  for (const generator of generators) {
    if (generator.Generate?.Resource) urls.push(resolver.iconUrl(`${generator.Generate.Resource}.png`));
    for (const cost of generator.Cost ?? []) urls.push(resolver.iconUrl(`${cost.Resource.toLowerCase()}.png`));
  }
  urls.push(resolver.iconUrl('comrade.png'));

  const scripted = new Map((balance.GachaScripts ?? []).map((script) => [script.GachaId, script.MimicGachaId]));
  for (const mission of balance.Missions) {
    const { Reward: type, RewardId: id } = mission.Reward;
    if (type === 'Gacha') {
      urls.push(resolver.active(`shared/gacha/${scripted.get(id) ?? id}.png`));
    } else if (type === 'Resources' && id === 'gold') {
      urls.push(resolver.active('shared/gold.png'));
    } else if (type === 'Resources' && id.includes('timehack_')) {
      urls.push(resolver.active(`shared/timewarps/${id}.png`));
    } else if (type === 'Resources' || type === 'Experiment') {
      urls.push(resolver.experimentIcon(id) || resolver.active(`main/${id}.png`));
    }

    const { ConditionType: kind, ConditionId: conditionId } = mission.Condition;
    if (kind === 'ResourceQuantity' || kind === 'ResourcesEarnedSinceSubscription' || kind === 'TradesSinceSubscription') {
      urls.push(resolver.iconUrl(`${conditionId}.png`));
    }
  }
  urls.push(resolver.iconUrl('upgrade.png', resolver.active('event')), resolver.iconUrl('card.png', resolver.active('shared')));
  return urls.filter(Boolean);
}

interface Config {
  mode: TrackerMode;
  balanceId: string | null;
  themeId: string | null;
  balance: GameBalance;
  label: string;
}

describe.skipIf(!assetsAvailable).each(TITLE_KEYS)('asset paths match legacy (%s)', (titleKey) => {
  const title = TITLES[titleKey];
  const balances = loadBalances(titleKey);
  const common = loadCommon(titleKey);
  const schedule = loadSchedule(titleKey);
  const evergreen = balances['evergreen'] as GameBalance;

  const themeOf = (balanceId: string) =>
    schedule.LteBalanceData.find((datum) => datum.BalanceId === balanceId)?.ThemeId ?? balanceId.split('-')[0] ?? balanceId;

  const configs: Config[] = [
    // Main mode ignores the event on display, so give it one.
    { mode: 'evergreen', balanceId: null, themeId: null, balance: evergreen, label: 'evergreen' },
    { mode: 'evergreen', balanceId: Object.keys(balances).find((id) => id !== 'evergreen') ?? null, themeId: 'crusade', balance: evergreen, label: 'main with event info' },
    { mode: 'lte', balanceId: null, themeId: null, balance: evergreen, label: 'event without info' },
    ...Object.keys(balances)
      .filter((id) => id !== 'evergreen')
      .map((id): Config => ({ mode: 'lte', balanceId: id, themeId: themeOf(id), balance: balances[id] as GameBalance, label: id }))
  ];

  const stateFor = (base: BaseVariant) => {
    const ids = base.titleIds ?? { adcom: TITLE_IDS.adcom, ages: TITLE_IDS.ages };
    const titleId = ids[titleKey];
    const legacy = createLegacy(titleKey, { runtimeConfig: { titleIds: ids, assetBaseByTitleId: base.assetBaseByTitleId } });
    const data = { ...balances, common: { Avatars: common['Avatars'] } };
    legacy.run(
      `DATA = __data; ACTIVE_TITLE = __key; ACTIVE_TITLE_ID = __titleId; IsAges = __key === 'ages';`,
      { __data: data, __key: titleKey, __titleId: titleId }
    );
    return { legacy, titleId, ids };
  };

  const configure = (legacy: Legacy, config: Config) => {
    legacy.run(
      `currentMode = __mode;
       eventScheduleInfo = __info;
       if (__mode === 'event') { DATA.event = __balance; }`,
      {
        __mode: config.mode === 'lte' ? 'event' : 'main',
        __info: config.balanceId || config.themeId ? { BalanceId: config.balanceId ?? undefined, ThemeId: config.themeId ?? undefined, EndTimeMillis: 1 } : {},
        __balance: config.balance
      }
    );
  };

  const resolverFor = (config: Config, base: BaseVariant, titleId: string, ids: TitleIds): AssetResolver =>
    createAssetResolver({
      assetBaseByTitleId: base.assetBaseByTitleId,
      title: { ...title, titleId },
      mode: config.mode,
      balanceId: config.balanceId,
      themeId: config.themeId,
      experiments: config.balance.Experiments,
      titleIds: ids
    });

  function compareList(label: string, items: string[], ours: (item: string) => string, legacyBatch: string, legacy: Legacy) {
    const expected = legacy.run<string[]>(legacyBatch, { __items: items });
    const mismatches: { item: string; ours: string; legacy: string }[] = [];
    items.forEach((item, index) => {
      const actual = ours(item);
      if (actual !== expected[index]) mismatches.push({ item, ours: actual, legacy: expected[index] as string });
    });
    expect(mismatches.slice(0, 5), label).toEqual([]);
    return items.length;
  }

  for (const base of BASE_VARIANTS) {
    it(`resolves every path like legacy (${base.name})`, () => {
      for (const config of configs) {
        const { legacy, titleId, ids } = stateFor(base);
        configure(legacy, config);
        const resolver = resolverFor(config, base, titleId, ids);
        const themeDir = config.themeId ?? 'crusade';

        const relative = relativePaths(config.balance, schedule, common, themeDir);
        const prefixes = [`img/${titleKey}/`, `img/${titleKey === 'adcom' ? 'ages' : 'adcom'}/`];
        const real = prefixes.flatMap((prefix) => relative.map((rel) => `${prefix}${rel}`));
        const fuzz = randomPaths(1500, 1000 + configs.indexOf(config), titleKey);
        const all = [...real, ...fuzz];

        counts.paths += compareList(
          `${config.label} legacyPath`,
          all,
          (item) => resolver.legacyPath(item),
          '__items.map((p) => resolveAssetPathByLegacyPath(p))',
          legacy
        );

        // The comparison means little if nothing is rewritten, so check that most paths were.
        const rewritten = all.filter((item) => resolver.legacyPath(item) !== item).length;
        counts.rewritten += rewritten;
        if (Object.keys(base.assetBaseByTitleId).length > 0) {
          expect(rewritten, `${config.label} rewritten paths`).toBeGreaterThan(real.length / 2);
        } else {
          // Only the local images are served without a base.
          expect(rewritten, `${config.label} rewritten paths`).toBeLessThan(all.length / 20);
        }

        // active() and forTitle() build the legacy path first.
        counts.paths += compareList(
          `${config.label} active`,
          relative,
          (rel) => resolver.active(rel),
          '__items.map((rel) => assetUrlForActive(rel))',
          legacy
        );
        counts.paths += compareList(
          `${config.label} forTitle`,
          relative,
          (rel) => resolver.forTitle('ages', rel),
          "__items.map((rel) => assetUrlForTitleSegment('ages', rel))",
          legacy
        );

        // Directories, and the icon URL legacy got by adding a file name and rewriting afterwards.
        for (const override of ['', 'img/x/custom', `img/${titleKey}/event`, `img/${titleKey}/shared`]) {
          legacy.run('__override = __value', { __value: override });
          expect(resolver.imageDirectory(override), `${config.label} directory ${override}`).toBe(
            legacy.run<string>('getImageDirectory(__override)')
          );
          counts.directories++;

          const files = [...new Set(relative.map((rel) => rel.split('/').pop() as string))].slice(0, 400);
          counts.paths += compareList(
            `${config.label} iconUrl ${override}`,
            files,
            (file) => resolver.iconUrl(file, override),
            `__items.map((file) => resolveAssetPathByLegacyPath(getImageDirectory(__override) + '/' + file))`,
            legacy
          );
        }

        // Experiments: every id, in other cases, and ones that are not there.
        const experimentIds: (string | number | null | undefined)[] = ['', '  ', 'nope', null, undefined, 0, 164, ' EX164 ', 'ex164'];
        for (const experiment of config.balance.Experiments ?? []) {
          experimentIds.push(experiment.Id, experiment.Id.toLowerCase(), ` ${experiment.Id} `);
        }
        for (const rewardId of experimentIds) {
          const expected = legacy.run<string>('getExperimentIconPathByRewardId(__id)', { __id: rewardId });
          expect(resolver.experimentIcon(rewardId), `${config.label} experiment ${String(rewardId)}`).toBe(expected);
          counts.experiments++;
        }
        counts.configs++;
      }
    });
  }

  it('helper functions agree', () => {
    const legacy = createLegacy(titleKey);
    const balanceIds = ['', 'main', 'evergreen', 'crusade-bal-1', 'crusade', 'a-b-c', 'x-bal-3', 'Main'];
    for (const id of balanceIds) {
      expect(mapBalanceIdForAssetPath(id), id).toBe(legacy.call('mapBalanceIdForAssetPath', id));
      counts.helpers++;
    }

    const themeIds = [...balanceIds, ...Object.values(title.themeIdOverrides), ...Object.keys(title.themeIdOverrides), ...schedule.LteBalanceData.map((d) => d.ThemeId)];
    for (const id of themeIds) {
      expect(mapThemeIdForAssetPath(id, title.themeIdOverrides), id).toBe(legacy.call('mapThemeIdForAssetPath', id));
      counts.helpers++;
    }

    for (const name of ['', 'a', 'a.png', 'a.PNG', 'a.jpg', 'png', '.png', 'RS001', 'RS001.png', 'AB12', 'A1', 'ab123.png', 'a.b', 'ABC.png', 'AB1', 'AB12.5.png', 'AB12 .png']) {
      expect(ensurePngFileName(name), name).toBe(legacy.call('ensurePngFileName', name));
      expect(looksLikeResearcherAsset(name), name).toBe(legacy.call('looksLikeResearcherAsset', name));
      counts.helpers += 2;
    }
  });

  it('the active title table matches legacy config', () => {
    const legacy = createLegacy(titleKey);
    expect(title.themeIdOverrides).toEqual(JSON.parse(legacy.run<string>('JSON.stringify(THEME_ID_OVERRIDES)')));
    expect(title.themeDuplicateOverrides).toEqual(JSON.parse(legacy.run<string>('JSON.stringify(THEME_DUPLICATE_OVERRIDES)')));
  });

  it('resolved URLs point at files that exist in the asset data (diagnostic)', () => {
    // Uses the first base variant, whose URL maps straight onto the asset folder. Only paths built from
    // the data count: legacy path rules are the reference, so a miss here means missing art, not a port error.
    const base = BASE_VARIANTS[0] as BaseVariant;
    const titleId = TITLE_IDS[titleKey];
    const root = `${base.assetBaseByTitleId[titleId]?.replace(/\/+$/, '')}/`;
    const missing = missingOnDisk.get(titleKey) ?? new Set<string>();
    missingOnDisk.set(titleKey, missing);
    let checked = 0;

    for (const config of configs) {
      const resolver = createAssetResolver({
        assetBaseByTitleId: base.assetBaseByTitleId,
        title,
        mode: config.mode,
        balanceId: config.balanceId,
        themeId: config.themeId,
        experiments: config.balance.Experiments
      });
      const files = pageIconUrls(config, resolver);
      for (const url of files) {
        if (!url.startsWith(root)) continue;
        checked++;
        const relativeFile = url.slice(root.length);
        if (!fs.existsSync(path.join(ASSETS, titleId, relativeFile))) {
          missing.add(`${config.label}: ${relativeFile}`);
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });
});

describe('deliberate differences from legacy', () => {
  const resolver = createAssetResolver({
    assetBaseByTitleId: { '6bf5': '/assets/6bf5' },
    title: { key: 'adcom', titleId: '6bf5', themeIdOverrides: {}, themeDuplicateOverrides: {} },
    mode: 'evergreen'
  });

  it('serves the local images from a configurable base', () => {
    expect(resolver.legacyPath('img/adcom/shared/calendar.png')).toBe('/img/calendar.png');
    const mounted = createAssetResolver({
      assetBaseByTitleId: {},
      title: { key: 'adcom', titleId: '6bf5', themeIdOverrides: {}, themeDuplicateOverrides: {} },
      mode: 'evergreen',
      localImageBase: '/tracker/img/'
    });
    expect(mounted.legacyPath('img/adcom/shared/calendar.png')).toBe('/tracker/img/calendar.png');
  });

  it('does not take a file named like an Object method for a remapped icon', () => {
    expect(resolver.legacyPath('img/adcom/shared/constructor')).toBe('/assets/6bf5/common/constructor');
  });
});

afterAll(() => {
  console.info(`asset comparisons against legacy: ${JSON.stringify(counts)}`);
  for (const [key, missing] of missingOnDisk) {
    console.info(`${key}: ${missing.size} resolved icon paths have no file in the asset data`);
    if (process.env.ASSET_MISSING_LIST) console.info([...missing].sort().join('\n'));
  }
});
