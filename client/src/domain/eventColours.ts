// The In-Game theme: page colours derived from the balance's palette. Pure, so every real palette can be tested.
//
// The game's colours are often far too bright to paint a page with (the fusion cream gives white text 1.2:1). So
// the panel colour is only mixed into the tracker's own neutrals, in OKLab, at small ratios, and each mix backs off
// until every text colour still passes its contrast minimum on it. The event's accent is darkened or lightened in
// OKLCH until it passes too. Text colours themselves never change.

import { eventAccent, type Palette } from './palette';

export type BaseTheme = 'light' | 'dark';

/** The tracker's own colours. They must match `styles.css`; eventColours.test.ts checks that they do. */
export const BASE_COLOURS = {
  light: {
    canvas: '#f4f2ee',
    surface: '#ffffff',
    raised: '#ece9e2',
    line: '#e0dbd2',
    ink: '#1b1917',
    muted: '#625c54',
    danger: '#b42318',
    success: '#17693f',
    warning: '#8a5a00',
    accent: { adcom: '#b9281d', ages: '#96590a' }
  },
  dark: {
    canvas: '#131211',
    surface: '#1d1b19',
    raised: '#2a2724',
    line: '#36322d',
    ink: '#f3f0ea',
    muted: '#a89f93',
    danger: '#f8877b',
    success: '#5fd08f',
    warning: '#e9b949',
    accent: { adcom: '#f36f60', ages: '#e8a744' }
  }
} as const;

/** How much of the panel colour goes into each background, at most. */
const MIX: Record<BaseTheme, { canvas: number; surface: number; raised: number; line: number; accentSoft: number }> = {
  light: { canvas: 0.1, surface: 0.04, raised: 0.16, line: 0.24, accentSoft: 0.14 },
  dark: { canvas: 0.18, surface: 0.22, raised: 0.28, line: 0.35, accentSoft: 0.22 }
};

/** Contrast minimums (WCAG): body text 7:1, everything else read as text 4.5:1. */
export const MIN_INK = 7;
export const MIN_TEXT = 4.5;

/** Panel colours darker than this (OKLab lightness) get the dark base, the rest the light one. */
const DARK_PANEL_BELOW = 0.6;

/** An accent with less colour than this (OKLCH chroma) reads as plain text, like Winter's near-white #FFFAE6. */
const MIN_ACCENT_CHROMA = 0.05;

type Lab = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) => c / 255) as [number, number, number];
}

function hex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('')}`;
}

export function toOklab(colour: string): Lab {
  const [r, g, b] = rgb(colour).map(toLinear) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
}

function linearFromOklab([L, a, b]: Lab): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
}

/** An OKLab colour as hex. Out of the sRGB gamut, chroma is reduced (hue and lightness kept) until it fits. */
export function fromOklab([L, a, b]: Lab): string {
  let scale = 1;
  let linear = linearFromOklab([L, a, b]);
  for (let i = 0; i < 60 && linear.some((c) => c < -1e-6 || c > 1 + 1e-6); i++) {
    scale *= 0.95;
    linear = linearFromOklab([L, a * scale, b * scale]);
  }
  return hex(linear.map(fromLinear) as [number, number, number]);
}

/** `ratio` of `colour` mixed into `base`, in OKLab, like CSS `color-mix(in oklab, …)`. */
export function mix(base: string, colour: string, ratio: number): string {
  const x = toOklab(base);
  const y = toOklab(colour);
  return fromOklab([0, 1, 2].map((i) => x[i]! + (y[i]! - x[i]!) * ratio) as Lab);
}

function luminance(colour: string): number {
  const [r, g, b] = rgb(colour).map(toLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, from 1 to 21. */
export function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (high + 0.05) / (low + 0.05);
}

/** The base the In-Game theme uses for a palette: dark for a dark panel colour, light for a light one. */
export function inGameBase(palette: Palette): BaseTheme {
  const panel = palette.root?.main;
  return panel && toOklab(panel)[0] < DARK_PANEL_BELOW ? 'dark' : 'light';
}

/** The most of `colour` that can go into `base` (up to `ratio`) with `passes` still true. */
function mixWithin(base: string, colour: string, ratio: number, passes: (background: string) => boolean): string {
  for (let r = ratio; r > 0; r = Math.round((r - 0.02) * 100) / 100) {
    const mixed = mix(base, colour, r);
    if (passes(mixed)) {
      return mixed;
    }
  }
  return base;
}

/** `accent` moved in lightness, hue kept, until `passes`. Darker on the light base, lighter on the dark one. */
function adjustLightness(accent: string, theme: BaseTheme, passes: (colour: string) => boolean): string {
  const [L, a, b] = toOklab(accent);
  for (let step = 0; step <= 100; step++) {
    const next = fromOklab([Math.min(1, Math.max(0, L + (theme === 'light' ? -step : step) * 0.01)), a, b]);
    if (passes(next)) {
      return next;
    }
  }
  return theme === 'light' ? '#000000' : '#ffffff';
}

export interface InGameColours {
  base: BaseTheme;
  /** Custom properties to set on the page, replacing the tracker's own values. */
  vars: Record<string, string>;
}

/** The page colours of the In-Game theme for a palette, or null when the palette has no panel colour. */
export function inGameColours(palette: Palette, title: 'adcom' | 'ages'): InGameColours | null {
  const panel = palette.root?.main;
  if (!panel) {
    return null;
  }
  const base = inGameBase(palette);
  const own = BASE_COLOURS[base];
  const ratio = MIX[base];
  const ownAccent = own.accent[title];
  const buttonText = base === 'light' ? '#ffffff' : '#000000';

  // Backgrounds first. Every fixed text colour must keep its minimum on them; the tracker's own accent too, when
  // the event has none. An event accent is fitted to the tinted backgrounds afterwards.
  const candidate = eventAccent(palette);
  const raw = candidate && Math.hypot(toOklab(candidate)[1], toOklab(candidate)[2]) >= MIN_ACCENT_CHROMA ? candidate : null;
  const fixedText = [own.muted, own.danger, own.success, own.warning, ...(raw ? [] : [ownAccent])];
  const readable = (background: string) =>
    contrast(own.ink, background) >= MIN_INK && fixedText.every((text) => contrast(text, background) >= MIN_TEXT);

  const vars: Record<string, string> = {
    '--canvas': mixWithin(own.canvas, panel, ratio.canvas, readable),
    '--surface': mixWithin(own.surface, panel, ratio.surface, readable),
    '--raised': mixWithin(own.raised, panel, ratio.raised, readable),
    '--line': mix(own.line, panel, ratio.line)
  };
  if (raw) {
    // The event's accent, moved in lightness until it reads on every background and carries button text.
    const backgrounds = [vars['--canvas']!, vars['--surface']!, vars['--raised']!, buttonText];
    const accent = adjustLightness(raw, base, (c) => backgrounds.every((other) => contrast(c, other) >= MIN_TEXT));
    const surface = vars['--surface']!;
    vars['--accent'] = accent;
    vars['--accent-soft'] = mixWithin(surface, accent, ratio.accentSoft, (bg) => contrast(own.ink, bg) >= MIN_INK && contrast(own.muted, bg) >= MIN_TEXT);
  }
  return { base, vars };
}
