// Where each game image lives. The legacy page wrote `img/<title>/...` paths into its HTML and rewrote them
// in the browser afterwards (resolveAssetPathByLegacyPath and the DOM observer). Here one resolver does that
// up front. tests/legacy/assets.test.ts compares it with the real legacy function on every path the page uses.

import type { Experiment, TrackerMode } from './types';

export const LOCAL_SHARED_IMAGE_ALLOWLIST: ReadonlySet<string> = new Set(['calendar.png', 'switch_ab_test.png']);

export const SHARED_COMMON_ICON_MAP: ReadonlySet<string> = new Set([
  'boost_power.png',
  'comrade.png',
  'comrades_per_second.png',
  'crit_chance.png',
  'crit_power.png',
  'discount.png',
  'gold.png',
  'speed.png',
  'trophy.png'
]);

export const SHARED_EFFECT_ICON_REMAP: Readonly<Record<string, string>> = {
  'card.png': 'effects/cards.png',
  'boost_power.png': 'effects/output.png',
  'crit_chance.png': 'effects/crit.png',
  'comrades_per_second.png': 'effects/flag.png',
  'crit_power.png': 'effects/power.png',
  'discount.png': 'effects/price.png',
  'speed.png': 'effects/speed.png'
};

const DEFAULT_TITLE_IDS: TitleIds = { adcom: '6bf5', ages: 'dc4bb' };

export interface TitleIds {
  adcom: string;
  ages: string;
}

/** The part of TitleConfig (domain/titles.ts) the resolver reads. */
export interface AssetTitle {
  key: string;
  titleId: string;
  themeIdOverrides: Readonly<Record<string, string>>;
  themeDuplicateOverrides: Readonly<Record<string, string>>;
}

export interface AssetResolverInput {
  /** `assetBaseByTitleId` of the runtime config. The base should end with the title id (see `experimentIcon`). */
  assetBaseByTitleId: Readonly<Record<string, string>>;
  title: AssetTitle;
  mode: TrackerMode;
  /** BalanceId of the event on display. Only read in event mode. */
  balanceId?: string | null;
  /** ThemeId of the event on display. Only read in event mode, to pick the image directory. */
  themeId?: string | null;
  /** Experiments of the balance on display (`getData().Experiments`). */
  experiments?: readonly Pick<Experiment, 'Id' | 'IconKey'>[] | null;
  /** The runtime config's title ids. Defaults to the ones legacy falls back to. */
  titleIds?: TitleIds;
  /**
   * Where `LOCAL_SHARED_IMAGE_ALLOWLIST` images are served from. Legacy hardcodes `/img/`, which breaks when
   * the site is mounted under a sub-path.
   */
  localImageBase?: string;
}

export interface AssetResolver {
  /** Resolves a legacy path like `img/adcom/event/crusade/foo.png`. Unknown shapes come back unchanged. */
  legacyPath(path: string): string;
  /** `legacyPath` for a path relative to the active title's img folder, like `shared/gacha/wood.png`. */
  active(relative: string): string;
  /** `legacyPath` for a path in another title's img folder (`adcom` or `ages`). */
  forTitle(titleKey: string, relative: string): string;
  /**
   * The legacy directory for resource, generator and researcher icons. It is a legacy path that
   * `legacyPath` resolves once a file name is added, which is why `iconUrl` exists.
   */
  imageDirectory(overrideDirectory?: string): string;
  /** The URL of `fileName` in the image directory. Legacy built `${imageDirectory}/${fileName}` and rewrote it later. */
  iconUrl(fileName: string, overrideDirectory?: string): string;
  /** URL of an experiment's icon, or '' when it has none or no asset base is configured. */
  experimentIcon(rewardId: string | number | null | undefined): string;
}

export function mapBalanceIdForAssetPath(balanceId: string): string {
  if (!balanceId) {
    return balanceId;
  }

  if (balanceId === 'main' || balanceId === 'evergreen') {
    return 'evergreen';
  }

  return balanceId.split('-')[0] ?? balanceId;
}

/** Ages maps canonical theme ids to its folder names. Asset paths need the canonical form, so this inverts it. */
export function mapThemeIdForAssetPath(themeId: string, themeIdOverrides: Readonly<Record<string, string>>): string {
  const normalizedThemeId = mapBalanceIdForAssetPath(themeId);
  if (!normalizedThemeId) {
    return normalizedThemeId;
  }

  for (const [canonicalThemeId, legacyThemeId] of Object.entries(themeIdOverrides)) {
    if (legacyThemeId === normalizedThemeId) {
      return canonicalThemeId;
    }
  }

  return normalizedThemeId;
}

