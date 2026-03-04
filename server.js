// ─────────────────────────────────────────────────────────────
// LeadReap API — v3.4 (Production)
// Express server with auth, Stripe payments, rate limiting, + scraper
// v3.4: Search history persisted in SQLite
// ─────────────────────────────────────────────────────────────

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Scraper
import { createJob, getJob, listJobs } from "./scraper/queue.js";
import { metrics } from "./scraper/gmaps.js";
import { getCacheStats, clearCache, clearExpired } from "./scraper/cache.js";
import { exportToBuffer } from "./scraper/exporter.js";

// Auth & Payments
import {
  createMagicLink, verifyMagicLink, validateSession,
  destroySession, recordSearch, cleanupAuth,
  saveSearchHistory, getSearchHistory,
  createSavedList, getUserLists, getList,
  updateSavedList, deleteSavedList,
  addLeadsToList, getListLeads,
  updateLeadStatus, updateLeadNotes, removeLeadFromList,
  createSequence, getUserSequences, getSequenceWithSteps,
  updateSequence, setSequenceStatus, deleteSequence,
  enrollLeads, getDueSends, markSendComplete, markSendFailed,
  setEnrollmentStatus,
} from "./auth.js";
import { createCheckout, constructWebhookEvent, handleWebhookEvent } from "./payments.js";
import { sendMagicLinkEmail, sendSequenceEmail } from "./email.js";
import { attachUser, requireAuth, requireSearchQuota, ipRateLimit } from "./middleware.js";

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Search history: persisted in SQLite (see auth.js) ────────
const deliveredJobs = new Set(); // track which jobs already saved to history

// ─────────────────────────────────────────────────────────────
// GLOBAL MIDDLEWARE
// ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    FRONTEND_URL,
    FRONTEND_URL.replace("://www.", "://"),
    FRONTEND_URL.replace("://", "://www."),
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  credentials: true,
}));

// Parse JSON for all routes EXCEPT webhook (needs raw body for sig verification)
app.use((req, res, next) => {
  if (req.path === "/api/webhook/stripe") return next();
  express.json()(req, res, next);
});

// Attach user from session token to all requests
app.use(attachUser);

// Trust proxy for correct IP detection behind Railway/Vercel
app.set("trust proxy", 1);


// ═════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═════════════════════════════════════════════════════════════

// ── POST /api/auth/magic — Request a magic login link ────────
app.post("/api/auth/magic", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required" });
  }

  try {
    const code = createMagicLink(email);
    await sendMagicLinkEmail(email, code);
    return res.json({ ok: true, message: "Check your email for a login code" });
  } catch (e) {
    console.error("[Auth] Magic link error:", e);
    return res.status(500).json({ error: "Failed to send login email" });
  }
});

// ── POST /api/auth/verify — Verify magic code → session token ─
app.post("/api/auth/verify", (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Code required" });

  const result = verifyMagicLink(code);
  if (!result) {
    return res.status(401).json({ error: "Invalid or expired code" });
  }

  return res.json({
    token: result.token,
    user: {
      email: result.user.email,
      plan: result.user.plan,
    },
  });
});

// ── GET /api/auth/me — Get current user (requires auth) ──────
app.get("/api/auth/me", (req, res) => {
  if (!req.user) {
    return res.json({ authenticated: false, user: null });
  }
  return res.json({
    authenticated: true,
    user: {
      email: req.user.email,
      plan: req.user.plan,
      searchesToday: req.user.searchesToday,
    },
  });
});

// ── POST /api/auth/logout ────────────────────────────────────
app.post("/api/auth/logout", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) destroySession(token);
  return res.json({ ok: true });
});


// ═════════════════════════════════════════════════════════════
// PAYMENT ROUTES
// ═════════════════════════════════════════════════════════════

