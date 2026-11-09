import { describe, expect, it, vi } from 'vitest';
import { fetchPalettes } from '../../server/palettes.js';

const BASE = 'http://assets.invalid/assets/6bf5';
const CRUSADE = { version: 1, root: { main: '#1C3C70' }, secondary: { main: '#E00E1C' } };

function upstream(files: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    const name = url.slice(BASE.length + 1);
    if (!(name in files)) {
      return new Response('not found', { status: 404 });
    }
    const body = files[name];
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status: 200 });
  });
}

describe('fetchPalettes', () => {
  it('returns each balance its asset folder palette, fetching each folder once', async () => {
    const fetchImpl = upstream({ 'crusade/palette.json': CRUSADE });
    const ids = new Map([
      ['common', 'common'],
      ['crusade-bal-1', 'crusade'],
      ['crusade-bal-2', 'crusade']
    ]);
    const palettes = await fetchPalettes(ids, BASE, fetchImpl);
    expect(palettes).toEqual({ 'crusade-bal-1': CRUSADE, 'crusade-bal-2': CRUSADE });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('leaves out balances whose palette is missing, unreadable or not a palette', async () => {
    const fetchImpl = upstream({ 'broken/palette.json': '{not json', 'odd/palette.json': [1, 2], 'crusade/palette.json': CRUSADE });
    const ids = new Map([
      ['missing-bal-1', 'missing'],
      ['broken-bal-1', 'broken'],
      ['odd-bal-1', 'odd'],
      ['crusade-bal-1', 'crusade']
    ]);
    expect(await fetchPalettes(ids, BASE, fetchImpl)).toEqual({ 'crusade-bal-1': CRUSADE });
  });

  it('never throws when the asset server is down', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('connection refused');
    });
    expect(await fetchPalettes(new Map([['crusade-bal-1', 'crusade']]), BASE, fetchImpl)).toEqual({});
  });
});
