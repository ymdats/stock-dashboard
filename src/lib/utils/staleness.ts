const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

export function isCacheStale(cachedAt: number): boolean {
  return Date.now() - cachedAt > STALE_AFTER_MS;
}
