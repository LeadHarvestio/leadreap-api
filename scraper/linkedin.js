// scraper/linkedin.js
// Finds LinkedIn company pages and attempts to surface owner/decision-maker names.
// Uses Google search (not LinkedIn directly — they block scrapers aggressively).
// Strategy: search "BusinessName City LinkedIn" on Google, parse first result.

const LINKEDIN_SEARCH_TIMEOUT = 8000;

/**
 * Find LinkedIn company URL and owner name via Google search.
 * @param {object} context - Playwright browser context
 * @param {object} lead    - { name, address, category }
 * @returns {object}       - { linkedinUrl, ownerName, ownerTitle }
 */
export async function enrichLinkedIn(context, lead) {
  const page = await context.newPage();

  try {
    const city = extractCity(lead.address);
    const query = encodeURIComponent(`"${lead.name}" ${city} linkedin`);
    const searchUrl = `https://www.google.com/search?q=${query}&num=5`;

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: LINKEDIN_SEARCH_TIMEOUT,
    });

    // Extract all result links
    const links = await page.$$eval("a[href]", els =>
      els.map(el => el.href).filter(h =>
        h.includes("linkedin.com/company/") || h.includes("linkedin.com/in/")
      )
    ).catch(() => []);

    const companyUrl = links.find(l => l.includes("linkedin.com/company/")) || null;
    const personUrl = links.find(l => l.includes("linkedin.com/in/")) || null;

    // Try to extract owner name from search result snippets
    const ownerName = await extractOwnerFromSnippets(page, lead.name);

    return {
      linkedinCompany: companyUrl ? cleanLinkedInUrl(companyUrl) : null,
      linkedinPerson: personUrl ? cleanLinkedInUrl(personUrl) : null,
      ownerName: ownerName || null,
      ownerTitle: ownerName ? inferTitle(lead.category) : null,
    };

  } catch (err) {
    return { linkedinCompany: null, linkedinPerson: null, ownerName: null, ownerTitle: null };
  } finally {
    await page.close();
  }
}

async function extractOwnerFromSnippets(page, businessName) {
  try {
    // Get all text from search result snippets
    const snippets = await page.$$eval("div.VwiC3b, div[data-sncf] span, .IsZvec", els =>
      els.map(el => el.textContent.trim()).filter(Boolean)
    ).catch(() => []);

    const ownerPatterns = [
      /owner[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /founded by ([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /([A-Z][a-z]+ [A-Z][a-z]+),?\s+(?:owner|founder|ceo|president|principal|doctor|dr\.)/i,
      /(?:owner|founder|ceo|president)\s+([A-Z][a-z]+ [A-Z][a-z]+)/i,
    ];

    for (const snippet of snippets) {
      for (const pattern of ownerPatterns) {
        const match = snippet.match(pattern);
        if (match) {
          const name = match[1].trim();
          // Sanity check — must be 2 words, not too long
          if (name.split(" ").length === 2 && name.length < 35) {
            return name;
          }
        }
      }
    }
  } catch {
    // Silently fail
  }
  return null;
}

function cleanLinkedInUrl(url) {
  // Strip tracking params
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url.split("?")[0];
  }
}

function extractCity(address) {
  if (!address) return "";
  // Addresses like "123 Main St, Austin, TX 78701"
  const parts = address.split(",");
  return parts.length >= 2 ? parts[parts.length - 2].trim() : address;
}

function inferTitle(category) {
  if (!category) return "Owner";
  const cat = category.toLowerCase();
  if (cat.includes("dental") || cat.includes("dentist")) return "Dentist / Owner";
  if (cat.includes("law") || cat.includes("attorney")) return "Attorney / Partner";
  if (cat.includes("medical") || cat.includes("doctor")) return "Physician / Owner";
  if (cat.includes("restaurant") || cat.includes("cafe")) return "Owner / Operator";
  if (cat.includes("gym") || cat.includes("fitness")) return "Owner / Head Trainer";
  if (cat.includes("real estate")) return "Agent / Broker";
  return "Owner";
}
