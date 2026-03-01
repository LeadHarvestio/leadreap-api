// ─────────────────────────────────────────────────────────────
// MIDDLEWARE — Auth + rate limiting
// ─────────────────────────────────────────────────────────────

import { validateSession, getSearchLimit } from "./auth.js";

/**
 * Attaches req.user if a valid session token is present.
 * Does NOT block unauthenticated requests (use requireAuth for that).
 */
export function attachUser(req, res, next) {
  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.cookies?.session ||
    null;

  if (token) {
    req.user = validateSession(token);
  } else {
    req.user = null;
  }
  next();
}

/**
 * Blocks requests without a valid session.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
  }
  next();
}

/**
 * Blocks requests that exceed the plan's search rate limit.
 */
export function requireSearchQuota(req, res, next) {
  if (!req.user) {
    // Allow unauthenticated users a very limited number of searches
    // (handled by IP-based rate limiting in the main rate limiter)
    return next();
  }

  const limit = getSearchLimit(req.user.plan);
  if (req.user.searchesToday >= limit) {
    return res.status(429).json({
      error: "Search limit reached",
      code: "RATE_LIMIT",
      plan: req.user.plan,
      limit,
      used: req.user.searchesToday,
      upgrade: req.user.plan === "free",
    });
  }
  next();
}

/**
 * Simple IP-based rate limiter for unauthenticated requests.
 * In-memory — resets on server restart. Good enough for launch.
 */
const ipHits = new Map();
const IP_WINDOW = 60 * 60 * 1000; // 1 hour
const IP_MAX_FREE = parseInt(process.env.FREE_SEARCHES_PER_HOUR || "3");

export function ipRateLimit(req, res, next) {
  // Skip for authenticated users (they have plan-based limits)
  if (req.user) return next();

  const ip = req.ip || req.socket.remoteAddress;
  const now = Date.now();

  if (!ipHits.has(ip)) {
    ipHits.set(ip, { count: 1, resetAt: now + IP_WINDOW });
    return next();
  }

  const entry = ipHits.get(ip);
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + IP_WINDOW;
    return next();
  }

  entry.count++;
  if (entry.count > IP_MAX_FREE) {
    return res.status(429).json({
      error: "Free search limit reached. Sign up to continue.",
      code: "IP_RATE_LIMIT",
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    });
  }
  next();
}

// Clean up stale IP entries every 10 min
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipHits.entries()) {
    if (now > entry.resetAt) ipHits.delete(ip);
  }
}, 10 * 60 * 1000);
