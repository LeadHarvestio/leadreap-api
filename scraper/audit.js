// ─────────────────────────────────────────────────────────────
// Site Audit Engine — Lightweight SEO & tech diagnostic
// Uses jsdom + node-fetch (no browser required)
// ─────────────────────────────────────────────────────────────

import { JSDOM } from "jsdom";

/**
 * Run a 6-point site audit: SSL, H1, title, meta desc, FB pixel, GA
 * Returns a structured report with score and sales angles
 */
export async function runSiteAudit(inputUrl) {
  let url = inputUrl.trim();
  if (!url.startsWith("http")) url = `https://${url}`;

  let html;
  let finalUrl = url;
  let isSSL = url.startsWith("https://");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LeadReap Audit/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    finalUrl = res.url;
    isSSL = finalUrl.startsWith("https://");
    html = await res.text();
  } catch (err) {
    // Try HTTP fallback if HTTPS failed
    if (url.startsWith("https://")) {
      try {
        const httpUrl = url.replace("https://", "http://");
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 10000);

        const res2 = await fetch(httpUrl, {
          signal: controller2.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; LeadReap Audit/1.0)",
            "Accept": "text/html,application/xhtml+xml",
          },
          redirect: "follow",
        });
        clearTimeout(timeout2);

        finalUrl = res2.url;
        isSSL = finalUrl.startsWith("https://");
        html = await res2.text();
      } catch {
        return { error: "Could not reach this website. It may be down or blocking requests." };
      }
    } else {
      return { error: "Could not reach this website. It may be down or blocking requests." };
    }
  }

  if (!html || html.length < 100) {
    return { error: "Website returned empty or invalid content." };
  }

  // Parse HTML
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const htmlLower = html.toLowerCase();

  // ── SEO Checks ──
  const titleEl = doc.querySelector("title");
  const hasTitle = !!(titleEl && titleEl.textContent.trim().length > 0);
  const titleText = titleEl?.textContent?.trim() || "";

  const h1El = doc.querySelector("h1");
  const hasH1 = !!(h1El && h1El.textContent.trim().length > 0);
  const h1Text = h1El?.textContent?.trim() || "";

  const metaDesc = doc.querySelector('meta[name="description"]');
  const hasMetaDesc = !!(metaDesc && metaDesc.getAttribute("content")?.trim().length > 0);
  const metaDescText = metaDesc?.getAttribute("content")?.trim() || "";

  // ── Tech Checks ──
  const hasFBPixel = htmlLower.includes("fbq(") || htmlLower.includes("facebook.com/tr") || htmlLower.includes("connect.facebook.net");
  const hasGA = htmlLower.includes("google-analytics.com") || htmlLower.includes("googletagmanager.com") || htmlLower.includes("gtag(") || htmlLower.includes("ga(");
  const hasGTM = htmlLower.includes("googletagmanager.com/gtm");

  // ── Score Calculation ──
  let score = 0;
  if (isSSL) score += 20;
  if (hasTitle) score += 15;
  if (hasH1) score += 15;
  if (hasMetaDesc) score += 15;
  if (hasFBPixel) score += 20;
  if (hasGA) score += 15;

  // ── Sales Angles ──
  const salesAngles = [];
  if (!hasFBPixel) {
    salesAngles.push({
      issue: "No Retargeting Pixel",
      hook: "You're losing 98% of your website traffic because you can't retarget visitors on Facebook or Instagram. A pixel takes 5 minutes to install and could double your ad ROI.",
    });
  }
  if (!isSSL) {
    salesAngles.push({
      issue: "Not Secure (No SSL)",
      hook: "Your site shows a 'Not Secure' warning to every visitor. Google also penalizes non-HTTPS sites in search rankings. This is scaring away local customers.",
    });
  }
  if (!hasH1) {
    salesAngles.push({
      issue: "Missing H1 Tag",
      hook: "Google doesn't know what your business does because your main heading tag is missing. This is one of the easiest SEO fixes — takes 2 minutes and can improve your rankings.",
    });
  }
  if (!hasMetaDesc) {
    salesAngles.push({
      issue: "No Meta Description",
      hook: "When your business shows up on Google, there's no description — just random text. A good meta description can increase your click-through rate by 30%.",
    });
  }
  if (!hasGA && !hasGTM) {
    salesAngles.push({
      issue: "No Analytics Tracking",
      hook: "You have zero visibility into who visits your website, where they come from, or what they do. You're flying blind — Google Analytics is free and takes 10 minutes to set up.",
    });
  }
  if (!hasTitle) {
    salesAngles.push({
      issue: "Missing Page Title",
      hook: "Your website doesn't have a proper title tag. This is the first thing Google reads — without it, you're invisible in search results for your services.",
    });
  }

  return {
    url: finalUrl,
    score,
    seo: {
      title: hasTitle,
      titleText,
      h1: hasH1,
      h1Text,
      description: hasMetaDesc,
      descriptionText: metaDescText,
    },
    tech: {
      ssl: isSSL,
      pixel: hasFBPixel,
      analytics: hasGA || hasGTM,
      gtm: hasGTM,
    },
    salesAngles,
    checkedAt: new Date().toISOString(),
  };
}
