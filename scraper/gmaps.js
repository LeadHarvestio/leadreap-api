// scraper/gmaps.js — World-class Google Maps scraper
// Architecture: 3-phase parallel pipeline
//   Phase 1: URL collection     (1 page, fast scroll)
//   Phase 2: Detail scraping    (N parallel tabs)
//   Phase 3: Enrichment         (email + tech + LinkedIn in parallel)

import { chromium } from "playwright";
import { createStealthContext } from "./stealth.js";
import { withRetry, pLimit, sleep, normalizePhone, formatPhoneDisplay, assessEmail, EMAIL_QUALITY_SCORES, normalizeWebsite, extractDomain } from "./utils.js";
import { detectTechStack, summarizeTechStack } from "./techstack.js";
import { enrichLinkedIn } from "./linkedin.js";
import { getCached, setCached, recordStat } from "./cache.js";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  headless:          true,
  concurrency:       parseInt(process.env.SCRAPER_CONCURRENCY   || "5"),
  emailConcurrency:  parseInt(process.env.EMAIL_CONCURRENCY     || "8"),
  linkedInEnabled:   process.env.LINKEDIN_ENRICHMENT !== "false",
  scrollPause:       800,
  navigationTimeout: 20000,
  detailWait:        3000,
};

// ─────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────
const SEL = {
  resultLinks:     'a[href*="/maps/place/"]',
  scrollContainer: 'div[role="feed"]',
  businessName:    'h1.DUwDvf, h1[class*="fontHeadlineLarge"]',
  rating:          'div.F7nice span[aria-hidden="true"]',
  reviewCount:     'div.F7nice span[aria-label*="review"]',
  address:         'button[data-item-id="address"] .Io6YTe, [data-item-id="address"] div.Io6YTe',
  phone:           'button[data-item-id^="phone"] .Io6YTe, [data-tooltip="Copy phone number"] .Io6YTe',
  website:         'a[data-item-id="authority"]',
  category:        'button.DkEaL',
  openedDate:      'button[data-item-id*="oh"] .Io6YTe, [data-item-id*="opened"] .Io6YTe',
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function buildSearchUrl(niche, location) {
  return `https://www.google.com/maps/search/${encodeURIComponent(`${niche} near ${location}`)}`;
}

function parseRating(text) {
  const m = text?.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

function parseReviewCount(label) {
  const m = label?.match(/([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : 0;
}

function calculateLeadScore({ rating, reviews, hasWebsite, hasPhone, emailQuality, techStack }) {
  let score = 50;

  // Rating
  if (rating >= 4.5) score += 15;
  else if (rating >= 4.0) score += 10;
  else if (rating >= 3.5) score += 5;
  else if (rating) score -= 10;

  // Review volume
  if (reviews >= 200) score += 15;
  else if (reviews >= 100) score += 12;
  else if (reviews >= 50) score += 8;
  else if (reviews >= 20) score += 4;
  else score -= 5;

  // Presence signals
  if (hasWebsite) score += 8;
  if (hasPhone) score += 4;

  // Email quality (replaces binary email bonus)
  if (emailQuality) score += (EMAIL_QUALITY_SCORES[emailQuality] || 0);

  // Tech stack signals
  if (techStack?.length > 0) {
    const hasAds = techStack.some(t => t.category === "Paid Ads");
    if (hasAds) score += 8; // already spending on digital marketing
    const hasWix = techStack.some(t => t.name === "Wix" || t.name === "Weebly");
    if (hasWix) score += 3; // pitch opportunity
  }

  return Math.min(99, Math.max(20, score));
}

function generateNote({ rating, reviews, hasWebsite, emailQuality, techStack, score, ownerName }) {
  if (ownerName) return `Contact ${ownerName} directly — owner identified.`;
  const adsTech = techStack?.find(t => t.category === "Paid Ads");
  if (adsTech) return `Running ${adsTech.name} — active ad spend, good agency target.`;
  const builderTech = techStack?.find(t => t.pitchNote && t.category === "Website Builder");
  if (builderTech) return builderTech.pitchNote;
  if (!hasWebsite) return "No website — strong pitch opportunity for web/digital services.";
  if (score >= 85) return "High-authority listing — established reputation, ideal outreach target.";
  if (reviews < 20) return "Low review count — may need reputation management services.";
  if (rating && rating < 3.8) return "Below-average rating — could benefit from marketing/review strategy.";
  if (emailQuality === "owner") return "Owner email found — direct decision-maker contact.";
  return "Solid mid-tier lead with good local presence.";
}

// ─────────────────────────────────────────────────────────────
// COOKIE CONSENT HANDLER (multi-language EU support)
// ─────────────────────────────────────────────────────────────
async function dismissCookieConsent(page) {
  // Strategy 1: Click by known button selectors
  const consentSelectors = [
    'button[aria-label*="Accept"]',
    'button[aria-label*="accept"]',
    'button[aria-label*="Accepter"]',
    'button[aria-label*="Akzeptieren"]',
    'button[aria-label*="Aceptar"]',
    'button[aria-label*="Accetta"]',
    'button[aria-label*="accepteren"]',
    'button[jsname="higCR"]',
    'button[jsname="b3VHJd"]',
  ];

  for (const sel of consentSelectors) {
    const btn = await page.$(sel).catch(() => null);
    if (btn) {
      console.log(`  → Cookie consent: clicking ${sel}`);
      await btn.click({ noWaitAfter: true }).catch(() => null);
      await sleep(1500);
      return true;
    }
  }

  // Strategy 2: Find button by text content (catches all languages)
  const acceptTexts = [
    "accept all", "accept", "agree",
    "alles accepteren", "alles akzeptieren",
    "tout accepter", "accepter",
    "aceptar todo", "accetta tutto",
    "aceitar tudo", "zaakceptuj wszystko",
  ];

  const clicked = await page.evaluate((texts) => {
    const buttons = Array.from(document.querySelectorAll("button"));
    for (const btn of buttons) {
      const btnText = btn.textContent.trim().toLowerCase();
      for (const text of texts) {
        if (btnText.includes(text)) {
          btn.click();
          return true;
        }
      }
    }
    return false;
  }, acceptTexts).catch(() => false);

  if (clicked) {
    console.log("  → Cookie consent: clicked via text match");
    await sleep(1500);
    return true;
  }

  console.log("  → Cookie consent: no consent wall detected");
  return false;
}

// ─────────────────────────────────────────────────────────────
// CAPTCHA / BLOCK DETECTION
// ─────────────────────────────────────────────────────────────
const CAPTCHA_SIGNALS = [
  'form#captcha-form', 'div.g-recaptcha',
  'iframe[src*="recaptcha"]', 'iframe[src*="captcha"]', '#recaptcha',
];
const BLOCK_TEXT = [
  "unusual traffic", "not a robot", "verify you're human",
  "access denied", "automated queries", "captcha",
];

async function detectBlock(page) {
  for (const sel of CAPTCHA_SIGNALS) {
    if (await page.$(sel).catch(() => null)) return { blocked: true, reason: `CAPTCHA: ${sel}` };
  }
  const body = await page.evaluate(() => document.body?.innerText?.toLowerCase() || "").catch(() => "");
  for (const sig of BLOCK_TEXT) {
    if (body.includes(sig)) return { blocked: true, reason: `Block text: "${sig}"` };
  }
  if (page.url().includes("/sorry/")) return { blocked: true, reason: "Redirected to /sorry/" };
  return { blocked: false, reason: null };
}

async function sendBlockAlert({ reason, niche, location }) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `🚨 *LeadReap Block*\n*Reason:* ${reason}\n*Search:* ${niche} in ${location}\n*Time:* ${new Date().toISOString()}`,
    }),
  }).catch(() => null);
}

