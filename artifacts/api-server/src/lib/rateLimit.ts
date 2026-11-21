import type { Request, Response, NextFunction } from "express";

/**
 * Fixed-window limiter held in process memory.
 *
 * The app runs as a single container, so a shared store would be extra moving
 * parts for no benefit. Swap in Redis if this is ever scaled horizontally.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Keeps the map from growing without bound on a long-lived process.
const SWEEP_INTERVAL_MS = 60_000;
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, SWEEP_INTERVAL_MS);
sweeper.unref?.();

function clientKey(req: Request): string {
  // Caddy terminates TLS and sets X-Forwarded-For.
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = (raw || "").split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  return ip;
}

export function rateLimit(options: {
  name: string;
  windowMs: number;
  max: number;
  message?: string;
}) {
  const { name, windowMs, max, message = "Too many requests. Please try again shortly." } = options;

  return function limiter(req: Request, res: Response, next: NextFunction): void {
    const key = `${name}:${clientKey(req)}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > max) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}
