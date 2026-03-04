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
db.pragma("foreign_keys = ON");
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

  CREATE TABLE IF NOT EXISTS sequences (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    name        TEXT NOT NULL,
    from_name   TEXT DEFAULT '',
    status      TEXT DEFAULT 'active',
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sequence_steps (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sequence_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    subject     TEXT NOT NULL,
    body        TEXT NOT NULL,
    delay_hours INTEGER DEFAULT 0,
    FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sequence_enrollments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sequence_id TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    lead_email  TEXT NOT NULL,
    lead_name   TEXT DEFAULT '',
    lead_data   TEXT DEFAULT '{}',
    current_step INTEGER DEFAULT 0,
    status      TEXT DEFAULT 'active',
    enrolled_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sequence_sends (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    enrollment_id INTEGER NOT NULL,
    step_number INTEGER NOT NULL,
    status      TEXT DEFAULT 'pending',
    scheduled_at TEXT NOT NULL,
    sent_at     TEXT,
    error       TEXT,
    FOREIGN KEY (enrollment_id) REFERENCES sequence_enrollments(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_search_history_job ON search_history(job_id);
  CREATE INDEX IF NOT EXISTS idx_saved_lists_user ON saved_lists(user_id);
  CREATE INDEX IF NOT EXISTS idx_list_leads_list ON list_leads(list_id);
  CREATE INDEX IF NOT EXISTS idx_sequences_user ON sequences(user_id);
  CREATE INDEX IF NOT EXISTS idx_sequence_steps_seq ON sequence_steps(sequence_id);
  CREATE INDEX IF NOT EXISTS idx_enrollments_seq ON sequence_enrollments(sequence_id);
  CREATE INDEX IF NOT EXISTS idx_enrollments_user ON sequence_enrollments(user_id);
  CREATE INDEX IF NOT EXISTS idx_sends_enrollment ON sequence_sends(enrollment_id);
  CREATE INDEX IF NOT EXISTS idx_sends_status ON sequence_sends(status, scheduled_at);
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

  // Sequences
  createSequence:   db.prepare("INSERT INTO sequences (id, user_id, name, from_name) VALUES (?, ?, ?, ?)"),
  getUserSequences: db.prepare("SELECT * FROM sequences WHERE user_id = ? ORDER BY updated_at DESC"),
  getSequence:      db.prepare("SELECT * FROM sequences WHERE id = ? AND user_id = ?"),
  getSequenceById:  db.prepare("SELECT * FROM sequences WHERE id = ?"),
  updateSequence:   db.prepare("UPDATE sequences SET name = ?, from_name = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"),
  updateSequenceStatus: db.prepare("UPDATE sequences SET status = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"),
  deleteSequence:   db.prepare("DELETE FROM sequences WHERE id = ? AND user_id = ?"),

  // Sequence steps
  insertStep:       db.prepare("INSERT INTO sequence_steps (sequence_id, step_number, subject, body, delay_hours) VALUES (?, ?, ?, ?, ?)"),
  getSteps:         db.prepare("SELECT * FROM sequence_steps WHERE sequence_id = ? ORDER BY step_number ASC"),
  deleteSteps:      db.prepare("DELETE FROM sequence_steps WHERE sequence_id = ?"),

  // Enrollments
  createEnrollment: db.prepare("INSERT INTO sequence_enrollments (sequence_id, user_id, lead_email, lead_name, lead_data) VALUES (?, ?, ?, ?, ?)"),
  getEnrollments:   db.prepare("SELECT * FROM sequence_enrollments WHERE sequence_id = ? ORDER BY enrolled_at DESC"),
  getEnrollmentById: db.prepare("SELECT * FROM sequence_enrollments WHERE id = ?"),
  updateEnrollmentStep: db.prepare("UPDATE sequence_enrollments SET current_step = ? WHERE id = ?"),
  completeEnrollment: db.prepare("UPDATE sequence_enrollments SET status = 'completed', completed_at = datetime('now') WHERE id = ?"),
  pauseEnrollment:  db.prepare("UPDATE sequence_enrollments SET status = ? WHERE id = ?"),
  getActiveEnrollmentByEmail: db.prepare("SELECT * FROM sequence_enrollments WHERE sequence_id = ? AND lead_email = ? AND status = 'active'"),

  // Sends
  createSend:       db.prepare("INSERT INTO sequence_sends (enrollment_id, step_number, status, scheduled_at) VALUES (?, ?, 'pending', ?)"),
  getDueSends:      db.prepare("SELECT s.*, e.lead_email, e.lead_name, e.lead_data, e.sequence_id, e.user_id FROM sequence_sends s JOIN sequence_enrollments e ON s.enrollment_id = e.id WHERE s.status = 'pending' AND s.scheduled_at <= datetime('now') AND e.status = 'active' LIMIT 50"),
  markSendSent:     db.prepare("UPDATE sequence_sends SET status = 'sent', sent_at = datetime('now') WHERE id = ?"),
  markSendFailed:   db.prepare("UPDATE sequence_sends SET status = 'failed', error = ? WHERE id = ?"),
  getSequenceSendStats: db.prepare("SELECT s.status, COUNT(*) as count FROM sequence_sends s JOIN sequence_enrollments e ON s.enrollment_id = e.id WHERE e.sequence_id = ? GROUP BY s.status"),
  getEnrollmentSends: db.prepare("SELECT * FROM sequence_sends WHERE enrollment_id = ? ORDER BY step_number ASC"),
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

// ─────────────────────────────────────────────────────────────
// EMAIL SEQUENCES
// ─────────────────────────────────────────────────────────────

/** Create a sequence with steps (transactional) */
export function createSequence(userId, name, fromName, steps) {
  const id = randomUUID();
  const insertAll = db.transaction(() => {
    stmts.createSequence.run(id, userId, name.trim(), fromName.trim());
    for (const step of steps) {
      stmts.insertStep.run(id, step.stepNumber, step.subject, step.body, step.delayHours || 0);
    }
  });
  insertAll();
  return { id, name: name.trim() };
}

/** Get all sequences for a user */
export function getUserSequences(userId) {
  if (!userId) return [];
  const seqs = stmts.getUserSequences.all(userId);
  return seqs.map(s => {
    const stats = stmts.getSequenceSendStats.all(s.id);
    const enrollments = stmts.getEnrollments.all(s.id);
    const stepCount = stmts.getSteps.all(s.id).length;
    return {
      ...s,
      stepCount,
      enrolledCount: enrollments.length,
      activeCount: enrollments.filter(e => e.status === "active").length,
      stats: Object.fromEntries(stats.map(r => [r.status, r.count])),
    };
  });
}

/** Get a single sequence with steps */
export function getSequenceWithSteps(seqId, userId) {
  const seq = stmts.getSequence.get(seqId, userId);
  if (!seq) return null;
  const steps = stmts.getSteps.all(seqId);
  const enrollments = stmts.getEnrollments.all(seqId);
  const stats = stmts.getSequenceSendStats.all(seqId);
  return {
    ...seq,
    steps,
    enrollments: enrollments.map(e => ({
      ...e,
      leadData: JSON.parse(e.lead_data || "{}"),
      sends: stmts.getEnrollmentSends.all(e.id),
    })),
    stats: Object.fromEntries(stats.map(r => [r.status, r.count])),
  };
}

/** Update sequence name/fromName and replace steps */
export function updateSequence(seqId, userId, name, fromName, steps) {
  const seq = stmts.getSequence.get(seqId, userId);
  if (!seq) return false;
  const updateAll = db.transaction(() => {
    stmts.updateSequence.run(name.trim(), fromName.trim(), seqId, userId);
    stmts.deleteSteps.run(seqId);
    for (const step of steps) {
      stmts.insertStep.run(seqId, step.stepNumber, step.subject, step.body, step.delayHours || 0);
    }
  });
  updateAll();
  return true;
}

/** Pause or activate a sequence */
export function setSequenceStatus(seqId, userId, status) {
  stmts.updateSequenceStatus.run(status, seqId, userId);
}

/** Delete a sequence */
export function deleteSequence(seqId, userId) {
  const seq = stmts.getSequence.get(seqId, userId);
  if (!seq) return false;
  stmts.deleteSequence.run(seqId, userId);
  return true;
}

/** Enroll leads in a sequence — schedules step 1 immediately */
export function enrollLeads(seqId, userId, leads) {
  const steps = stmts.getSteps.all(seqId);
  if (!steps.length) return { enrolled: 0, skipped: 0 };

  let enrolled = 0, skipped = 0;
  const now = new Date().toISOString();

  const enrollAll = db.transaction(() => {
    for (const lead of leads) {
      if (!lead.email || lead.email === "—") { skipped++; continue; }

      // Skip if already enrolled & active in this sequence
      const existing = stmts.getActiveEnrollmentByEmail.get(seqId, lead.email);
      if (existing) { skipped++; continue; }

      const result = stmts.createEnrollment.run(seqId, userId, lead.email, lead.name || "", JSON.stringify(lead));
      const enrollmentId = result.lastInsertRowid;

      // Schedule step 1 immediately
      stmts.createSend.run(enrollmentId, 1, now);
      enrolled++;
    }
  });
  enrollAll();
  return { enrolled, skipped };
}

/** Get pending sends that are due — called by scheduler */
export function getDueSends() {
  return stmts.getDueSends.all();
}

/** After successfully sending, advance the enrollment to next step */
export function markSendComplete(sendId, enrollmentId) {
  stmts.markSendSent.run(sendId);

  const enrollment = stmts.getEnrollmentById.get(enrollmentId);
  if (!enrollment) return;

  const seq = stmts.getSequenceById.get(enrollment.sequence_id);
  if (!seq) return;

  const steps = stmts.getSteps.all(enrollment.sequence_id);
  const nextStepNum = enrollment.current_step + 1 + 1; // current is 0-indexed in enrollment but 1-indexed in steps
  const nextStep = steps.find(s => s.step_number === nextStepNum);

  stmts.updateEnrollmentStep.run(enrollment.current_step + 1, enrollmentId);

  if (nextStep) {
    // Schedule next step
    const sendAt = new Date(Date.now() + nextStep.delay_hours * 60 * 60 * 1000).toISOString();
    stmts.createSend.run(enrollmentId, nextStep.step_number, sendAt);
  } else {
    // All steps done
    stmts.completeEnrollment.run(enrollmentId);
  }
}

/** Mark a send as failed */
export function markSendFailed(sendId, error) {
  stmts.markSendFailed.run(error, sendId);
}

/** Pause/resume an enrollment */
export function setEnrollmentStatus(enrollmentId, status) {
  stmts.pauseEnrollment.run(status, enrollmentId);
}

// Run cleanup every hour
setInterval(cleanupAuth, 60 * 60 * 1000);
