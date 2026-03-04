// scraper/cache.js
// SQLite-based cache for scrape results.
// Keyed on niche+location. Results expire after CACHE_TTL_HOURS.
// Eliminates redundant Google Maps requests — critical for block rate management.

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.CACHE_DB_PATH || path.join(__dirname, "../data/cache.db");
const CACHE_TTL_HOURS = parseInt(process.env.CACHE_TTL_HOURS || "72"); // 3 days default

let db;

function getDb() {
  if (db) return db;

  // Ensure data directory exists
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS scrape_cache (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key   TEXT NOT NULL UNIQUE,
      niche       TEXT NOT NULL,
      location    TEXT NOT NULL,
      leads_json  TEXT NOT NULL,
      lead_count  INTEGER NOT NULL DEFAULT 0,
      created_at  INTEGER NOT NULL,
      expires_at  INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cache_key ON scrape_cache(cache_key);
    CREATE INDEX IF NOT EXISTS idx_expires   ON scrape_cache(expires_at);

    CREATE TABLE IF NOT EXISTS lead_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key   TEXT NOT NULL,
      name        TEXT NOT NULL,
      email       TEXT,
      phone       TEXT,
      website     TEXT,
      score       INTEGER,
      scraped_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scrape_stats (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      niche       TEXT,
      location    TEXT,
      lead_count  INTEGER,
      blocked     INTEGER DEFAULT 0,
      duration_ms INTEGER,
      scraped_at  INTEGER NOT NULL
    );
  `);

  return db;
}

function makeCacheKey(niche, location) {
  return `${niche.toLowerCase().trim()}::${location.toLowerCase().trim()}`;
}

// ─────────────────────────────────────────────────────────────
// READ: Get cached leads if fresh
// ─────────────────────────────────────────────────────────────
export function getCached(niche, location) {
  const db = getDb();
  const key = makeCacheKey(niche, location);
  const now = Date.now();

  const row = db.prepare(`
    SELECT leads_json, lead_count, created_at, expires_at
    FROM scrape_cache
    WHERE cache_key = ? AND expires_at > ?
  `).get(key, now);

  if (!row) return null;

  const ageHours = ((now - row.created_at) / 3_600_000).toFixed(1);
  console.log(`  📦 Cache hit: ${row.lead_count} leads for "${niche}" in "${location}" (${ageHours}h old)`);

  try {
    return JSON.parse(row.leads_json);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// WRITE: Store scraped leads in cache
// ─────────────────────────────────────────────────────────────
export function setCached(niche, location, leads) {
  const db = getDb();
  const key = makeCacheKey(niche, location);
  const now = Date.now();
  const expiresAt = now + CACHE_TTL_HOURS * 3_600_000;

  db.prepare(`
    INSERT INTO scrape_cache (cache_key, niche, location, leads_json, lead_count, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET
      leads_json = excluded.leads_json,
      lead_count = excluded.lead_count,
      created_at = excluded.created_at,
      expires_at = excluded.expires_at
  `).run(key, niche, location, JSON.stringify(leads), leads.length, now, expiresAt);

  // Also write individual leads to history for deduplication across searches
  const insertLead = db.prepare(`
    INSERT OR IGNORE INTO lead_history (cache_key, name, email, phone, website, score, scraped_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((leads) => {
    for (const l of leads) {
      insertLead.run(key, l.name, l.email, l.phone, l.website, l.score, now);
    }
  });

  insertMany(leads);
  console.log(`  💾 Cached ${leads.length} leads for "${niche}" in "${location}" (expires in ${CACHE_TTL_HOURS}h)`);
}

// ─────────────────────────────────────────────────────────────
// STATS: Record every scrape attempt for analytics
// ─────────────────────────────────────────────────────────────
export function recordStat({ niche, location, leadCount, blocked, durationMs }) {
  const db = getDb();
  db.prepare(`
    INSERT INTO scrape_stats (niche, location, lead_count, blocked, duration_ms, scraped_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(niche, location, leadCount, blocked ? 1 : 0, durationMs, Date.now());
}

// ─────────────────────────────────────────────────────────────
// ADMIN: Cache management endpoints
// ─────────────────────────────────────────────────────────────
export function clearExpired() {
  const db = getDb();
  const result = db.prepare("DELETE FROM scrape_cache WHERE expires_at <= ?").run(Date.now());
  console.log(`  🧹 Cleared ${result.changes} expired cache entries`);
  return result.changes;
}

export function clearCache(niche, location) {
  const db = getDb();
  if (niche && location) {
    const key = makeCacheKey(niche, location);
    db.prepare("DELETE FROM scrape_cache WHERE cache_key = ?").run(key);
    return 1;
  }
  const result = db.prepare("DELETE FROM scrape_cache").run();
  return result.changes;
}

export function getCacheStats() {
  const db = getDb();

  const total = db.prepare("SELECT COUNT(*) as n, SUM(lead_count) as leads FROM scrape_cache").get();
  const fresh = db.prepare("SELECT COUNT(*) as n FROM scrape_cache WHERE expires_at > ?").get(Date.now());
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_scrapes,
      SUM(CASE WHEN blocked = 1 THEN 1 ELSE 0 END) as total_blocks,
      AVG(duration_ms) as avg_duration_ms,
      SUM(lead_count) as total_leads
    FROM scrape_stats
  `).get();

  const topNiches = db.prepare(`
    SELECT niche, COUNT(*) as searches, SUM(lead_count) as leads
    FROM scrape_stats WHERE blocked = 0
    GROUP BY niche ORDER BY searches DESC LIMIT 5
  `).all();

  return {
    cache: {
      totalEntries: total.n,
      freshEntries: fresh.n,
      totalLeadsCached: total.leads || 0,
    },
    scrapes: {
      totalScrapes: stats.total_scrapes || 0,
      totalBlocks: stats.total_blocks || 0,
      blockRate: stats.total_scrapes > 0
        ? `${((stats.total_blocks / stats.total_scrapes) * 100).toFixed(1)}%`
        : "0%",
      avgDurationMs: Math.round(stats.avg_duration_ms || 0),
      totalLeadsScraped: stats.total_leads || 0,
    },
    topNiches,
  };
}
