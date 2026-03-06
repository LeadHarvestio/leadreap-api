import fetch from "node-fetch";
import { JSDOM } from "jsdom";

/**
 * LeadReap Professional Site Audit Engine
 * Performs a 5-point diagnostic on a business URL
 */
export async function runSiteAudit(url) {
  if (!url) return { error: "No URL provided" };
  
  const results = {
    url,
    timestamp: new Date().toISOString(),
    seo: { title: false, h1: false, description: false, imagesWithoutAlt: 0 },
    tech: { wordpress: false, analytics: false, pixel: false, ssl: false },
    speed: { score: 0, loadTime: 0 },
    score: 0
  };

  try {
    // 1. SSL Check
    results.tech.ssl = url.startsWith("https");

    // 2. Fetch HTML with Timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'LeadReap-Audit-Bot/1.0' }
    });
    
    const html = await response.text();
    clearTimeout(timeout);
    
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // 3. SEO Basic Check
    results.seo.title = !!doc.querySelector("title")?.textContent;
    results.seo.description = !!doc.querySelector('meta[name="description"]');
    results.seo.h1 = !!doc.querySelector("h1");
    
    const images = Array.from(doc.querySelectorAll("img"));
    results.seo.imagesWithoutAlt = images.filter(img => !img.alt).length;

    // 4. Marketing Tech Check (Pixels & Analytics)
    results.tech.wordpress = html.includes("wp-content");
    results.tech.analytics = html.includes("gtag") || html.includes("google-analytics");
    results.tech.pixel = html.includes("fbevents.js") || html.includes("fbq");

    // 5. Calculate LeadReap Score (0-100)
    let points = 0;
    if (results.tech.ssl) points += 20;
    if (results.seo.title) points += 20;
    if (results.seo.h1) points += 20;
    if (results.tech.analytics) points += 20;
    if (results.tech.pixel) points += 20;
    results.score = points;

    return results;
  } catch (err) {
    console.error(`[Audit] Failed for ${url}:`, err.message);
    return { error: "Site unreachable or blocking requests" };
  }
}
