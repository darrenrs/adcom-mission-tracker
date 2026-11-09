// Each balance's theme colours, published by adcom-assets as `<assetBalanceId>/palette.json` beside
// `balance.json`. Older asset data has none, so a missing or unreadable palette is skipped, never an error:
// the page then keeps its own colours.

/** Whether a parsed file looks like a palette. The page checks each colour itself. */
const isPalette = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && Number.isInteger(value.version);

/**
 * Fetches the palette of every balance, by balance id.
 * @param {Map<string, string>} assetIdByBalanceId balance id -> asset folder, as `/api/data` builds it
 * @param {string} base the title's asset server base, such as `http://assets:3002/assets/6bf5`
 * @param {(url: string) => Promise<Response>} fetchImpl
 */
export async function fetchPalettes(assetIdByBalanceId, base, fetchImpl = globalThis.fetch) {
  const byAssetId = new Map();
  const load = (assetId) => {
    if (!byAssetId.has(assetId)) {
      byAssetId.set(
        assetId,
        fetchImpl(`${base}/${assetId}/palette.json`)
          .then((response) => (response.ok ? response.json() : null))
          .then((value) => (isPalette(value) ? value : null))
          .catch(() => null)
      );
    }
    return byAssetId.get(assetId);
  };

  const entries = await Promise.all(
    [...assetIdByBalanceId].filter(([, assetId]) => assetId !== 'common').map(async ([balanceId, assetId]) => [balanceId, await load(assetId)])
  );
  return Object.fromEntries(entries.filter(([, palette]) => palette !== null));
}