// ─────────────────────────────────────────────────────────────
// METRICS (in-memory + persisted via cache.js recordStat)
// ─────────────────────────────────────────────────────────────
export const metrics = {
  totalScrapes: 0, totalLeads: 0, totalBlocks: 0, totalCacheHits: 0,
  recentBlocks: [], recentScrapes: [],
  recordScrape({ niche, location, leads, blocked, reason, durationMs }) {
    this.totalScrapes++;
    if (blocked) {
      this.totalBlocks++;
      this.recentBlocks.unshift({ niche, location, reason, time: new Date().toISOString() });
      if (this.recentBlocks.length > 20) this.recentBlocks.pop();
    } else {
      this.totalLeads += leads;
    }
    this.recentScrapes.unshift({ niche, location, leads, blocked, durationMs, time: new Date().toISOString() });
    if (this.recentScrapes.length > 20) this.recentScrapes.pop();
    recordStat({ niche, location, leadCount: leads, blocked, durationMs });
  },
  get blockRate() {
    return this.totalScrapes === 0 ? 0 : ((this.totalBlocks / this.totalScrapes) * 100).toFixed(1);
  },
};

// ─────────────────────────────────────────────────────────────
// PHASE 1: Collect listing URLs
// ─────────────────────────────────────────────────────────────
async function collectListingUrls(page, limit) {
  const seen = new Set();
  const urls = [];

  for (let attempt = 0; attempt < 20 && urls.length < limit; attempt++) {
    const hrefs = await page.$$eval(SEL.resultLinks, els =>
      els.map(el => el.href).filter(h => h.includes("/maps/place/"))
    ).catch(() => []);

    for (const href of hrefs) {
      const base = href.split("?")[0];
      if (!seen.has(base)) { seen.add(base); urls.push(href); }
      if (urls.length >= limit) break;
    }
    if (urls.length >= limit) break;

    await page.evaluate(sel => {
      const el = document.querySelector(sel);
      if (el) el.scrollTop += 1200;
    }, SEL.scrollContainer);

    await sleep(CONFIG.scrollPause);
  }

  return urls.slice(0, limit);
}

