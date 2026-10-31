// The game's English text arrives as base64 of a `key=value` file, one entry per line.

/**
 * Decodes the base64 text and returns its entries. Later lines win over earlier ones.
 * Lines without `=` are skipped, and the value is everything after the first `=`.
 */
export function parseLocalization(base64: string): Record<string, string> {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  // Legacy kept a byte order mark as part of the first key, so it is not stripped here either.
  const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);

  // No prototype, so a key like "constructor" can only come from the file.
  const entries: Record<string, string> = Object.create(null) as Record<string, string>;

  for (const line of text.split(/\r?\n/)) {
    const keyValue = line.match(/(.*?)=(.*)/);

    if (keyValue) {
      const [, key = '', value = ''] = keyValue;
      entries[key] = value;
    }
  }

  return entries;
}
