// Rate-limited client for the Hyper Hippo "Kestrel" leaderboard v3 API.
// Ported from adcom-leaderboard's GameApiClient, using global fetch.
//
// Limits: max concurrency, a cap on request starts per second, a per-request
// timeout, and retries on 429/502/503/504 and network errors. A 429 pauses the
// shared queue for the Retry-After duration. The token and upstream URL are
// never logged or placed in error messages.

const DEFAULT_MAX_CONCURRENCY = 4;
const DEFAULT_REQUESTS_PER_SECOND = 8;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_FALLBACK_RETRY_MS = 2_000;
const DEFAULT_RETRY_JITTER_MS = 250;
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

export const readNumber = (env, name, fallback, minimum) => {
  const raw = env[name];
  if (raw === undefined || raw === null || raw === '') {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
};

export class UpstreamError extends Error {
  constructor(message, { status = null, code = null, retryable = false, retryAfterMs = null } = {}) {
    super(message);
    this.name = 'UpstreamError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

export class LeaderboardClient {
  constructor({
    baseUrl,
    token,
    fetchImpl = globalThis.fetch,
    env = process.env,
    logger = console,
    maxConcurrency,
    requestsPerSecond,
    timeoutMs,
    maxRetries,
    fallbackRetryMs,
    retryJitterMs,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now = () => Date.now(),
    random = Math.random
  }) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.fetchImpl = fetchImpl;
    this.logger = logger;
    this.maxConcurrency = Math.floor(
      maxConcurrency ?? readNumber(env, 'ADCOM_API_MAX_CONCURRENCY', DEFAULT_MAX_CONCURRENCY, 1)
    );
    this.minimumStartIntervalMs =
      1_000 / (requestsPerSecond ?? readNumber(env, 'ADCOM_API_REQUESTS_PER_SECOND', DEFAULT_REQUESTS_PER_SECOND, 0.001));
    this.timeoutMs = Math.floor(timeoutMs ?? readNumber(env, 'ADCOM_API_TIMEOUT_MS', DEFAULT_TIMEOUT_MS, 1));
    this.maxRetries = Math.floor(maxRetries ?? readNumber(env, 'ADCOM_API_MAX_RETRIES', DEFAULT_MAX_RETRIES, 0));
    this.fallbackRetryMs = Math.floor(
      fallbackRetryMs ?? readNumber(env, 'ADCOM_API_FALLBACK_RETRY_MS', DEFAULT_FALLBACK_RETRY_MS, 0)
    );
    this.retryJitterMs = Math.floor(
      retryJitterMs ?? readNumber(env, 'ADCOM_API_RETRY_JITTER_MS', DEFAULT_RETRY_JITTER_MS, 0)
    );
    this.sleep = sleep;
    this.now = now;
    this.random = random;

    this.normalQueue = [];
    this.retryQueue = [];
    this.activeRequests = 0;
    this.nextStartAt = 0;
    this.cooldownUntil = 0;
    this.drainTimer = null;
    this.requestCounter = 0;
  }

  // GET `${baseUrl}${path}` and return the parsed JSON body.
  async get(path, { operation = 'request', timeoutMs } = {}) {
    const url = `${this.baseUrl}${path}`;
    const requestId = ++this.requestCounter;
    const attemptTimeout = Math.floor(timeoutMs ?? this.timeoutMs);

    for (let retryIndex = 0; ; retryIndex++) {
      try {
        return await this._schedule(() => this._attempt(url, attemptTimeout, retryIndex, operation, requestId), retryIndex > 0);
      } catch (error) {
        if (!(error instanceof UpstreamError) || !error.retryable || retryIndex >= this.maxRetries) {
          throw error;
        }
        this._log('warn', `request=${requestId} operation=${operation} retry=${retryIndex + 1}/${this.maxRetries} waitMs=${error.retryAfterMs}`);
        // A 429 already paused the shared queue; other failures only delay
        // this logical request.
        if (error.status !== 429) {
          await this.sleep(error.retryAfterMs);
        }
      }
    }
  }

  async _attempt(url, timeoutMs, retryIndex, operation, requestId) {
    const startedAt = this.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let response;
      try {
        response = await this.fetchImpl(url, {
          method: 'GET',
          headers: {
            _token: this.token,
            'User-Agent': 'adcom-mission-tracker',
            Accept: 'application/json'
          },
          signal: controller.signal
        });
      } catch (cause) {
        const timedOut = controller.signal.aborted;
        this._log('warn', `request=${requestId} operation=${operation} try=${retryIndex + 1} ${timedOut ? 'timeout' : 'network-error'}`);
        throw new UpstreamError(timedOut ? 'Upstream request timed out' : 'Upstream network error', {
          code: timedOut ? 'TIMEOUT' : 'NETWORK',
          retryable: true,
          retryAfterMs: this._retryDelay(null, retryIndex)
        });
      }

      const durationMs = Math.round(this.now() - startedAt);

      if (!response.ok) {
        const status = response.status;
        const delay = this._retryDelay(this._parseRetryAfter(response.headers), retryIndex);
        try {
          await response.body?.cancel();
        } catch {
          // ignore
        }
        this._log('warn', `request=${requestId} operation=${operation} try=${retryIndex + 1} status=${status} durationMs=${durationMs}`);
        if (status === 429) {
          this._pauseQueue(delay);
        }
        throw new UpstreamError(`Upstream responded with HTTP ${status}`, {
          status,
          retryable: RETRYABLE_STATUSES.has(status),
          retryAfterMs: delay
        });
      }

      try {
        const body = await response.json();
        this._log('info', `request=${requestId} operation=${operation} try=${retryIndex + 1} status=${response.status} durationMs=${Math.round(this.now() - startedAt)}`);
        return body;
      } catch (cause) {
        if (cause instanceof SyntaxError) {
          throw new UpstreamError('Upstream returned invalid JSON', { status: response.status, code: 'BAD_JSON' });
        }
        const timedOut = controller.signal.aborted;
        throw new UpstreamError(timedOut ? 'Upstream request timed out' : 'Upstream network error', {
          code: timedOut ? 'TIMEOUT' : 'NETWORK',
          retryable: true,
          retryAfterMs: this._retryDelay(null, retryIndex)
        });
      }
    } finally {
      clearTimeout(timer);
    }
  }

  _retryDelay(retryAfterMs, retryIndex) {
    const base = retryAfterMs ?? this.fallbackRetryMs * 2 ** retryIndex;
    const jitter = this.retryJitterMs > 0 ? Math.floor(this.random() * this.retryJitterMs) : 0;
    return Math.max(0, Math.ceil(base + jitter));
  }

  _parseRetryAfter(headers) {
    const value = headers?.get?.('retry-after');
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return seconds * 1_000;
    }
    const date = Date.parse(value);
    return Number.isNaN(date) ? null : Math.max(0, date - this.now());
  }

  _schedule(task, isRetry) {
    return new Promise((resolve, reject) => {
      (isRetry ? this.retryQueue : this.normalQueue).push({ task, resolve, reject });
      this._drain();
    });
  }

  _drain() {
    if (
      this.activeRequests >= this.maxConcurrency ||
      (this.retryQueue.length === 0 && this.normalQueue.length === 0)
    ) {
      return;
    }

    const now = this.now();
    const allowedStartAt = Math.max(this.nextStartAt, this.cooldownUntil);

    if (allowedStartAt > now) {
      if (!this.drainTimer) {
        this.drainTimer = setTimeout(() => {
          this.drainTimer = null;
          this._drain();
        }, Math.ceil(allowedStartAt - now));
      }
      return;
    }

    if (this.drainTimer) {
      clearTimeout(this.drainTimer);
      this.drainTimer = null;
    }

    const job = this.retryQueue.shift() ?? this.normalQueue.shift();
    this.activeRequests++;
    this.nextStartAt = this.now() + this.minimumStartIntervalMs;

    Promise.resolve()
      .then(job.task)
      .then(job.resolve, job.reject)
      .finally(() => {
        this.activeRequests--;
        this._drain();
      });

    this._drain();
  }

  _pauseQueue(milliseconds) {
    this.cooldownUntil = Math.max(this.cooldownUntil, this.now() + milliseconds);
    this._drain();
  }

  _log(level, message) {
    const method = this.logger?.[level] ?? this.logger?.log;
    if (typeof method === 'function') {
      method.call(this.logger, `[leaderboard-api] ${message}`);
    }
  }
}
