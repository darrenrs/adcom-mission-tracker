import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BASE_COLOURS, contrast, fromOklab, inGameBase, inGameColours, MIN_INK, MIN_TEXT, mix, toOklab } from './eventColours';
import { eventAccent, readPalette, readPalettes, type Palette } from './palette';

const ROOT = path.resolve(import.meta.dirname, '../../..');
// Every palette adcom-assets exported for game data 6.59 (AdCom) and 1.36 (Ages), keyed `<game>:<balance folder>`.
const PALETTES = JSON.parse(readFileSync(path.join(ROOT, 'tests/fixtures/palettes.json'), 'utf8')) as Record<string, unknown>;
const all = Object.entries(PALETTES).map(([key, raw]) => [key, readPalette(raw)!] as const);

describe('colour maths', () => {
  it('round-trips through OKLab and matches known values', () => {
    for (const colour of ['#1c3c70', '#ffe4a6', '#000000', '#ffffff', '#e00e1c']) {
      expect(fromOklab(toOklab(colour))).toBe(colour);
    }
    expect(toOklab('#ffffff')[0]).toBeCloseTo(1, 4);
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff');
  });

  it('keeps the base colours in step with styles.css', () => {
    const css = readFileSync(path.join(ROOT, 'client/src/styles.css'), 'utf8');
    const block = (selector: string) => css.slice(css.indexOf(`${selector} {`), css.indexOf('}', css.indexOf(`${selector} {`)));
    for (const [theme, selector] of [['light', ':root'], ['dark', ':root[data-theme="dark"]']] as const) {
      const text = block(selector);
      for (const name of ['canvas', 'surface', 'raised', 'line', 'ink', 'muted', 'danger', 'success', 'warning'] as const) {
        expect(text, `${theme} --${name}`).toContain(`--${name}: ${BASE_COLOURS[theme][name]};`);
      }
      expect(text).toContain(`--accent: ${BASE_COLOURS[theme].accent.adcom};`);
    }
  });
});

describe('palettes', () => {
  it('reads every exported palette, and drops malformed colours', () => {
    expect(all).toHaveLength(48);
    expect(readPalette({ root: { main: 'red' }, secondary: { main: '#E00E1C', shadow: 3 } })).toEqual({ secondary: { main: '#E00E1C' } });
    expect(readPalette('nope')).toBeNull();
    expect(readPalettes({ a: { root: { main: '#123456' } }, b: null })).toEqual({ a: { root: { main: '#123456' } } });
  });

  it('finds an event accent only where it is not the standard button colour', () => {
    const accents = Object.fromEntries(all.map(([key, palette]) => [key, eventAccent(palette)]));
    expect(accents['adcom:crusade']).toBe('#E00E1C');
    for (const key of ['adcom:attack', 'adcom:defense', 'adcom:export', 'adcom:power', 'adcom:evergreen']) {
      expect(accents[key], key).toBeNull();
    }
    expect(all.filter(([key]) => key.startsWith('ages:')).every(([key]) => accents[key] === null)).toBe(true);
  });

  it('picks the dark base for dark panels and the light base for light ones', () => {
    const base = (key: string) => inGameBase(all.find(([k]) => k === key)![1]);
    expect(base('adcom:crusade')).toBe('dark');
    expect(base('adcom:ninja')).toBe('dark');
    expect(base('adcom:fusfarm')).toBe('light');
    expect(base('adcom:hexathlon')).toBe('light');
  });
});

describe('In-Game colours', () => {
  const check = (key: string, palette: Palette) => {
    const title = key.startsWith('ages:') ? 'ages' : 'adcom';
    const result = inGameColours(palette, title)!;
    const own = BASE_COLOURS[result.base];
    const accent = result.vars['--accent'] ?? own.accent[title];
    for (const name of ['--canvas', '--surface', '--raised'] as const) {
      const background = result.vars[name]!;
      expect(contrast(own.ink, background), `${key} ink on ${name}`).toBeGreaterThanOrEqual(MIN_INK);
      for (const [label, text] of Object.entries({ muted: own.muted, danger: own.danger, success: own.success, warning: own.warning, accent })) {
        expect(contrast(text, background), `${key} ${label} on ${name}`).toBeGreaterThanOrEqual(MIN_TEXT);
      }
    }
    expect(contrast(accent, result.base === 'light' ? '#ffffff' : '#000000'), `${key} button text on accent`).toBeGreaterThanOrEqual(MIN_TEXT);
    if (result.vars['--accent-soft']) {
      expect(contrast(own.ink, result.vars['--accent-soft']), `${key} ink on accent-soft`).toBeGreaterThanOrEqual(MIN_INK);
    }
    return result;
  };

  it('keeps every text colour readable for every real palette', () => {
    for (const [key, palette] of all) {
      check(key, palette);
    }
  });

  it('tints the page with the panel colour and uses the event accent', () => {
    const crusade = check('adcom:crusade', all.find(([k]) => k === 'adcom:crusade')![1]);
    expect(crusade.base).toBe('dark');
    expect(crusade.vars['--canvas']).not.toBe(BASE_COLOURS.dark.canvas);
    // Crusade's red, made light enough to read on the dark base.
    const [L, a] = toOklab(crusade.vars['--accent']!);
    expect(L).toBeGreaterThan(toOklab('#E00E1C')[0]);
    expect(a).toBeGreaterThan(0.1);
  });

  it('keeps the tracker accent where the event has none', () => {
    const egypt = check('ages:egypt', all.find(([k]) => k === 'ages:egypt')![1]);
    expect(egypt.vars['--accent']).toBeUndefined();
    expect(egypt.vars['--accent-soft']).toBeUndefined();
  });

  it('keeps the tracker accent where the event accent is nearly grey', () => {
    // Winter's accent, #FFFAE6, would read as plain text.
    const winter = check('adcom:winter', all.find(([k]) => k === 'adcom:winter')![1]);
    expect(winter.vars['--accent']).toBeUndefined();
    const accented = all.filter(([key, palette]) => inGameColours(palette, key.startsWith('ages:') ? 'ages' : 'adcom')!.vars['--accent']);
    expect(accented.map(([key]) => key)).not.toContain('adcom:winter');
    expect(accented.length).toBeGreaterThanOrEqual(20);
  });

  it('has nothing to derive without a panel colour', () => {
    expect(inGameColours({ secondary: { main: '#E00E1C' } }, 'adcom')).toBeNull();
  });
});
