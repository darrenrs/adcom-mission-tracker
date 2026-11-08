// Compares the arrow-key arithmetic of number fields with the legacy inputKeyboardHandler, which is called
// with fake keyboard events on fake inputs, for every kind of field, key and modifier combination.
import { afterAll, describe, expect, it } from 'vitest';
import { parseAmount, stepDirection } from '@/domain/inputSteps';
import { TITLES } from '@/domain/titles';
import { createLegacy, TITLE_KEYS } from './harness';

let comparisons = 0;
let moved = 0;

afterAll(() => {
  console.log(`[inputSteps] ${comparisons} comparisons against legacy, ${moved} of them moved a value`);
});

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

/** What a player might have in a field, plus a spread of generated amounts in game notation. */
function sampleTexts(powers: readonly string[]): string[] {
  const random = mulberry32(7);
  const fixed = ['', '0', '1', '2', '9', '10', '99', '100', '999', '1,000', '1000', '12.5 K', '999 K', '1 M', '35.33 EE', '1 CC', 'abc', '1e5', '-5', '5 zz', '  7 ', '0.5', '1.5 B', '999.99 T'];
  const generated: string[] = [];
  for (let index = 0; index < 60; index++) {
    const mantissa = (1 + random() * 998).toFixed(Math.floor(random() * 3));
    const power = Math.floor(random() * Math.min(powers.length, 40));
    generated.push(power === 0 || random() < 0.2 ? String(Math.floor(random() * 1e6)) : `${mantissa} ${powers[power - 1]}`);
  }
  return [...fixed, ...generated];
}

const KEYS = [
  { key: 'ArrowUp', legacy: 'ArrowUp' },
  { key: 'ArrowDown', legacy: 'ArrowDown' },
  { key: 'Up', legacy: 'Up' },
  { key: 'Down', legacy: 'Down' },
  { key: 'a', legacy: 'a' },
  { key: 'Tab', legacy: 'Tab' }
];

// Only plain presses are left. Modifiers do nothing now, so they no longer match legacy.
const MODIFIERS = [{ ctrlKey: false, shiftKey: false, altKey: false }];

// Amount fields now step by the owner's rule (see client/src/domain/inputSteps.test.ts); only trade costs still match legacy.
const FIELDS: { id: string; kind: 'tradeCost' }[] = [{ id: 'potato-trade-cost', kind: 'tradeCost' }];

describe.each(TITLE_KEYS)('number field steps match legacy (%s)', (titleKey) => {
  const powers = TITLES[titleKey].powers;
  const legacy = createLegacy(titleKey);

  it('moves values the way inputKeyboardHandler does', () => {
    legacy.run('var __trade = null; tradeLevelDelta = function (id, delta) { __trade = [id, delta]; };');

    for (const field of FIELDS) {
      for (const text of sampleTexts(powers)) {
        for (const { key, legacy: legacyKey } of KEYS) {
          for (const modifiers of MODIFIERS) {
            const dom = {
              id: field.id,
              value: text,
              tagName: 'INPUT',
              matches: (selector: string) => {
                const suffix = /^\[id\$="(.*)"\]$/.exec(selector)?.[1];
                return suffix !== undefined ? field.id.endsWith(suffix) : selector === `#${field.id}`;
              }
            };
            const event = { target: dom, originalEvent: { key: legacyKey, ...modifiers } };
            legacy.run('__trade = null');
            try {
              legacy.call('inputKeyboardHandler', event, true);
            } catch {
              // With Alt held, legacy goes on to look for tab panes in jQuery, which the test does not provide.
              // The field has been changed by then.
            }

            const direction = stepDirection({ key, ...modifiers });
            const label = `${field.id} "${text}" ${key} ${JSON.stringify(modifiers)}`;
            comparisons++;

            const trade = legacy.read<[string, number] | null>('__trade');
            if (direction === 0) {
              expect(trade, label).toBeNull();
            } else {
              expect(trade?.[1], label).toBe(direction);
              moved++;
            }
          }
        }
      }
    }
  });

  it('actually changed values', () => {
    expect(moved).toBeGreaterThan(100);
  });

  it('reads amounts the way legacy reads field values', () => {
    for (const text of sampleTexts(powers)) {
      const expected = legacy.run<number>('fromBigNum(__text) || Number(__text)', { __text: text });
      comparisons++;
      expect(Object.is(parseAmount(text, powers), expected), text).toBe(true);
    }
  });
});

describe('stepDirection', () => {
  const press = (key: string, mods: Partial<Record<'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey', boolean>> = {}) =>
    stepDirection({ key, ctrlKey: false, shiftKey: false, altKey: false, ...mods });

  it('reads plain Up and Down', () => {
    expect(press('ArrowUp')).toBe(1);
    expect(press('ArrowDown')).toBe(-1);
    expect(press('Enter')).toBe(0);
  });

  it('does nothing with a modifier held', () => {
    for (const mod of ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'] as const) {
      expect(press('ArrowUp', { [mod]: true })).toBe(0);
    }
  });
});
