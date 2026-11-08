// Number and time text, ported from the legacy tracker. tests/legacy/format.test.ts runs both
// versions side by side, so keep the output identical, quirks included.

type Locale = string | undefined;

// Legacy turns non-breaking spaces (char 160) into normal spaces in every number it prints.
const NBSP = /\xA0/g;

/** Large numbers in game style: `bigNum(1e21, powers)` gives `1 CC`. `significantCharacters` counts the decimal point. */
export function bigNum(
  x: number,
  powers: readonly string[],
  minimumCutoff = 1e6,
  significantCharacters = 100,
  locale: Locale = undefined
): string {
  if (x < minimumCutoff) {
    return x.toLocaleString(locale).replace(NBSP, ' ');
  }

  const digits = Math.floor(Math.log10(x));
  const thousands = Math.floor(digits / 3);
  const mantissa = x / Math.pow(10, thousands * 3);
  const numberString = mantissa
    .toLocaleString(locale, { maximumFractionDigits: 2 })
    .slice(0, significantCharacters + 1)
    .replace(NBSP, ' ');
  // Past the last power legacy prints "undefined"; String() keeps that instead of dropping the suffix.
  return `${numberString} ${String(powers[thousands - 1])}`;
}

/** Like `bigNum`, but with three significant figures from 10,000 up. */
export function shortBigNum(x: number, powers: readonly string[]): string {
  // Three figures can leave "129. M", so the stray decimal point is removed.
  return bigNum(x, powers, 1e4, 3).replace(/[^0-9] /g, ' ');
}

/** Reads a number as printed by `bigNum`: `fromBigNum('1 CC', powers)` gives 1e21. Empty input gives `''`. */
export function fromBigNum(x: string | null | undefined, powers: readonly string[], locale: Locale = undefined): number | '' {
  if (x == null) {
    return NaN;
  } else if (x.length === 0) {
    return '';
  } else if (!/(-?[\d.,]+)/.test(x)) {
    return NaN;
  }

  const text = x.replace(NBSP, ' ');
  // Digits first, then an optional suffix. Groups that did not match are dropped.
  const match = /(-?[\d., ]+)? *(\w+)?/g.exec(text);
  const split = (match ?? []).filter((group, i) => group !== undefined && i > 0);
  const [first, second] = split;

  if (split.length === 1 && first !== undefined) {
    return parseLocaleNumber(first, locale);
  }

  if (split.length === 2 && first !== undefined && second !== undefined) {
    const powerIndex = powers.indexOf(second.toUpperCase());
    const mantissa = parseLocaleNumber(first, locale);
    if (powerIndex !== -1 && !isNaN(mantissa)) {
      return timesThousands(mantissa, powerIndex + 1);
    }
  }

  return NaN;
}

/**
 * `mantissa × 1000^power`, read as a decimal so the result is the nearest number to the written amount.
 * Multiplying in floating point is not: 1.1 × 1000^5 gives 1,100,000,000,000,000.1, which a whole-number
 * field then rejects (legacy had this bug, for about 1 in 40 one-decimal amounts).
 */
function timesThousands(mantissa: number, power: number): number {
  const [digits = '', exponent = '0'] = String(mantissa).split('e');
  return Number(`${digits}e${Number(exponent) + 3 * power}`);
}

/** Parses digits written with the separators of `locale` (default: the runtime's own). */
export function parseLocaleNumber(stringNumber: string, locale: Locale = undefined): number {
  const decimalSeparator = (1.1).toLocaleString(locale).replace(/1/g, '') || '.';
  let thousandSeparator = (11111).toLocaleString(locale).replace(/1/g, '');

  // Locales without a thousands separator get the opposite of their decimal separator.
  if (!thousandSeparator) {
    thousandSeparator = decimalSeparator !== ',' ? ',' : '.';
  } else if (thousandSeparator === String.fromCharCode(160)) {
    thousandSeparator = ' ';
  }

  const reformatted = stringNumber
    .replace(new RegExp('\\' + thousandSeparator, 'g'), '')
    .replace(new RegExp('\\' + decimalSeparator), '.');
  return Number(reformatted);
}

/** `1h 2m 3s` style countdown. Beyond what a Date can show it falls back to years. */
export function getEta(timeSeconds: number, powers: readonly string[]): string {
  // A Date past 9999-12-31 prints its year with a sign and six digits, which shifts the time.
  const offset = timeSeconds >= 253402300800 ? 14 : 11;
  const years = Math.floor(timeSeconds / (60 * 60 * 24 * 365));

  try {
    const days = Math.floor(timeSeconds / (60 * 60 * 24)) % 365;
    // Dates before year 0 print a longer year, so the slice can come up short and a part reads "undefined", as in legacy.
    const [hours, minutes, seconds] = new Date(timeSeconds * 1000)
      .toISOString()
      .substring(offset, offset + 8)
      .split(':');
    let eta: string;

    if (years > 0) {
      eta = `${years}y ${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (days > 0) {
      eta = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (Number(hours) > 0) {
      eta = `${hours}h ${minutes}m ${seconds}s`;
    } else if (Number(minutes) > 0) {
      eta = `${minutes}m ${seconds}s`;
    } else if (Number(seconds) > 0) {
      eta = `${seconds}s`;
    } else if (timeSeconds > 0.5) {
      eta = '1s';
    } else if (timeSeconds > 1e-6) {
      eta = `1/${Math.floor(1 / timeSeconds)}s`;
    } else {
      eta = 'Instant';
    }

    return eta.replace(/^0*/, '');
  } catch (error) {
    if (error instanceof RangeError) {
      // No date can show this, so only the years mean anything.
      return `${shortBigNum(years, powers)} years`;
    }
    throw error;
  }
}

/** Shows when a mission will finish. `now` is in milliseconds; both stamps are epoch milliseconds. */
export function getMissionEtaString(
  etaTimeStamp: number,
  powers: readonly string[],
  now: number = Date.now(),
  locale: Locale = undefined
): string {
  const milliDifference = etaTimeStamp - now;

  if (milliDifference <= 0) {
    return 'Complete?';
  }

  try {
    return `${getEta(milliDifference / 1000, powers)} (${getTimeStampLocaleString(etaTimeStamp, locale)})`;
  } catch {
    return 'Invalid time';
  }
}

/** The one format used wherever the tracker shows a date and time. */
export function getTimeStampLocaleString(timeStamp: number, locale: Locale = undefined): string {
  return new Date(timeStamp).toLocaleString(locale, {
    weekday: 'short',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  });
}

/** 0.256 gives `26%`. */
export function percentageConversion(f: number | string): string {
  return `${(parseFloat(String(f)) * 100).toFixed(0)}%`;
}

/** 1 gives `1st`, 2 `2nd`, 5 `5th`. Only 11, 12 and 13 are special-cased, as in legacy, so 111 gives `111st`. */
export function ordinalConversion(inputNumber: number): string {
  const text = inputNumber.toString();
  const lastDigit = text[text.length - 1] ?? '';
  const presets: Record<string, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = presets[lastDigit];

  if (suffix === undefined || [11, 12, 13].includes(inputNumber)) {
    return `${inputNumber}th`;
  }

  return `${inputNumber}${suffix}`;
}

export function upperCaseFirstLetter(name: string | null | undefined): string {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}