export function ensurePngFileName(fileName: string): string {
  if (!fileName) {
    return fileName;
  }

  return fileName.toLowerCase().endsWith('.png') ? fileName : `${fileName}.png`;
}

/** Researcher icons are named like `RS001`. */
export function looksLikeResearcherAsset(filename: string): boolean {
  const basename = filename.split('.').slice(0, -1).join('.') || filename;
  return /^[A-Z]{2,}\d{2,}$/.test(basename.toUpperCase());
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function findExperiment(
  experiments: readonly Pick<Experiment, 'Id' | 'IconKey'>[],
  rewardIdInput: string | number | null | undefined
): Pick<Experiment, 'Id' | 'IconKey'> | null {
  if (!rewardIdInput) {
    return null;
  }

  const rewardId = String(rewardIdInput).trim();
  if (!rewardId) {
    return null;
  }

  const exactMatch = experiments.find((experiment) => experiment && experiment.Id !== undefined && String(experiment.Id) === rewardId);
  if (exactMatch) {
    return exactMatch;
  }

  const lowerRewardId = rewardId.toLowerCase();
  return (
    experiments.find(
      (experiment) =>
        experiment && typeof experiment.Id !== 'undefined' && String(experiment.Id).toLowerCase() === lowerRewardId
    ) ?? null
  );
}

export function createAssetResolver(input: AssetResolverInput): AssetResolver {
  const { assetBaseByTitleId, title, mode } = input;
  const titleIds = input.titleIds ?? DEFAULT_TITLE_IDS;
  const localImageBase = input.localImageBase ?? '/img/';
  const experiments = input.experiments ?? [];
  const activeTitleId = title.titleId || titleIds.adcom;

  const assetBaseFor = (titleId: string): string => {
    const base = Object.hasOwn(assetBaseByTitleId, titleId) ? assetBaseByTitleId[titleId] : undefined;
    return base ? trimTrailingSlashes(base) : '';
  };

  // Which balance's folder icons come from. Event assets belong to the event on display, everything else to evergreen.
  const currentBalanceId = (): string => {
    const loaded = mode === 'lte' && input.balanceId ? input.balanceId : 'evergreen';
    return mapBalanceIdForAssetPath(loaded);
  };

  const normalizeTitleSegmentToId = (segment: string): string => {
    const lower = segment.toLowerCase();
    if (lower === 'adcom' || lower === titleIds.adcom.toLowerCase()) {
      return titleIds.adcom;
    }
    if (lower === 'ages' || lower === titleIds.ages.toLowerCase()) {
      return titleIds.ages;
    }
    return activeTitleId;
  };

  const legacyPath = (legacyPathInput: string): string => {
    if (!legacyPathInput) {
      return legacyPathInput;
    }

    let pathname: string;
    try {
      // The base only makes relative paths parse. Its origin never shows in the pathname.
      pathname = new URL(legacyPathInput, 'http://localhost').pathname;
    } catch {
      pathname = legacyPathInput;
    }

    const imgPrefixIndex = pathname.indexOf('/img/');
    if (imgPrefixIndex === -1) {
      return legacyPathInput;
    }

    const segments = pathname
      .slice(imgPrefixIndex + '/img/'.length)
      .split('/')
      .filter(Boolean);
    const firstSegment = segments[0];
    if (firstSegment === undefined) {
      return legacyPathInput;
    }

    let titleId = activeTitleId;
    let rest = segments;
    if (['adcom', 'ages', titleIds.adcom, titleIds.ages].includes(firstSegment.toLowerCase())) {
      titleId = normalizeTitleSegmentToId(firstSegment);
      rest = segments.slice(1);
    }

    const [first, second] = rest;
    const fileName = rest[rest.length - 1];
    if (first === undefined || fileName === undefined) {
      return legacyPathInput;
    }

    if (first === 'shared' && second !== undefined && LOCAL_SHARED_IMAGE_ALLOWLIST.has(second)) {
      return `${localImageBase}${second}`;
    }

    const balanceId = currentBalanceId();
    const remap = Object.hasOwn(SHARED_EFFECT_ICON_REMAP, fileName) ? SHARED_EFFECT_ICON_REMAP[fileName] : undefined;
    let mappedRelative: string;

    if (first === 'event' && fileName === 'darkscience.png') {
      mappedRelative = `${balanceId}/icon/darkscience.png`;
    } else if (first === 'shared' && second === 'timewarps' && fileName.includes('timehack')) {
      mappedRelative = titleId === titleIds.ages ? `common/timehack/${fileName}` : `${balanceId}/icon/${fileName}`;
    } else if (first === 'shared' && second === 'themeicons') {
      const rawThemeId = fileName.replace(/\.png$/i, '');
      const iconThemeId = mapThemeIdForAssetPath(rawThemeId || balanceId, title.themeIdOverrides);
      mappedRelative = `${iconThemeId}/icon.png`;
    } else if (first === 'shared' && remap) {
      mappedRelative = `${balanceId}/${remap}`;
    } else if (first === 'event' && fileName === 'upgrade.png') {
      mappedRelative = 'common/upgrade_lte.png';
    } else if (first === 'event' && fileName === 'propaganda_boost_on.png') {
      mappedRelative = `${balanceId}/propaganda/propaganda_boost_on.png`;
    } else if (first === 'event' && rest.length >= 3) {
      mappedRelative = looksLikeResearcherAsset(fileName)
        ? `${balanceId}/researcher/${fileName}`
        : `${balanceId}/icon/${fileName}`;
    } else if (first === 'main' && fileName === 'darkscience.png') {
      mappedRelative = 'evergreen/icon/scientist.png';
    } else if (first === 'main' && fileName === 'upgrade.png') {
      mappedRelative = 'common/upgrade.png';
    } else if (first === 'main' && fileName === 'propaganda_boost_on.png') {
      mappedRelative = 'evergreen/propaganda/propaganda_boost_on.png';
    } else if (first === 'main' && rest.length >= 2) {
      mappedRelative = looksLikeResearcherAsset(fileName)
        ? `evergreen/researcher/${fileName}`
        : `evergreen/icon/${fileName}`;
    } else if (first === 'shared' && second === 'avatars' && rest.length >= 3) {
      mappedRelative = `avatars/${fileName}`;
    } else if (first === 'shared' && ['blitz', 'surge', 'experiments'].includes(second ?? '') && rest.length >= 3) {
      mappedRelative = `common/experiments/${fileName}`;
    } else if (first === 'shared' && second === 'card' && rest.length >= 3) {
      mappedRelative = `common/card/${fileName}`;
    } else if (first === 'shared' && second === 'gacha' && rest.length >= 3) {
      mappedRelative = `common/gacha/${fileName}`;
    } else if (first === 'shared' && fileName.startsWith('leaderboard')) {
      mappedRelative = `common/leaderboard/${fileName}`;
    } else if (first === 'shared' && fileName.startsWith('propaganda')) {
      mappedRelative = `common/propaganda/${fileName}`;
    } else if (first === 'shared' && rest.length >= 2) {
      // Covers SHARED_COMMON_ICON_MAP too: every other shared file also lives in common.
      mappedRelative = `common/${fileName}`;
    } else {
      return legacyPathInput;
    }

    const titleBase = assetBaseFor(titleId);
    if (!titleBase) {
      return legacyPathInput;
    }

    return `${titleBase}/${mappedRelative}`;
  };

  const forTitle = (titleKey: string, relative: string): string => legacyPath(`img/${titleKey}/${relative}`);

  const imageDirectory = (overrideDirectory = ''): string => {
    if (overrideDirectory) {
      return overrideDirectory;
    }

    if (mode === 'lte' && input.themeId) {
      let themeId = input.themeId;
      themeId = lookup(title.themeIdOverrides, themeId) || themeId;
      themeId = lookup(title.themeDuplicateOverrides, themeId) || themeId;
      return forTitle(title.key, `event/${themeId}`);
    }

    return forTitle(title.key, mode === 'lte' ? 'event' : 'main');
  };

  const experimentIcon = (rewardId: string | number | null | undefined): string => {
    const iconKey = String(findExperiment(experiments, rewardId)?.IconKey ?? '').trim();
    if (!iconKey) {
      return '';
    }

    const assetBase = assetBaseFor(activeTitleId);
    if (!assetBase) {
      return '';
    }

    const titleScopedBase = assetBase.endsWith(`/${activeTitleId}`) ? assetBase : `${assetBase}/${activeTitleId}`;
    return `${titleScopedBase}/common/experiments/${iconKey}.png`;
  };

  return {
    legacyPath,
    active: (relative) => forTitle(title.key, relative),
    forTitle,
    imageDirectory,
    iconUrl: (fileName, overrideDirectory) => legacyPath(`${imageDirectory(overrideDirectory)}/${fileName}`),
    experimentIcon
  };
}

// Own properties only, so a theme named like an Object method cannot return a function.
function lookup(map: Readonly<Record<string, string>>, key: string): string | undefined {
  return Object.hasOwn(map, key) ? map[key] : undefined;
}
