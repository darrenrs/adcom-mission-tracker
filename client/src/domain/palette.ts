// Each balance's theme colours, as adcom-assets reads them from the game (its `app/steps/palette.py`). One palette
// per balance: the game has no light or dark variants. The server sends them in `/api/data` as `Palette`.

/** A colour set as the game defines it: a main shade with lighter and darker ones. */
export interface ColourSet {
  main: string;
  highlight?: string;
  shadow?: string;
}

export interface RarityColours extends ColourSet {
  /** The rarity's text colour. */
  text?: string;
}

export interface Palette {
  /** `Container [Root]`: the panel colour. */
  root?: ColourSet;
  /** `Container [Secondary]`: the event's accent, unless it is the game's standard button colour. */
  secondary?: ColourSet;
  /** `Container [Primary]`: the game's standard button colour. */
  primary?: ColourSet;
  /** Researcher card colours by rarity: LteCommon and LteRare for events; Common, Rare, Epic … for Motherland. */
  rarity?: Record<string, RarityColours>;
}

const HEX = /^#[0-9A-F]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSet(value: unknown): RarityColours | undefined {
  if (!isRecord(value) || typeof value['main'] !== 'string' || !HEX.test(value['main'])) {
    return undefined;
  }
  const set: RarityColours = { main: value['main'].toUpperCase() };
  for (const key of ['highlight', 'shadow', 'text'] as const) {
    const shade = value[key];
    if (typeof shade === 'string' && HEX.test(shade)) {
      set[key] = shade.toUpperCase();
    }
  }
  return set;
}

/** A palette from untrusted JSON, keeping only well-formed colours. Null when nothing usable is left. */
export function readPalette(value: unknown): Palette | null {
  if (!isRecord(value)) {
    return null;
  }
  const palette: Palette = {};
  for (const key of ['root', 'secondary', 'primary'] as const) {
    const set = readSet(value[key]);
    if (set) {
      palette[key] = set;
    }
  }
  if (isRecord(value['rarity'])) {
    const rarity: Record<string, RarityColours> = {};
    for (const [name, raw] of Object.entries(value['rarity'])) {
      const set = readSet(raw);
      if (set) {
        rarity[name] = set;
      }
    }
    if (Object.keys(rarity).length > 0) {
      palette.rarity = rarity;
    }
  }
  return Object.keys(palette).length > 0 ? palette : null;
}

/** Every palette in the `/api/data` response, by balance id. Missing or malformed ones are left out. */
export function readPalettes(value: unknown): Record<string, Palette> {
  const palettes: Record<string, Palette> = {};
  if (isRecord(value)) {
    for (const [balanceId, raw] of Object.entries(value)) {
      const palette = readPalette(raw);
      if (palette) {
        palettes[balanceId] = palette;
      }
    }
  }
  return palettes;
}

/** The event's own accent: `secondary`, unless it is just the standard button colour (all of Ages, rank-up events). */
export function eventAccent(palette: Palette): string | null {
  const accent = palette.secondary?.main;
  return accent && accent !== palette.primary?.main ? accent : null;
}
