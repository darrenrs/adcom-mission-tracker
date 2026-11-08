// Compares the TypeScript number and time formatting with the legacy functions, run from master.
import { afterAll, describe, expect, it } from 'vitest';
import {
  bigNum,
  fromBigNum,
  getEta,
  getMissionEtaString,
  getTimeStampLocaleString,
  ordinalConversion,
  parseLocaleNumber,
  percentageConversion,
  shortBigNum,
  upperCaseFirstLetter
} from '@/domain/format';
import { TITLES } from '@/domain/titles';
import { createLegacy, SHORT_NAME_CHANGES, TITLE_KEYS, type Legacy } from './harness';

let comparisons = 0;

type Outcome = { value: unknown } | { error: string };

function outcome(run: () => unknown): Outcome {
  try {
    return { value: run() };
  } catch (error) {
    return { error: error instanceof Error ? error.constructor.name : String(error) };
  }
}

// Errors from the sandbox come from another realm, so only their kind is compared.
function same(label: string, ours: () => unknown, legacy: () => unknown) {
  comparisons++;
  const expected = outcome(legacy);
  const actual = outcome(ours);
  if ('error' in expected && 'error' in actual) {
    expect(actual.error, label).toBe(expected.error);
  } else {
    expect(actual, label).toEqual(expected);
  }
}

const LOCALES = [undefined, 'en-US', 'en-GB', 'en-IN', 'de-DE', 'de-CH', 'fr-FR', 'es-ES', 'hu-HU', 'ru-RU', 'pt-BR', 'sv-SE', 'it-IT', 'ja-JP', 'ar-EG'];

function numberSamples(): number[] {
  const samples = [
    0, 1, 2, 5, 9.5, 12.5, 99, 100, 999, 1000, 1234.5678, 9999, 10000, 12345, 99999, 123456, 999999, 999999.9,
    1e6 - 1, 1e6, 1e6 + 1, 1500000, 12345678, 0.1, 0.000001, 1e-9, 0.5, 2.5,
    -1, -0.5, -999, -1234567, -1e9, -1e300, 1e303, 1e304, 1e308, Number.MAX_VALUE, Infinity, -Infinity, NaN
  ];
  for (let power = 3; power <= 306; power += 1) {
    samples.push(Number(`1e${power}`));
  }
  for (let power = 3; power <= 300; power += 3) {
    for (const mantissa of [1.5, 9.99, 12.345, 123.456, 999, 999.999]) {
      samples.push(Number(`${mantissa}e${power}`));
    }
  }
  return samples;
}

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function eachTitle(run: (legacy: Legacy, powers: readonly string[]) => void) {
  for (const key of TITLE_KEYS) {
    describe(key, () => run(createLegacy(key), TITLES[key].powers));
  }
}

afterAll(() => {
  console.log(`[format] ${comparisons} comparisons against legacy`);
});

describe('title config', () => {
  const plain = (value: unknown): unknown => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

  for (const key of TITLE_KEYS) {
    it(`${key} matches the legacy config file`, () => {
      const legacy = createLegacy(key);
      const title = TITLES[key];
      const pairs: [string, unknown, string][] = [
        ['powers', title.powers, 'POWERS'],
        ['themeDuplicateOverrides', title.themeDuplicateOverrides, 'THEME_DUPLICATE_OVERRIDES'],
        ['themeIdOverrides', title.themeIdOverrides, 'THEME_ID_OVERRIDES'],
        ['balanceUpdateVersion', title.balanceUpdateVersion, 'BALANCE_UPDATE_VERSION'],
        ['socialHelpUrls', title.socialHelpUrls, 'SOCIAL_HELP_URLS'],
        ['gameSaveKeyPrefix', title.gameSaveKeyPrefix, 'GAME_SAVE_KEY_PREFIX'],
        ['datamineWarningMinRank', title.datamineWarningMinRank, 'DATAMINE_WARNING_MIN_RANK'],
        ['datamineWarningThemeId', title.datamineWarningThemeId, 'DATAMINE_WARNING_THEME_ID']
      ];
      for (const [field, ours, name] of pairs) {
        comparisons++;
        expect(plain(ours), field).toEqual(plain(legacy.read(name)));
      }
      comparisons++;
      expect(title.themeIdTitleOverrides, 'themeIdTitleOverrides').toEqual({
        ...(plain(legacy.read('THEME_ID_TITLE_OVERRIDES')) as Record<string, string>),
        ...SHORT_NAME_CHANGES[key]
      });
      comparisons++;
      expect(title.titleId).toBe(legacy.read('TITLE_ID_' + key.toUpperCase()));
      expect(title.key).toBe(key);
      expect(title.isAges).toBe(legacy.read<boolean>(`'${key}' === 'ages'`));
    });
  }
});

