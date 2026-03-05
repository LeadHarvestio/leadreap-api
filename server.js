// ─────────────────────────────────────────────────────────────
// LeadReap API — v3.4 (Production)
// Express server with auth, Stripe payments, rate limiting, + scraper
// v3.4: Search history persisted in SQLite
// ─────────────────────────────────────────────────────────────

import express from "express";
import cors from "cors";
import crypto from "crypto";
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
  createTeam, getUserTeam, getTeamMembers, createTeamInvite,
  acceptTeamInvite, removeTeamMember, getPendingInvites,
  getAccessibleLists,
  createWebhook, getUserWebhooks, deleteWebhook, toggleWebhook,
  getActiveWebhooks, touchWebhookTimestamp,
  createApiKey, getUserApiKeys, deleteApiKey,
} from "./auth.js";
import { createCheckout, constructWebhookEvent, handleWebhookEvent } from "./payments.js";
import { sendMagicLinkEmail, sendSequenceEmail, sendTeamInviteEmail } from "./email.js";
import { generateReport } from "./reports.js";
import { attachUser, requireAuth, requireSearchQuota, ipRateLimit, requireAgency, requirePro } from "./middleware.js";

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
      leads: job.leads // <-- ADD THIS LINE
    });
    // Trigger webhooks
    triggerWebhooks(req.user.id, "search.completed", {
      jobId: job.id, niche: job.niche, location: job.location,
      leadCount: job.leads.length,
      leads: job.leads.slice(0, 100),
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

// ── GET /api/leads/history/:jobId — Instantly load a past search ──
app.get("/api/leads/history/:jobId", requireAuth, (req, res) => {
  const history = getSearchHistoryJob(req.user.id, req.params.jobId);
  if (!history) return res.status(404).json({ error: "Saved search not found" });
  
  return res.json({
    jobId: history.job_id,
    status: "done",
    niche: history.niche,
    location: history.location,
    total: history.lead_count,
    leads: JSON.parse(history.leads_json || "[]")
  });
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
// WEBHOOK TRIGGER HELPER
// ═════════════════════════════════════════════════════════════

async function triggerWebhooks(userId, event, payload) {
  try {
    const hooks = getActiveWebhooks(userId);
    for (const hook of hooks) {
      const events = (hook.events || "").split(",").map(e => e.trim());
      if (!events.includes(event) && !events.includes("*")) continue;

      const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
      const signature = crypto.createHmac("sha256", hook.secret).update(body).digest("hex");

      fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-LeadReap-Signature": signature,
          "X-LeadReap-Event": event,
        },
        body,
      }).then(() => {
        touchWebhookTimestamp(hook.id);
      }).catch(err => {
        console.error(`[Webhook] Failed ${hook.url}: ${err.message}`);
      });
    }
  } catch (err) {
    console.error("[Webhook] Trigger error:", err.message);
  }
}


// ═════════════════════════════════════════════════════════════
// TEAMS (Agency tier)
// ═════════════════════════════════════════════════════════════

// ── GET /api/team — Get user's team info ─────────────────────
app.get("/api/team", requireAuth, (req, res) => {
  try {
    const team = getUserTeam(req.user.id);
    if (!team) return res.json({ team: null });
    const members = getTeamMembers(team.id);
    const invites = team.owner_id === req.user.id ? getPendingInvites(team.id) : [];
    return res.json({ team: { ...team, members, invites, isOwner: team.owner_id === req.user.id } });
  } catch (e) { console.error("[Team] GET error:", e.message); return res.status(500).json({ error: "Failed to load team" }); }
});

// ── POST /api/team — Create a team ──────────────────────────
app.post("/api/team", requireAgency, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Team name required" });
    const team = createTeam(req.user.id, name);
    return res.json({ ok: true, team });
  } catch (e) { console.error("[Team] Create error:", e.message); return res.status(500).json({ error: "Failed to create team" }); }
});

// ── POST /api/team/invite — Invite a member ─────────────────
app.post("/api/team/invite", requireAgency, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const team = getUserTeam(req.user.id);
    if (!team || team.owner_id !== req.user.id) return res.status(403).json({ error: "Only team owners can invite" });

    const members = getTeamMembers(team.id);
    const invites = getPendingInvites(team.id);
    if (members.length + invites.length >= 6) return res.status(400).json({ error: "Team is full (max 6 members including owner)" });

    const invite = createTeamInvite(team.id, email);

    // Send invite email (non-blocking)
    try {
      await sendTeamInviteEmail(email, team.name, invite.token);
    } catch (emailErr) {
      console.warn("[Team] Invite email failed (non-blocking):", emailErr.message);
    }

    return res.json({ ok: true, invite });
  } catch (e) { console.error("[Team] Invite error:", e.message); return res.status(500).json({ error: "Failed to send invite" }); }
});

