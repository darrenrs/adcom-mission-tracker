// Loading the game data and the runtime config the server injects. Replaces loadDataFromAPI and the
// RUNTIME_CONFIG constants of the legacy script.

import type { Balance, LteScheduleData } from './types';

export interface GameData {
  /** Every balance by id, plus `evergreen` and `common`. */
  balances: Record<string, Balance>;
  schedule: LteScheduleData;
  /** The English localization file, base64 encoded. */
  localizationBase64: string;
}

export interface RuntimeConfig {
  titleIds: { adcom: string; ages: string };
  assetBaseByTitleId: Record<string, string>;
}

const FALLBACK_TITLE_IDS = { adcom: '6bf5', ages: 'dc4bb' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Fetches `api/data/<titleId>`. The URL is relative on purpose: the site may be mounted under a sub-path. */
export async function loadGameData(titleId: string, fetchImpl: typeof fetch = fetch): Promise<GameData> {
  const endpoint = `api/data/${encodeURIComponent(titleId)}`;
  const response = await fetchImpl(endpoint);

  if (!response.ok) {
    throw new Error(`Could not load game data for title ${titleId}: ${endpoint} answered ${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new Error(`Could not load game data for title ${titleId}: ${endpoint} did not return JSON`, { cause: error });
  }

  if (!isRecord(body)) {
    throw new Error(`Could not load game data for title ${titleId}: ${endpoint} did not return an object`);
  }

  const { Balance, LTESchedule, Localization } = body;
  const missing: string[] = [];
  if (!isRecord(Balance)) missing.push('Balance');
  if (!isRecord(LTESchedule)) missing.push('LTESchedule');
  if (typeof Localization !== 'string') missing.push('Localization');
  if (missing.length > 0) {
    throw new Error(`Game data for title ${titleId} is missing ${missing.join(', ')}`);
  }

  const lists = ['LteBalanceData', 'LteOneOff', 'LteSchedule'].filter(
    (key) => !Array.isArray((LTESchedule as Record<string, unknown>)[key])
  );
  if (lists.length > 0) {
    throw new Error(`Game data for title ${titleId} has a schedule without ${lists.join(', ')}`);
  }

  return {
    balances: Balance as Record<string, Balance>,
    schedule: LTESchedule as LteScheduleData,
    localizationBase64: Localization as string
  };
}

/**
 * Reads `window.__RUNTIME_CONFIG__`, which /js/runtime-config.js sets. Title ids fall back to the
 * defaults legacy used, also when the server sends them empty.
 */
export function readRuntimeConfig(host: unknown = globalThis): RuntimeConfig {
  const raw = isRecord(host) ? host['__RUNTIME_CONFIG__'] : undefined;
  const config = isRecord(raw) ? raw : {};
  const titleIds = isRecord(config['titleIds']) ? config['titleIds'] : {};
  const rawBases = isRecord(config['assetBaseByTitleId']) ? config['assetBaseByTitleId'] : {};

  const assetBaseByTitleId: Record<string, string> = {};
  for (const [titleId, base] of Object.entries(rawBases)) {
    if (typeof base === 'string') {
      assetBaseByTitleId[titleId] = base;
    }
  }

  const titleId = (value: unknown, fallback: string) => (typeof value === 'string' && value ? value : fallback);
  return {
    titleIds: {
      adcom: titleId(titleIds['adcom'], FALLBACK_TITLE_IDS.adcom),
      ages: titleId(titleIds['ages'], FALLBACK_TITLE_IDS.ages)
    },
    assetBaseByTitleId
  };
}
