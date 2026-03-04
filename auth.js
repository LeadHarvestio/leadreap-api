// ─────────────────────────────────────────────────────────────
// AUTH — Email-based license system backed by SQLite
// No passwords. User enters email → gets a magic link → session.
// LemonSqueezy webhook activates their plan.
// ─────────────────────────────────────────────────────────────

import Database from "better-sqlite3";
import { randomUUID, createHmac } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = process.env.DB_PATH || path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "leadreap.db");

// Ensure data directory exists
import fs from "fs";
fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
console.log(`[Auth] SQLite database: ${DB_PATH}`);

// ─────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    plan        TEXT NOT NULL DEFAULT 'free',
    lemon_customer_id   TEXT,
    lemon_order_id      TEXT,
    searches_today      INTEGER DEFAULT 0,
    searches_reset_at   TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token       TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS magic_links (
    code        TEXT PRIMARY KEY,
    email       TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    used        INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS search_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    niche       TEXT NOT NULL,
    location    TEXT NOT NULL,
    lead_count  INTEGER DEFAULT 0,
    job_id      TEXT UNIQUE,
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_search_history_job ON search_history(job_id);
`);

// ─────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────
const stmts = {
  findUserByEmail:  db.prepare("SELECT * FROM users WHERE email = ?"),
  findUserById:     db.prepare("SELECT * FROM users WHERE id = ?"),
  createUser:       db.prepare("INSERT INTO users (id, email, plan) VALUES (?, ?, 'free')"),
  upgradePlan:      db.prepare("UPDATE users SET plan = ?, lemon_customer_id = ?, lemon_order_id = ?, updated_at = datetime('now') WHERE email = ?"),
  incrementSearch:  db.prepare("UPDATE users SET searches_today = searches_today + 1, updated_at = datetime('now') WHERE id = ?"),
  resetSearchCount: db.prepare("UPDATE users SET searches_today = 0, searches_reset_at = datetime('now') WHERE id = ?"),

  // Sessions
  createSession:    db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)"),
  findSession:      db.prepare("SELECT s.*, u.email, u.plan, u.searches_today FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime('now')"),
  deleteSession:    db.prepare("DELETE FROM sessions WHERE token = ?"),
  cleanSessions:    db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')"),

  // Magic links
  createMagicLink:  db.prepare("INSERT INTO magic_links (code, email, expires_at) VALUES (?, ?, ?)"),
  findMagicLink:    db.prepare("SELECT * FROM magic_links WHERE code = ? AND used = 0 AND expires_at > datetime('now')"),
  useMagicLink:     db.prepare("UPDATE magic_links SET used = 1 WHERE code = ?"),
  cleanMagicLinks:  db.prepare("DELETE FROM magic_links WHERE expires_at < datetime('now')"),

  // Search history
  insertSearch:     db.prepare("INSERT OR IGNORE INTO search_history (user_id, niche, location, lead_count, job_id) VALUES (?, ?, ?, ?, ?)"),
  getUserHistory:   db.prepare("SELECT niche, location, lead_count AS leadCount, job_id AS jobId, created_at AS timestamp FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"),
};

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

/** Find or create a user by email */
export function getOrCreateUser(email) {
  const normalized = email.toLowerCase().trim();
  let user = stmts.findUserByEmail.get(normalized);
  if (!user) {
    const id = randomUUID();
    stmts.createUser.run(id, normalized);
    user = stmts.findUserById.get(id);
  }
  return user;
}

/** Create a magic login code (6-char alphanumeric) */
export function createMagicLink(email) {
  const code = randomUUID().slice(0, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min
  getOrCreateUser(email); // ensure user exists
  stmts.createMagicLink.run(code, email.toLowerCase().trim(), expiresAt);
  return code;
}

/** Verify a magic code and return a session token */
export function verifyMagicLink(code) {
  const link = stmts.findMagicLink.get(code.toUpperCase());
  if (!link) return null;

  stmts.useMagicLink.run(link.code);
  const user = getOrCreateUser(link.email);

  // Create session (30 day expiry)
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  stmts.createSession.run(token, user.id, expiresAt);

  return { token, user };
}

/** Validate a session token → returns user or null */
export function validateSession(token) {
  if (!token) return null;
  const row = stmts.findSession.get(token);
  if (!row) return null;
  return {
    id: row.user_id,
    email: row.email,
    plan: row.plan,
    searchesToday: row.searches_today,
  };
}

/** Destroy a session (logout) */
export function destroySession(token) {
  stmts.deleteSession.run(token);
}

/** Upgrade a user's plan (called from LemonSqueezy webhook) */
export function activateLicense(email, plan, customerId, orderId) {
  getOrCreateUser(email); // ensure user exists
  stmts.upgradePlan.run(plan, customerId, orderId, email.toLowerCase().trim());
  console.log(`[Auth] Activated ${plan} for ${email}`);
}

/** Check & increment search count for rate limiting */
export function recordSearch(userId) {
  const user = stmts.findUserById.get(userId);
  if (!user) return false;

  // Reset counter if it's a new day
  const today = new Date().toISOString().slice(0, 10);
  const resetDay = user.searches_reset_at ? user.searches_reset_at.slice(0, 10) : null;
  if (resetDay !== today) {
    stmts.resetSearchCount.run(userId);
  }

  stmts.incrementSearch.run(userId);
  return true;
}

/** Get rate limit for a plan */
export function getSearchLimit(plan) {
  const limits = {
    free: parseInt(process.env.FREE_SEARCHES_PER_HOUR || "3"),
    starter: 30,
    pro: 9999,
    agency: 9999,
  };
  return limits[plan] || limits.free;
}

/** Periodic cleanup */
export function cleanupAuth() {
  stmts.cleanSessions.run();
  stmts.cleanMagicLinks.run();
}

/** Upgrade a user's plan (called from Stripe webhook) */
export function upgradeUser(email, plan) {
  getOrCreateUser(email);
  stmts.upgradePlan.run(plan, null, null, email.toLowerCase().trim());
  console.log(`[Auth] Upgraded ${email} to ${plan} via Stripe`);
}

/** Save a search to persistent history (deduped by jobId) */
export function saveSearchHistory(userId, { niche, location, leadCount, jobId }) {
  if (!userId || !jobId) return;
  try {
    stmts.insertSearch.run(userId, niche, location, leadCount || 0, jobId);
  } catch (e) {
    // UNIQUE constraint = already saved, ignore
    if (!e.message.includes("UNIQUE")) {
      console.error("[Auth] saveSearchHistory error:", e.message);
    }
  }
}

/** Get a user's search history (most recent 50) */
export function getSearchHistory(userId) {
  if (!userId) return [];
  return stmts.getUserHistory.all(userId);
}

// Run cleanup every hour
setInterval(cleanupAuth, 60 * 60 * 1000);
