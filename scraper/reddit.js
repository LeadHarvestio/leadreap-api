// ─────────────────────────────────────────────────────────────
// REDDIT INTENT MONITOR — Finds buy-ready leads on Reddit
// Uses Reddit's public JSON API (no auth needed)
// ─────────────────────────────────────────────────────────────

// Default subreddits to monitor for local business intent
const DEFAULT_SUBREDDITS = [
  "smallbusiness", "Entrepreneur", "marketing", "digital_marketing",
  "SEO", "webdev", "web_design", "socialmedia", "LocalSEO",
  "freelance", "agency", "realtors", "restaurantowners",
  "dentistry", "HVAC", "plumbing", "roofing", "landscaping",
  "legaladvice", "Insurance", "RealEstate",
];

// Intent keywords — phrases that signal someone is actively looking
const INTENT_PHRASES = [
  "looking for", "need help with", "anyone recommend", "can someone help",
  "hiring a", "need a", "searching for", "where can I find",
  "who do you use for", "recommendations for", "best way to get",
  "struggling with", "how do I get more", "need more customers",
  "need more clients", "how to get leads", "looking to hire",
  "want to improve my", "my website needs", "my google listing",
  "need marketing", "need a website", "need seo", "need social media",
  "anyone know a good", "can anyone suggest", "help me find",
];

// Niche keyword groups — matched against user's target niches
const NICHE_KEYWORDS = {
  "marketing": ["marketing", "digital marketing", "social media", "advertising", "branding", "seo", "google ads", "facebook ads"],
  "web design": ["website", "web design", "web developer", "redesign", "landing page", "wordpress", "shopify", "wix"],
  "seo": ["seo", "search engine", "google ranking", "local seo", "google maps", "google business"],
  "social media": ["social media", "instagram", "facebook", "tiktok", "content creation", "social media manager"],
  "lead generation": ["leads", "lead gen", "customers", "clients", "sales", "cold outreach", "prospecting"],
  "reputation": ["reviews", "reputation", "google reviews", "yelp", "bad reviews", "online presence"],
  "general": ["small business", "local business", "startup", "entrepreneur", "grow my business"],
};

/**
 * Fetch recent posts from a subreddit via JSON API
 * Reddit serves JSON at reddit.com/r/{sub}/new.json
 */
async function fetchSubredditPosts(subreddit, limit = 25) {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}&raw_json=1`;
  
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LeadReap-IntentMonitor/1.0",
      },
    });
    
    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`[Reddit] Rate limited on r/${subreddit}, skipping`);
        return [];
      }
      return [];
    }
    
    const data = await res.json();
    const posts = data?.data?.children || [];
    
    return posts.map(p => ({
      id: p.data.id,
      subreddit: p.data.subreddit,
      title: p.data.title,
      body: p.data.selftext || "",
      author: p.data.author,
      url: `https://reddit.com${p.data.permalink}`,
      score: p.data.score,
      numComments: p.data.num_comments,
      createdUtc: p.data.created_utc,
      createdAt: new Date(p.data.created_utc * 1000).toISOString(),
    }));
  } catch (err) {
    console.error(`[Reddit] Error fetching r/${subreddit}:`, err.message);
    return [];
  }
}

/**
 * Score a post for intent signals
 * Returns { score, matchedPhrases, matchedNiches } or null if no match
 */
function scorePost(post, targetNiches = []) {
  const text = `${post.title} ${post.body}`.toLowerCase();
  
  // 1. Check for intent phrases
  const matchedPhrases = INTENT_PHRASES.filter(phrase => text.includes(phrase));
  if (matchedPhrases.length === 0) return null;
  
  // 2. Check for niche relevance
  const matchedNiches = [];
  
  // Check user's custom niches
  for (const niche of targetNiches) {
    if (text.includes(niche.toLowerCase())) {
      matchedNiches.push(niche);
    }
  }
  
  // Check general niche keywords
  for (const [category, keywords] of Object.entries(NICHE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matchedNiches.push(category);
        break; // one match per category is enough
      }
    }
  }
  
  // Deduplicate
  const uniqueNiches = [...new Set(matchedNiches)];
  
  // Must match at least one niche to be relevant
  if (uniqueNiches.length === 0) return null;
  
  // 3. Calculate score (0-100)
  let score = 0;
  score += Math.min(30, matchedPhrases.length * 15); // intent signals: up to 30
  score += Math.min(30, uniqueNiches.length * 10);    // niche relevance: up to 30
  score += Math.min(15, post.numComments * 3);         // engagement: up to 15
  
  // Boost for very strong intent phrases
  const strongIntent = ["looking for", "hiring a", "need a", "looking to hire", "anyone recommend"];
  if (matchedPhrases.some(p => strongIntent.includes(p))) score += 15;
  
  // Recency bonus (posted in last 2 hours)
  const hoursAgo = (Date.now() / 1000 - post.createdUtc) / 3600;
  if (hoursAgo < 2) score += 10;
  else if (hoursAgo < 6) score += 5;
  
  return {
    score: Math.min(100, score),
    matchedPhrases,
    matchedNiches: uniqueNiches,
    hoursAgo: Math.round(hoursAgo * 10) / 10,
  };
}

/**
 * Scan multiple subreddits for intent signals
 * @param {string[]} subreddits - List of subreddit names
 * @param {string[]} targetNiches - User's target niches (e.g., ["plumber", "web design"])
 * @param {string[]} customKeywords - Additional custom keywords to match
 * @param {Set} seenIds - Post IDs already processed (for dedup)
 * @returns {Array} Scored and sorted intent signals
 */
export async function scanForIntentSignals(subreddits, targetNiches = [], customKeywords = [], seenIds = new Set()) {
  const allNiches = [...targetNiches, ...customKeywords];
  const signals = [];
  
  // Stagger requests to avoid rate limiting
  for (const sub of subreddits) {
    const posts = await fetchSubredditPosts(sub, 25);
    
    for (const post of posts) {
      // Skip already-seen posts
      if (seenIds.has(post.id)) continue;
      
      // Skip posts older than 48 hours
      const hoursAgo = (Date.now() / 1000 - post.createdUtc) / 3600;
      if (hoursAgo > 48) continue;
      
      // Score the post
      const result = scorePost(post, allNiches);
      if (result && result.score >= 30) {
        signals.push({
          ...post,
          intentScore: result.score,
          matchedPhrases: result.matchedPhrases,
          matchedNiches: result.matchedNiches,
          hoursAgo: result.hoursAgo,
        });
      }
    }
    
    // Small delay between subreddits to respect rate limits
    await new Promise(r => setTimeout(r, 800));
  }
  
  // Sort by score descending, then recency
  signals.sort((a, b) => b.intentScore - a.intentScore || a.hoursAgo - b.hoursAgo);
  
  return signals;
}

export { DEFAULT_SUBREDDITS, INTENT_PHRASES, NICHE_KEYWORDS };