// ── POST /api/team/join — Accept an invite ──────────────────
app.post("/api/team/join", requireAuth, (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Invite token required" });
    const result = acceptTeamInvite(token, req.user.id);
    if (result.error) return res.status(400).json(result);
    return res.json({ ok: true, teamId: result.teamId });
  } catch (e) { console.error("[Team] Join error:", e.message); return res.status(500).json({ error: "Failed to join team" }); }
});

// ── DELETE /api/team/members/:userId — Remove a member ──────
app.delete("/api/team/members/:userId", requireAgency, (req, res) => {
  try {
    const team = getUserTeam(req.user.id);
    if (!team) return res.status(404).json({ error: "No team" });
    const ok = removeTeamMember(team.id, req.params.userId, req.user.id);
    if (!ok) return res.status(400).json({ error: "Cannot remove" });
    return res.json({ ok: true });
  } catch (e) { console.error("[Team] Remove error:", e.message); return res.status(500).json({ error: "Failed to remove member" }); }
});

// ── GET /api/team/lists — Get shared lists across team ──────
app.get("/api/team/lists", requireAuth, (req, res) => {
  try {
    const lists = getAccessibleLists(req.user.id);
    return res.json({ lists });
  } catch (e) { console.error("[Team] Lists error:", e.message); return res.status(500).json({ error: "Failed to load lists" }); }
});


// ═════════════════════════════════════════════════════════════
// WEBHOOKS
// ═════════════════════════════════════════════════════════════

// ── GET /api/webhooks — List user's webhooks ────────────────
app.get("/api/webhooks", requirePro, (req, res) => {
  try {
    const hooks = getUserWebhooks(req.user.id);
    return res.json({ webhooks: hooks });
  } catch (e) { console.error("[Webhooks] GET error:", e.message); return res.status(500).json({ error: "Failed to load webhooks" }); }
});

// ── POST /api/webhooks — Create a webhook ───────────────────
app.post("/api/webhooks", requirePro, (req, res) => {
  try {
    const { url, events } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    try { new URL(url); } catch { return res.status(400).json({ error: "Invalid URL" }); }
    if (!url.startsWith("https://")) return res.status(400).json({ error: "Webhook URL must use HTTPS" });

    const existing = getUserWebhooks(req.user.id);
    if (existing.length >= 5) return res.status(400).json({ error: "Maximum 5 webhooks" });

    const validEvents = ["search.completed", "lead.status_changed", "lead.added", "sequence.completed", "*"];
    const eventList = (events || "search.completed").split(",").map(e => e.trim());
    if (eventList.some(e => !validEvents.includes(e))) return res.status(400).json({ error: "Invalid event type" });

    const hook = createWebhook(req.user.id, url, eventList.join(","));
    return res.json({ ok: true, webhook: hook });
  } catch (e) { console.error("[Webhooks] Create error:", e.message); return res.status(500).json({ error: "Failed to create webhook" }); }
});

// ── DELETE /api/webhooks/:id — Delete a webhook ─────────────
app.delete("/api/webhooks/:id", requirePro, (req, res) => {
  try {
    deleteWebhook(req.params.id, req.user.id);
    return res.json({ ok: true });
  } catch (e) { console.error("[Webhooks] Delete error:", e.message); return res.status(500).json({ error: "Failed to delete webhook" }); }
});

// ── PATCH /api/webhooks/:id/toggle — Enable/disable ─────────
app.patch("/api/webhooks/:id/toggle", requirePro, (req, res) => {
  try {
    const { active } = req.body;
    toggleWebhook(req.params.id, req.user.id, !!active);
    return res.json({ ok: true });
  } catch (e) { console.error("[Webhooks] Toggle error:", e.message); return res.status(500).json({ error: "Failed to toggle webhook" }); }
});


// ═════════════════════════════════════════════════════════════
// API KEYS
// ═════════════════════════════════════════════════════════════

// ── GET /api/keys — List user's API keys ────────────────────
app.get("/api/keys", requirePro, (req, res) => {
  try {
    const keys = getUserApiKeys(req.user.id);
    return res.json({ keys });
  } catch (e) { console.error("[API Keys] GET error:", e.message); return res.status(500).json({ error: "Failed to load API keys" }); }
});

// ── POST /api/keys — Create an API key ──────────────────────
app.post("/api/keys", requirePro, (req, res) => {
  try {
    const { name } = req.body;
    const result = createApiKey(req.user.id, name || "Default");
    if (result.error) return res.status(400).json(result);
    return res.json({ ok: true, ...result });
  } catch (e) { console.error("[API Keys] Create error:", e.message); return res.status(500).json({ error: "Failed to create API key" }); }
});

