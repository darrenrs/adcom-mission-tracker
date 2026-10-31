import { describe, expect, it, vi } from 'vitest';
import { loadGameData, readRuntimeConfig } from './gameData';

const SCHEDULE = { LteBalanceData: [], LteOneOff: [], LteSchedule: [] };

const respond = (body: unknown, ok = true, status = 200) =>
  vi.fn(async () => ({ ok, status, json: async () => body }) as Response);

describe('loadGameData', () => {
  it('requests a relative URL so the app works under a sub-path', async () => {
    const fetchImpl = respond({ Balance: { evergreen: {} }, LTESchedule: SCHEDULE, Localization: 'YQ==' });
    await loadGameData('6bf5', fetchImpl as unknown as typeof fetch);
    expect(fetchImpl).toHaveBeenCalledWith('api/data/6bf5');
  });

  it('maps the API response keys', async () => {
    const fetchImpl = respond({ Balance: { evergreen: {} }, LTESchedule: SCHEDULE, Localization: 'YQ==' });
    const data = await loadGameData('6bf5', fetchImpl as unknown as typeof fetch);
    expect(data.localizationBase64).toBe('YQ==');
    expect(data.balances).toHaveProperty('evergreen');
  });

  it('reports a failed request', async () => {
    const fetchImpl = respond({}, false, 502);
    await expect(loadGameData('6bf5', fetchImpl as unknown as typeof fetch)).rejects.toThrow(/502/);
  });

  it('rejects a response with missing data', async () => {
    const fetchImpl = respond({ Balance: {} });
    await expect(loadGameData('6bf5', fetchImpl as unknown as typeof fetch)).rejects.toThrow();
  });
});

describe('readRuntimeConfig', () => {
  it('falls back to the known title ids', () => {
    const config = readRuntimeConfig({});
    expect(config.titleIds).toEqual({ adcom: '6bf5', ages: 'dc4bb' });
  });
});