// ─────────────────────────────────────────────────────────────
// PHASE 2: Scrape one listing (with retry)
// ─────────────────────────────────────────────────────────────
async function scrapeListingByUrl(context, url) {
  return withRetry(async () => {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(CONFIG.navigationTimeout);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(SEL.businessName, { timeout: CONFIG.detailWait }).catch(() => null);

      const name = await page.$eval(SEL.businessName, el => el.textContent.trim()).catch(() => null);
      if (!name) throw new Error("No business name found");

      const [ratingText, reviewLabel, address, rawPhone, category, openedText] = await Promise.all([
        page.$eval(SEL.rating,     el => el.textContent.trim()).catch(() => null),
        page.$eval(SEL.reviewCount, el => el.getAttribute("aria-label")).catch(() => null),
        page.$eval(SEL.address,    el => el.textContent.trim()).catch(() => null),
        page.$eval(SEL.phone,      el => el.textContent.trim()).catch(() => null),
        page.$eval(SEL.category,   el => el.textContent.trim()).catch(() => null),
        page.$eval(SEL.openedDate, el => el.textContent.trim()).catch(() => null),
      ]);

      const websiteEl = await page.$(SEL.website);
      const rawWebsite = websiteEl ? await websiteEl.getAttribute("href") : null;

      // Normalize data
      const phone = normalizePhone(rawPhone);
      const website = normalizeWebsite(rawWebsite);

      return {
        name,
        address: address || null,
        phone,
        phoneDisplay: phone ? formatPhoneDisplay(phone) : rawPhone || null,
        website,
        domain: extractDomain(website),
        email: null,           // Phase 3
        emailQuality: null,    // Phase 3
        emailQualityLabel: null,
        rating: parseRating(ratingText),
        reviews: parseReviewCount(reviewLabel),
        category: category || null,
        yearOpened: parseYearOpened(openedText),
        techStack: [],         // Phase 3
        techStackSummary: null,
        linkedinCompany: null, // Phase 3
        linkedinPerson: null,
        ownerName: null,
        ownerTitle: null,
        mapsUrl: url,
      };
    } finally {
      await page.close();
    }
  }, { attempts: 3, baseMs: 1500, label: `detail:${url.split("/maps/place/")[1]?.slice(0, 20)}` });
}

