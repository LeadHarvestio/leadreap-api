import React from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@400;600;700;800&display=swap');
  
  .compare-page {
    background-color: #0a0a0b;
    color: #ededed;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }
  .compare-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 48px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .compare-logo {
    font-family: 'Syne', sans-serif;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #fff;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .compare-logo span { color: #f0b429; }
  
  .compare-hero {
    padding: 100px 24px 60px;
    text-align: center;
    max-width: 900px;
    margin: 0 auto;
  }
  .compare-hero h1 {
    font-family: 'Syne', sans-serif;
    font-size: 48px;
    line-height: 1.1;
    margin-bottom: 24px;
    letter-spacing: -1.5px;
  }
  .compare-hero h1 span { color: #f0b429; }
  .compare-hero p {
    font-size: 18px;
    color: #a1a1aa;
    line-height: 1.6;
    margin-bottom: 40px;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
  }
  .compare-cta {
    background: #f0b429;
    color: #000;
    font-weight: 700;
    font-size: 16px;
    padding: 16px 32px;
    border-radius: 8px;
    text-decoration: none;
    display: inline-block;
    transition: transform 0.2s, background 0.2s;
  }
  .compare-cta:hover { background: #f5c451; transform: translateY(-2px); }

  .compare-table-section {
    max-width: 1000px;
    margin: 0 auto 80px;
    padding: 0 24px;
  }
  .compare-table {
    width: 100%;
    border-collapse: collapse;
    background: #111114;
    border: 1px solid #2a2a35;
    border-radius: 16px;
    overflow: hidden;
  }
  .compare-table th, .compare-table td {
    padding: 20px 24px;
    text-align: left;
    border-bottom: 1px solid #2a2a35;
  }
  .compare-table th {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    background: #18181d;
  }
  .compare-table th.leadreap-col { color: #f0b429; width: 35%; }
  .compare-table th.apollo-col { color: #a1a1aa; width: 35%; font-weight: 500; }
  .compare-table td.feature-name {
    font-weight: 600;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    color: #a1a1aa;
  }
  .compare-table td.leadreap-val { color: #fff; font-weight: 600; }
  .compare-table td.apollo-val { color: #6b6b80; }
  
  .deep-dive {
    max-width: 800px;
    margin: 0 auto 80px;
    padding: 0 24px;
  }
  .deep-dive-card {
    background: #111113;
    border: 1px solid #222;
    padding: 40px;
    border-radius: 12px;
    margin-bottom: 32px;
  }
  .deep-dive-card h3 {
    font-family: 'Syne', sans-serif;
    font-size: 24px;
    margin-bottom: 16px;
    color: #fff;
  }
  .deep-dive-card p {
    color: #a1a1aa;
    line-height: 1.7;
    font-size: 16px;
  }

  @media (max-width: 768px) {
    .compare-hero h1 { font-size: 36px; }
    .compare-table th, .compare-table td { padding: 16px 12px; font-size: 14px; }
    .compare-table td.feature-name { font-size: 11px; }
    .deep-dive-card { padding: 24px; }
  }
`;

export default function ApolloAlternative() {
  return (
    <div className="compare-page">
      <style>{STYLE}</style>
      
      <nav className="compare-nav">
        <a href="/" className="compare-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#f0b429"/>
            <circle cx="12" cy="12" r="6" stroke="#000" strokeWidth="2"/>
            <circle cx="12" cy="12" r="2" fill="#000"/>
          </svg>
          Lead<span>Reap</span>
        </a>
        <a href="/" style={{ color: '#a1a1aa', textDecoration: 'none', fontWeight: 500 }}>Log In</a>
      </nav>

      <header className="compare-hero">
        <h1>Apollo is for Enterprise SaaS.<br/><span>LeadReap is for Local Businesses.</span></h1>
        <p>If you're selling software to Microsoft, use Apollo.io. If you're selling marketing, websites, or services to local plumbers, roofers, and med spas, you need live Google Maps data.</p>
        <a href="/" className="compare-cta">Try the Local Alternative to Apollo →</a>
      </header>

      <section className="compare-table-section">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th className="leadreap-col">🎯 LeadReap</th>
              <th className="apollo-col">🚀 Apollo.io</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="feature-name">Data Source</td>
              <td className="leadreap-val">Live Google Maps Scraping</td>
              <td className="apollo-val">Static B2B Database (LinkedIn)</td>
            </tr>
            <tr>
              <td className="feature-name">Local Accuracy</td>
              <td className="leadreap-val">100% (Real-time data)</td>
              <td className="apollo-val">Low (Local businesses rarely update LinkedIn)</td>
            </tr>
            <tr>
              <td className="feature-name">Unclaimed Google Listings</td>
              <td className="leadreap-val">✅ Auto-detected</td>
              <td className="apollo-val">❌ Not tracked</td>
            </tr>
            <tr>
              <td className="feature-name">Social Media Gaps</td>
              <td className="leadreap-val">✅ Identifies missing profiles</td>
              <td className="apollo-val">❌ Not tracked</td>
            </tr>
            <tr>
              <td className="feature-name">Email Verification</td>
              <td className="leadreap-val">✅ Live MX Check</td>
              <td className="apollo-val">✅ Database verified</td>
            </tr>
            <tr>
              <td className="feature-name">Pricing Model</td>
              <td className="leadreap-val">One-time purchase ($47-$197)</td>
              <td className="apollo-val">$99 - $149 per month</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="deep-dive">
        <div className="deep-dive-card">
          <h3>1. Live Scraping vs. Stale Databases</h3>
          <p>Apollo relies on a massive, static database that gets updated periodically. If a new roofing company or dental clinic opens today, they won't be in Apollo's system for months. LeadReap searches Google Maps in real-time. If a business exists on the map right now, you get their contact info and website data in 30 seconds.</p>
        </div>
        
        <div className="deep-dive-card">
          <h3>2. Local Buying Signals</h3>
          <p>Enterprise sales reps care about "Funding Rounds" and "Headcount" (which Apollo shows). Local agencies care about <strong>"Unclaimed Google Listings," "Missing Websites,"</strong> and <strong>"No Facebook Pixel."</strong> LeadReap is the only tool that actively flags these local buying signals so you can craft the perfect pitch for small business owners.</p>
        </div>

        <div className="deep-dive-card">
          <h3>3. Stop Renting Your Leads</h3>
          <p>Apollo charges $1,188+ a year just for the privilege of exporting a few thousand rows of data. LeadReap offers lifetime access for a one-time fee. Pay once, search unlimited local niches, and export unlimited CSVs to your CRM forever.</p>
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '0 24px 100px' }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: '36px', marginBottom: '16px' }}>See the difference yourself.</h2>
        <p style={{ color: '#a1a1aa', fontSize: '18px', marginBottom: '32px' }}>Search your specific niche and city right now. We guarantee we'll find verified local leads that aren't in Apollo's database.</p>
        <a href="/" className="compare-cta" style={{ padding: '20px 40px', fontSize: '18px' }}>Search Live Data Now →</a>
      </section>
    </div>
  );
}
