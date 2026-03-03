import { useState, useEffect, useRef } from "react";

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

  body {
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif; min-height: 100vh;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E");
  }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* NAV */
  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 40px; border-bottom: 1px solid var(--border);
    background: rgba(10,10,11,0.85); backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    position: sticky; top: 0; z-index: 100;
  }
  .logo {
    display: flex; align-items: center; gap: 10px;
    font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
  }
  .logo-mark {
    width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
  }
  .logo span { color: var(--accent); }
  .nav-actions { display: flex; align-items: center; gap: 12px; }
  .badge {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px; background: rgba(240,180,41,0.12);
    color: var(--accent); border: 1px solid rgba(240,180,41,0.3);
    padding: 4px 10px; border-radius: 4px; letter-spacing: 0.05em;
  }

  /* BTNs */
  .btn {
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 14px;
    padding: 10px 22px; border-radius: 8px; cursor: pointer;
    border: none; transition: all 0.2s ease; display: inline-flex;
    align-items: center; gap: 8px;
  }
  .btn-primary { background: var(--accent); color: #000; }
  .btn-primary:hover { background: #f5c842; transform: translateY(-1px); box-shadow: 0 4px 24px rgba(240,180,41,0.25); }
  .btn-primary:disabled { background: #333; color: #666; transform: none; box-shadow: none; cursor: not-allowed; }
  .btn-outline { background: transparent; color: var(--text); border: 1px solid var(--border); }
  .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
  .btn-ghost { background: transparent; color: var(--muted); border: none; }
  .btn-ghost:hover { color: var(--text); }
  .btn-sm { padding: 7px 14px; font-size: 13px; }
  .btn-green { background: var(--green); color: #000; }
  .btn-green:hover { background: #16a34a; }

  /* HERO */
  .hero {
    padding: 48px 40px 0; text-align: center;
    position: relative; overflow: hidden;
  }
  .hero::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(240,180,41,0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-tag {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    color: var(--accent); border: 1px solid rgba(240,180,41,0.2);
    padding: 6px 16px; border-radius: 20px; margin-bottom: 20px;
    letter-spacing: 0.08em; background: rgba(240,180,41,0.04);
  }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{ opacity:1; transform: scale(1); } 50%{ opacity:0.4; transform: scale(0.8); } }
  .hero h1 {
    font-size: clamp(30px, 4vw, 48px); font-weight: 800; line-height: 1.1;
    letter-spacing: -1.5px; margin-bottom: 14px;
    max-width: 700px; margin-left: auto; margin-right: auto;
  }
  .hero h1 em { font-style: normal; color: var(--accent); }
  .hero p {
    font-size: 15px; color: var(--muted); max-width: 500px;
    margin: 0 auto; line-height: 1.6; font-weight: 400;
  }
  .hero-stats {
    display: flex; gap: 32px; justify-content: center;
    margin-top: 28px; padding-top: 24px;
    border-top: 1px solid var(--border); padding-bottom: 32px;
  }
  .stat { text-align: center; }
  .stat-num { font-size: 22px; font-weight: 800; color: var(--accent); letter-spacing: -1px; }
  .stat-label { font-size: 12px; color: var(--muted); margin-top: 2px; }

  /* MAIN TOOL */
  .tool-section { padding: 0 40px 80px; max-width: 1100px; margin: 0 auto; width: 100%; }
  .search-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 32px; margin-bottom: 28px;
    position: relative; overflow: hidden;
  }
  .search-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent2), transparent);
  }
  .search-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    color: var(--muted); letter-spacing: 0.1em; margin-bottom: 20px;
    text-transform: uppercase;
  }
  .search-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: end; }
  .field { display: flex; flex-direction: column; gap: 8px; }
  .field label { font-size: 13px; color: var(--muted); font-weight: 500; }
  .field input, .field select {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 10px; padding: 12px 16px;
    font-family: 'IBM Plex Mono', monospace; font-size: 14px;
    color: var(--text); outline: none; transition: border-color 0.2s; width: 100%;
  }
  .field input:focus, .field select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(240,180,41,0.08); }
  .field input::placeholder { color: var(--muted); }
  .options-row { display: flex; gap: 16px; margin-top: 16px; align-items: center; flex-wrap: wrap; }
  .toggle-chip {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 14px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--surface2);
    cursor: pointer; font-size: 13px; color: var(--muted);
    transition: all 0.2s; user-select: none;
  }
  .toggle-chip.active { border-color: var(--accent); color: var(--accent); background: rgba(240,180,41,0.06); }
  .toggle-chip input { display: none; }
  .check { width: 14px; height: 14px; border-radius: 3px; border: 1px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 10px; }

  /* RESULTS */
  .results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .results-meta { display: flex; align-items: center; gap: 12px; }
  .count-tag {
    font-family: 'IBM Plex Mono', monospace; font-size: 12px;
    background: rgba(34,197,94,0.1); color: var(--green);
    border: 1px solid rgba(34,197,94,0.2); padding: 4px 12px; border-radius: 4px;
  }
  .table-wrap { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  thead { background: var(--surface2); }
  th {
    font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--muted); padding: 14px 16px;
    text-align: left; font-weight: 500; border-bottom: 1px solid var(--border);
  }
  td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr { transition: background 0.15s; }
  tr:hover td { background: rgba(240,180,41,0.02); }
  .name-cell { font-weight: 600; color: var(--text); }
  .email-cell { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--accent); }
  .phone-cell { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); }
  .site-cell { color: #60a5fa; font-size: 12px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .site-cell a { color: #60a5fa; text-decoration: none; }
  .site-cell a:hover { text-decoration: underline; }
  .rating-cell { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--muted); }
  .star { color: var(--accent); }
  .score-pill { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-family: 'IBM Plex Mono', monospace; font-weight: 600; }
  .score-high { background: rgba(34,197,94,0.12); color: var(--green); }
  .score-med { background: rgba(240,180,41,0.12); color: var(--accent); }
  .score-low { background: rgba(239,68,68,0.08); color: #f87171; }

  /* LOADING */
  .loading-state { text-align: center; padding: 60px 20px; }
  .loading-orb {
    width: 64px; height: 64px; margin: 0 auto 28px; border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, var(--accent), var(--accent2));
    animation: orbPulse 2s ease-in-out infinite; position: relative;
    box-shadow: 0 0 40px rgba(240,180,41,0.15), 0 0 80px rgba(240,180,41,0.05);
  }
  .loading-orb::after {
    content: ''; position: absolute; inset: -4px; border-radius: 50%;
    border: 1px solid rgba(240,180,41,0.2); animation: orbRing 3s linear infinite;
  }
  @keyframes orbPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(240,180,41,0.15); }
    50% { transform: scale(1.08); box-shadow: 0 0 60px rgba(240,180,41,0.25); }
  }
  @keyframes orbRing { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .loading-title { font-size: 18px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.5px; }
  .loading-sub { font-size: 13px; color: var(--muted); margin-bottom: 32px; font-family: 'IBM Plex Mono', monospace; }
  .progress-track { width: 280px; height: 3px; background: var(--border); border-radius: 4px; margin: 0 auto 32px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 1s ease; }
  .loading-steps { display: flex; flex-direction: column; gap: 6px; align-items: center; margin-bottom: 32px; }
  .loading-step {
    font-family: 'IBM Plex Mono', monospace; font-size: 12px;
    color: var(--muted); display: flex; align-items: center; gap: 8px; transition: all 0.3s ease;
  }
  .loading-step.done { color: var(--green); }
  .loading-step.active { color: var(--accent); }
  .loading-tip {
    max-width: 380px; margin: 0 auto; padding: 16px 20px; border-radius: 10px;
    background: rgba(240,180,41,0.04); border: 1px solid rgba(240,180,41,0.1);
    font-size: 13px; color: var(--muted); line-height: 1.5; animation: tipFade 0.4s ease;
  }
  .loading-tip strong { color: var(--accent); font-weight: 600; }
  @keyframes tipFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

  /* EMPTY */
  .empty-state { text-align: center; padding: 80px 20px; }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.8; }
  .empty-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .empty-sub { color: var(--muted); font-size: 14px; line-height: 1.6; }

  /* PRICING MODAL */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; padding: 20px; animation: fadeIn 0.15s ease;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .modal {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 48px; max-width: 900px; width: 100%;
    position: relative; animation: slideUp 0.25s ease;
  }
  @keyframes slideUp { from { transform: translateY(20px); opacity:0; } to { transform:none; opacity:1; } }
  .modal-close {
    position: absolute; top: 20px; right: 20px;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--muted); width: 32px; height: 32px; border-radius: 8px;
    cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.15s;
  }
  .modal-close:hover { color: var(--text); border-color: var(--text); }
  .modal h2 { font-size: 32px; font-weight: 800; margin-bottom: 8px; letter-spacing: -1px; }
  .modal > p { color: var(--muted); margin-bottom: 40px; }
  .pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .plan-card {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 14px; padding: 28px; position: relative; transition: all 0.2s;
  }
  .plan-card:hover { border-color: var(--muted); transform: translateY(-2px); }
  .plan-card.featured { border-color: var(--accent); background: rgba(240,180,41,0.04); }
  .plan-badge {
    position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
    background: var(--accent); color: #000; font-size: 11px; font-weight: 700;
    padding: 3px 12px; border-radius: 20px; letter-spacing: 0.05em; white-space: nowrap;
  }
  .plan-name { font-size: 14px; color: var(--muted); margin-bottom: 8px; font-weight: 600; }
  .plan-price { font-size: 40px; font-weight: 800; letter-spacing: -2px; margin-bottom: 4px; }
  .plan-price sup { font-size: 20px; vertical-align: top; margin-top: 10px; display: inline-block; }
  .plan-note { font-size: 12px; color: var(--muted); margin-bottom: 24px; }
  .plan-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .plan-feature { display: flex; align-items: center; gap: 10px; font-size: 14px; }
  .plan-feature .check-icon { color: var(--green); font-size: 16px; }

  /* TOAST */
  .toast {
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
    background: var(--green); color: #000; font-weight: 700; font-size: 14px;
    padding: 14px 28px; border-radius: 10px;
    animation: slideUp 0.2s ease, fadeOut 0.3s ease 2.5s forwards;
    z-index: 300; display: flex; align-items: center; gap: 8px;
    box-shadow: 0 8px 32px rgba(34,197,94,0.3);
  }
  @keyframes fadeOut { to { opacity: 0; transform: translateX(-50%) translateY(10px); } }

  /* LOCK OVERLAY */
  .lock-overlay { position: relative; overflow: hidden; }
  .lock-overlay::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 20%, var(--bg) 100%); pointer-events: none;
  }
  .upgrade-bar {
    text-align: center; padding: 24px;
    border: 1px solid var(--border); border-top: none;
    border-radius: 0 0 12px 12px; background: var(--surface);
    display: flex; align-items: center; justify-content: center; gap: 16px;
  }
  .upgrade-bar p { color: var(--muted); font-size: 14px; }

  /* FOOTER */
  .footer {
    margin-top: auto; padding: 24px 40px; border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .footer-left { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); }
  .footer-right { display: flex; gap: 20px; }
  .footer-link { font-size: 13px; color: var(--muted); cursor: pointer; transition: color 0.15s; }
  .footer-link:hover { color: var(--text); }

  /* DEMO PREVIEW */
  .demo-section { position: relative; }
  .demo-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .demo-label { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }
  .demo-wrap { position: relative; overflow: hidden; border-radius: 12px; }
  .demo-wrap::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 10%, var(--bg) 85%);
    pointer-events: none; z-index: 2;
  }
  .demo-cta { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); z-index: 3; text-align: center; }
  .demo-cta p { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
  .demo-cta .sub { font-size: 12px; color: var(--muted); margin-top: 8px; font-family: 'IBM Plex Mono', monospace; }

  /* MOBILE */
  @media (max-width: 768px) {
    .nav { padding: 12px 16px; gap: 8px; }
    .nav-actions { gap: 8px; }
    .nav-actions .btn-sm { padding: 6px 12px; font-size: 12px; }
    .nav-email { display: none; }
    .nav-beta { display: none; }
    .nav-cta { display: none; }
    .badge { padding: 3px 8px; font-size: 10px; }
    .hero { padding: 32px 20px 24px; }
    .hero-tag { display: none; }
    .hero h1 { font-size: 26px; letter-spacing: -0.8px; margin-bottom: 10px; line-height: 1.2; }
    .hero h1 br { display: none; }
    .hero-desktop { display: none; }
    .hero-mobile { display: block; }
    .hero p { font-size: 13px; margin-bottom: 0; line-height: 1.5; max-width: 100%; }
    .hero-stats { display: none; }
    .hero::before { display: none; }
    .tool-section { padding: 0 16px 48px; }
    .search-card { padding: 20px 16px; border-radius: 12px; margin-bottom: 16px; }
    .search-label { font-size: 10px; margin-bottom: 14px; }
    .search-row { grid-template-columns: 1fr; gap: 10px; }
    .field input, .field select { padding: 13px 14px; font-size: 14px; border-radius: 10px; }
    .btn-primary { width: 100%; justify-content: center; height: 48px !important; font-size: 15px; }
    .options-row { gap: 8px; margin-top: 12px; }
    .toggle-chip { padding: 6px 10px; font-size: 12px; }
    .options-hint { display: none; }
    .results-header { flex-direction: column; gap: 12px; align-items: flex-start; }
    .results-meta { flex-wrap: wrap; gap: 8px; }
    .results-actions { width: 100%; display: flex; gap: 8px; }
    .results-actions .btn { flex: 1; justify-content: center; font-size: 12px; padding: 8px 12px; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { min-width: 700px; }
    th { padding: 10px 12px; font-size: 10px; }
    td { padding: 10px 12px; font-size: 12px; }
    .name-cell { font-size: 13px; }
    .upsell-banner { flex-direction: column !important; gap: 12px !important; text-align: center; padding: 14px 16px !important; }
    .upsell-banner .btn { width: 100%; justify-content: center; }
    .upgrade-bar { flex-direction: column; gap: 12px; padding: 18px 16px; }
    .upgrade-bar .btn { width: 100%; justify-content: center; }
    .loading-title { font-size: 16px; }
    .loading-sub { font-size: 12px; }
    .loading-tip { font-size: 12px; padding: 12px 16px; max-width: 100%; }
    .modal-overlay { padding: 12px; align-items: flex-start; overflow-y: auto; }
    .modal { padding: 24px 18px; border-radius: 14px; margin-top: 40px; }
    .modal h2 { font-size: 22px; }
    .modal > p { font-size: 13px; margin-bottom: 24px; }
    .pricing-grid { grid-template-columns: 1fr; gap: 12px; }
    .plan-card { padding: 20px; }
    .plan-price { font-size: 32px; }
    .plan-feature { font-size: 13px; }
    .empty-state { padding: 48px 16px; }
    .empty-title { font-size: 17px; }
    .empty-sub { font-size: 13px; }
    .demo-header { flex-direction: column; gap: 6px; align-items: flex-start; }
    .demo-cta p { font-size: 14px; }
    .demo-cta .btn { font-size: 14px; }
    .footer { flex-direction: column; gap: 10px; padding: 20px 16px; text-align: center; }
  }
  .hero-mobile { display: none; }
  @media (max-width: 380px) {
    .hero h1 { font-size: 23px; }
    .logo { font-size: 17px; }
    .logo-mark { width: 28px; height: 28px; }
    .logo-mark svg { width: 28px; height: 28px; }
  }
`;

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="34" height="34" rx="8" fill="#f0b429"/>
      <circle cx="17" cy="17" r="10" stroke="#0a0a0b" strokeWidth="2.5" fill="none"/>
      <circle cx="17" cy="17" r="5" stroke="#0a0a0b" strokeWidth="2" fill="none"/>
      <circle cx="17" cy="17" r="1.5" fill="#0a0a0b"/>
      <line x1="17" y1="2" x2="17" y2="7" stroke="#0a0a0b" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

const INDUSTRIES = [
  "Dentist", "Chiropractor", "Real Estate Agent", "Plumber", "Electrician",
  "Restaurant", "Hair Salon", "Auto Repair Shop", "Law Firm", "Gym / Fitness Studio",
  "Roofing Contractor", "HVAC Company", "Wedding Photographer", "Accountant / CPA",
  "Landscaping Company", "Personal Trainer", "Marketing Agency", "Insurance Agent"
];

const DEMO_LEADS = [
  { name: "Bright Smile Dental", address: "1420 Main St, Austin, TX", email: "info@brightsmile.com", phone: "(512) 555-0142", website: "brightsmile.com", rating: 4.9, score: 94, unclaimed: false, linkedinCompany: "https://linkedin.com/company/brightsmile", facebook: "https://facebook.com/brightsmile", instagram: "https://instagram.com/brightsmile", twitter: null, linkedinPerson: null, notes: "Running Facebook Pixel — active ad spend, good agency target." },
  { name: "Hill Country Family Dentistry", address: "8801 Research Blvd, Austin, TX", email: "hello@hillcountrydental.com", phone: "(512) 555-0287", website: "hillcountrydental.com", rating: 4.8, score: 87, unclaimed: false, linkedinCompany: null, facebook: "https://facebook.com/hillcountrydental", instagram: null, twitter: null, linkedinPerson: null, notes: "High-authority listing — established reputation, ideal outreach target." },
  { name: "Austin Dental Works", address: "3500 S Lamar Blvd, Austin, TX", email: "contact@atxdental.com", phone: "(512) 555-0391", website: "atxdental.com", rating: 4.7, score: 82, unclaimed: false, linkedinCompany: null, facebook: null, instagram: "https://instagram.com/atxdental", twitter: null, linkedinPerson: "https://linkedin.com/in/drsmith", ownerName: "Dr. Smith", notes: "Contact Dr. Smith directly — owner identified." },
  { name: "Westlake Smiles", address: "701 Capital of TX Hwy, Austin, TX", email: "team@westlakesmiles.com", phone: "(512) 555-0463", website: "westlakesmiles.com", rating: 4.6, score: 78, unclaimed: true, linkedinCompany: null, facebook: null, instagram: null, twitter: null, linkedinPerson: null, notes: "Unclaimed Google listing — owner hasn't claimed it, prime opportunity to pitch GMB management." },
  { name: "Lakeway Dental Care", address: "2300 Lohmans Crossing, Austin, TX", email: "\u2014", phone: "(512) 555-0518", website: "lakewaydental.com", rating: 4.5, score: 65, unclaimed: false, linkedinCompany: null, facebook: null, instagram: null, twitter: null, linkedinPerson: null, notes: "Has website but no social media links — pitch social media management." },
];

function scoreToClass(score) {
  if (score >= 80) return "score-high";
  if (score >= 60) return "score-med";
  return "score-low";
}

function generateCSV(leads) {
  const headers = ["Business Name", "Email", "Phone", "Website", "Address", "Rating", "Unclaimed", "LinkedIn", "Facebook", "Instagram", "Twitter", "Lead Score", "Insight"];
  const rows = leads.map(l => [
    `"${l.name}"`, l.email || "", l.phone || "", l.website || "", `"${l.address || ""}"`,
    l.rating || "", l.unclaimed ? "Yes" : "No",
    l.linkedinCompany || l.linkedinPerson || "", l.facebook || "", l.instagram || "", l.twitter || "",
    l.score, `"${(l.notes || "").replace(/"/g, '""')}"`
  ]);
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

