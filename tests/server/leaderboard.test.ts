// @vitest-environment node
// @ts-nocheck -- the server modules are plain ESM JavaScript without types.
import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LeaderboardClient } from '../../server/leaderboard/client.js';
import {
  computeBrackets,
  parseBoard,
  parseEvents,
  parseSegmentCategory,
  shapePlayerResult
} from '../../server/leaderboard/parse.js';
import { registerLeaderboardRoutes } from '../../server/leaderboard/routes.js';

const fixture = (name: string) =>
  JSON.parse(readFileSync(path.join(import.meta.dirname, 'fixtures', name), 'utf8'));

const NOW = Date.parse('2026-08-11T12:00:00Z');
const ACTIVE = '11111111-1111-4111-8111-111111111111';
const ARCH = '22222222-2222-4222-8222-222222222222';
const FUT = '33333333-3333-4333-8333-333333333333';
const PLAYER = 'AAAAAAAAAAAAAAA1';
const BASE = 'https://upstream.invalid/api/leaderboard/v3';

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init });

// Routes mock upstream by URL. Records every call.
function makeUpstream(overrides: Record<string, () => Response> = {}) {
  const calls: string[] = [];
  const fetchImpl = vi.fn(async (url: string) => {
    calls.push(url);
    const u = new URL(url);
    const p = u.pathname;
    for (const [needle, make] of Object.entries(overrides)) {
      if (url.includes(needle)) return make();
    }
    if (p.endsWith('/leaderboards')) return json(fixture('events.json'));
    const m = /\/leaderboards\/([^/]+)\/players\/([^/]+)(\/results)?$/.exec(p);
    if (!m) return new Response('{}', { status: 404 });
    const [, guid, , results] = m;
    if (guid === ACTIVE && !results) return json(fixture('registration-active.json'));
    if (guid === ARCH && !results) return json(fixture('registration-archived.json'));
    if (guid === ACTIVE && results) {
      return u.searchParams.get('topCount') === '9999999'
        ? json(fixture('board-active.json'))
        : json(fixture('player-results-active.json'));
    }
    if (guid === ARCH && results) return json(fixture('player-results-archived.json'));
    return new Response('{}', { status: 404 });
  });
  return { fetchImpl, calls };
}

const servers: { close: () => void }[] = [];
async function start(env: Record<string, string>, fetchImpl = makeUpstream().fetchImpl, now = () => NOW) {
  const app = express();
  registerLeaderboardRoutes(app, {
    env,
    fetchImpl,
    now,
    logger: { info() {}, warn() {}, error() {}, log() {} },
    clientOptions: { requestsPerSecond: 1000, fallbackRetryMs: 1, retryJitterMs: 0 }
  });
  const server = await new Promise<import('node:http').Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  servers.push(server);
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return (p: string) => fetch(origin + p);
}

const CONFIGURED = { API_URL_LEADERBOARD: BASE, API_GCLOUD_TOKEN: 'test-token-value' };

afterEach(() => {
  vi.useRealTimers();
  while (servers.length) servers.pop()!.close();
});

describe('parseEvents', () => {
  const events = parseEvents(fixture('events.json'), { now: NOW });

  it('filters template, other-project, hidden and empty started events; keeps future', () => {
    expect(events.map((e) => e.guid)).toEqual([FUT, ACTIVE, ARCH]);
  });

  it('shapes fields', () => {
    expect(events[1]).toEqual({
      guid: ACTIVE,
      theme: 'atlantis',
      start: '2026-08-10T16:00:00.000Z',
      end: '2026-08-13T15:59:00.000Z',
      status: 'active',
      live: true,
      players: 200,
      divisionSize: 25
    });
    expect(events[2]).toMatchObject({ status: 'archived', live: false, players: 105 });
    expect(events[0]).toMatchObject({ live: false, players: 0 });
  });
});

