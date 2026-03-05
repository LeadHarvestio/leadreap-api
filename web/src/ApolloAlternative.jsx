import React from "react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0b;
    --surface: #111114;
    --surface2: #18181d;
    --border: #2a2a35;
    --accent: #f0b429;
    --accent2: #e85d04;
    --text: #e8e8f0;
    --muted: #6b6b80;
    --green: #22c55e;
    --red: #ef4444;
  }

  .cp {
    min-height: 100vh; display: flex; flex-direction: column;
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E");
  }

  /* NAV — identical to main app */
  .cp-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 40px; border-bottom: 1px solid var(--border);
    background: rgba(10,10,11,0.85); backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    position: sticky; top: 0; z-index: 100;
  }
  .cp-logo {
    display: flex; align-items: center; gap: 10px;
    font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
    color: var(--text); text-decoration: none;
  }
  .cp-logo span { color: var(--accent); }
  .cp-nav-actions { display: flex; align-items: center; gap: 12px; }

  /* BTN */
  .cp-btn {
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 14px;
    padding: 10px 22px; border-radius: 8px; cursor: pointer;
    border: none; transition: all 0.2s ease; display: inline-flex;
    align-items: center; gap: 8px; text-decoration: none;
  }
  .cp-btn-primary { background: var(--accent); color: #000; }
  .cp-btn-primary:hover { background: #f5c842; transform: translateY(-1px); box-shadow: 0 4px 24px rgba(240,180,41,0.25); }
  .cp-btn-outline { background: transparent; color: var(--text); border: 1px solid var(--border); }
  .cp-btn-outline:hover { border-color: var(--accent); color: var(--accent); }
  .cp-btn-ghost { background: transparent; color: var(--muted); border: none; padding: 10px 14px; font-size: 13px; }
  .cp-btn-ghost:hover { color: var(--text); }
  .cp-btn-lg { padding: 14px 32px; font-size: 16px; border-radius: 10px; }

  /* HERO */
  .cp-hero {
    padding: 80px 40px 60px; text-align: center;
    position: relative; overflow: hidden; max-width: 860px;
    margin: 0 auto;
  }
  .cp-hero::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(240,180,41,0.05) 0%, transparent 70%);
    pointer-events: none;
  }
  .cp-tag-pill {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    color: var(--accent); border: 1px solid rgba(240,180,41,0.2);
    padding: 6px 16px; border-radius: 20px; margin-bottom: 24px;
    letter-spacing: 0.08em; background: rgba(240,180,41,0.04);
  }
  .cp-hero h1 {
    font-size: clamp(32px, 4.5vw, 52px); font-weight: 800; line-height: 1.08;
    letter-spacing: -2px; margin-bottom: 20px;
  }
  .cp-hero h1 em { font-style: normal; color: var(--accent); }
  .cp-hero-sub {
    font-size: 16px; color: var(--muted); max-width: 580px;
    margin: 0 auto 36px; line-height: 1.7; font-weight: 400;
  }

  /* COMPARISON TABLE */
  .cp-section { max-width: 960px; margin: 0 auto 72px; padding: 0 40px; }
  .cp-section-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase;
    text-align: center; margin-bottom: 28px;
  }

  .cp-table {
    border: 1px solid var(--border); border-radius: 16px;
    overflow: hidden; background: var(--surface);
  }
  .cp-table-head {
    display: grid; grid-template-columns: 1fr 1fr;
    background: var(--surface2); border-bottom: 1px solid var(--border);
  }
  .cp-table-head-cell {
    padding: 18px 28px; font-size: 14px; font-weight: 700;
    display: flex; align-items: center; gap: 10px;
  }
  .cp-table-head-cell:first-child { border-right: 1px solid var(--border); }
  .cp-table-head-cell.ours { color: var(--accent); }
  .cp-table-head-cell.theirs { color: var(--muted); font-weight: 500; }
  .cp-table-head-cell .badge {
    font-family: 'IBM Plex Mono', monospace; font-size: 10px;
    padding: 2px 8px; border-radius: 4px; letter-spacing: 0.04em;
  }
  .cp-table-head-cell.ours .badge { background: rgba(240,180,41,0.12); color: var(--accent); }
  .cp-table-head-cell.theirs .badge { background: rgba(107,107,128,0.12); color: var(--muted); }

  .cp-row {
    display: grid; grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }
  .cp-row:last-child { border-bottom: none; }
  .cp-row:hover { background: rgba(240,180,41,0.015); }
  .cp-cell {
    padding: 20px 28px; font-size: 14px; line-height: 1.5;
  }
  .cp-cell:first-child { border-right: 1px solid var(--border); }
  .cp-cell.win { color: var(--text); }
  .cp-cell.dim { color: var(--muted); font-size: 13px; }
  .cp-cell-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 10px;
    color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase;
    margin-bottom: 6px; display: block;
  }
  .cp-cell-main { font-weight: 600; }
  .cp-cell-main .chk { color: var(--green); margin-right: 6px; }
  .cp-cell-main .xx { color: var(--red); margin-right: 6px; opacity: 0.5; }
  .cp-cell-sub { font-size: 12px; color: var(--muted); margin-top: 3px; font-weight: 400; }

  /* PRICE CARDS */
  .cp-price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .cp-price-card {
    padding: 32px; border-radius: 14px; text-align: center;
    border: 1px solid var(--border); background: var(--surface);
  }
  .cp-price-card.ours { border-color: rgba(240,180,41,0.3); }
  .cp-price-name {
    font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase;
    margin-bottom: 12px;
  }
  .cp-price-card.ours .cp-price-name { color: var(--accent); }
  .cp-price-amount { font-size: 38px; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 4px; }
  .cp-price-card.theirs .cp-price-amount { color: var(--muted); }
  .cp-price-note { font-size: 13px; color: var(--muted); margin-bottom: 16px; }
  .cp-price-card.ours .cp-price-note { color: var(--green); }
  .cp-price-card.theirs .cp-price-note { color: var(--red); }
  .cp-price-detail {
    font-size: 12px; color: var(--muted); line-height: 1.6;
    padding-top: 16px; border-top: 1px solid var(--border);
  }

  /* DEEP DIVE CARDS */
  .cp-card {
    padding: 36px; border-radius: 14px;
    border: 1px solid var(--border); background: var(--surface);
    margin-bottom: 16px; transition: border-color 0.2s;
  }
  .cp-card:hover { border-color: rgba(240,180,41,0.2); }
  .cp-card-num {
    font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    color: var(--accent); letter-spacing: 0.06em; margin-bottom: 12px;
    display: block;
  }
  .cp-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 12px; letter-spacing: -0.5px; }
  .cp-card p { font-size: 14px; color: var(--muted); line-height: 1.8; }
  .cp-card strong { color: var(--text); font-weight: 600; }

  /* BOTTOM CTA */
  .cp-bottom {
    text-align: center; padding: 20px 40px 100px;
    max-width: 560px; margin: 0 auto;
  }
  .cp-bottom h2 { font-size: clamp(24px, 3vw, 32px); font-weight: 800; letter-spacing: -1px; margin-bottom: 14px; }
  .cp-bottom p { font-size: 15px; color: var(--muted); line-height: 1.7; margin-bottom: 28px; }

  /* FOOTER */
  .cp-footer {
    margin-top: auto; padding: 24px 40px; border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .cp-footer-l { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); }
  .cp-footer-r { display: flex; gap: 20px; }
  .cp-footer-r a { font-size: 13px; color: var(--muted); text-decoration: none; transition: color 0.15s; }
  .cp-footer-r a:hover { color: var(--text); }

  /* ANIMATIONS */
  .fade-in { animation: fadeUp 0.5s ease both; }
  .fd1 { animation-delay: 0.05s; } .fd2 { animation-delay: 0.1s; }
  .fd3 { animation-delay: 0.15s; } .fd4 { animation-delay: 0.2s; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .cp-nav { padding: 14px 20px; }
    .cp-hero { padding: 40px 20px 36px; }
    .cp-hero h1 { font-size: 28px; letter-spacing: -1px; }
    .cp-section { padding: 0 16px; margin-bottom: 48px; }
    .cp-table-head { grid-template-columns: 1fr; }
    .cp-table-head-cell:first-child { border-right: none; border-bottom: 1px solid var(--border); }
    .cp-row { grid-template-columns: 1fr; }
    .cp-cell:first-child { border-right: none; border-bottom: 1px solid var(--border); }
    .cp-price-grid { grid-template-columns: 1fr; }
    .cp-card { padding: 24px; }
    .cp-bottom { padding: 16px 20px 60px; }
    .cp-footer { padding: 20px; flex-direction: column; gap: 12px; text-align: center; }
  }
