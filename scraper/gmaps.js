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

const CONFIG = {
  headless:          true,
  concurrency:       parseInt(process.env.SCRAPER_CONCURRENCY   || "8"),
  emailConcurrency:  parseInt(process.env.EMAIL_CONCURRENCY     || "8"),
  linkedInEnabled:   process.env.LINKEDIN_ENRICHMENT !== "false",
  scrollPause:       1000,
  navigationTimeout: 20000,
  detailWait:        2000,
};

const SEL = {
  resultLinks:     'a[href*="/maps/place/"]',
  scrollContainer: 'div[role="feed"]',
  businessName:    'h1.DUwDvf, h1[class*="fontHeadlineLarge"]',
  rating:          'div.F7nice span[aria-hidden="true"]',
  reviewCount:     'div.F7nice span[aria-label*="review"], span[aria-label*="review" i], button[jsaction*="review"] span',
  address:         'button[data-item-id="address"] .Io6YTe, [data-item-id="address"] div.Io6YTe',
  phone:           'button[data-item-id^="phone"] .Io6YTe, [data-tooltip="Copy phone number"] .Io6YTe',
  website:         'a[data-item-id="authority"]',
  category:        'button.DkEaL',
  openedDate:      'button[data-item-id*="oh"] .Io6YTe, [data-item-id*="opened"] .Io6YTe',
};

const US_COORDS = {
  default: { latitude: 37.7749, longitude: -122.4194 },
};

function guessCoords(locationStr) {
  const stateCoords = {
    AL: { latitude: 32.3182, longitude: -86.9023 },
    AK: { latitude: 64.2008, longitude: -149.4937 },
    AZ: { latitude: 33.4484, longitude: -112.0740 },
    AR: { latitude: 34.7465, longitude: -92.2896 },
    CA: { latitude: 36.7783, longitude: -119.4179 },
    CO: { latitude: 39.7392, longitude: -104.9903 },
    CT: { latitude: 41.7658, longitude: -72.6734 },
    DE: { latitude: 39.1582, longitude: -75.5244 },
    FL: { latitude: 27.6648, longitude: -81.5158 },
    GA: { latitude: 33.7490, longitude: -84.3880 },
    HI: { latitude: 19.8968, longitude: -155.5828 },
    ID: { latitude: 43.6150, longitude: -116.2023 },
    IL: { latitude: 41.8781, longitude: -87.6298 },
    IN: { latitude: 39.7684, longitude: -86.1581 },
    IA: { latitude: 41.5868, longitude: -93.6250 },
    KS: { latitude: 39.0119, longitude: -98.4842 },
    KY: { latitude: 38.2009, longitude: -84.8733 },
    LA: { latitude: 30.9843, longitude: -91.9623 },
    ME: { latitude: 44.3106, longitude: -69.7795 },
    MD: { latitude: 39.2904, longitude: -76.6122 },
    MA: { latitude: 42.3601, longitude: -71.0589 },
    MI: { latitude: 42.3314, longitude: -83.0458 },
    MN: { latitude: 44.9778, longitude: -93.2650 },
    MS: { latitude: 32.2988, longitude: -90.1848 },
    MO: { latitude: 38.6270, longitude: -90.1994 },
    MT: { latitude: 46.8797, longitude: -110.3626 },
    NE: { latitude: 41.2565, longitude: -95.9345 },
    NV: { latitude: 36.1699, longitude: -115.1398 },
    NH: { latitude: 43.2081, longitude: -71.5376 },
    NJ: { latitude: 40.0583, longitude: -74.4057 },
    NM: { latitude: 35.0844, longitude: -106.6504 },
    NY: { latitude: 40.7128, longitude: -74.0060 },
    NC: { latitude: 35.7796, longitude: -78.6382 },
    ND: { latitude: 46.8772, longitude: -96.7898 },
    OH: { latitude: 39.9612, longitude: -82.9988 },
    OK: { latitude: 35.4676, longitude: -97.5164 },
    OR: { latitude: 45.5152, longitude: -122.6784 },
    PA: { latitude: 39.9526, longitude: -75.1652 },
    RI: { latitude: 41.8240, longitude: -71.4128 },
    SC: { latitude: 34.0007, longitude: -81.0348 },
    SD: { latitude: 43.5460, longitude: -96.7313 },
    TN: { latitude: 36.1627, longitude: -86.7816 },
    TX: { latitude: 30.2672, longitude: -97.7431 },
    UT: { latitude: 40.7608, longitude: -111.8910 },
    VT: { latitude: 44.2601, longitude: -72.5754 },
    VA: { latitude: 37.5407, longitude: -77.4360 },
    WA: { latitude: 47.6062, longitude: -122.3321 },
    WV: { latitude: 38.3498, longitude: -81.6326 },
    WI: { latitude: 43.0389, longitude: -87.9065 },
    WY: { latitude: 42.8666, longitude: -106.3131 },
  };

  const upper = locationStr.toUpperCase();
  for (const [abbr, coords] of Object.entries(stateCoords)) {
    if (upper.includes(abbr) && (upper.includes(`, ${abbr}`) || upper.includes(` ${abbr}`))) {
      return coords;
    }
  }
  const stateNames = {
    CALIFORNIA: "CA", TEXAS: "TX", FLORIDA: "FL", "NEW YORK": "NY",
    ILLINOIS: "IL", PENNSYLVANIA: "PA", OHIO: "OH", GEORGIA: "GA",
    MICHIGAN: "MI", "NORTH CAROLINA": "NC", VIRGINIA: "VA", WASHINGTON: "WA",
    ARIZONA: "AZ", MASSACHUSETTS: "MA", TENNESSEE: "TN", INDIANA: "IN",
    MISSOURI: "MO", MARYLAND: "MD", WISCONSIN: "WI", COLORADO: "CO",
    MINNESOTA: "MN", "SOUTH CAROLINA": "SC", ALABAMA: "AL", LOUISIANA: "LA",
    KENTUCKY: "KY", OREGON: "OR", OKLAHOMA: "OK", CONNECTICUT: "CT",
    UTAH: "UT", IOWA: "IA", NEVADA: "NV", ARKANSAS: "AR", MISSISSIPPI: "MS",
    KANSAS: "KS", "NEW MEXICO": "NM", NEBRASKA: "NE", IDAHO: "ID",
    "WEST VIRGINIA": "WV", HAWAII: "HI", MAINE: "ME", MONTANA: "MT",
    "RHODE ISLAND": "RI", DELAWARE: "DE", "SOUTH DAKOTA": "SD",
    "NORTH DAKOTA": "ND", ALASKA: "AK", VERMONT: "VT", WYOMING: "WY",
    "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ",
  };
  for (const [name, abbr] of Object.entries(stateNames)) {
    if (upper.includes(name)) return stateCoords[abbr];
  }

  return US_COORDS.default;
}

