// Leaderboard API routes. Upstream is Hyper Hippo's Kestrel leaderboard v3.
//
//   GET /api/leaderboard/events  (always 200; unavailable:true when not configured or upstream fails)
//   GET /api/leaderboard/:guid/player/:playerId
//   GET /api/leaderboard/:guid/stats?player=<playfabId>
//
// Caching: the event list for 10 minutes and each event's full board for 1 minute.
// Player results are never cached. Player results carry fetchedAt and boardFetchedAt;
// stats carry boardFetchedAt.
//
// Env: API_URL_LEADERBOARD, API_GCLOUD_TOKEN (both required),
// API_APPLICATION_ID (default "adcom"), LEADERBOARD_PLAYER_TOP_COUNT
// (default 25), LEADERBOARD_BOARD_TIMEOUT_MS (default 30000), plus the
// ADCOM_API_* limits read by the client.

import { InflightMap, TtlCache } from './cache.js';
import { LeaderboardClient, readNumber, UpstreamError } from './client.js';
import { computeStats, parseBoard, parseEvents, PROJECT, shapePlayerResult } from './parse.js';

const EVENTS_TTL_MS = 10 * 60 * 1000;
// The full board is the one expensive call, so it is shared for a minute. A player's own
// result is never cached: every lookup asks upstream again.
const BOARD_TTL_MS = 60 * 1000;
const FULL_TOP_COUNT = 9_999_999;
// Entries requested around the player (matches the old site's per-player calls).
const PLAYER_OFFSET = 25;
const DEFAULT_PLAYER_TOP_COUNT = 25;
const DEFAULT_BOARD_TIMEOUT_MS = 30_000;

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLAYER_ID_PATTERN = /^[0-9a-f]{1,16}$/i;

class RouteError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const readConfig = (env) => {
  const rawBase = (env.API_URL_LEADERBOARD ?? '').trim();
  const token = (env.API_GCLOUD_TOKEN ?? '').trim();
  if (!rawBase || !token) {
    return null;
  }
  let base = rawBase.replace(/\/+$/, '');
  if (!/\/api\/leaderboard\/v3$/.test(base)) {
    base += '/api/leaderboard/v3';
  }
  const project = (env.API_APPLICATION_ID ?? '').trim() || PROJECT;
  return { baseUrl: `${base}/project/${project}`, token, project };
};

