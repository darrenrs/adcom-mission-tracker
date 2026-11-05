// Small in-memory helpers for the leaderboard routes: a TTL cache with a size
// cap (least recently used entries are evicted first) and in-flight dedupe.

export class TtlCache {
  constructor({ ttlMs, maxEntries = 500, now = () => Date.now() }) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.now = now;
    this.map = new Map();
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= this.now()) {
      this.map.delete(key);
      return undefined;
    }
    // Refresh recency.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    this.map.delete(key);
    this.map.set(key, { value, expiresAt: this.now() + this.ttlMs });
    while (this.map.size > this.maxEntries) {
      this.map.delete(this.map.keys().next().value);
    }
  }

  delete(key) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }

  get size() {
    return this.map.size;
  }
}

// Shares one running promise per key. The entry is removed when it settles, so
// failures are never cached.
export class InflightMap {
  constructor() {
    this.map = new Map();
  }

  run(key, factory) {
    const existing = this.map.get(key);
    if (existing) {
      return existing;
    }
    const promise = Promise.resolve()
      .then(factory)
      .finally(() => {
        if (this.map.get(key) === promise) {
          this.map.delete(key);
        }
      });
    this.map.set(key, promise);
    return promise;
  }
}