function parseYearOpened(text) {
  if (!text) return null;
  const m = text.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0]) : null;
}

// ─────────────────────────────────────────────────────────────
// PHASE 3A: Email + tech stack (parallel, per-lead)
// ─────────────────────────────────────────────────────────────
async function enrichWebsite(context, lead) {
  if (!lead.website) return lead;

  return withRetry(async () => {
    const page = await context.newPage();
    try {
      await page.goto(lead.website, { timeout: 10000, waitUntil: "domcontentloaded" });

      // Grab full HTML for tech stack detection
      const html = await page.content().catch(() => "");
      const techStack = detectTechStack(html);

      // Email: mailto first, then regex body scan
      const mailtoEmails = await page.$$eval('a[href^="mailto:"]', els =>
        els.map(l => l.href.replace("mailto:", "").split("?")[0].trim().toLowerCase())
      ).catch(() => []);

      let email = mailtoEmails[0] || null;

      if (!email) {
        const bodyText = await page.evaluate(() => document.body?.innerText || "").catch(() => "");
        const blacklist = ["example.com", "sentry.io", "wix.com", "squarespace.com",
                           "wordpress.com", "godaddy.com", "schema.org", "w3.org",
                           "jquery.com", "cloudflare.com"];
        const matches = (bodyText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [])
          .filter(e => !blacklist.some(b => e.includes(b)));
        email = matches[0] || null;
      }

      const emailAssessment = assessEmail(email);

      return {
        ...lead,
        email: emailAssessment.valid ? email : null,
        emailQuality: emailAssessment.quality,
        emailQualityLabel: emailAssessment.qualityLabel,
        techStack,
        techStackSummary: summarizeTechStack(techStack),
      };
    } finally {
      await page.close();
    }
  }, { attempts: 2, baseMs: 1000, label: `email:${lead.domain}` }) || lead;
}

// ─────────────────────────────────────────────────────────────
// PHASE 3B: LinkedIn enrichment (parallel, capped lower)
// ─────────────────────────────────────────────────────────────
async function enrichAllWebsites(context, leads, scrapeEmails) {
  if (!scrapeEmails) return leads;
  const withWebsites = leads.filter(l => l.website);
  console.log(`  → Phase 3a: Enriching ${withWebsites.length} websites (${CONFIG.emailConcurrency} parallel)...`);

  const tasks = withWebsites.map(lead => async () => {
    const enriched = await enrichWebsite(context, lead);
    // Update lead in-place
    Object.assign(lead, enriched);
    return lead;
  });

  await pLimit(tasks, CONFIG.emailConcurrency);
  return leads;
}

