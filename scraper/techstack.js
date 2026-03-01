// scraper/techstack.js
// Detects what technology a business website runs on.
// Signals: HTML meta tags, script URLs, CSS class names, HTTP headers, DOM patterns.
// Value: agencies selling web services want to know if a biz runs Wix/Squarespace
//        (easy to pitch a redesign) vs custom (already invested in web).

const SIGNATURES = [
  // ── Website Builders ───────────────────────────────────────
  {
    name: "Wix",
    category: "Website Builder",
    budget: "low",
    pitchNote: "Wix site — likely small budget, pitch affordable web upgrades",
    checks: [
      { type: "script",  value: "wix.com" },
      { type: "script",  value: "wixstatic.com" },
      { type: "meta",    name: "generator", value: "Wix" },
      { type: "class",   value: "wix-" },
    ],
  },
  {
    name: "Squarespace",
    category: "Website Builder",
    budget: "low-mid",
    pitchNote: "Squarespace site — may be open to a professional upgrade",
    checks: [
      { type: "script",  value: "squarespace.com" },
      { type: "meta",    name: "generator", value: "Squarespace" },
      { type: "link",    value: "squarespace.com" },
    ],
  },
  {
    name: "Weebly",
    category: "Website Builder",
    budget: "low",
    pitchNote: "Weebly site — older builder, strong redesign pitch opportunity",
    checks: [
      { type: "script",  value: "weebly.com" },
      { type: "meta",    name: "generator", value: "Weebly" },
    ],
  },
  {
    name: "GoDaddy Website Builder",
    category: "Website Builder",
    budget: "low",
    pitchNote: "GoDaddy builder — typically small business, limited web investment",
    checks: [
      { type: "script",  value: "godaddy.com/websites" },
      { type: "meta",    name: "generator", value: "GoDaddy" },
    ],
  },

  // ── CMS ────────────────────────────────────────────────────
  {
    name: "WordPress",
    category: "CMS",
    budget: "mid",
    pitchNote: "WordPress site — large plugin/theme ecosystem, pitch SEO or redesign",
    checks: [
      { type: "script",  value: "/wp-content/" },
      { type: "script",  value: "/wp-includes/" },
      { type: "link",    value: "/wp-content/" },
      { type: "meta",    name: "generator", value: "WordPress" },
    ],
  },
  {
    name: "Shopify",
    category: "E-commerce",
    budget: "mid",
    pitchNote: "Shopify store — selling online, pitch marketing/ads/SEO services",
    checks: [
      { type: "script",  value: "shopify.com" },
      { type: "script",  value: "cdn.shopify.com" },
      { type: "meta",    name: "shopify-checkout-api-token", value: "" },
    ],
  },
  {
    name: "Webflow",
    category: "CMS",
    budget: "mid-high",
    pitchNote: "Webflow site — design-conscious business, higher budget likely",
    checks: [
      { type: "script",  value: "webflow.com" },
      { type: "class",   value: "w-webflow-badge" },
      { type: "html",    value: 'data-wf-site' },
    ],
  },

  // ── Analytics & Marketing ──────────────────────────────────
  {
    name: "Google Analytics",
    category: "Analytics",
    budget: null,
    pitchNote: null, // not customer-facing
    checks: [
      { type: "script", value: "google-analytics.com" },
      { type: "script", value: "gtag/js" },
    ],
  },
  {
    name: "Facebook Pixel",
    category: "Paid Ads",
    budget: "mid-high",
    pitchNote: "Running Facebook Pixel — actively investing in paid ads",
    checks: [
      { type: "script", value: "connect.facebook.net/en_US/fbevents.js" },
      { type: "html",   value: "fbq(" },
    ],
  },
  {
    name: "Google Ads",
    category: "Paid Ads",
    budget: "mid-high",
    pitchNote: "Running Google Ads — has paid marketing budget, good agency target",
    checks: [
      { type: "script", value: "googleadservices.com" },
      { type: "script", value: "google_conversion" },
      { type: "html",   value: "gtag('event', 'conversion'" },
    ],
  },

  // ── Booking / Scheduling ────────────────────────────────────
  {
    name: "Calendly",
    category: "Scheduling",
    budget: null,
    pitchNote: null,
    checks: [{ type: "script", value: "calendly.com" }],
  },
  {
    name: "Acuity Scheduling",
    category: "Scheduling",
    budget: null,
    pitchNote: null,
    checks: [{ type: "script", value: "acuityscheduling.com" }],
  },

  // ── Chat / Support ─────────────────────────────────────────
  {
    name: "Intercom",
    category: "Customer Support",
    budget: "high",
    pitchNote: "Uses Intercom — significant SaaS spend, higher budget business",
    checks: [{ type: "script", value: "widget.intercom.io" }],
  },
  {
    name: "Drift",
    category: "Customer Support",
    budget: "high",
    checks: [{ type: "script", value: "drift.com" }],
  },
];

/**
 * Detect tech stack from a page's HTML source.
 * @param {string} html - Full HTML source of the page
 * @returns {Array} Detected technologies
 */
export function detectTechStack(html) {
  if (!html) return [];
  const detected = [];

  for (const tech of SIGNATURES) {
    const matched = tech.checks.some(check => {
      switch (check.type) {
        case "script":
          return html.includes(check.value);
        case "link":
          return html.includes(check.value);
        case "class":
          return html.includes(check.value);
        case "html":
          return html.includes(check.value);
        case "meta":
          if (check.value) {
            return html.includes(`name="${check.name}"`) && html.includes(check.value);
          }
          return html.includes(`name="${check.name}"`);
        default:
          return false;
      }
    });

    if (matched) {
      detected.push({
        name: tech.name,
        category: tech.category,
        budget: tech.budget,
        pitchNote: tech.pitchNote,
      });
    }
  }

  return detected;
}

/**
 * Summarize tech stack into a short label for the lead table
 */
export function summarizeTechStack(stack) {
  if (!stack || stack.length === 0) return null;

  const cms = stack.find(t => ["Website Builder", "CMS", "E-commerce"].includes(t.category));
  const ads = stack.filter(t => t.category === "Paid Ads").map(t => t.name);

  const parts = [];
  if (cms) parts.push(cms.name);
  if (ads.length > 0) parts.push(`+ ${ads.join(", ")}`);
  return parts.join(" ") || null;
}
