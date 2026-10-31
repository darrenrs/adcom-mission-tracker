// "Time left" on a long generator cycle: `24m`, `1h 5m`, `90s`, `1:05:00` or plain minutes.

export type TimeLeft = { seconds: number } | { seconds: null } | { error: string };

const UNITS: Readonly<Record<string, number>> = { d: 86400, h: 3600, m: 60, s: 1 };

/** Seconds, `{ seconds: null }` for an empty field, or what is wrong with the text. */
export function parseTimeLeft(text: string): TimeLeft {
  const trimmed = text.trim().toLowerCase();
  if (trimmed === '') {
    return { seconds: null };
  }

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return { seconds: Number(trimmed) * 60 };
  }

  const clock = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (clock) {
    const [, hours = '0', minutes = '0', seconds = '0'] = clock;
    return { seconds: Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) };
  }

  const parts = trimmed.match(/\d+(?:\.\d+)?\s*[dhms]/g);
  if (parts && parts.join('').replace(/\s+/g, '') === trimmed.replace(/\s+/g, '')) {
    return {
      seconds: parts.reduce((sum, part) => sum + Number.parseFloat(part) * (UNITS[part.slice(-1)] ?? 0), 0)
    };
  }

  return { error: 'Use a time like 24m, 1h 5m or 90s. A plain number means minutes.' };
}

/** Seconds already done in a cycle, or null when nothing was entered or the text cannot be used. */
export function cycleProgress(text: string, cycleSeconds: number): { progress: number | null; error: string | null } {
  const parsed = parseTimeLeft(text);
  if ('error' in parsed) {
    return { progress: null, error: parsed.error };
  }
  if (parsed.seconds === null) {
    return { progress: null, error: null };
  }
  if (parsed.seconds > cycleSeconds) {
    return { progress: null, error: 'That is longer than one whole cycle.' };
  }
  return { progress: cycleSeconds - parsed.seconds, error: null };
}
