// CDN-friendly freshness and high-performance in-memory caching for public, CMS-driven reads.
// Authenticated and mutating routes are never cached. 60s max-age keeps content edits visible
// quickly while absorbing repeat traffic; stale-while-revalidate smooths spikes.
export function cachePublic(res, seconds = 60) {
  res.setHeader('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 5}`);
}

const memoryStore = new Map();

/**
 * Retrieve cached response if still within TTL.
 * @param {string} key
 * @returns {any | null}
 */
export function getCached(key) {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Cache data in memory with custom TTL (default 30 seconds).
 * @param {string} key
 * @param {any} value
 * @param {number} ttlMs
 */
export function setCached(key, value, ttlMs = 30_000) {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Invalidate cache by key or prefix, or wipe entirely on mutations.
 * @param {string} prefix
 */
export function clearCache(prefix = '') {
  if (!prefix) {
    memoryStore.clear();
    return;
  }
  for (const k of memoryStore.keys()) {
    if (k.startsWith(prefix)) {
      memoryStore.delete(k);
    }
  }
}
