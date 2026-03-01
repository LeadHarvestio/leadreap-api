// scraper/utils.js
// Retry logic, data normalization, and validation utilities

// ─────────────────────────────────────────────────────────────
// RETRY WITH EXPONENTIAL BACKOFF
// ─────────────────────────────────────────────────────────────

/**
 * Retry an async function with exponential backoff.
 * @param {Function} fn        - Async function to retry
 * @param {Object}   opts
 * @param {number}   opts.attempts  - Max attempts (default 3)
 * @param {number}   opts.baseMs    - Base delay in ms (default 1000)
 * @param {number}   opts.maxMs     - Max delay cap in ms (default 8000)
 * @param {string}   opts.label     - Label for logging
 */
export async function withRetry(fn, { attempts = 3, baseMs = 1000, maxMs = 8000, label = "task" } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === attempts) break;

      // Exponential backoff with jitter so parallel retries don't collide
      const delay = Math.min(baseMs * Math.pow(2, attempt - 1) + Math.random() * 500, maxMs);
      console.warn(`  ↺ [${label}] Attempt ${attempt}/${attempts} failed: ${err.message} — retrying in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }

  // All attempts exhausted — log and return null rather than throwing
  // so one bad listing doesn't kill the whole scrape
  console.error(`  ✗ [${label}] All ${attempts} attempts failed: ${lastError?.message}`);
  return null;
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Run an array of async task-factories with a concurrency cap
export async function pLimit(tasks, limit) {
  const results = [];
  const executing = new Set();

  for (const task of tasks) {
    const p = Promise.resolve().then(task).then(r => { executing.delete(p); return r; });
    results.push(p);
    executing.add(p);
    if (executing.size >= limit) await Promise.race(executing);
  }

  return Promise.allSettled(results);
}

// ─────────────────────────────────────────────────────────────
// PHONE NORMALIZATION
// Converts any US phone format to E.164: +15125550100
// ─────────────────────────────────────────────────────────────
export function normalizePhone(raw) {
  if (!raw) return null;

  // Strip everything except digits
  const digits = raw.replace(/\D/g, "");

  // Handle 10-digit US numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Handle 11-digit with country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // Return original if we can't normalize (international, etc.)
  return raw.trim() || null;
}

export function formatPhoneDisplay(e164) {
  if (!e164 || !e164.startsWith("+1")) return e164;
  const d = e164.slice(2);
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// ─────────────────────────────────────────────────────────────
// EMAIL VALIDATION + QUALITY SCORING
// ─────────────────────────────────────────────────────────────

const GENERIC_PREFIXES = new Set([
  "info", "contact", "hello", "support", "help", "admin", "office",
  "enquiries", "enquiry", "mail", "email", "webmaster", "noreply",
  "no-reply", "donotreply", "team", "sales", "service", "services",
  "booking", "bookings", "reservations", "reception", "general",
]);

const OWNER_SIGNALS = new Set([
  "owner", "founder", "ceo", "president", "director", "manager",
  "principal", "partner", "dr", "doc",
]);

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwam.com",
  "10minutemail.com", "yopmail.com", "trashmail.com", "fakeinbox.com",
]);

const FREE_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
  "icloud.com", "me.com", "live.com", "msn.com", "protonmail.com",
]);

/**
 * Assess email quality.
 * Returns: { valid, quality, qualityLabel, reason }
 * quality: "owner" | "personal" | "generic" | "free" | "invalid"
 */
export function assessEmail(email) {
  if (!email) return { valid: false, quality: null, qualityLabel: null, reason: "No email" };

  const lower = email.toLowerCase().trim();

  // Basic format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)) {
    return { valid: false, quality: "invalid", qualityLabel: "Invalid", reason: "Malformed email" };
  }

  const [prefix, domain] = lower.split("@");

  // Disposable check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, quality: "invalid", qualityLabel: "Disposable", reason: "Disposable email domain" };
  }

  // Free email = personal but not business
  if (FREE_DOMAINS.has(domain)) {
    return { valid: true, quality: "free", qualityLabel: "Personal (free)", reason: "Free email provider" };
  }

  // Check prefix for owner signals
  const prefixWords = prefix.replace(/[._-]/g, " ").split(" ");
  const hasOwnerSignal = prefixWords.some(w => OWNER_SIGNALS.has(w));
  if (hasOwnerSignal) {
    return { valid: true, quality: "owner", qualityLabel: "Owner/Decision-maker", reason: "Owner-signal in prefix" };
  }

  // Generic catch-all prefixes
  if (GENERIC_PREFIXES.has(prefix)) {
    return { valid: true, quality: "generic", qualityLabel: "Generic (catch-all)", reason: "Generic email prefix" };
  }

  // Looks like a personal business email (e.g. john.smith@businessname.com)
  const looksPersonal = /^[a-z]+[._-]?[a-z]+$/.test(prefix) && prefix.length <= 20;
  if (looksPersonal) {
    return { valid: true, quality: "personal", qualityLabel: "Personal business email", reason: "Name-style prefix" };
  }

  // Default: valid business email, unknown type
  return { valid: true, quality: "business", qualityLabel: "Business email", reason: "Business domain email" };
}

/**
 * Quality scores for lead scoring adjustment
 */
export const EMAIL_QUALITY_SCORES = {
  owner:    15,  // highest — direct decision maker
  personal: 10,  // good — likely reaches a person
  business:  7,  // decent
  free:      5,  // low — may not be business email
  generic:   2,  // lowest — catch-all, often unmonitored
  invalid:   0,
};

// ─────────────────────────────────────────────────────────────
// WEBSITE NORMALIZATION
// ─────────────────────────────────────────────────────────────
export function normalizeWebsite(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.origin; // strip path/query — we just want the domain
  } catch {
    return url.trim() || null;
  }
}

export function extractDomain(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