`;

const ROWS = [
  {
    label: "DATA SOURCE",
    ours: { val: "Live Google Maps scraping", note: "Real-time from active listings" },
    theirs: { val: "Static B2B database", note: "LinkedIn-sourced, updated periodically" },
  },
  {
    label: "LOCAL ACCURACY",
    ours: { val: "100% — real-time data", note: "If it's on Google Maps, you get it" },
    theirs: { val: "Low for local businesses", note: "Most local businesses aren't on LinkedIn" },
  },
  {
    label: "UNCLAIMED LISTINGS",
    ours: { val: "Auto-detected", check: true, note: "Instant selling signal for agencies" },
    theirs: { val: "Not tracked", x: true },
  },
  {
    label: "BUYING SIGNALS",
    ours: { val: "Missing website, no social, old tech", check: true },
    theirs: { val: "Funding rounds, headcount", note: "Enterprise-focused" },
  },
  {
    label: "EMAIL VERIFICATION",
    ours: { val: "Live MX check", check: true },
    theirs: { val: "Database verified", check: true },
  },
  {
    label: "SEARCH SPEED",
    ours: { val: "~30 seconds per niche", note: "Live scrape per query" },
    theirs: { val: "Instant (pre-indexed)", note: "But data may be months old" },
  },
];

export default function ApolloAlternative() {
  return (
    <div className="cp">
      <style>{STYLE}</style>

      <nav className="cp-nav">
        <a href="/" className="cp-logo">
          <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="22" fill="#f0b429"/>
            <circle cx="50" cy="50" r="24" stroke="#000" strokeWidth="7" fill="none"/>
            <circle cx="50" cy="50" r="7" fill="#000"/>
            <path d="M50 26 L50 10" stroke="#000" strokeWidth="5" strokeLinecap="round"/>
          </svg>
          <span>Lead<span>Reap</span></span>
        </a>
        <div className="cp-nav-actions">
          <a href="/" className="cp-btn cp-btn-ghost">Log In</a>
          <a href="/" className="cp-btn cp-btn-primary" style={{fontSize:13}}>Try Free &rarr;</a>
        </div>
      </nav>

      <header className="cp-hero">
        <div className="cp-tag-pill fade-in">LEADREAP VS APOLLO.IO</div>
        <h1 className="fade-in fd1">
          Apollo is for enterprise.<br /><em>LeadReap is for local.</em>
        </h1>
        <p className="cp-hero-sub fade-in fd2">
          Selling to Fortune 500s? Use Apollo. Selling marketing, websites, or services to local plumbers, roofers, and dentists? You need live Google Maps data — not a stale LinkedIn database.
        </p>
        <a href="/" className="cp-btn cp-btn-primary cp-btn-lg fade-in fd3">
          Try the Local Alternative &rarr;
        </a>
      </header>

      {/* COMPARISON TABLE */}
      <section className="cp-section">
        <div className="cp-section-label">Feature comparison</div>
        <div className="cp-table">
          <div className="cp-table-head">
            <div className="cp-table-head-cell ours">
              LeadReap <span className="badge">LOCAL LEADS</span>
            </div>
            <div className="cp-table-head-cell theirs">
              Apollo.io <span className="badge">B2B DATABASE</span>
            </div>
          </div>
          {ROWS.map((row, i) => (
            <div className="cp-row" key={i}>
              <div className="cp-cell win">
                <span className="cp-cell-label">{row.label}</span>
                <div className="cp-cell-main">
                  {row.ours.check && <span className="chk">✓</span>}
                  {row.ours.val}
                </div>
                {row.ours.note && <div className="cp-cell-sub">{row.ours.note}</div>}
              </div>
              <div className="cp-cell dim">
                <span className="cp-cell-label">{row.label}</span>
                <div className="cp-cell-main">
                  {row.theirs.x && <span className="xx">✗</span>}
                  {row.theirs.check && <span className="chk" style={{color:"var(--muted)"}}>✓</span>}
                  {row.theirs.val}
                </div>
                {row.theirs.note && <div className="cp-cell-sub">{row.theirs.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICE */}
      <section className="cp-section" style={{maxWidth:680}}>
        <div className="cp-section-label">Annual cost</div>
        <div className="cp-price-grid">
          <div className="cp-price-card ours">
            <div className="cp-price-name">LeadReap Pro</div>
            <div className="cp-price-amount">$97</div>
            <div className="cp-price-note">One-time &mdash; forever</div>
            <div className="cp-price-detail">
              Unlimited leads, all niches, CSV export, email sequences, enrichment data. No recurring fees ever.
            </div>
          </div>
          <div className="cp-price-card theirs">
            <div className="cp-price-name">Apollo.io Basic</div>
            <div className="cp-price-amount">$1,188</div>
            <div className="cp-price-note">Per year &mdash; recurring</div>
            <div className="cp-price-detail">
              $99/mo billed annually. Limited export credits. Overage charges. Cancel and you lose access.
            </div>
          </div>
        </div>
      </section>

      {/* DEEP DIVE */}
      <section className="cp-section" style={{maxWidth:680}}>
        <div className="cp-section-label">Why it matters</div>

        <div className="cp-card">
          <span className="cp-card-num">01</span>
          <h3>Live scraping vs. stale databases</h3>
          <p>
            Apollo relies on a massive database that gets updated periodically. If a new roofing company opens today, they won't appear for months. LeadReap searches Google Maps <strong>in real-time</strong> — if a business exists on the map right now, you get their contact info in 30 seconds.
          </p>
        </div>

        <div className="cp-card">
          <span className="cp-card-num">02</span>
          <h3>Local buying signals, not enterprise metrics</h3>
          <p>
            Enterprise sales reps care about funding rounds and headcount. Local agencies care about <strong>unclaimed Google listings</strong>, <strong>missing websites</strong>, and <strong>outdated tech stacks</strong>. LeadReap flags these signals automatically so you can craft the perfect pitch.
          </p>
        </div>

        <div className="cp-card">
          <span className="cp-card-num">03</span>
          <h3>Stop renting your leads</h3>
          <p>
            Apollo charges $1,188+ a year just to export a few thousand rows. LeadReap offers <strong>lifetime access for a one-time fee</strong>. Pay once, search unlimited niches, and export unlimited CSVs forever. No credits. No overage charges.
          </p>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="cp-bottom">
        <h2>See the difference yourself.</h2>
        <p>
          Search your niche and city right now. We'll find verified local leads that aren't in Apollo's database.
        </p>
        <a href="/" className="cp-btn cp-btn-primary cp-btn-lg">
          Search Live Data Now &rarr;
        </a>
        <div style={{marginTop:14,fontSize:12,color:"var(--muted)",fontFamily:"IBM Plex Mono, monospace"}}>
          No credit card required &middot; 5 leads free
        </div>
      </section>

      <footer className="cp-footer">
        <div className="cp-footer-l">&copy; 2026 LeadReap</div>
        <div className="cp-footer-r">
          <a href="/">Home</a>
          <a href="/">Privacy</a>
          <a href="/">Terms</a>
        </div>
      </footer>
    </div>
  );
}