async function enrichAllLinkedIn(context, leads) {
  if (!CONFIG.linkedInEnabled) return leads;
  console.log(`  → Phase 3b: LinkedIn enrichment (3 parallel)...`);

  // Only enrich top-scoring leads to save time
  const topLeads = leads.filter(l => l.score >= 65).slice(0, 15);

  const tasks = topLeads.map(lead => async () => {
    const li = await enrichLinkedIn(context, lead).catch(() => ({}));
    Object.assign(lead, li);
    return lead;
  });

  await pLimit(tasks, 3);
  return leads;
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export async function scrapeGoogleMaps({ niche, location, limit = 20, scrapeEmails = true, forceRefresh = false }) {
  const startTime = Date.now();
  console.log(`\n🔍 [${new Date().toISOString()}] "${niche}" in "${location}" (limit: ${limit})`);

  // ── Cache check ──────────────────────────────────────────
  if (!forceRefresh) {
    const cached = getCached(niche, location);
    if (cached) {
      metrics.totalCacheHits++;
      return cached.slice(0, limit);
    }
  }

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--disable-dev-shm-usage"],
  });

  let leads = [];
  let blocked = false;

  try {
    const context = await createStealthContext(browser);
    const searchPage = await context.newPage();
    searchPage.setDefaultNavigationTimeout(CONFIG.navigationTimeout);

    // Force English locale so selectors work consistently
    await searchPage.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

    // ── Phase 1: URL collection ──────────────────────────────
    const t1 = Date.now();
    await searchPage.goto(buildSearchUrl(niche, location), { waitUntil: "domcontentloaded" });
    await sleep(2000);

    // ── Handle cookie consent (EU datacenters) ───────────────
    await dismissCookieConsent(searchPage);

    // Wait for Maps to actually load after consent
    await searchPage.waitForSelector(SEL.resultLinks, { timeout: 10000 }).catch(() => {
      console.log("  ⚠ No result links found after consent — retrying page load...");
    });

    // If still no results, the consent may have reloaded — try navigating again
    const hasResults = await searchPage.$(SEL.resultLinks).catch(() => null);
    if (!hasResults) {
      console.log("  → Reloading Maps after consent...");
      await searchPage.goto(buildSearchUrl(niche, location), { waitUntil: "domcontentloaded" });
      await sleep(3000);
    }

    const check1 = await detectBlock(searchPage);
    if (check1.blocked) {
      blocked = true;
      console.error(`  ✗ BLOCKED on load: ${check1.reason}`);
      await sendBlockAlert({ reason: check1.reason, niche, location });
      return [];
    }

    const listingUrls = await collectListingUrls(searchPage, limit);

    const check2 = await detectBlock(searchPage);
    if (check2.blocked) {
      blocked = true;
      console.error(`  ✗ BLOCKED post-scroll: ${check2.reason}`);
      await sendBlockAlert({ reason: check2.reason, niche, location });
      return [];
    }

    await searchPage.close();
    console.log(`  ✓ Phase 1: ${listingUrls.length} URLs in ${Date.now() - t1}ms`);

    // ── Phase 2: Parallel detail scraping ───────────────────
    const t2 = Date.now();
    console.log(`  → Phase 2: Scraping ${listingUrls.length} listings (${CONFIG.concurrency} parallel)...`);

    const detailTasks = listingUrls.map((url, i) => async () => {
      const data = await scrapeListingByUrl(context, url);
      process.stdout.write(`  [${i+1}/${listingUrls.length}] ${data ? `✓ ${data.name}` : "✗ failed"}\n`);
      return data;
    });

    const results = await pLimit(detailTasks, CONFIG.concurrency);
    const seen = new Set();
    for (const r of results) {
      if (r.status === "fulfilled" && r.value?.name && !seen.has(r.value.name)) {
        seen.add(r.value.name);
        leads.push(r.value);
      }
    }
    console.log(`  ✓ Phase 2: ${leads.length} listings in ${Date.now() - t2}ms`);

    // ── Phase 3: Enrichment ──────────────────────────────────
    const t3 = Date.now();
    leads = await enrichAllWebsites(context, leads, scrapeEmails);
    leads = await enrichAllLinkedIn(context, leads);
    console.log(`  ✓ Phase 3: Enrichment done in ${Date.now() - t3}ms`);

  } finally {
    await browser.close();
  }

  // ── Final scoring & sorting ──────────────────────────────
  leads = leads.map(lead => {
    const score = calculateLeadScore({
      rating: lead.rating,
      reviews: lead.reviews,
      hasWebsite: !!lead.website,
      hasPhone: !!lead.phone,
      emailQuality: lead.emailQuality,
      techStack: lead.techStack,
    });
    return {
      ...lead,
      score,
      notes: generateNote({
        rating: lead.rating,
        reviews: lead.reviews,
        hasWebsite: !!lead.website,
        emailQuality: lead.emailQuality,
        techStack: lead.techStack,
        ownerName: lead.ownerName,
        score,
      }),
    };
  });

  leads.sort((a, b) => b.score - a.score);

  // ── Cache + metrics ──────────────────────────────────────
  if (leads.length > 0) setCached(niche, location, leads);

  const durationMs = Date.now() - startTime;
  metrics.recordScrape({ niche, location, leads: leads.length, blocked, reason: null, durationMs });

  console.log(`\n✅ Done in ${(durationMs/1000).toFixed(1)}s — ${leads.length} leads | ${Math.round(durationMs/leads.length||0)}ms/lead | Block rate: ${metrics.blockRate}%\n`);
  return leads;
}