describe('bigNum and shortBigNum', () => {
  eachTitle((legacy, powers) => {
    const samples = numberSamples();

    it('matches for default arguments across magnitudes', () => {
      for (const x of samples) {
        same(`bigNum(${x})`, () => bigNum(x, powers), () => legacy.call('bigNum', x));
        same(`shortBigNum(${x})`, () => shortBigNum(x, powers), () => legacy.call('shortBigNum', x));
      }
    });

    it('matches for other cutoffs and character limits', () => {
      for (const [cutoff, characters] of [[1e6, 100], [1e4, 3], [1000, 2], [1, 5], [0, 1], [1e3, 0]] as const) {
        for (const x of samples) {
          same(
            `bigNum(${x}, ${cutoff}, ${characters})`,
            () => bigNum(x, powers, cutoff, characters),
            () => legacy.call('bigNum', x, cutoff, characters)
          );
        }
      }
    });

    it('matches for each locale', () => {
      for (const locale of LOCALES) {
        for (const x of samples) {
          same(
            `bigNum(${x}, ${locale})`,
            () => bigNum(x, powers, 1e6, 100, locale),
            () => legacy.call('bigNum', x, 1e6, 100, locale)
          );
        }
      }
    });

    it('matches for random values', () => {
      const random = seeded(7);
      for (let i = 0; i < 3000; i++) {
        const x = random() * Math.pow(10, Math.floor(random() * 306) - 3);
        same(`bigNum(${x})`, () => bigNum(x, powers), () => legacy.call('bigNum', x));
        same(`shortBigNum(${x})`, () => shortBigNum(x, powers), () => legacy.call('shortBigNum', x));
      }
    });
  });
});

describe('fromBigNum and parseLocaleNumber', () => {
  const texts: (string | null | undefined)[] = [
    undefined, null, '', ' ', 'abc', 'K', '0', '1', '12', '1.5', '1,5', '1,234', '1,234.5', '1.234,5', '1 234,5', '.5', ',5',
    '-5', '-1.5 K', '1.2.3', '1,2,3', '1 K', '1K', '1 k', '1.5 M', '2 B', '3 t', '12.5 TTTTT', '999 ZZZZ', '1 CC', '1 cc',
    '5 K ', ' 5 K', '5  K', '1 K M', '1 XYZ', '1 KFC', 'K 5', '5 K 5', '1 K', '1 234,5 M', '1 234', '١٢٣',
    '1e5', '1e5 K', 'Infinity', '0.000 K', '100 AA', '1 aa', '7 TTTTTT'
  ];

  eachTitle((legacy, powers) => {
    it('matches for hand-picked text and every locale', () => {
      for (const locale of LOCALES) {
        for (const text of texts) {
          same(`fromBigNum(${JSON.stringify(text)}, ${locale})`, () => fromBigNum(text, powers, locale), () => legacy.call('fromBigNum', text, locale));
          if (text !== null && text !== undefined) {
            same(`parseLocaleNumber(${JSON.stringify(text)}, ${locale})`, () => parseLocaleNumber(text, locale), () => legacy.call('parseLocaleNumber', text, locale));
          }
        }
      }
    });

    it('matches for what bigNum prints, and reads it back', () => {
      for (const locale of LOCALES) {
        for (const x of numberSamples()) {
          const printed = bigNum(x, powers, 1e6, 100, locale);
          same(`fromBigNum(${JSON.stringify(printed)}, ${locale})`, () => fromBigNum(printed, powers, locale), () => legacy.call('fromBigNum', printed, locale));

          const shortPrinted = shortBigNum(x, powers);
          same(`fromBigNum(${JSON.stringify(shortPrinted)})`, () => fromBigNum(shortPrinted, powers), () => legacy.call('fromBigNum', shortPrinted));
        }
      }
    });

    it('round trips values the way legacy does', () => {
      for (const x of numberSamples().filter((n) => n >= 1e6 && n < 1e303 && Number.isFinite(n))) {
        const ours = fromBigNum(bigNum(x, powers), powers) as number;
        same(`round trip ${x}`, () => ours, () => legacy.call('fromBigNum', legacy.call('bigNum', x)));
        // bigNum keeps two decimals of the mantissa, so the round trip is only close.
        expect(Math.abs(ours - x) / x, `round trip ${x}`).toBeLessThan(0.006);
      }
    });
  });
});