describe('parseSegmentCategory', () => {
  it('reads the first uppercase run', () => {
    expect(parseSegmentCategory('defenseSPEND_100_TO_500:20')).toBe('SPEND_100_TO_500');
    expect(parseSegmentCategory('defenseRANK_19_TO_29:4')).toBe('RANK_19_TO_29');
    expect(parseSegmentCategory('atlantisSPEND_GT_500:1')).toBe('SPEND_GT_500');
  });
  it('handles default and missing', () => {
    expect(parseSegmentCategory('defaultbracket:3')).toBe('default');
    expect(parseSegmentCategory(null)).toBeNull();
    expect(parseSegmentCategory('')).toBeNull();
    expect(parseSegmentCategory('lowercaseonly:9')).toBeNull();
  });
});

describe('computeBrackets', () => {
  const board = (count: number, length = count) => ({
    count,
    scores: Array.from({ length }, (_, i) => 5000.9 - i)
  });

  it('skips fractional brackets whose index is <= 99 and floors scores', () => {
    // 200 players: 0.75 -> index 149 is the only fraction that survives.
    expect(computeBrackets(board(200))).toEqual([
      { rank: 1, fraction: null, score: 5000 },
      { rank: 5, fraction: null, score: 4996 },
      { rank: 25, fraction: null, score: 4976 },
      { rank: 100, fraction: null, score: 4901 },
      { fraction: 0.75, rank: null, score: 4851 }
    ]);
  });

  it('computes fractional positions on a large board', () => {
    const rows = computeBrackets(board(1000));
    // 0.01 -> idx 9, 0.05 -> 49, 0.10 -> 99 are skipped; 0.25 -> 249, 0.5 -> 499, 0.75 -> 749.
    expect(rows.filter((r) => r.fraction !== null).map((r) => [r.fraction, r.score])).toEqual([
      [0.25, 4751],
      [0.5, 4501],
      [0.75, 4251]
    ]);
    const big = computeBrackets(board(100000));
    expect(big.filter((r) => r.fraction !== null)).toHaveLength(6);
    expect(big.find((r) => r.fraction === 0.01)).toEqual({ rank: null, fraction: 0.01, score: 4001 });
  });

  it('returns null scores when the board is incomplete or too small', () => {
    const rows = computeBrackets(board(1000, 50));
    expect(rows.every((r) => r.score === null)).toBe(true);
    expect(computeBrackets(board(3))[3]).toEqual({ rank: 100, fraction: null, score: null });
  });
});

