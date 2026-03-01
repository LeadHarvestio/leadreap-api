// ─────────────────────────────────────────────────────────────
// SCRAPE JOB QUEUE
// Runs one scrape at a time so we don't launch 20 browsers.
// Jobs are stored in memory — swap for Redis if you scale up.
// ─────────────────────────────────────────────────────────────

import { scrapeGoogleMaps } from "./gmaps.js";
import { randomUUID } from "crypto";

// In-memory job store  { jobId -> job }
const jobs = new Map();

// Simple FIFO queue of pending job IDs
const queue = [];
let isRunning = false;

// ─────────────────────────────────────────────────────────────
// JOB STATES: pending | running | done | error
// ─────────────────────────────────────────────────────────────
export function createJob({ niche, location, limit = 20, scrapeEmails = true }) {
  const jobId = randomUUID();
  const job = {
    id: jobId,
    status: "pending",
    niche,
    location,
    limit,
    scrapeEmails,
    leads: [],
    error: null,
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
  };
  jobs.set(jobId, job);
  queue.push(jobId);
  processQueue(); // kick off if idle
  return job;
}

export function getJob(jobId) {
  return jobs.get(jobId) || null;
}

export function listJobs() {
  return [...jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
}

// ─────────────────────────────────────────────────────────────
// PROCESS QUEUE — one job at a time
// ─────────────────────────────────────────────────────────────
async function processQueue() {
  if (isRunning || queue.length === 0) return;
  isRunning = true;

  const jobId = queue.shift();
  const job = jobs.get(jobId);
  if (!job) {
    isRunning = false;
    processQueue();
    return;
  }

  job.status = "running";
  job.startedAt = Date.now();
  console.log(`[Queue] Starting job ${jobId}: "${job.niche}" in "${job.location}"`);

  try {
    const leads = await scrapeGoogleMaps({
      niche: job.niche,
      location: job.location,
      limit: job.limit,
      scrapeEmails: job.scrapeEmails,
    });

    job.leads = leads;
    job.status = "done";
    job.completedAt = Date.now();
    const elapsed = ((job.completedAt - job.startedAt) / 1000).toFixed(1);
    console.log(`[Queue] Job ${jobId} done — ${leads.length} leads in ${elapsed}s`);

  } catch (err) {
    job.status = "error";
    job.error = err.message;
    job.completedAt = Date.now();
    console.error(`[Queue] Job ${jobId} failed:`, err.message);
  }

  isRunning = false;

  // Clean up old completed jobs after 1 hour
  for (const [id, j] of jobs.entries()) {
    if (j.status !== "pending" && j.status !== "running") {
      if (Date.now() - j.completedAt > 3_600_000) {
        jobs.delete(id);
      }
    }
  }

  processQueue(); // run next job
}
