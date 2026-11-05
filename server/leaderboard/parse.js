// Pure functions that turn Kestrel leaderboard v3 responses into the tracker's
// response shapes. No I/O here.

export const PROJECT = 'adcom';

// Events that cannot be identified as test events by their data.
export const HIDDEN_EVENT_GUIDS = ['3b788292-787f-4c60-9f8d-fee2f1216847'];

// Same order as the old site. Integers are ranks, fractions are top shares.
export const BRACKETS = [1, 5, 25, 100, 0.01, 0.05, 0.1, 0.25, 0.5, 0.75];

const toIso = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

// Port of adcom-leaderboard parseAllEvents. Future events are included.
export function parseEvents(body, { now = Date.now(), project = PROJECT, hiddenGuids = HIDDEN_EVENT_GUIDS } = {}) {
  const list = Array.isArray(body?.data) ? body.data : [];
  const events = [];

  for (const item of list) {
    const instance = item?.instance;
    const definition = instance?.definition;
    if (
      !definition?.requirements ||
      !definition.segmentDefinition ||
      definition.project !== project ||
      hiddenGuids.includes(instance.guid)
    ) {
      continue;
    }

    const requirement =
      definition.requirements.find((r) => r?.name === 'date') ?? definition.requirements[0];
    const start = new Date(requirement?.dateFrom);
    const end = new Date(requirement?.dateTo);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      continue;
    }

    const rootCounts = instance.statistics?.rootCounts ?? {};
    let players = (num(rootCounts.global) ?? 0) + (num(rootCounts.sandbox) ?? 0);
    if (num(rootCounts.archive) !== null) {
      players += rootCounts.archive;
    }

    // Started events with no players are dropped.
    if (start.getTime() < now && players === 0) {
      continue;
    }

    const divisionSize = parseInt(definition.segmentDefinition.configuration?.MAX_ENTRIES, 10);

    events.push({
      guid: instance.guid,
      theme: definition.name,
      start: start.toISOString(),
      end: end.toISOString(),
      status: instance.status?.currentStatus === 'Enabled' ? 'active' : 'archived',
      live: now >= start.getTime() && now < end.getTime(),
      players,
      divisionSize: Number.isNaN(divisionSize) ? null : divisionSize
    });
  }

  events.sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
  return events;
}

// First run of [A-Z_0-9] in the segment id, as helper.js getSpendingCategory
// reads it: "defenseSPEND_100_TO_500:20" -> "SPEND_100_TO_500". Segment ids
// containing "default" (spending-agnostic) return "default".
export function parseSegmentCategory(segmentId) {
  if (typeof segmentId !== 'string' || segmentId === '') {
    return null;
  }
  if (segmentId.includes('default')) {
    return 'default';
  }
  const match = /[A-Z_][A-Z_\d]*/.exec(segmentId);
  return match ? match[0] : null;
}

// Reduce a full-board response to what the routes need: the player count, the
// scores indexed by 0-based position and a playerId -> position map. Returns
// null when the response has no global top results (archived event).
export function parseBoard(resultMap) {
  const entries = resultMap?.results?.rootResults?.topResults?.rankedEntry;
  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  const scores = [];
  const positionById = new Map();
  entries.forEach((entry, index) => {
    const position = num(entry?.position?.position) ?? index;
    scores[position] = entry.score;
    positionById.set(entry.playerId, position);
  });

  return {
    count: num(entries[0]?.position?.count) ?? entries.length,
    scores,
    positionById
  };
}

// Cut-off scores, ported from adcom-leaderboard rankedEntryData.
// Fractional brackets whose position index is <= 99 are omitted entirely.
// Rows whose score cannot be computed (incomplete board, missing index) have
// score null.
export function computeBrackets(board) {
  const { count, scores } = board;
  const complete = scores.length >= count;
  const rows = [];

  for (const bracket of BRACKETS) {
    const isFraction = bracket < 1;
    const index = isFraction ? Math.floor(count * bracket) - 1 : bracket - 1;

    if (isFraction && index <= 99) {
      continue;
    }

    const raw = complete ? scores[index] : undefined;
    rows.push({
      rank: isFraction ? null : bracket,
      fraction: isFraction ? bracket : null,
      score: typeof raw === 'number' && Number.isFinite(raw) ? Math.floor(raw) : null
    });
  }

  return rows;
}