describe('shapePlayerResult', () => {
  const events = parseEvents(fixture('events.json'), { now: NOW });
  const cachedAt = '2026-08-11T12:00:00.000Z';

  it('shapes an active event', () => {
    const board = parseBoard(fixture('board-active.json').resultMap);
    const result = shapePlayerResult({
      event: events[1],
      playerId: PLAYER,
      registration: fixture('registration-active.json').data,
      resultMap: fixture('player-results-active.json').resultMap,
      board,
      cachedAt
    });
    expect(result.event).toEqual({
      guid: ACTIVE, theme: 'atlantis', start: '2026-08-10T16:00:00.000Z', end: '2026-08-13T15:59:00.000Z', status: 'active'
    });
    expect(result.player).toEqual({
      playerId: PLAYER,
      ordinal: 102,
      segmentId: 'defenseSPEND_100_TO_500:20',
      shortboardCategory: 'SPEND_100_TO_500',
      root: 'global',
      trophies: 877,
      joined: '2026-08-10T16:05:00.000Z',
      updated: '2026-08-11T12:00:00.000Z',
      globalPosition: 41,
      globalCount: 200,
      divisionPosition: 2,
      divisionCount: 5
    });
    expect(result.global).toEqual({
      count: 200,
      brackets: [
        { rank: 1, fraction: null, score: 1000 },
        { rank: 5, fraction: null, score: 988 },
        { rank: 25, fraction: null, score: 928 },
        { rank: 100, fraction: null, score: 703 },
        { rank: null, fraction: 0.75, score: 553 }
      ]
    });
    expect(result.division).toEqual({
      count: 5,
      entries: [
        { ordinal: 100, position: 0, globalPosition: 7, trophies: 979, isPlayer: false },
        { ordinal: 101, position: 1, globalPosition: 30, trophies: 910, isPlayer: false },
        { ordinal: 102, position: 2, globalPosition: 41, trophies: 877, isPlayer: true },
        { ordinal: 103, position: 3, globalPosition: 77, trophies: 769, isPlayer: false },
        { ordinal: 104, position: 4, globalPosition: 150, trophies: 550, isPlayer: false }
      ]
    });
    expect(result.cachedAt).toBe(cachedAt);
  });

  it('falls back to adjacent entries for global position when there is no board', () => {
    const result = shapePlayerResult({
      event: events[1],
      playerId: PLAYER,
      registration: fixture('registration-active.json').data,
      resultMap: fixture('player-results-active.json').resultMap,
      board: null,
      cachedAt
    });
    expect(result.player.globalPosition).toBe(41);
    expect(result.player.globalCount).toBe(200);
    expect(result.global).toBeNull();
    expect(result.division.entries[0].globalPosition).toBeNull();
  });

  it('shapes an archived event', () => {
    const result = shapePlayerResult({
      event: events[2],
      playerId: PLAYER,
      registration: fixture('registration-archived.json').data,
      resultMap: fixture('player-results-archived.json').resultMap,
      board: null,
      cachedAt
    });
    expect(result.global).toBeNull();
    expect(result.division).toBeNull();
    expect(result.event.status).toBe('archived');
    expect(result.player).toEqual({
      playerId: PLAYER,
      ordinal: 9,
      segmentId: 'defenseRANK_19_TO_29:4',
      shortboardCategory: 'RANK_19_TO_29',
      root: 'global',
      trophies: 100,
      joined: '2026-07-01T17:00:00.000Z',
      updated: '2026-07-04T10:00:00.000Z',
      globalPosition: 2,
      globalCount: 20,
      divisionPosition: 1,
      divisionCount: 5
    });
  });
});

