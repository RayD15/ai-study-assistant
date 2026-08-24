/**
 * Rate limiter in-memory sederhana per user (sliding window per interval).
 *
 * Catatan: state disimpan di memori proses. Di serverless (Vercel) tiap
 * instance punya bucket sendiri, jadi ini pengaman kasar — cukup untuk
 * melindungi kuota Gemini dari spam/klik berulang.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

let lastPrune = 0;
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;

function prune(now: number) {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  /** Detik sampai kuota reset (0 jika ok). */
  retryAfterSec: number;
};

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  prune(now);

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count++;
  return { ok: true, retryAfterSec: 0 };
}

/** Batas pemakaian fitur AI: 6 req/menit per fitur, maksimal 60 req/hari total. */
export function aiRateLimit(
  userId: number,
  endpoint: string,
): RateLimitResult & { kind: "minute" | "daily" } {
  const daily = rateLimit(`ai-daily:${userId}`, 60, 24 * 60 * 60 * 1000);
  if (!daily.ok) return { ...daily, kind: "daily" };

  const perMinute = rateLimit(`ai-${endpoint}:${userId}`, 6, 60 * 1000);
  if (!perMinute.ok) return { ...perMinute, kind: "minute" };

  return { ok: true, retryAfterSec: 0, kind: "minute" };
}