// ── DELETE /api/keys/:id — Revoke an API key ────────────────
app.delete("/api/keys/:id", requirePro, (req, res) => {
  try {
    deleteApiKey(req.params.id, req.user.id);
    return res.json({ ok: true });
  } catch (e) { console.error("[API Keys] Delete error:", e.message); return res.status(500).json({ error: "Failed to delete API key" }); }
});


// ═════════════════════════════════════════════════════════════
// WHITE-LABEL REPORTS (Agency tier)
// ═════════════════════════════════════════════════════════════

// ── POST /api/reports/generate — Generate PDF report ────────
app.post("/api/reports/generate", requireAgency, async (req, res) => {
  const { listId, agencyName, clientName, subtitle, contactEmail, contactPhone, niche, location } = req.body;

  let leads;
  if (listId) {
    const list = getList(listId, req.user.id);
    if (!list) return res.status(404).json({ error: "List not found" });
    const raw = getListLeads(listId);
    leads = raw.map(l => JSON.parse(l.leadData || "{}"));
  } else {
    return res.status(400).json({ error: "listId required" });
  }

  if (!leads.length) return res.status(400).json({ error: "No leads in list" });

  try {
    const pdfBuffer = await generateReport({
      agencyName: agencyName || "LeadReap",
      clientName: clientName || "",
      niche: niche || "Local Businesses",
      location: location || "",
      leads,
      subtitle: subtitle || "",
      contactEmail: contactEmail || "",
      contactPhone: contactPhone || "",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="report-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[Reports] Generation failed:", err.message);
    return res.status(500).json({ error: "Report generation failed" });
  }
});


// ═════════════════════════════════════════════════════════════
// PUBLIC API (v1)
// ═════════════════════════════════════════════════════════════

// ── POST /api/v1/search — Trigger a search via API ──────────
app.post("/api/v1/search", requireAuth, requirePro, ipRateLimit, requireSearchQuota, (req, res) => {
  const { niche, location, options = {} } = req.body;
  if (!niche || !location) return res.status(400).json({ error: "niche and location required" });

  const plan = req.user.plan || "free";
  const jobId = createJob({
    niche, location,
    includeEmail: options.includeEmail !== false,
    includePhone: options.includePhone !== false,
    includeSocial: options.includeSocial === true,
    plan,
  });
  recordSearch(req.user.id);

  return res.json({ jobId, status: "queued", pollUrl: `/api/v1/search/${jobId}` });
});

// ── GET /api/v1/search/:id — Poll job status via API ────────
app.get("/api/v1/search/:id", requireAuth, requirePro, (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });

  if (job.status === "completed" && job.leads?.length > 0) {
    // Trigger webhook on first fetch of completed results
    if (!job._webhookFired) {
      job._webhookFired = true;
      triggerWebhooks(req.user.id, "search.completed", {
        jobId: job.id, niche: job.niche, location: job.location,
        leadCount: job.leads.length,
        leads: job.leads.slice(0, 100), // Cap at 100 for webhook payload
      });
    }

    return res.json({
      jobId: job.id, status: job.status,
      niche: job.niche, location: job.location,
      total: job.leads.length,
      leads: job.leads,
    });
  }

  return res.json({
    jobId: job.id, status: job.status,
    niche: job.niche, location: job.location,
    error: job.error,
  });
});

// ── GET /api/v1/lists — Get lists via API ───────────────────
app.get("/api/v1/lists", requireAuth, requirePro, (req, res) => {
  const lists = getUserLists(req.user.id);
  return res.json({ lists });
});

// ── GET /api/v1/lists/:id/leads — Get leads from list via API
app.get("/api/v1/lists/:id/leads", requireAuth, requirePro, (req, res) => {
  const list = getList(req.params.id, req.user.id);
  if (!list) return res.status(404).json({ error: "List not found" });
  const raw = getListLeads(req.params.id);
  const leads = raw.map(l => ({ ...JSON.parse(l.leadData || "{}"), status: l.status, notes: l.notes }));
  return res.json({ listId: list.id, name: list.name, leads });
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
  LeadReap API v4.0 — port ${PORT}
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
  GET  /api/sequences (+CRUD)
  GET  /api/team (+invite/join)
  GET  /api/webhooks (+CRUD)
  GET  /api/keys (+CRUD)
  POST /api/reports/generate
  POST /api/v1/search (Public API)
  GET  /api/v1/lists (Public API)
  GET  /api/metrics
  GET  /health
  ────────────────────────────────
  `);
});

// ═════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLING
// ═════════════════════════════════════════════════════════════

// Express error middleware — catches thrown errors in routes
app.use((err, req, res, _next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message || err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// Prevent crash on unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]", reason);
});

// Prevent crash on uncaught exceptions (log but stay alive)
process.on("uncaughtException", (err) => {
  console.error("[Uncaught Exception]", err.message);
  // Don't exit — let the process stay alive for Railway
});
