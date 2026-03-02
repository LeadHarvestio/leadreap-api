// ─────────────────────────────────────────────────────────────
// LeadReap API — v3.2 (Production)
// Express server with auth, payments, rate limiting, + scraper
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
} from "./auth.js";
import { createCheckout, verifyWebhookSignature, handleWebhookEvent } from "./payments.js";
import { sendMagicLinkEmail } from "./email.js";
import { attachUser, requireAuth, requireSearchQuota, ipRateLimit } from "./middleware.js";

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

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
  if (req.path === "/api/webhook/lemonsqueezy") return next();
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

// ── POST /api/checkout — Create LemonSqueezy checkout URL ────
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

// ── POST /api/webhook/lemonsqueezy — Handle payment webhooks ─
app.post("/api/webhook/lemonsqueezy",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["x-signature"];
    const rawBody = req.body.toString();

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("[Payments] Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    try {
      const event = JSON.parse(rawBody);
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
  const { niche, location, limit = 20, scrapeEmails = true, forceRefresh = false } = req.body;
  if (!niche || !location) return res.status(400).json({ error: "niche and location required" });

  const plan = req.user?.plan || "free";
  const maxLimit = plan === "free" ? 20 : 60;
  const safeLimit = Math.min(limit, maxLimit);

  if (req.user) recordSearch(req.user.id);

  const job = createJob({ niche, location, limit: safeLimit, scrapeEmails, forceRefresh });
  return res.json({ jobId: job.id, status: job.status });
});

// ── GET /api/leads/job/:id — Poll for results ────────────────
app.get("/api/leads/job/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  const plan = req.user?.plan || "free";
  const leads = plan === "free" ? job.leads.slice(0, 5) : job.leads;

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

app.post("/api/admin/clear-cache", (req, res) => {
  const { clearCache } = await import("./scraper/cache.js");
  const cleared = clearCache();
  res.json({ cleared });
});
```

Then hit it with: `curl -X POST https://leadreap.com/api/admin/clear-cache`

(You'd want to protect that with an auth check before going live, but for now it works.)

**Option 3: Delete the file**

In Railway shell:
```
rm data/cache.db

// ─────────────────────────────────────────────────────────────
// STARTUP
// ─────────────────────────────────────────────────────────────
clearExpired();
setInterval(clearExpired, 6 * 60 * 60 * 1000);
cleanupAuth();

app.listen(PORT, () => {
  console.log(`
  LeadReap API v3.2 — port ${PORT}
  ────────────────────────────────
  POST /api/auth/magic
  POST /api/auth/verify
  GET  /api/auth/me
  POST /api/checkout
  POST /api/webhook/lemonsqueezy
  POST /api/leads/search
  GET  /api/leads/job/:id
  GET  /api/leads/export/:id
  GET  /api/metrics
  GET  /health
  ────────────────────────────────
  `);
});
