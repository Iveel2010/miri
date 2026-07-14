// ============================================================================
// Lightweight in-memory rate limiter (fixed window).
// Keyed by `${route}:${identifier}` (usually IP). For multi-instance
// deployments, replace the Map with a shared store (Redis) — see notes below.
// ============================================================================

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

const MAX = Number(process.env.RATE_LIMIT_MAX ?? 120);
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfter: number; // seconds until the window resets
}

export function rateLimit(key: string, max = MAX, windowMs = WINDOW_MS): RateLimitResult {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: max - 1, retryAfter: 0 };
  }

  if (entry.count >= max) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { success: true, remaining: max - entry.count, retryAfter: 0 };
}

/**
 * Build a stable client identifier from a Request.
 * Prefers the forwarded IP (behind a proxy) and falls back to a generic key.
 */
export function clientKey(req: Request, scope = "global"): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
  return `${scope}:${ip}`;
}
