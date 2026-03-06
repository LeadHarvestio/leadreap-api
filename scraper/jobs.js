// ─────────────────────────────────────────────────────────────
// JOB POSTING SIGNALS — Finds businesses actively hiring
// Uses Google search (no API key needed) via Playwright
// A business hiring for "marketing" = they need help but haven't solved it yet
// ─────────────────────────────────────────────────────────────

const MARKETING_JOB_KEYWORDS = [
  "marketing manager", "marketing coordinator", "digital marketing",
  "social media manager", "seo specialist", "content manager",
  "web designer", "graphic designer", "marketing assistant",
  "marketing director", "brand manager", "growth marketing",
];

const JOB_BOARDS = ["indeed.com", "linkedin.com/jobs", "glassdoor.com", "ziprecruiter.com"];

/**
 * Search for job postings for businesses in a given area
 * Uses fetch to hit Indeed's public search (no auth needed)
 */
export async function scanJobPostings(niche, location, limit = 20) {
  const signals = [];

  for (const keyword of MARKETING_JOB_KEYWORDS.slice(0, 6)) {
    const query = `${niche} ${keyword} ${location}`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query + " site:indeed.com OR site:linkedin.com/jobs")}&num=10`;

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!res.ok) continue;
      const html = await res.text();

      // Extract result titles and URLs from Google search results
      const titleMatches = html.match(/<h3[^>]*>(.*?)<\/h3>/gi) || [];
      const linkMatches = html.match(/href="\/url\?q=(https?[^"&]+)/gi) || [];

      for (let i = 0; i < Math.min(titleMatches.length, 5); i++) {
        const title = titleMatches[i]?.replace(/<[^>]+>/g, "").trim();
        const rawLink = linkMatches[i]?.match(/q=(https?[^"&]+)/)?.[1];
        const link = rawLink ? decodeURIComponent(rawLink) : null;

        if (!title || !link) continue;
        if (!JOB_BOARDS.some(board => link.includes(board))) continue;

        // Score the signal
        let score = 40; // base: it's a job posting in the right area
        if (title.toLowerCase().includes("marketing")) score += 20;
        if (title.toLowerCase().includes("digital")) score += 10;
        if (title.toLowerCase().includes("seo")) score += 15;
        if (title.toLowerCase().includes("social media")) score += 15;
        if (title.toLowerCase().includes("web")) score += 10;

        signals.push({
          id: `job_${Buffer.from(title + link).toString("base64").slice(0, 16)}`,
          title,
          url: link,
          keyword,
          source: link.includes("indeed") ? "Indeed" : link.includes("linkedin") ? "LinkedIn" : "Job Board",
          score: Math.min(100, score),
          niche,
          location,
        });
      }
    } catch (err) {
      console.warn(`[Jobs] Search failed for "${keyword}":`, err.message);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
    if (signals.length >= limit) break;
  }

  // Deduplicate by title similarity
  const seen = new Set();
  const unique = signals.filter(s => {
    const key = s.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Check if a specific business is hiring (for per-lead enrichment)
 */
export async function checkBusinessHiring(businessName, location) {
  const query = `"${businessName}" hiring OR "careers" OR "job" ${location}`;

  try {
    const res = await fetch(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=5`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });

    if (!res.ok) return { isHiring: false };
    const html = await res.text();
    const text = html.toLowerCase();

    const hiringSignals = [
      "now hiring", "we're hiring", "join our team", "career opportunities",
      "apply now", "open position", "job opening",
    ];

    const matched = hiringSignals.filter(s => text.includes(s));
    return {
      isHiring: matched.length > 0,
      confidence: Math.min(100, matched.length * 25),
      signals: matched,
    };
  } catch {
    return { isHiring: false };
  }
}

export { MARKETING_JOB_KEYWORDS };