// ── POST /api/checkout — Create Stripe Checkout Session URL ──
app.post("/api/checkout", async (req, res) => {
  const { plan } = req.body;
  const validPlans = ["starter", "pro", "agency"];
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ error: "Invalid plan. Use: starter, pro, or agency" });
  }

  const email = req.user?.email || req.body.email;
  if (!email) {
    return res.status(400).json({ error: "Email required (log in or provide email)" });
  }

  try {
    const { checkoutUrl } = await createCheckout(plan, email);
    return res.json({ checkoutUrl });
  } catch (e) {
    console.error("[Payments] Checkout error:", e);
    return res.status(500).json({ error: e.message });
  }
});

// ── POST /api/webhook/stripe — Handle Stripe webhooks ────────
app.post("/api/webhook/stripe",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["stripe-signature"];

    const event = constructWebhookEvent(req.body, signature);
    if (!event) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    try {
      const result = handleWebhookEvent(event);
      return res.json(result);
    } catch (e) {
      console.error("[Payments] Webhook error:", e);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);


// ═════════════════════════════════════════════════════════════
// LEAD SCRAPER ROUTES
// ═════════════════════════════════════════════════════════════

// ── POST /api/leads/search — Queue a scrape job ──────────────
app.post("/api/leads/search", ipRateLimit, requireSearchQuota, (req, res) => {
  const { niche, location, limit = 20, offset = 0, scrapeEmails = true, forceRefresh = false } = req.body;
  if (!niche || !location) return res.status(400).json({ error: "niche and location required" });

  const plan = req.user?.plan || "free";
  const maxLimit = plan === "free" ? 20 : 60;
  const safeLimit = Math.min(limit, maxLimit);
  const safeOffset = plan === "free" ? 0 : Math.max(0, offset);

  if (req.user) recordSearch(req.user.id);

  const job = createJob({ niche, location, limit: safeLimit, offset: safeOffset, scrapeEmails, forceRefresh });
  return res.json({ jobId: job.id, status: job.status });
});

// ── GET /api/leads/job/:id — Poll for results ────────────────
app.get("/api/leads/job/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  const plan = req.user?.plan || "free";
  const leads = plan === "free" ? job.leads.slice(0, 5) : job.leads;

  // Auto-save to search history when job completes
  if (job.status === "done" && req.user?.id && !deliveredJobs.has(job.id)) {
    deliveredJobs.add(job.id);
    saveSearchHistory(req.user.id, {
      niche: job.niche, location: job.location,
      leadCount: job.leads.length, jobId: job.id,
    });
  }

  return res.json({
    jobId: job.id,
    status: job.status,
    niche: job.niche,
    location: job.location,
    leads,
    total: job.leads.length,
    gated: plan === "free" && job.leads.length > 5,
    error: job.error,
    elapsedMs: job.startedAt ? (job.completedAt || Date.now()) - job.startedAt : null,
  });
});

// ── GET /api/leads/history — Recent searches ─────────────────
app.get("/api/leads/history", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Login required" });
  const history = getSearchHistory(req.user.id);
  return res.json({ searches: history });
});

// ── GET /api/account — Dashboard data ────────────────────────
app.get("/api/account", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Login required" });
  const history = getSearchHistory(req.user.id);
  const totalLeads = history.reduce((sum, h) => sum + (h.leadCount || 0), 0);
  const topNiches = {};
  for (const h of history) {
    topNiches[h.niche] = (topNiches[h.niche] || 0) + 1;
  }
  const sortedNiches = Object.entries(topNiches).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return res.json({
    email: req.user.email,
    plan: req.user.plan,
    searchesToday: req.user.searchesToday || 0,
    stats: {
      totalSearches: history.length,
      totalLeads,
      topNiches: sortedNiches.map(([niche, count]) => ({ niche, count })),
      recentSearches: history.slice(0, 20),
    },
  });
});

// ── GET /api/leads/jobs — List recent jobs ───────────────────
app.get("/api/leads/jobs", (req, res) => {
  res.json({ jobs: listJobs().map(j => ({
    jobId: j.id, status: j.status, niche: j.niche,
    location: j.location, total: j.leads.length,
    createdAt: j.createdAt, completedAt: j.completedAt,
  }))});
});

