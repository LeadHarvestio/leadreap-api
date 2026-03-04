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

  CREATE TABLE IF NOT EXISTS saved_lists (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS list_leads (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id     TEXT NOT NULL,
    lead_data   TEXT NOT NULL,
    status      TEXT DEFAULT 'new',
    notes       TEXT DEFAULT '',
    added_at    TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (list_id) REFERENCES saved_lists(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_search_history_job ON search_history(job_id);
  CREATE INDEX IF NOT EXISTS idx_saved_lists_user ON saved_lists(user_id);
  CREATE INDEX IF NOT EXISTS idx_list_leads_list ON list_leads(list_id);
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

  // Saved lists
  createList:       db.prepare("INSERT INTO saved_lists (id, user_id, name, description) VALUES (?, ?, ?, ?)"),
  getUserLists:     db.prepare("SELECT l.id, l.name, l.description, l.created_at AS createdAt, l.updated_at AS updatedAt, (SELECT COUNT(*) FROM list_leads WHERE list_id = l.id) AS leadCount FROM saved_lists l WHERE l.user_id = ? ORDER BY l.updated_at DESC"),
  getList:          db.prepare("SELECT * FROM saved_lists WHERE id = ? AND user_id = ?"),
  updateList:       db.prepare("UPDATE saved_lists SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"),
  deleteList:       db.prepare("DELETE FROM saved_lists WHERE id = ? AND user_id = ?"),
  touchList:        db.prepare("UPDATE saved_lists SET updated_at = datetime('now') WHERE id = ?"),

  // List leads
  addLeadToList:    db.prepare("INSERT INTO list_leads (list_id, lead_data, status, notes) VALUES (?, ?, ?, ?)"),
  getListLeads:     db.prepare("SELECT id, lead_data AS leadData, status, notes, added_at AS addedAt FROM list_leads WHERE list_id = ? ORDER BY added_at DESC"),
  updateLeadStatus: db.prepare("UPDATE list_leads SET status = ? WHERE id = ? AND list_id = ?"),
  updateLeadNotes:  db.prepare("UPDATE list_leads SET notes = ? WHERE id = ? AND list_id = ?"),
  removeLeadFromList: db.prepare("DELETE FROM list_leads WHERE id = ? AND list_id = ?"),
  countListLeads:   db.prepare("SELECT COUNT(*) AS count FROM list_leads WHERE list_id = ?"),
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

// ─────────────────────────────────────────────────────────────
// SAVED LISTS
// ─────────────────────────────────────────────────────────────

/** Create a new saved list */
export function createSavedList(userId, name, description = "") {
  const id = randomUUID();
  stmts.createList.run(id, userId, name.trim(), description.trim());
  return { id, name: name.trim(), description: description.trim(), leadCount: 0 };
}

/** Get all lists for a user */
export function getUserLists(userId) {
  if (!userId) return [];
  return stmts.getUserLists.all(userId);
}

/** Get a single list (with ownership check) */
export function getList(listId, userId) {
  return stmts.getList.get(listId, userId);
}

/** Update list name/description */
export function updateSavedList(listId, userId, name, description) {
  stmts.updateList.run(name.trim(), (description || "").trim(), listId, userId);
}

/** Delete a list and all its leads */
export function deleteSavedList(listId, userId) {
  const list = stmts.getList.get(listId, userId);
  if (!list) return false;
  stmts.deleteList.run(listId, userId);
  return true;
}

/** Add leads to a list (accepts array of lead objects) */
export function addLeadsToList(listId, leads) {
  const insert = db.transaction((items) => {
    for (const lead of items) {
      stmts.addLeadToList.run(listId, JSON.stringify(lead), "new", "");
    }
    stmts.touchList.run(listId);
  });
  insert(leads);
  return leads.length;
}

/** Get all leads in a list */
export function getListLeads(listId) {
  const rows = stmts.getListLeads.all(listId);
  return rows.map(r => ({
    id: r.id,
    ...JSON.parse(r.leadData),
    _status: r.status,
    _notes: r.notes,
    _addedAt: r.addedAt,
  }));
}

/** Update a lead's status (new/contacted/replied/closed) */
export function updateLeadStatus(listId, leadId, status) {
  const valid = ["new", "contacted", "replied", "closed"];
  if (!valid.includes(status)) return false;
  stmts.updateLeadStatus.run(status, leadId, listId);
  stmts.touchList.run(listId);
  return true;
}

/** Update a lead's notes */
export function updateLeadNotes(listId, leadId, notes) {
  stmts.updateLeadNotes.run(notes, leadId, listId);
  return true;
}

/** Remove a lead from a list */
export function removeLeadFromList(listId, leadId) {
  stmts.removeLeadFromList.run(leadId, listId);
  stmts.touchList.run(listId);
  return true;
}

// Run cleanup every hour
setInterval(cleanupAuth, 60 * 60 * 1000);