export function registerLeaderboardRoutes(app, options = {}) {
  const env = options.env ?? process.env;
  const now = options.now ?? (() => Date.now());
  const logger = options.logger ?? console;
  const config = readConfig(env);

  const client = config
    ? (options.client ??
      new LeaderboardClient({
        baseUrl: config.baseUrl,
        token: config.token,
        fetchImpl: options.fetchImpl ?? globalThis.fetch,
        env,
        logger,
        ...options.clientOptions
      }))
    : null;

  const playerTopCount = Math.floor(
    readNumber(env, 'LEADERBOARD_PLAYER_TOP_COUNT', DEFAULT_PLAYER_TOP_COUNT, 1)
  );
  const boardTimeoutMs = readNumber(env, 'LEADERBOARD_BOARD_TIMEOUT_MS', DEFAULT_BOARD_TIMEOUT_MS, 1);

  const eventsCache = new TtlCache({ ttlMs: EVENTS_TTL_MS, maxEntries: 1, now });
  const boardCache = new TtlCache({ ttlMs: BOARD_TTL_MS, maxEntries: 4, now });
  const eventsInflight = new InflightMap();
  const boardInflight = new InflightMap();
  // Last player id that fetched each event's board, so /stats can refetch an
  // expired board without a ?player= parameter.
  const anchors = new Map();
  const playerInflight = new InflightMap();

  const getEvents = async () => {
    const cached = eventsCache.get('events');
    if (cached) {
      return cached;
    }
    return eventsInflight.run('events', async () => {
      const body = await client.get('/leaderboards', { operation: 'list-leaderboards' });
      const events = parseEvents(body, { now: now(), project: config.project });
      eventsCache.set('events', events);
      return events;
    });
  };

  // One full board per event, shared across players and concurrent requests.
  // The requesting player is the anchor (archiver strategy).
  const getBoard = async (guid, anchorPlayerId) => {
    const cached = boardCache.get(guid);
    if (cached) {
      return cached;
    }
    return boardInflight.run(guid, async () => {
      anchors.set(guid, anchorPlayerId);
      const body = await client.get(
        `/leaderboards/${guid}/players/${anchorPlayerId}/results?offset=0&topCount=${FULL_TOP_COUNT}&resolvePlayers=true`,
        { operation: 'full-board', timeoutMs: Math.max(boardTimeoutMs, client.timeoutMs) }
      );
      const parsed = parseBoard(body?.resultMap);
      if (!parsed) {
        throw new UpstreamError('Full board response had no global results', { code: 'NO_BOARD' });
      }
      const board = { ...parsed, fetchedAt: new Date(now()).toISOString() };
      boardCache.set(guid, board);
      return board;
    });
  };

  const buildPlayerResult = async (guid, playerId) => {
    const event = await findEvent(guid);

    let registration;
    try {
      const body = await client.get(`/leaderboards/${event.guid}/players/${playerId}`, {
        operation: 'player-registration'
      });
      registration = body?.data ?? null;
    } catch (error) {
      if (error instanceof UpstreamError && error.status === 404) {
        throw new RouteError(404, 'player-not-found');
      }
      throw error;
    }
    if (!registration) {
      throw new RouteError(404, 'player-not-found');
    }

    const resultsBody = await client.get(
      `/leaderboards/${event.guid}/players/${playerId}/results` +
        `?offset=${PLAYER_OFFSET}&topCount=${playerTopCount}&resolvePlayers=true`,
      { operation: 'player-results' }
    );
    const resultMap = resultsBody?.resultMap;
    if (!resultMap?.results) {
      throw new UpstreamError('Player results response had no results', { code: 'NO_RESULTS' });
    }

    const isActive = Boolean(resultMap.results.rootResults?.topResults?.rankedEntry?.length);
    const board = isActive ? await getBoard(event.guid, playerId) : null;

    return shapePlayerResult({
      event,
      playerId,
      registration,
      resultMap,
      board,
      fetchedAt: new Date(now()).toISOString()
    });
  };

  const findEvent = async (guid) => {
    const events = await getEvents();
    const event = events.find((e) => e.guid.toLowerCase() === guid);
    if (!event) {
      throw new RouteError(404, 'event-not-found');
    }
    return event;
  };

  const buildStats = async (guid, playerId) => {
    const event = await findEvent(guid);
    const anchor = playerId ?? anchors.get(event.guid);
    if (!boardCache.get(event.guid) && !anchor) {
      throw new RouteError(400, 'bad-request');
    }
    const board = await getBoard(event.guid, anchor);
    return { ...computeStats(board), boardFetchedAt: board.fetchedAt };
  };

  const unavailable = (res) =>
    res.status(503).json({
      error: 'leaderboard-unavailable',
      message: 'Leaderboard is not configured on this server.'
    });

  const fail = (res, error, label) => {
    if (error instanceof RouteError) {
      return res.status(error.status).json({ error: error.code });
    }
    const detail =
      error instanceof UpstreamError
        ? `${error.code ?? ''} status=${error.status ?? 'none'}`
        : (error?.name ?? 'Error');
    logger.error?.(`[leaderboard] ${label} failed: ${detail}`);
    return res.status(502).json({ error: 'upstream-failed' });
  };

  // Never an error status: browsers log every non-2xx fetch, and the tracker
  // calls this on every AdCom page load.
  app.get('/api/leaderboard/events', async (req, res) => {
    if (!client) {
      return res.json({ events: [], unavailable: true });
    }
    try {
      res.json({ events: await getEvents(), unavailable: false });
    } catch (error) {
      const detail =
        error instanceof UpstreamError
          ? `${error.code ?? ''} status=${error.status ?? 'none'}`
          : (error?.name ?? 'Error');
      logger.error?.(`[leaderboard] events failed: ${detail}`);
      res.json({ events: [], unavailable: true });
    }
  });

  app.get('/api/leaderboard/:guid/player/:playerId', async (req, res) => {
    if (!client) {
      return unavailable(res);
    }
    const { guid, playerId } = req.params;
    if (!GUID_PATTERN.test(guid) || !PLAYER_ID_PATTERN.test(playerId)) {
      return res.status(400).json({ error: 'bad-request' });
    }

    const normalizedGuid = guid.toLowerCase();
    const normalizedPlayerId = playerId.toUpperCase();
    const key = `${normalizedGuid}:${normalizedPlayerId}`;

    try {
      // Identical requests that arrive together share one upstream lookup; nothing is kept afterwards.
      res.json(await playerInflight.run(key, () => buildPlayerResult(normalizedGuid, normalizedPlayerId)));
    } catch (error) {
      fail(res, error, 'player');
    }
  });

  app.get('/api/leaderboard/:guid/stats', async (req, res) => {
    if (!client) {
      return unavailable(res);
    }
    const { guid } = req.params;
    const player = req.query.player;
    if (
      !GUID_PATTERN.test(guid) ||
      (player !== undefined && (typeof player !== 'string' || !PLAYER_ID_PATTERN.test(player)))
    ) {
      return res.status(400).json({ error: 'bad-request' });
    }

    try {
      res.json(await buildStats(guid.toLowerCase(), player?.toUpperCase()));
    } catch (error) {
      fail(res, error, 'stats');
    }
  });
}