const LOADING_STEPS = [
  "Scanning Google Maps...",
  "Collecting business details...",
  "Extracting emails & social profiles...",
  "Running AI lead scoring...",
];

const LOADING_TIPS = [
  { text: "Leads with a 4.5+ star rating tend to convert 3x better for outreach.", label: "Insight" },
  { text: "Export your results to CSV for easy import into any CRM platform.", label: "Pro tip" },
  { text: "Businesses without websites are prime targets for web design services.", label: "Sales angle" },
  { text: "The Lead Score factors in rating, email quality, tech stack, and listing status.", label: "How it works" },
  { text: "Leads running Facebook Pixel are already spending on ads \u2014 warm prospects.", label: "Insight" },
  { text: "Try narrowing your location to a zip code for more targeted results.", label: "Pro tip" },
  { text: "Unclaimed Google listings are gold \u2014 the owner needs help managing their online presence.", label: "Sales angle" },
  { text: "Businesses on Wix or Squarespace are often open to a website redesign.", label: "Insight" },
];

export default function LeadReap({ apiBase = "", token, user, onLoginClick, onLogout, onCheckout, onRefreshAuth }) {
  const API_BASE = apiBase;
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [includeEmail, setIncludeEmail] = useState(true);
  const [includePhone, setIncludePhone] = useState(true);
  const [includeSocial, setIncludeSocial] = useState(false);
  const [leads, setLeads] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [showPricing, setShowPricing] = useState(false);
  const [toast, setToast] = useState(false);
  const isPro = user && user.plan !== "free";
  const [searchDone, setSearchDone] = useState(false);
  const [batchNum, setBatchNum] = useState(1);
  const [searchError, setSearchError] = useState("");
  const [currentTip, setCurrentTip] = useState(0);
  const [pollAttempts, setPollAttempts] = useState(0);
  const stepRef = useRef(null);
  const pollRef = useRef(null);
  const tipRef = useRef(null);

  const targetNiche = niche === "custom" ? customNiche : niche;

  useEffect(() => {
    if (loading) {
      setCurrentTip(Math.floor(Math.random() * LOADING_TIPS.length));
      tipRef.current = setInterval(() => {
        setCurrentTip(prev => (prev + 1) % LOADING_TIPS.length);
      }, 5000);
    } else {
      clearInterval(tipRef.current);
    }
    return () => clearInterval(tipRef.current);
  }, [loading]);

  async function pollJob(jobId) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const MAX_ATTEMPTS = 300;

      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch(`${API_BASE}/api/leads/job/${jobId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const job = await res.json();
          // Advance steps to match scrape duration
          // 20 results: ~20-30s, 40 results: ~35-50s
          let nextStep;
          const t = isPro ? [6, 16, 28] : [4, 10, 18];
          if (attempts < t[0]) nextStep = 0;
          else if (attempts < t[1]) nextStep = 1;
          else if (attempts < t[2]) nextStep = 2;
          else nextStep = 3;
          setLoadStep(nextStep);
          setPollAttempts(attempts);

          if (job.status === "done") {
            clearInterval(pollRef.current);
            setLoadStep(LOADING_STEPS.length);
            resolve(job);
          } else if (job.status === "error") {
            clearInterval(pollRef.current);
            reject(new Error(job.error || "Search failed"));
          } else if (attempts >= MAX_ATTEMPTS) {
            clearInterval(pollRef.current);
            reject(new Error("Search timed out \u2014 try a more specific location"));
          }
        } catch (e) {
          clearInterval(pollRef.current);
          reject(e);
        }
      }, 1000);
    });
  }

  async function handleSearch() {
    if (!targetNiche || !location) return;
    setLoading(true);
    setLeads([]);
    setTotalLeads(0);
    setSearchDone(false);
    setSearchError("");
    setLoadStep(0);
    setPollAttempts(0);
    setBatchNum(1);
    clearInterval(pollRef.current);

    try {
      const res = await fetch(`${API_BASE}/api/leads/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ niche: targetNiche, location, limit: isPro ? 40 : 20, scrapeEmails: includeEmail })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.code === "RATE_LIMIT" || errData.code === "IP_RATE_LIMIT") {
          throw new Error(errData.error || "Search limit reached \u2014 upgrade for unlimited searches");
        }
        throw new Error(`Something went wrong (${res.status}). Please try again.`);
      }
      const { jobId } = await res.json();
      const job = await pollJob(jobId);
      setLeads(job.leads || []);
      setTotalLeads(job.total || job.leads?.length || 0);
      setSearchDone(true);
    } catch (e) {
      console.error(e);
      setSearchDone(true);
      setSearchError(e.message || "Search failed \u2014 please try again");
    }
    setLoading(false);
  }

  async function handleLoadMore() {
    if (!isPro) { setShowPricing(true); return; }
    setLoadingMore(true);
    setSearchError("");
    try {
      const currentOffset = leads.length;
      const res = await fetch(`${API_BASE}/api/leads/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ niche: targetNiche, location, limit: 20, offset: currentOffset, scrapeEmails: includeEmail, forceRefresh: true })
      });
      const { jobId } = await res.json();

      const moreLeads = await new Promise((resolve, reject) => {
        let attempts = 0;
        const iv = setInterval(async () => {
          attempts++;
          try {
            const r = await fetch(`${API_BASE}/api/leads/job/${jobId}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const job = await r.json();
            if (job.status === "done") { clearInterval(iv); resolve(job.leads || []); }
            else if (job.status === "error" || attempts > 300) { clearInterval(iv); reject(new Error(job.error || "Timed out")); }
          } catch (e) { clearInterval(iv); reject(e); }
        }, 1000);
      });

      const existingNames = new Set(leads.map(l => l.name));
      const fresh = moreLeads.filter(l => !existingNames.has(l.name));
      setLeads(prev => [...prev, ...fresh]);
      setTotalLeads(prev => prev + fresh.length);
      setBatchNum(b => b + 1);
    } catch (e) {
      console.error(e);
      setSearchError("Failed to load more results \u2014 try again");
    }
    setLoadingMore(false);
  }

  function handleExport() {
    if (!isPro) { setShowPricing(true); return; }
    const csv = generateCSV(leads);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leadreap-${targetNiche}-${location}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  }

  function handleUnlock(plan = "pro") {
    if (!user) { onLoginClick?.(); return; }
    onCheckout?.(plan);
  }

  const visibleLeads = isPro ? leads : leads.slice(0, 5);
  // Easing curve: fast early, slows near end — adapts to 20 vs 40 result searches
  const decayRate = isPro ? 14 : 10;
  const progressPercent = loading ? Math.min(95, 95 * (1 - Math.exp(-pollAttempts / decayRate))) : (searchDone ? 100 : 0);
  const displayTotal = totalLeads > leads.length ? totalLeads : leads.length;

  return (
    <>
      <style>{STYLE}</style>
      <div className="app">
        <nav className="nav">
          <div className="logo">
            <div className="logo-mark"><LogoMark /></div>
            Lead<span>Reap</span>
          </div>
          <div className="nav-actions">
            <span className="badge mono nav-beta">BETA</span>
            {user ? (
              <>
                <span className="badge mono" style={{ background: isPro ? "rgba(34,197,94,0.12)" : undefined, color: isPro ? "#22c55e" : undefined, borderColor: isPro ? "rgba(34,197,94,0.3)" : undefined }}>
                  {user.plan.toUpperCase()}
                </span>
                <span className="nav-email" style={{ fontSize: 13, color: "var(--muted)", fontFamily: "IBM Plex Mono, monospace" }}>{user.email}</span>
                <button className="btn btn-ghost btn-sm" onClick={onLogout}>Log out</button>
              </>
            ) : (
              <>
                <button className="btn btn-outline btn-sm" onClick={onLoginClick}>Log In</button>
                <button className="btn btn-primary btn-sm nav-cta" onClick={() => setShowPricing(true)}>Get Full Access &rarr;</button>
              </>
            )}
          </div>
        </nav>

        <div className="hero">
          <div className="hero-tag"><div className="dot" /> AI-POWERED LEAD INTELLIGENCE</div>
          <h1 className="hero-desktop">Find <em>any</em> local business lead<br />in under 30 seconds</h1>
          <h1 className="hero-mobile">Find <em>verified</em> local leads in seconds</h1>
          <p>Pull verified contact data from any local business niche. Search unlimited leads by location &mdash; filter, score, and export to CSV in seconds.</p>
          <div className="hero-stats">
            <div className="stat"><div className="stat-num">2.1M+</div><div className="stat-label">Businesses indexed</div></div>
            <div className="stat"><div className="stat-num">47</div><div className="stat-label">Supported niches</div></div>
            <div className="stat"><div className="stat-num">94%</div><div className="stat-label">Email accuracy</div></div>
            <div className="stat"><div className="stat-num">30s</div><div className="stat-label">Avg search time</div></div>
          </div>
        </div>

        <div className="tool-section">
          <div className="search-card">
            <div className="search-label">&#9889; Lead Search Engine</div>
            <div className="search-row">
              <div className="field">
                <label>Business Niche</label>
                <select value={niche} onChange={e => setNiche(e.target.value)}>
                  <option value="">Select a niche...</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  <option value="custom">+ Custom niche</option>
                </select>
              </div>
              {niche === "custom" && (
                <div className="field">
                  <label>Custom Niche</label>
                  <input value={customNiche} onChange={e => setCustomNiche(e.target.value)} placeholder="e.g. Yoga Studio" />
                </div>
              )}
              <div className="field">
                <label>Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, State &mdash; e.g. Austin, TX" />
              </div>
              <button className="btn btn-primary" onClick={handleSearch} disabled={loading || !targetNiche || !location} style={{ height: 46 }}>
                {loading ? "Searching..." : "Find Leads"}
              </button>
            </div>
            <div className="options-row">
              {[
                { key: "email", label: "Emails", val: includeEmail, set: setIncludeEmail },
                { key: "phone", label: "Phone Numbers", val: includePhone, set: setIncludePhone },
                { key: "social", label: "Social Profiles", val: includeSocial, set: setIncludeSocial },
              ].map(opt => (
                <label key={opt.key} className={`toggle-chip ${opt.val ? "active" : ""}`} onClick={() => opt.set(!opt.val)}>
                  <span className="check">{opt.val ? "\u2713" : ""}</span>
                  {opt.label}
                </label>
              ))}
              <span className="options-hint" style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)", fontFamily: "IBM Plex Mono" }}>
                FREE: 5 leads preview &middot; PRO: 40 leads + exports
              </span>
            </div>
          </div>

          {loading && (
            <div className="search-card">
              <div className="loading-state">
                <div className="loading-orb" />
                <div className="loading-title">
                  Finding <span style={{ color: "var(--accent)" }}>{targetNiche}</span> leads in <span style={{ color: "var(--accent)" }}>{location}</span>
                </div>
                <div className="loading-sub">This typically takes {isPro ? "25\u201345" : "15\u201330"} seconds</div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="loading-steps">
                  {LOADING_STEPS.map((s, i) => (
                    <div key={i} className={`loading-step ${i < loadStep ? "done" : i === loadStep ? "active" : ""}`}>
                      <span>{i < loadStep ? "\u2713" : i === loadStep ? "\u203A" : "\u00B7"}</span> {s}
                    </div>
                  ))}
                </div>
                <div className="loading-tip" key={currentTip}>
                  <strong>{LOADING_TIPS[currentTip].label}:</strong> {LOADING_TIPS[currentTip].text}
                </div>
              </div>
            </div>
          )}

          {!loading && searchDone && !searchError && leads.length > 0 && !isPro && (
            <div className="upsell-banner" style={{
              display: "flex", gap: 16, marginBottom: 20,
              padding: "14px 20px", borderRadius: 10,
              background: "rgba(240,180,41,0.04)", border: "1px solid rgba(240,180,41,0.12)",
              alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                Showing <strong style={{ color: "var(--text)" }}>{visibleLeads.length} of {displayTotal}</strong> leads &mdash; upgrade to unlock all results, CSV export, and unlimited searches.
              </span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowPricing(true)}>Unlock Full Access &rarr;</button>
            </div>
          )}

          {!loading && searchDone && searchError && (
            <div className="search-card" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
              <div className="empty-state" style={{ padding: "40px 20px" }}>
                <div className="empty-icon">&#9888;&#65039;</div>
                <div className="empty-title" style={{ color: "#f87171" }}>{searchError}</div>
                <div className="empty-sub">
                  {searchError.includes("limit") || searchError.includes("Rate")
                    ? <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowPricing(true)}>Upgrade for Unlimited Searches &rarr;</button>
                    : <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={handleSearch}>Try Again</button>
                  }
                </div>
              </div>
            </div>
          )}

          {!loading && searchDone && !searchError && leads.length > 0 && (
            <>
              <div className="results-header">
                <div className="results-meta">
                  <span style={{fontWeight:700, fontSize:15}}>Results</span>
                  <span className="count-tag">{"\u2713"} {displayTotal} leads found</span>
                  <span style={{fontSize:13, color:"var(--muted)", fontFamily:"IBM Plex Mono"}}>{targetNiche} &middot; {location}</span>
                </div>
                <div className="results-actions" style={{display:"flex",gap:10}}>
                  <button className="btn btn-outline btn-sm" onClick={handleSearch}>{"\u21BB"} Refresh</button>
                  <button className="btn btn-green btn-sm" onClick={handleExport}>
                    {"\u2B07"} Export CSV {!isPro && "\uD83D\uDD12"}
                  </button>
                </div>
              </div>

              <div className={!isPro ? "lock-overlay" : ""}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Business Name</th>
                        {includeEmail && <th>Email</th>}
                        {includePhone && <th>Phone</th>}
                        <th>Website</th>
                        <th>Rating</th>
                        <th>Lead Score</th>
                        <th>Insight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLeads.map((lead, i) => (
                        <tr key={i}>
                          <td style={{color:"var(--muted)",fontSize:12,fontFamily:"IBM Plex Mono"}}>{String(i+1).padStart(2,"0")}</td>
                          <td>
                            <div className="name-cell">{lead.name}</div>
                            <div style={{fontSize:11,color:"var(--muted)",marginTop:2,fontFamily:"IBM Plex Mono"}}>{lead.address}</div>
                            {includeSocial && (lead.linkedinCompany || lead.linkedinPerson || lead.facebook || lead.instagram || lead.twitter) && (
                              <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
                                {lead.linkedinCompany && <a href={lead.linkedinCompany} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#0a66c2",textDecoration:"none"}}>LinkedIn</a>}
                                {lead.linkedinPerson && <a href={lead.linkedinPerson} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#0a66c2",textDecoration:"none"}}>{lead.ownerName ? `in/${lead.ownerName}` : "LinkedIn Owner"}</a>}
                                {lead.facebook && <a href={lead.facebook} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#1877f2",textDecoration:"none"}}>Facebook</a>}
                                {lead.instagram && <a href={lead.instagram} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#e1306c",textDecoration:"none"}}>Instagram</a>}
                                {lead.twitter && <a href={lead.twitter} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#1da1f2",textDecoration:"none"}}>X/Twitter</a>}
                              </div>
                            )}
                          </td>
                          {includeEmail && <td className="email-cell">{lead.email || "\u2014"}</td>}
                          {includePhone && <td className="phone-cell">{lead.phoneDisplay || lead.phone || "\u2014"}</td>}
                          <td className="site-cell">
                            {lead.website ? <a href={lead.website} target="_blank" rel="noopener noreferrer">{lead.website.replace(/^https?:\/\/(www\.)?/, "")}</a> : "\u2014"}
                          </td>
                          <td>
                            <div className="rating-cell">
                              <span className="star">{"\u2605"}</span> {lead.rating || "\u2014"}
                              {lead.unclaimed && (
                                <span style={{marginLeft:6,fontSize:10,padding:"1px 6px",borderRadius:4,background:"#f59e0b22",color:"#f59e0b",fontWeight:600,whiteSpace:"nowrap"}}>UNCLAIMED</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`score-pill ${scoreToClass(lead.score)}`}>{lead.score}/100</span>
                          </td>
                          <td style={{maxWidth:200,fontSize:12,color:"var(--muted)"}}>{lead.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!isPro ? (
                <div className="upgrade-bar">
                  <p>{"\uD83D\uDD12"} Showing <strong style={{color:"var(--text)"}}>{visibleLeads.length} of {displayTotal}</strong> leads &mdash; unlock all results + CSV export</p>
                  <button className="btn btn-primary" onClick={() => setShowPricing(true)}>Unlock Full Access &rarr;</button>
                </div>
              ) : (
                <div className="upgrade-bar">
                  <p style={{color:"var(--muted)"}}>Showing <strong style={{color:"var(--text)"}}>{leads.length} leads</strong> &middot; Batch {batchNum}</p>
                  <button className="btn btn-outline btn-sm" onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? "Loading more..." : "Load More Results"}
                  </button>
                </div>
              )}
            </>
          )}

          {!loading && !searchDone && (
            <div className="demo-section">
              <div className="demo-header">
                <span className="demo-label">Example: &quot;Dentist&quot; in Austin, TX</span>
                <span className="count-tag" style={{opacity:0.5}}>{"\u2713"} 20 leads found</span>
              </div>
              <div className="demo-wrap">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Business Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Website</th>
                        <th>Rating</th>
                        <th>Lead Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_LEADS.map((lead, i) => (
                        <tr key={i} style={{opacity: 1 - (i * 0.08)}}>
                          <td style={{color:"var(--muted)",fontSize:12,fontFamily:"IBM Plex Mono"}}>{String(i+1).padStart(2,"0")}</td>
                          <td>
                            <div className="name-cell">{lead.name}</div>
                            <div style={{fontSize:11,color:"var(--muted)",marginTop:2,fontFamily:"IBM Plex Mono"}}>{lead.address}</div>
                          </td>
                          <td className="email-cell">{lead.email}</td>
                          <td className="phone-cell">{lead.phone}</td>
                          <td className="site-cell">{lead.website}</td>
                          <td>
                            <div className="rating-cell">
                              <span className="star">{"\u2605"}</span> {lead.rating}
                              {lead.unclaimed && (
                                <span style={{marginLeft:6,fontSize:10,padding:"1px 6px",borderRadius:4,background:"#f59e0b22",color:"#f59e0b",fontWeight:600,whiteSpace:"nowrap"}}>UNCLAIMED</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`score-pill ${scoreToClass(lead.score)}`}>{lead.score}/100</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="demo-cta">
                  <p>Try it free &mdash; search any niche, any city</p>
                  <button className="btn btn-primary" onClick={() => document.querySelector('.field select')?.focus()}>
                    Start Your First Search &rarr;
                  </button>
                  <div className="sub">No credit card required &middot; 5 leads free</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="footer">
          <div className="footer-left">&copy; 2026 LeadReap</div>
          <div className="footer-right">
            <span className="footer-link">Privacy</span>
            <span className="footer-link">Terms</span>
            <span className="footer-link" onClick={() => setShowPricing(true)}>Pricing</span>
          </div>
        </footer>
      </div>

      {showPricing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPricing(false)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowPricing(false)}>&times;</button>
            <h2>One-time. No subscription.</h2>
            <p>Pay once, use forever. Every plan includes lifetime access + free updates.</p>
            <div className="pricing-grid">
              {[
                {
                  name: "STARTER", planId: "starter", price: 47, note: "one-time payment",
                  features: ["250 leads/month", "5 niches", "CSV export", "Email + phone data", "Email support"],
                  featured: false
                },
                {
                  name: "PRO", planId: "pro", price: 97, note: "one-time payment",
                  features: ["Unlimited leads", "All 47 niches", "CSV + JSON export", "Email + phone + social", "Lead scoring AI", "Priority support"],
                  featured: true, badge: "MOST POPULAR"
                },
                {
                  name: "AGENCY", planId: "agency", price: 197, note: "one-time payment",
                  features: ["Unlimited leads", "All niches + custom", "Bulk export (1000s)", "API access", "White-label license", "Dedicated support"],
                  featured: false
                }
              ].map((plan, i) => (
                <div key={i} className={`plan-card ${plan.featured ? "featured" : ""}`}>
                  {plan.badge && <div className="plan-badge">{plan.badge}</div>}
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-price"><sup>$</sup>{plan.price}</div>
                  <div className="plan-note">{plan.note}</div>
                  <div className="plan-features">
                    {plan.features.map((f, j) => (
                      <div key={j} className="plan-feature">
                        <span className="check-icon">{"\u2713"}</span> {f}
                      </div>
                    ))}
                  </div>
                  <button
                    className={`btn ${plan.featured ? "btn-primary" : "btn-outline"}`}
                    style={{width:"100%", justifyContent:"center"}}
                    onClick={() => handleUnlock(plan.planId)}
                  >
                    Get {plan.name} Access &rarr;
                  </button>
                </div>
              ))}
            </div>
            <p style={{textAlign:"center", marginTop:28, color:"var(--muted)", fontSize:13}}>
              Secure checkout &middot; 30-day money-back guarantee &middot; Instant access
            </p>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">{"\u2713"} {isPro && !leads ? "Upgraded to PRO!" : isPro ? "CSV downloaded!" : "Welcome to PRO!"}</div>
      )}
    </>
  );
}
