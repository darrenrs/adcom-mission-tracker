/** Types for `palettes.js`, so its tests stay type-checked. */
export function fetchPalettes(
  assetIdByBalanceId: Map<string, string>,
  base: string,
  fetchImpl?: (url: string) => Promise<Response>
): Promise<Record<string, unknown>>;
