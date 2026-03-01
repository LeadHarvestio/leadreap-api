// Run this to test the scraper directly without starting the server:
// node test-scraper.js

import { scrapeGoogleMaps } from "./scraper/gmaps.js";

const results = await scrapeGoogleMaps({
  niche: "Dentist",
  location: "Austin, TX",
  limit: 5,          // keep it small for a quick test
  scrapeEmails: true,
});

console.log("\n=== RESULTS ===");
console.table(results.map(r => ({
  name:    r.name,
  phone:   r.phone,
  email:   r.email,
  rating:  r.rating,
  reviews: r.reviews,
  score:   r.score,
})));

console.log("\nFull first result:");
console.log(JSON.stringify(results[0], null, 2));