async function setGoogleConsentCookies(context) {
  const cookies = [
    {
      name: "SOCS",
      value: "CAISHAgBEhJnd3NfMjAyNDAzMTAtMF9SQzIaAmVuIAEaBgiA_ZS2Bg",
      domain: ".google.com",
      path: "/",
      secure: true,
      sameSite: "Lax",
    },
    {
      name: "CONSENT",
      value: "PENDING+987",
      domain: ".google.com",
      path: "/",
      secure: true,
      sameSite: "Lax",
    },
  ];
  await context.addCookies(cookies);
  console.log("  → Google consent cookies injected (EU bypass)");
}

function buildSearchUrl(niche, location) {
  return `https://www.google.com/maps/search/${encodeURIComponent(`${niche} near ${location}`)}?hl=en&gl=us`;
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
  if (rating >= 4.5) score += 15;
  else if (rating >= 4.0) score += 10;
  else if (rating >= 3.5) score += 5;
  else if (rating) score -= 10;

  if (reviews >= 200) score += 15;
  else if (reviews >= 100) score += 12;
  else if (reviews >= 50) score += 8;
  else if (reviews >= 20) score += 4;
  else score -= 5;

  if (hasWebsite) score += 8;
  if (hasPhone) score += 4;
  if (emailQuality) score += (EMAIL_QUALITY_SCORES[emailQuality] || 0);

  if (techStack?.length > 0) {
    const hasAds = techStack.some(t => t.category === "Paid Ads");
    if (hasAds) score += 8;
    const hasWix = techStack.some(t => t.name === "Wix" || t.name === "Weebly");
    if (hasWix) score += 3;
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

async function collectListingUrls(page, limit) {
  const seen = new Set();
  const listings = []; // Now returns {url, searchRating, searchReviews} objects
  let noNewCount = 0;

  for (let attempt = 0; attempt < 35 && listings.length < limit; attempt++) {
    // Extract URLs AND review data from search result cards
    const items = await page.$$eval(SEL.resultLinks, els =>
      els.map(el => {
        const href = el.href;
        if (!href.includes("/maps/place/")) return null;

        // Walk up to find the result card container
        let card = el;
        for (let i = 0; i < 8; i++) {
          if (!card.parentElement) break;
          card = card.parentElement;
          // Stop at a reasonable container level
          if (card.getAttribute('jsaction') || card.classList.contains('Nv2PK') || card.classList.contains('THODhf')) break;
        }

        const cardText = card?.innerText || '';

        // Extract rating: look for patterns like "4.9" near stars
        let rating = null;
        const ratingMatch = cardText.match(/^[\s\S]*?(\d\.\d)\s*(?:\(\d|star)/m) || cardText.match(/(\d\.\d)/);
        if (ratingMatch) rating = parseFloat(ratingMatch[1]);

        // Extract review count: "(123)" or "(1,234)"
        let reviews = 0;
        const reviewMatch = cardText.match(/\(([\d,]+)\)/);
        if (reviewMatch) reviews = parseInt(reviewMatch[1].replace(/,/g, ''), 10);

        return { href, rating, reviews };
      }).filter(Boolean)
    ).catch(() => []);

    const prevCount = listings.length;
    for (const item of items) {
      const base = item.href.split("?")[0];
      if (!seen.has(base)) {
        seen.add(base);
        listings.push({ url: item.href, searchRating: item.rating, searchReviews: item.reviews });
      }
      if (listings.length >= limit) break;
    }
    if (listings.length >= limit) break;

    if (listings.length === prevCount) {
      noNewCount++;
      if (noNewCount >= 3) {
        console.log(`  → Scroll exhausted at ${listings.length} URLs after ${attempt + 1} scrolls`);
        break;
      }
    } else {
      noNewCount = 0;
    }

    await page.evaluate(sel => {
      const el = document.querySelector(sel);
      if (el) el.scrollTop += 1500;
    }, SEL.scrollContainer);

    await sleep(CONFIG.scrollPause);
  }

  const result = listings.slice(0, limit);
  const withReviews = result.filter(l => l.searchReviews > 0).length;
  console.log(`  → Search page extracted ${withReviews}/${result.length} review counts`);
  return result;
}

async function scrapeListingByUrl(context, url, searchData = {}) {
  return withRetry(async () => {
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(CONFIG.navigationTimeout);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(SEL.businessName, { timeout: CONFIG.detailWait }).catch(() => null);

      const name = await page.$eval(SEL.businessName, el => el.textContent.trim()).catch(() => null);
      if (!name) throw new Error("No business name found");

      // Note: Google serves stripped detail pages to headless browsers (no review counts).
      // Review counts are extracted from the search results page in Phase 1 and passed via searchData.

      const [ratingText, reviewLabel, address, rawPhone, category, openedText] = await Promise.all([
        page.$eval(SEL.rating, el => el.textContent.trim()).catch(() => null),
        page.$eval(SEL.reviewCount, el => el.getAttribute("aria-label")).catch(() => null),
        page.$eval(SEL.address, el => el.textContent.trim()).catch(() => null),
        page.$eval(SEL.phone, el => el.textContent.trim()).catch(() => null),
        page.$eval(SEL.category, el => el.textContent.trim()).catch(() => null),
        page.$eval(SEL.openedDate, el => el.textContent.trim()).catch(() => null),
      ]);

      let finalReviewLabel = reviewLabel;

      // Fallback: comprehensive page-wide extraction
      if (!finalReviewLabel) {
        finalReviewLabel = await page.evaluate(() => {
          // Strategy 1: Walk up from F7nice to find review count in ancestor text
          const nice = document.querySelector('div.F7nice');
          if (nice) {
            let ancestor = nice;
            for (let i = 0; i < 5; i++) {
              if (!ancestor.parentElement) break;
              ancestor = ancestor.parentElement;
              const text = ancestor.innerText || '';
              const m = text.match(/\(([\d,]+)\)/);
              if (m) return m[1] + " reviews";
              const m2 = text.match(/([\d,]+)\s*reviews?/i);
              if (m2) return m2[0];
            }
          }

          // Strategy 2: aria-label on any element containing "reviews"
          const allWithAria = document.querySelectorAll('[aria-label*="review" i]');
          for (const el of allWithAria) {
            const label = el.getAttribute('aria-label') || '';
            const m = label.match(/([\d,]+)\s*review/i);
            if (m) return m[0];
          }

          // Strategy 3: Find any button/link related to reviews
          const reviewBtns = document.querySelectorAll('button[jsaction*="review"], button[data-tab-id]');
          for (const btn of reviewBtns) {
            const label = btn.getAttribute('aria-label') || btn.textContent || '';
            const m = label.match(/([\d,]+)\s*review/i);
            if (m) return m[0];
          }

          // Strategy 4: Scan entire main area for standalone "(N)" patterns
          const mainArea = document.querySelector('div[role="main"]');
          if (mainArea) {
            const candidates = mainArea.querySelectorAll('span, button, a, div');
            for (const el of candidates) {
              // Check elements with no children (leaf nodes) for "(123)" pattern
              if (el.children.length === 0) {
                const text = el.textContent.trim();
                if (/^\([\d,]+\)$/.test(text)) {
                  return text.match(/([\d,]+)/)[1] + " reviews";
                }
              }
            }
            // Check own text nodes (not inherited from children)
            for (const el of candidates) {
              const ownText = Array.from(el.childNodes)
                .filter(n => n.nodeType === 3)
                .map(n => n.textContent.trim())
                .join('');
              if (/^\([\d,]+\)$/.test(ownText)) {
                return ownText.match(/([\d,]+)/)[1] + " reviews";
              }
            }
          }

          return null;
        }).catch(() => null);
      }

      // Use search-page data as fallback when detail page doesn't have reviews
      // (Google serves stripped pages to headless browsers)
      const detailReviews = parseReviewCount(finalReviewLabel);
      const finalReviews = detailReviews > 0 ? detailReviews : (searchData.searchReviews || 0);
      const detailRating = parseRating(ratingText);
      const finalRating = detailRating || searchData.searchRating || null;

      const websiteEl = await page.$(SEL.website);
      const rawWebsite = websiteEl ? await websiteEl.getAttribute("href") : null;

      const phone = normalizePhone(rawPhone);
      const website = normalizeWebsite(rawWebsite);

      return {
        name,
        address: address || null,
        phone,
        phoneDisplay: phone ? formatPhoneDisplay(phone) : rawPhone || null,
        website,
        domain: extractDomain(website),
        email: null,
        emailQuality: null,
        emailQualityLabel: null,
        rating: finalRating,
        reviews: finalReviews,
        category: category || null,
        yearOpened: parseYearOpened(openedText),
        techStack: [],
        techStackSummary: null,
        linkedinCompany: null,
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

async function enrichWebsite(context, lead) {
  if (!lead.website) return lead;

  return withRetry(async () => {
    const page = await context.newPage();
    try {
      await page.goto(lead.website, { timeout: 10000, waitUntil: "domcontentloaded" });

      const html = await page.content().catch(() => "");
      const techStack = detectTechStack(html);

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

async function enrichAllWebsites(context, leads, scrapeEmails) {
  if (!scrapeEmails) return leads;
  const withWebsites = leads.filter(l => l.website);
  console.log(`  → Phase 3a: Enriching ${withWebsites.length} websites (${CONFIG.emailConcurrency} parallel)...`);

  const tasks = withWebsites.map(lead => async () => {
    const enriched = await enrichWebsite(context, lead);
    Object.assign(lead, enriched);
    return lead;
  });

  await pLimit(tasks, CONFIG.emailConcurrency);
  return leads;
}

async function enrichAllLinkedIn(context, leads) {
  if (!CONFIG.linkedInEnabled) return leads;
  console.log(`  → Phase 3b: LinkedIn enrichment (3 parallel)...`);

  const topLeads = leads.filter(l => l.score >= 65).slice(0, 15);

  const tasks = topLeads.map(lead => async () => {
    const li = await enrichLinkedIn(context, lead).catch(() => ({}));
    Object.assign(lead, li);
    return lead;
  });

  await pLimit(tasks, 3);
  return leads;
}

export async function scrapeGoogleMaps({ niche, location, limit = 20, scrapeEmails = true, forceRefresh = false }) {
  const startTime = Date.now();
  console.log(`\n🔍 [${new Date().toISOString()}] "${niche}" in "${location}" (limit: ${limit})`);

  if (!forceRefresh) {
    const cached = getCached(niche, location);
    if (cached) {
      metrics.totalCacheHits++;
      return cached.slice(0, limit);
    }
  }

  const geo = guessCoords(location);
  console.log(`  → Geolocation: ${geo.latitude.toFixed(2)}, ${geo.longitude.toFixed(2)}`);

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--disable-dev-shm-usage"],
  });

  let leads = [];
  let blocked = false;

  try {
    const context = await createStealthContext(browser, {
      geolocation: { ...geo, accuracy: 100 },
      permissions: ["geolocation"],
    });

    await setGoogleConsentCookies(context);

    const searchPage = await context.newPage();
    searchPage.setDefaultNavigationTimeout(CONFIG.navigationTimeout);
    await searchPage.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

    const t1 = Date.now();
    await searchPage.goto(buildSearchUrl(niche, location), { waitUntil: "domcontentloaded" });
    await sleep(3000);

    const consentStillShowing = await searchPage.$('button[jsname="higCR"], button[jsname="b3VHJd"]').catch(() => null);
    if (consentStillShowing) {
      console.log("  → Consent wall still showing — clicking through...");
      await consentStillShowing.click({ noWaitAfter: true }).catch(() => null);
      await sleep(2000);
      await searchPage.goto(buildSearchUrl(niche, location), { waitUntil: "domcontentloaded" });
      await sleep(3000);
    }

    const consentClicked = await searchPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      for (const btn of buttons) {
        const t = btn.textContent.trim().toLowerCase();
        if (t.includes("accept") || t.includes("accepteren") || t.includes("akzeptieren") || t.includes("accepter") || t.includes("accetta")) {
          btn.click();
          return true;
        }
      }
      return false;
    }).catch(() => false);

    if (consentClicked) {
      console.log("  → Clicked remaining consent button via text match");
      await sleep(2000);
      const hasLinks = await searchPage.$(SEL.resultLinks).catch(() => null);
      if (!hasLinks) {
        await searchPage.goto(buildSearchUrl(niche, location), { waitUntil: "domcontentloaded" });
        await sleep(3000);
      }
    }

    await searchPage.waitForSelector(SEL.resultLinks, { timeout: 15000 }).catch(() => {
      console.log("  ⚠ No result links found after all consent attempts");
    });

    const check1 = await detectBlock(searchPage);
    if (check1.blocked) {
      blocked = true;
      console.error(`  ✗ BLOCKED on load: ${check1.reason}`);
      await sendBlockAlert({ reason: check1.reason, niche, location });
      return [];
    }

    const listings = await collectListingUrls(searchPage, limit);

    const check2 = await detectBlock(searchPage);
    if (check2.blocked) {
      blocked = true;
      console.error(`  ✗ BLOCKED post-scroll: ${check2.reason}`);
      await sendBlockAlert({ reason: check2.reason, niche, location });
      return [];
    }

    await searchPage.close();
    console.log(`  ✓ Phase 1: ${listings.length} URLs in ${Date.now() - t1}ms`);

    const t2 = Date.now();
    console.log(`  → Phase 2: Scraping ${listings.length} listings (${CONFIG.concurrency} parallel)...`);

    const detailTasks = listings.map((listing, i) => async () => {
      const data = await scrapeListingByUrl(context, listing.url, listing);
      process.stdout.write(`  [${i+1}/${listings.length}] ${data ? `✓ ${data.name} (${data.reviews} reviews)` : "✗ failed"}\n`);
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

    const t3 = Date.now();
    leads = await enrichAllWebsites(context, leads, scrapeEmails);
    leads = await enrichAllLinkedIn(context, leads);
    console.log(`  ✓ Phase 3: Enrichment done in ${Date.now() - t3}ms`);

  } finally {
    await browser.close();
  }

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

  if (leads.length > 0) setCached(niche, location, leads);

  const durationMs = Date.now() - startTime;
  metrics.recordScrape({ niche, location, leads: leads.length, blocked, reason: null, durationMs });

  console.log(`\n✅ Done in ${(durationMs/1000).toFixed(1)}s — ${leads.length} leads | ${Math.round(durationMs/leads.length||0)}ms/lead | Block rate: ${metrics.blockRate}%\n`);
  return leads;
}