// ── GET /api/leads/export/:id — Download XLSX (paid only) ────
app.get("/api/leads/export/:jobId", requireAuth, async (req, res) => {
  if (req.user.plan === "free") {
    return res.status(403).json({ error: "Export requires a paid plan", code: "PLAN_REQUIRED" });
  }

  const job = getJob(req.params.jobId);
  if (!job || job.status !== "done") return res.status(404).json({ error: "Job not found or not complete" });
  if (job.leads.length === 0) return res.status(400).json({ error: "No leads to export" });

  try {
    const buffer = await exportToBuffer(job.leads, { niche: job.niche, location: job.location });
    const filename = `leadreap-${job.niche.replace(/\s+/g, "-")}-${job.location.replace(/\s+/g, "-")}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (e) {
    console.error("Export error:", e);
    res.status(500).json({ error: "Export failed" });
  }
});


// ═════════════════════════════════════════════════════════════
// SAVED LISTS ROUTES
// ═════════════════════════════════════════════════════════════

// ── GET /api/lists — Get all user's lists ────────────────────
app.get("/api/lists", requireAuth, (req, res) => {
  const lists = getUserLists(req.user.id);
  return res.json({ lists });
});

// ── POST /api/lists — Create a new list ──────────────────────
app.post("/api/lists", requireAuth, (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "List name required" });
  }

  // Limit: 50 lists per user
  const existing = getUserLists(req.user.id);
  if (existing.length >= 50) {
    return res.status(400).json({ error: "Maximum 50 lists reached" });
  }

  const list = createSavedList(req.user.id, name, description);
  return res.json({ list });
});

// ── PUT /api/lists/:id — Rename / update a list ─────────────
app.put("/api/lists/:id", requireAuth, (req, res) => {
  const list = getList(req.params.id, req.user.id);
  if (!list) return res.status(404).json({ error: "List not found" });

  const { name, description } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "List name required" });

  updateSavedList(req.params.id, req.user.id, name, description);
  return res.json({ ok: true });
});

// ── DELETE /api/lists/:id — Delete a list ────────────────────
app.delete("/api/lists/:id", requireAuth, (req, res) => {
  const deleted = deleteSavedList(req.params.id, req.user.id);
  if (!deleted) return res.status(404).json({ error: "List not found" });
  return res.json({ ok: true });
});

// ── GET /api/lists/:id/leads — Get all leads in a list ──────
app.get("/api/lists/:id/leads", requireAuth, (req, res) => {
  const list = getList(req.params.id, req.user.id);
  if (!list) return res.status(404).json({ error: "List not found" });

  const leads = getListLeads(req.params.id);
  return res.json({ list: { id: list.id, name: list.name, description: list.description }, leads });
});

// ── POST /api/lists/:id/leads — Add leads to a list ─────────
app.post("/api/lists/:id/leads", requireAuth, (req, res) => {
  const list = getList(req.params.id, req.user.id);
  if (!list) return res.status(404).json({ error: "List not found" });

  const { leads } = req.body;
  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: "leads array required" });
  }

  // Limit: 2000 leads per list
  const currentLeads = getListLeads(req.params.id);
  if (currentLeads.length + leads.length > 2000) {
    return res.status(400).json({ error: `Would exceed 2000 lead limit (currently ${currentLeads.length})` });
  }

  const added = addLeadsToList(req.params.id, leads);
  return res.json({ added, total: currentLeads.length + added });
});

// ── PATCH /api/lists/:listId/leads/:leadId — Update status or notes ─
app.patch("/api/lists/:listId/leads/:leadId", requireAuth, (req, res) => {
  const list = getList(req.params.listId, req.user.id);
  if (!list) return res.status(404).json({ error: "List not found" });

  const { status, notes } = req.body;
  if (status !== undefined) updateLeadStatus(req.params.listId, req.params.leadId, status);
  if (notes !== undefined) updateLeadNotes(req.params.listId, req.params.leadId, notes);

  return res.json({ ok: true });
});

// ── DELETE /api/lists/:listId/leads/:leadId — Remove a lead ─
app.delete("/api/lists/:listId/leads/:leadId", requireAuth, (req, res) => {
  const list = getList(req.params.listId, req.user.id);
  if (!list) return res.status(404).json({ error: "List not found" });

  removeLeadFromList(req.params.listId, req.params.leadId);
  return res.json({ ok: true });
});


// ═════════════════════════════════════════════════════════════
// EMAIL SEQUENCES
// ═════════════════════════════════════════════════════════════

// ── GET /api/sequences — List user's sequences ──────────────
app.get("/api/sequences", requireAuth, (req, res) => {
  const seqs = getUserSequences(req.user.id);
  return res.json({ sequences: seqs });
});

// ── POST /api/sequences — Create a sequence with steps ──────
app.post("/api/sequences", requireAuth, (req, res) => {
  if (req.user.plan === "free") return res.status(403).json({ error: "Pro plan required" });

  const { name, fromName, steps } = req.body;
  if (!name || !steps || !steps.length) return res.status(400).json({ error: "Name and steps are required" });
  if (steps.length > 5) return res.status(400).json({ error: "Maximum 5 steps per sequence" });

  // Validate steps
  for (const s of steps) {
    if (!s.subject || !s.body) return res.status(400).json({ error: `Step ${s.stepNumber}: subject and body required` });
  }

  const userSeqs = getUserSequences(req.user.id);
  if (userSeqs.length >= 10) return res.status(400).json({ error: "Maximum 10 sequences" });

  const seq = createSequence(req.user.id, name, fromName || "", steps);
  return res.json({ ok: true, sequence: seq });
});

// ── GET /api/sequences/:id — Get sequence with steps + enrollments ──
app.get("/api/sequences/:id", requireAuth, (req, res) => {
  const seq = getSequenceWithSteps(req.params.id, req.user.id);
  if (!seq) return res.status(404).json({ error: "Sequence not found" });
  return res.json({ sequence: seq });
});

// ── PUT /api/sequences/:id — Update sequence name/steps ─────
app.put("/api/sequences/:id", requireAuth, (req, res) => {
  const { name, fromName, steps } = req.body;
  if (!name || !steps || !steps.length) return res.status(400).json({ error: "Name and steps required" });
  if (steps.length > 5) return res.status(400).json({ error: "Maximum 5 steps" });

  const ok = updateSequence(req.params.id, req.user.id, name, fromName || "", steps);
  if (!ok) return res.status(404).json({ error: "Sequence not found" });
  return res.json({ ok: true });
});

// ── PATCH /api/sequences/:id/status — Pause/activate ────────
app.patch("/api/sequences/:id/status", requireAuth, (req, res) => {
  const { status } = req.body;
  if (!["active", "paused"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  setSequenceStatus(req.params.id, req.user.id, status);
  return res.json({ ok: true });
});

// ── DELETE /api/sequences/:id — Delete a sequence ───────────
app.delete("/api/sequences/:id", requireAuth, (req, res) => {
  const ok = deleteSequence(req.params.id, req.user.id);
  if (!ok) return res.status(404).json({ error: "Sequence not found" });
  return res.json({ ok: true });
});

// ── POST /api/sequences/:id/enroll — Enroll leads ──────────
app.post("/api/sequences/:id/enroll", requireAuth, (req, res) => {
  if (req.user.plan === "free") return res.status(403).json({ error: "Pro plan required" });

  const seq = getSequenceWithSteps(req.params.id, req.user.id);
  if (!seq) return res.status(404).json({ error: "Sequence not found" });
  if (seq.status !== "active") return res.status(400).json({ error: "Sequence is paused" });

  const { leads } = req.body;
  if (!leads || !leads.length) return res.status(400).json({ error: "No leads provided" });
  if (leads.length > 500) return res.status(400).json({ error: "Maximum 500 leads per enrollment" });

  const result = enrollLeads(req.params.id, req.user.id, leads);
  return res.json({ ok: true, ...result });
});

// ── PATCH /api/sequences/enrollments/:id/status — Pause/resume enrollment ──
app.patch("/api/sequences/enrollments/:id/status", requireAuth, (req, res) => {
  const { status } = req.body;
  if (!["active", "paused", "cancelled"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  setEnrollmentStatus(req.params.id, status);
  return res.json({ ok: true });
});


// ═════════════════════════════════════════════════════════════
// SYSTEM ROUTES
// ═════════════════════════════════════════════════════════════

app.get("/api/metrics", (req, res) => {
  const cacheStats = getCacheStats();
  res.json({
    uptime: Math.round(process.uptime()),
    memory: process.memoryUsage(),
    scraper: {
      totalScrapes: metrics.totalScrapes,
      totalLeads: metrics.totalLeads,
      totalBlocks: metrics.totalBlocks,
      totalCacheHits: metrics.totalCacheHits,
      blockRate: `${metrics.blockRate}%`,
      status: metrics.blockRate > 30 ? "HIGH" :
              metrics.blockRate > 10 ? "ELEVATED" : "HEALTHY",
    },
    cache: cacheStats,
  });
});

app.post("/api/cache/clear", (req, res) => {
  const { niche, location } = req.body;
  const cleared = clearCache(niche, location);
  res.json({ cleared, message: `Cleared ${cleared} cache entries` });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});


// ─────────────────────────────────────────────────────────────
// STARTUP
// ─────────────────────────────────────────────────────────────
clearExpired();
setInterval(clearExpired, 6 * 60 * 60 * 1000);
cleanupAuth();

// ── Sequence email scheduler ────────────────────────────────
async function processSequenceQueue() {
  try {
    const dueSends = getDueSends();
    if (!dueSends.length) return;

    console.log(`[Scheduler] Processing ${dueSends.length} pending sends`);

    for (const send of dueSends) {
      try {
        const seq = getSequenceWithSteps(send.sequence_id, send.user_id);
        if (!seq || seq.status !== "active") {
          markSendFailed(send.id, "Sequence paused or deleted");
          continue;
        }

        const step = seq.steps.find(s => s.step_number === send.step_number);
        if (!step) {
          markSendFailed(send.id, "Step not found");
          continue;
        }

        const leadData = JSON.parse(send.lead_data || "{}");

        await sendSequenceEmail({
          to: send.lead_email,
          fromName: seq.from_name || "LeadReap",
          subject: step.subject,
          body: step.body,
          leadData,
        });

        markSendComplete(send.id, send.enrollment_id);
      } catch (err) {
        console.error(`[Scheduler] Send ${send.id} failed:`, err.message);
        markSendFailed(send.id, err.message);
      }
    }
  } catch (err) {
    console.error("[Scheduler] Queue error:", err.message);
  }
}

// Process queue every 60 seconds
setInterval(processSequenceQueue, 60 * 1000);
processSequenceQueue(); // Run once on startup

app.listen(PORT, () => {
  console.log(`
  LeadReap API v3.5 — port ${PORT}
  ────────────────────────────────
  POST /api/auth/magic
  POST /api/auth/verify
  GET  /api/auth/me
  POST /api/checkout
  POST /api/webhook/stripe
  POST /api/leads/search
  GET  /api/leads/job/:id
  GET  /api/leads/export/:id
  GET  /api/lists
  POST /api/lists
  GET  /api/lists/:id/leads
  POST /api/lists/:id/leads
  PATCH /api/lists/:lid/leads/:id
  GET  /api/sequences
  POST /api/sequences
  GET  /api/sequences/:id
  PUT  /api/sequences/:id
  PATCH /api/sequences/:id/status
  DELETE /api/sequences/:id
  POST /api/sequences/:id/enroll
  GET  /api/metrics
  GET  /health
  ────────────────────────────────
  `);
});
