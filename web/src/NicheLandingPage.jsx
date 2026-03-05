import { useState, useEffect } from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@400;600;700;800&display=swap');
  
  .niche-page {
    background-color: #0a0a0b;
    color: #ededed;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }
  .niche-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 48px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .niche-logo {
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
  .niche-logo span { color: #f0b429; }
  .niche-hero {
    padding: 100px 24px 60px;
    text-align: center;
    max-width: 900px;
    margin: 0 auto;
  }
  .niche-hero h1 {
    font-family: 'Syne', sans-serif;
    font-size: 56px;
    line-height: 1.1;
    margin-bottom: 24px;
    letter-spacing: -1.5px;
  }
  .niche-hero p {
    font-size: 18px;
    color: #a1a1aa;
    line-height: 1.6;
    margin-bottom: 40px;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
  }
  .niche-cta {
    background: #f0b429;
    color: #000;
    font-weight: 600;
    font-size: 16px;
    padding: 16px 32px;
    border-radius: 8px;
    text-decoration: none;
    display: inline-block;
    transition: transform 0.2s, background 0.2s;
  }
  .niche-cta:hover {
    background: #f5c451;
    transform: translateY(-2px);
  }
  .niche-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 32px;
    padding: 60px 48px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .niche-feature-card {
    background: #111113;
    border: 1px solid #222;
    padding: 32px;
    border-radius: 12px;
  }
  .niche-feature-card h3 {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    margin-bottom: 16px;
    color: #fff;
  }
  .niche-feature-card p {
    color: #a1a1aa;
    line-height: 1.5;
    font-size: 15px;
  }
  .niche-demo-section {
    padding: 80px 24px;
    background: linear-gradient(180deg, #0a0a0b 0%, #111113 100%);
    border-top: 1px solid rgba(255,255,255,0.05);
  }
  .niche-demo-container {
    max-width: 1000px;
    margin: 0 auto;
    background: #000;
    border: 1px solid #333;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  }
  .niche-table-header {
    display: grid;
    grid-template-columns: 2fr 2fr 1.5fr 1fr;
    padding: 16px 24px;
    border-bottom: 1px solid #222;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: #666;
    text-transform: uppercase;
  }
  .niche-table-row {
    display: grid;
    grid-template-columns: 2fr 2fr 1.5fr 1fr;
    padding: 20px 24px;
    border-bottom: 1px solid #1a1a1a;
    align-items: center;
  }
  .niche-verified {
    display: inline-block;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 6px;
  }
  .niche-unclaimed {
    display: inline-block;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #f0b429;
    border: 1px solid rgba(240, 180, 41, 0.3);
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 6px;
  }
  .niche-playbook {
    max-width: 800px;
    margin: 80px auto;
    padding: 0 24px;
  }
  .niche-playbook h2 {
    font-family: 'Syne', sans-serif;
    font-size: 36px;
    margin-bottom: 24px;
    text-align: center;
  }
  .niche-playbook > p {
    text-align: center;
    color: #a1a1aa;
    margin-bottom: 40px;
    font-size: 16px;
  }
  .niche-email-box {
    background: #111113;
    border: 1px solid #333;
    padding: 32px;
    border-radius: 12px;
    font-family: -apple-system, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: #ddd;
  }
  .niche-email-subject {
    font-weight: 600;
    color: #fff;
    border-bottom: 1px solid #333;
    padding-bottom: 16px;
    margin-bottom: 16px;
  }
  .niche-footer-cta {
    text-align: center;
    padding: 80px 24px 120px;
  }
  @media (max-width: 768px) {
    .niche-hero h1 { font-size: 40px; }
    .niche-nav { padding: 20px; }
    .niche-table-header { display: none; }
    .niche-table-row { grid-template-columns: 1fr; gap: 12px; padding: 16px; }
  }
`;

export default function NicheLandingPage({ slug }) {
  // Format slug "roofing-contractors" -> "Roofing Contractors"
  const formatNiche = (s) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const nichePlural = formatNiche(slug);
  // Rough singular conversion (remove 's' if it ends in s, unless it's a word like "HVAC")
  const nicheSingular = nichePlural.endsWith('s') ? nichePlural.slice(0, -1) : nichePlural;

  // We pass the niche as a URL parameter to the main app so it auto-fills the search bar
  const appUrl = `/?niche=${encodeURIComponent(nichePlural)}`;

  return (
    <div className="niche-page">
      <style>{STYLE}</style>
      
      <nav className="niche-nav">
        <a href="/" className="niche-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#f0b429"/>
            <circle cx="12" cy="12" r="6" stroke="#000" strokeWidth="2"/>
            <circle cx="12" cy="12" r="2" fill="#000"/>
          </svg>
          Lead<span>Reap</span>
        </a>
        <a href="/" style={{ color: '#a1a1aa', textDecoration: 'none', fontWeight: 500 }}>Log In</a>
      </nav>

      <header className="niche-hero">
        <h1>Build a verified list of {nichePlural} in 30 seconds.</h1>
        <p>Skip the manual Google Maps scraping. LeadReap automatically pulls direct emails, social media profiles, and deep business insights for {nichePlural} in any city.</p>
        <a href={appUrl} className="niche-cta">Search {nichePlural} Now →</a>
        <div style={{ marginTop: '16px', fontSize: '13px', color: '#666' }}>5 free leads per search • No credit card required • Live data</div>
      </header>

      <section className="niche-features">
        <div className="niche-feature-card">
          <h3>🎯 Direct, Verified Emails</h3>
          <p>We deep-crawl {nicheSingular} websites to find hidden email addresses, then run an MX verification check so your pitch lands in the inbox, not spam.</p>
        </div>
        <div className="niche-feature-card">
          <h3>🚩 "Unclaimed" Detection</h3>
          <p>LeadReap flags {nichePlural} that haven't claimed their Google Business Profile. Reach out, offer to fix it for them, and win an easy client.</p>
        </div>
        <div className="niche-feature-card">
          <h3>📱 Social Media Gaps</h3>
          <p>Instantly see which {nichePlural} are missing a Facebook, Instagram, or LinkedIn presence. Perfect for pitching social media management.</p>
        </div>
      </section>

      <section className="niche-demo-section">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: '32px', marginBottom: '16px' }}>Exactly what you get.</h2>
          <p style={{ color: '#a1a1aa' }}>Live, scraped-on-demand data enriched with AI lead scoring.</p>
        </div>
        
        <div className="niche-demo-container">
          <div className="niche-table-header">
            <div>Business</div>
            <div>Contact</div>
            <div>Rating</div>
            <div>Insight</div>
          </div>
          
          <div className="niche-table-row">
            <div>
              <strong style={{ display: 'block', marginBottom: '4px' }}>Apex {nicheSingular} Pros</strong>
              <div className="niche-unclaimed">UNCLAIMED</div>
            </div>
            <div>
              <div style={{ color: '#ddd' }}>hello@apex{slug.split('-')[0]}.com</div>
              <div className="niche-verified">Verified ✓</div>
            </div>
            <div style={{ color: '#a1a1aa' }}>★ 4.8</div>
            <div style={{ fontSize: '13px', color: '#888' }}>Has website but missing LinkedIn profile. Unclaimed Google listing.</div>
          </div>

          <div className="niche-table-row">
            <div>
              <strong style={{ display: 'block', marginBottom: '4px' }}>Elite {nichePlural} LLC</strong>
              <div style={{ fontSize: '12px', color: '#0A66C2', marginTop: '4px' }}>LinkedIn ↗</div>
            </div>
            <div>
              <div style={{ color: '#ddd' }}>info@elite{slug.split('-')[0]}.com</div>
              <div className="niche-verified">Verified ✓</div>
            </div>
            <div style={{ color: '#a1a1aa' }}>★ 4.2</div>
            <div style={{ fontSize: '13px', color: '#888' }}>Tech stack indicates Wix. Good candidate for website redesign.</div>
          </div>
        </div>
      </section>

      <section className="niche-playbook">
        <h2>How to cold email a {nicheSingular}</h2>
        <p>Use LeadReap's data to send a hyper-personalized pitch that actually gets a reply.</p>
        
        <div className="niche-email-box">
          <div className="niche-email-subject">Subject: Quick question about your Google Maps listing</div>
          <div style={{ marginTop: '16px' }}>
            Hi [Owner Name],<br/><br/>
            I was searching for {nichePlural} in the area and noticed that your Google Business listing is currently unclaimed.<br/><br/>
            This means competitors can easily suggest edits to your phone number or hours, and you're likely missing out on local search traffic.<br/><br/>
            I help {nichePlural} secure and rank their local profiles. Mind if I send over a quick 2-minute video showing you how to claim it for free?<br/><br/>
            Best,<br/>
            [Your Name]
          </div>
        </div>
      </section>

      <section className="niche-footer-cta">
        <h2 style={{ fontFamily: 'Syne', fontSize: '40px', marginBottom: '16px' }}>Ready to fill your pipeline?</h2>
        <p style={{ color: '#a1a1aa', fontSize: '18px', marginBottom: '32px' }}>Join the agencies using LeadReap to bypass gatekeepers and close more deals.</p>
        <a href={appUrl} className="niche-cta" style={{ padding: '20px 40px', fontSize: '18px' }}>Find Your First 20 {nichePlural} Free</a>
      </section>
    </div>
  );
}