describe('getEta', () => {
  const seconds = [
    0, 1e-9, 1e-7, 1e-6, 1.5e-6, 1e-5, 0.001, 0.01, 0.3, 0.4, 0.5, 0.51, 0.99, 1, 1.5, 2, 30, 59, 59.9, 60, 61, 90, 599, 600,
    3599, 3600, 3601, 3661, 7322, 43200, 86399, 86400, 86401, 90061, 604800, 31535999, 31536000, 31536001, 47304000,
    63072000, 1e8, 3e8, 1e9, 3.15e9, 1e10, 1e11, 253402300799, 253402300799.9, 253402300800, 253402300801, 1e12, 5e12,
    8.64e12 - 1, 8.64e12, 8.64e12 + 1, 1e13, 1e15, 1e20, 1e50, 1e100, 1e300, 1e308, Infinity, -Infinity, NaN, -1, -0.5, -86400, -1e12
  ];

  eachTitle((legacy, powers) => {
    it('matches across its branches', () => {
      for (const s of seconds) {
        same(`getEta(${s})`, () => getEta(s, powers), () => legacy.call('getEta', s));
      }
    });

    it('matches for random durations', () => {
      const random = seeded(11);
      for (let i = 0; i < 4000; i++) {
        const s = random() * Math.pow(10, Math.floor(random() * 22) - 7);
        same(`getEta(${s})`, () => getEta(s, powers), () => legacy.call('getEta', s));
      }
    });

    const now = Date.UTC(2026, 5, 15, 12, 30, 45);

    it('getMissionEtaString matches at a fixed time', () => {
      legacy.setNow(now);
      try {
        for (const offset of [-1e9, -1000, -1, 0, 1, 500, 999, 1000, 1500, 59000, 3.6e6, 8.64e7, 3.15e10, 1e12, 1e14, 8.64e15, 1e16, 1e20, NaN]) {
          const eta = now + offset;
          same(`getMissionEtaString(now + ${offset})`, () => getMissionEtaString(eta, powers, now), () => legacy.call('getMissionEtaString', eta));
        }
      } finally {
        legacy.setNow(null);
      }
    });

    it('getTimeStampLocaleString matches', () => {
      for (const stamp of [0, 1, now, now + 123456789, Date.UTC(1999, 11, 31, 23, 59, 59), 8.64e15, 8.64e15 + 1, NaN]) {
        same(`getTimeStampLocaleString(${stamp})`, () => getTimeStampLocaleString(stamp), () => legacy.call('getTimeStampLocaleString', stamp));
      }
    });
  });
});

describe('small text helpers', () => {
  const legacy = createLegacy('adcom');

  it('percentageConversion matches', () => {
    const values: (number | string)[] = [
      0, 0.256, 0.5, 0.125, 0.005, 0.015, 1, 1.005, 2.675, 12, 100, -0.1, -0.005, 1e-9, 1e21, '0.5', '12abc', 'abc', '', ' 0.3 ', NaN, Infinity
    ];
    for (const v of values) {
      same(`percentageConversion(${JSON.stringify(v)})`, () => percentageConversion(v), () => legacy.call('percentageConversion', v));
    }
  });

  it('ordinalConversion matches', () => {
    const values = [...Array.from({ length: 1201 }, (_, i) => i), -1, -2, -3, -11, -12, -13, -21, 1.5, 2.1, 1e21, 1e-7, NaN, Infinity];
    for (const v of values) {
      same(`ordinalConversion(${v})`, () => ordinalConversion(v), () => legacy.call('ordinalConversion', v));
    }
  });

  it('upperCaseFirstLetter matches', () => {
    const values: (string | null | undefined)[] = [undefined, null, '', 'a', 'abc', 'Abc', ' x', '1abc', 'éa', 'ßeta', 'ǆ', 'a b'];
    for (const v of values) {
      same(`upperCaseFirstLetter(${JSON.stringify(v)})`, () => upperCaseFirstLetter(v), () => legacy.call('upperCaseFirstLetter', v));
    }
  });
});