const ordinalMap = (resultMap) => {
  const map = new Map();
  for (const player of resultMap?.resolvedPlayers?.objectArray ?? []) {
    const sequence = num(player?.sequence);
    if (sequence !== null) {
      map.set(player.playerId, sequence);
    }
  }
  return map;
};

// Division rows from segment top results plus the entries around the player,
// de-duplicated by player and ordered by position.
function divisionEntries(resultMap, board, playerId, ordinals) {
  const segment = resultMap?.results?.segmentResults;
  const merged = new Map();
  for (const entry of [
    ...(segment?.topResults?.rankedEntry ?? []),
    ...(segment?.offsetResults?.rankedEntry ?? [])
  ]) {
    if (entry?.playerId && !merged.has(entry.playerId)) {
      merged.set(entry.playerId, entry);
    }
  }

  const entries = [...merged.values()]
    .map((entry) => ({
      ordinal: ordinals.get(entry.playerId) ?? null,
      position: num(entry.position?.position) ?? 0,
      globalPosition: board?.positionById.get(entry.playerId) ?? null,
      trophies: num(entry.score) ?? 0,
      isPlayer: entry.playerId === playerId
    }))
    .sort((a, b) => a.position - b.position);

  const first = [...merged.values()][0];
  const count = num(first?.position?.count) ?? entries.length;
  return { count, entries };
}

// Build the PlayerResult. `board` is parseBoard() output (active events) or null.
export function shapePlayerResult({ event, playerId, registration, resultMap, board, cachedAt }) {
  const ordinals = ordinalMap(resultMap);
  const rootResults = resultMap?.results?.rootResults;
  const isActive = Boolean(rootResults?.topResults?.rankedEntry?.length);

  const player = {
    playerId,
    ordinal: ordinals.get(playerId) ?? null,
    segmentId: registration?.segmentId ?? null,
    shortboardCategory: parseSegmentCategory(registration?.segmentId),
    root: registration?.root ?? null,
    trophies: num(registration?.score),
    joined: registration?.created ? toIso(registration.created) : null,
    updated: registration?.updated ? toIso(registration.updated) : null,
    globalPosition: null,
    globalCount: null,
    divisionPosition: null,
    divisionCount: null
  };

  const eventOut = {
    guid: event.guid,
    theme: event.theme,
    start: event.start,
    end: event.end,
    status: event.status
  };

  if (!isActive) {
    const archived = rootResults?.offsetResults?.archivedEntry;
    player.globalPosition = num(archived?.rootPosition?.position);
    player.globalCount = num(archived?.rootPosition?.count);
    player.divisionPosition = num(archived?.segmentPosition?.position);
    player.divisionCount = num(archived?.segmentPosition?.count);
    if (player.trophies === null) {
      player.trophies = num(archived?.score);
    }
    return { event: eventOut, player, global: null, division: null, cachedAt };
  }

  // Global position: the full board first, then the entries around the player.
  const adjacent = (rootResults.offsetResults?.rankedEntry ?? []).find((e) => e.playerId === playerId);
  player.globalPosition = board?.positionById.get(playerId) ?? num(adjacent?.position?.position);
  player.globalCount = board?.count ?? num(adjacent?.position?.count) ?? num(rootResults.topResults.rankedEntry[0]?.position?.count);

  const division = divisionEntries(resultMap, board, playerId, ordinals);
  const own = division.entries.find((e) => e.isPlayer);
  if (own) {
    player.divisionPosition = own.position;
    if (player.trophies === null) {
      player.trophies = own.trophies;
    }
  }
  if (division.entries.length > 0) {
    player.divisionCount = division.count;
  }

  return {
    event: eventOut,
    player,
    global: board ? { count: board.count, brackets: computeBrackets(board) } : null,
    division: division.entries.length > 0 ? division : null,
    cachedAt
  };
}