describe('LeaderboardClient', () => {
  const make = (fetchImpl, extra = {}) =>
    new LeaderboardClient({
      baseUrl: 'https://upstream.invalid/x',
      token: 'tok',
      fetchImpl,
      logger: null,
      requestsPerSecond: 1000,
      fallbackRetryMs: 10,
      retryJitterMs: 0,
      ...extra
    });

  it('sends the auth header and user agent', async () => {
    const fetchImpl = vi.fn(async () => json({ ok: 1 }));
    await expect(make(fetchImpl).get('/a')).resolves.toEqual({ ok: 1 });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://upstream.invalid/x/a');
    expect(init.headers._token).toBe('tok');
    expect(init.headers['User-Agent']).toBe('adcom-mission-tracker');
  });

  it('retries a 429 only after Retry-After has elapsed', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 429, headers: { 'Retry-After': '2' } }))
      .mockResolvedValueOnce(json({ ok: true }));
    const promise = make(fetchImpl).get('/a');
    await vi.advanceTimersByTimeAsync(1900);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    await expect(promise).resolves.toEqual({ ok: true });
  });

  it('pauses the shared queue for other requests during a 429 cooldown', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(async (url: string) =>
      fetchImpl.mock.calls.length === 1
        ? new Response('{}', { status: 429, headers: { 'Retry-After': '2' } })
        : json({ url })
    );
    const client = make(fetchImpl);
    const first = client.get('/one');
    await vi.advanceTimersByTimeAsync(50);
    const second = client.get('/two');
    await vi.advanceTimersByTimeAsync(1500);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    await Promise.all([first, second]);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('retries 503 and network errors, then gives up after maxRetries', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(json({ ok: 1 }));
    await expect(make(fetchImpl).get('/a')).resolves.toEqual({ ok: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(3);

    const failing = vi.fn(async () => new Response('{}', { status: 502 }));
    await expect(make(failing).get('/a')).rejects.toMatchObject({ status: 502 });
    expect(failing).toHaveBeenCalledTimes(3);
  });

  it('does not retry a 404 and never puts the URL or token in errors', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 404 }));
    const error = await make(fetchImpl).get('/secret-path').catch((e) => e);
    expect(error.status).toBe(404);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(error.message).not.toMatch(/secret-path|upstream\.invalid|tok/);
  });

  it('times out hung requests via AbortController and retries them', async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementationOnce((_url, init) => new Promise((_, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      }))
      .mockResolvedValueOnce(json({ ok: 2 }));
    await expect(make(fetchImpl, { timeoutMs: 20 }).get('/a')).resolves.toEqual({ ok: 2 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe('routes', () => {
  it('returns 503 without calling upstream when unconfigured', async () => {
    const { fetchImpl } = makeUpstream();
    const get = await start({}, fetchImpl);
    const res = await get(`/api/leaderboard/${ACTIVE}/player/${PLAYER}`);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'leaderboard-unavailable',
      message: 'Leaderboard is not configured on this server.'
    });
    const events = await get('/api/leaderboard/events');
    expect(events.status).toBe(200);
    expect(await events.json()).toEqual({ events: [], unavailable: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('also reports unavailable when only one variable is set', async () => {
    const get = await start({ API_URL_LEADERBOARD: BASE });
    const res = await get('/api/leaderboard/events');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ events: [], unavailable: true });
    expect((await get(`/api/leaderboard/${ACTIVE}/player/${PLAYER}`)).status).toBe(503);
  });

  it('returns 200 unavailable events when upstream fails', async () => {
    const { fetchImpl } = makeUpstream({ '/leaderboards': () => new Response('{}', { status: 500 }) });
    const get = await start(CONFIGURED, fetchImpl);
    const res = await get('/api/leaderboard/events');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ events: [], unavailable: true });
  });

  it('lists events and caches them for 10 minutes', async () => {
    let clock = NOW;
    const { fetchImpl, calls } = makeUpstream();
    const get = await start(CONFIGURED, fetchImpl, () => clock);
    const res = await get('/api/leaderboard/events');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.unavailable).toBe(false);
    expect(body.events.map((e) => e.guid)).toEqual([FUT, ACTIVE, ARCH]);
    expect(calls[0]).toBe(`${BASE}/project/adcom/leaderboards`);

    await get('/api/leaderboard/events');
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    clock += 10 * 60 * 1000 + 1;
    await get('/api/leaderboard/events');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('accepts a base URL without the /api/leaderboard/v3 suffix', async () => {
    const { fetchImpl, calls } = makeUpstream();
    const get = await start({ ...CONFIGURED, API_URL_LEADERBOARD: 'https://upstream.invalid/' }, fetchImpl);
    await get('/api/leaderboard/events');
    expect(calls[0]).toBe(`${BASE}/project/adcom/leaderboards`);
  });

  it('validates guid and player id', async () => {
    const { fetchImpl } = makeUpstream();
    const get = await start(CONFIGURED, fetchImpl);
    for (const p of [
      `/api/leaderboard/not-a-guid/player/${PLAYER}`,
      `/api/leaderboard/${ACTIVE}/player/ZZZ`,
      `/api/leaderboard/${ACTIVE}/player/${'A'.repeat(17)}`
    ]) {
      const res = await get(p);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'bad-request' });
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('serves an active-event player, uppercasing the id and sending the right queries', async () => {
    const { fetchImpl, calls } = makeUpstream();
    const get = await start(CONFIGURED, fetchImpl);
    const res = await get(`/api/leaderboard/${ACTIVE}/player/${PLAYER.toLowerCase()}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.player).toMatchObject({ playerId: PLAYER, globalPosition: 41, globalCount: 200, divisionPosition: 2 });
    expect(body.global.brackets).toHaveLength(5);
    expect(body.cachedAt).toBe('2026-08-11T12:00:00.000Z');
    expect(calls.some((c) => c.includes(`/players/${PLAYER}/results?offset=0&topCount=9999999&resolvePlayers=true`))).toBe(true);
    expect(calls.some((c) => c.includes('offset=25&topCount=25&resolvePlayers=true'))).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/test-token-value|upstream\.invalid/);
  });

  it('honours LEADERBOARD_PLAYER_TOP_COUNT', async () => {
    const { fetchImpl, calls } = makeUpstream();
    const get = await start({ ...CONFIGURED, LEADERBOARD_PLAYER_TOP_COUNT: '60' }, fetchImpl);
    await get(`/api/leaderboard/${ACTIVE}/player/${PLAYER}`);
    expect(calls.some((c) => c.includes('topCount=60'))).toBe(true);
  });

  it('serves an archived-event player without fetching a full board', async () => {
    const { fetchImpl, calls } = makeUpstream();
    const get = await start(CONFIGURED, fetchImpl);
    const res = await get(`/api/leaderboard/${ARCH}/player/${PLAYER}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.global).toBeNull();
    expect(body.division).toBeNull();
    expect(body.player).toMatchObject({ globalPosition: 2, globalCount: 20, divisionPosition: 1, divisionCount: 5 });
    expect(calls.some((c) => c.includes('9999999'))).toBe(false);
  });

  it('returns 404 player-not-found for a missing registration (null data and HTTP 404)', async () => {
    const nullData = makeUpstream({ [`/leaderboards/${ACTIVE}/players/${PLAYER}`]: () => json(fixture('registration-missing.json')) });
    let get = await start(CONFIGURED, nullData.fetchImpl);
    let res = await get(`/api/leaderboard/${ACTIVE}/player/${PLAYER}`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'player-not-found' });

    const http404 = makeUpstream({ [`/leaderboards/${ACTIVE}/players/${PLAYER}`]: () => new Response('{}', { status: 404 }) });
    get = await start(CONFIGURED, http404.fetchImpl);
    res = await get(`/api/leaderboard/${ACTIVE}/player/${PLAYER}`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'player-not-found' });
  });

  it('returns 404 event-not-found for an unknown event guid', async () => {
    const get = await start(CONFIGURED);
    const res = await get(`/api/leaderboard/99999999-9999-4999-8999-999999999999/player/${PLAYER}`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'event-not-found' });
  });

  it('returns 502 upstream-failed without leaking details', async () => {
    const { fetchImpl } = makeUpstream({ '/leaderboards/': () => new Response('{}', { status: 500 }) });
    const get = await start(CONFIGURED, fetchImpl);
    const res = await get(`/api/leaderboard/${ACTIVE}/player/${PLAYER}`);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'upstream-failed' });
  });

  it('caches player responses for 60 seconds', async () => {
    let clock = NOW;
    const { fetchImpl } = makeUpstream();
    const get = await start(CONFIGURED, fetchImpl, () => clock);
    const url = `/api/leaderboard/${ACTIVE}/player/${PLAYER}`;
    await get(url);
    const callsAfterFirst = fetchImpl.mock.calls.length;
    clock += 59_000;
    const second = await get(url);
    expect(second.status).toBe(200);
    expect(fetchImpl.mock.calls.length).toBe(callsAfterFirst);

    clock += 2_000;
    await get(url);
    // Player data re-fetched (registration + results); the board is still cached (5 min).
    expect(fetchImpl.mock.calls.length).toBe(callsAfterFirst + 2);
  });

  it('shares one in-flight full-board fetch across concurrent players', async () => {
    const { fetchImpl, calls } = makeUpstream();
    const get = await start(CONFIGURED, fetchImpl);
    const other = 'BBBBBBBBBBBBBBB2';
    const responses = await Promise.all([
      get(`/api/leaderboard/${ACTIVE}/player/${PLAYER}`),
      get(`/api/leaderboard/${ACTIVE}/player/${other}`),
      get(`/api/leaderboard/${ACTIVE}/player/${PLAYER}`)
    ]);
    expect(responses.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(calls.filter((c) => c.includes('topCount=9999999'))).toHaveLength(1);
    // The duplicate request for the same player is also shared.
    expect(calls.filter((c) => c.endsWith(`/players/${PLAYER}`))).toHaveLength(1);
  });
});
