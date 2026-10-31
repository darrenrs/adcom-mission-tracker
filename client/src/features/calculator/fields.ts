// How the calculator's number fields map onto the saved form, in the shape the legacy tracker saved:
// Counts[resourceId] holds the generators, the resource, `resourceProgress` and a TimeStamp, Counts.comrade holds
// the comrades and their own TimeStamp, and the comrades per second live in Trades.TotalComrades.

import { bigNum } from '@/domain/format';
import { parseAmount } from '@/domain/inputSteps';
import type { FormValues } from '@/engine/model';

export const RESOURCE_KEY = 'resource';
export const PROGRESS_KEY = 'progress';
export const COMRADES_KEY = 'comrades';
export const CPS_KEY = 'cps';

export const generatorKey = (generatorId: string) => `gen:${generatorId}`;

/** Text for a saved amount that reads back as the same number: `35.33 EE` when that is exact, plain digits when not. */
export function amountText(value: number | undefined, powers: readonly string[]): string {
  if (value === undefined || !(value > 0)) {
    return '';
  }
  const short = bigNum(value, powers);
  return Math.abs(parseAmount(short, powers) - value) <= value * 1e-9 ? short : String(value);
}

/** Import writes whole numbers, as legacy did, and leaves a field empty for zero. */
export function importedText(value: number, powers: readonly string[]): string {
  return value > 0 ? bigNum(Math.round(value), powers) : '';
}

/** The text each count field starts with: what was saved last time. */
export function savedTexts(form: FormValues, resourceId: string, generatorIds: readonly string[], powers: readonly string[]): Record<string, string> {
  const saved = form.Counts[resourceId];
  const texts: Record<string, string> = {
    [RESOURCE_KEY]: amountText(saved?.[resourceId], powers),
    [PROGRESS_KEY]: amountText(saved?.['resourceProgress'], powers),
    [COMRADES_KEY]: amountText(form.Counts['comrade']?.['comrade'], powers),
    // Default to what the Trades tab worked out, as legacy did.
    [CPS_KEY]: form.Trades.TotalComrades ? amountText(form.Trades.TotalComrades, powers) : ''
  };
  for (const id of generatorIds) {
    texts[generatorKey(id)] = amountText(saved?.[id], powers);
  }
  return texts;
}

/** Saves one valid field into the form, stamping the group it belongs to with the time. */
export function applyCount(form: FormValues, resourceId: string, key: string, value: number, now: number): void {
  if (key === CPS_KEY) {
    form.Trades.TotalComrades = value;
    return;
  }

  if (key === COMRADES_KEY) {
    const comrades = (form.Counts['comrade'] ??= {});
    comrades['comrade'] = value;
    comrades['TimeStamp'] = now;
    return;
  }

  const group = (form.Counts[resourceId] ??= {});
  if (key === RESOURCE_KEY) {
    group[resourceId] = value;
  } else if (key === PROGRESS_KEY) {
    group['resourceProgress'] = value;
  } else if (key.startsWith('gen:')) {
    group[key.slice('gen:'.length)] = value;
  }
  group['TimeStamp'] = now;
}

/** When the counts of this industry were last typed in or imported, or null if never. */
export function countsTimeStamp(form: FormValues, resourceId: string): number | null {
  return form.Counts[resourceId]?.['TimeStamp'] || null;
}

export function isInvalidAmount(text: string, powers: readonly string[]): boolean {
  return Number.isNaN(parseAmount(text, powers));
}
