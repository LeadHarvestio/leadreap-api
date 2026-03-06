import React, { useState, useEffect, useRef } from "react";

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
  .audit-badge {
    background: rgba(240,180,41,0.1); border: 1px solid rgba(240,180,41,0.3);
    color: var(--accent); border-radius: 6px; padding: 3px 8px;
    font-size: 10px; font-weight: 700; cursor: pointer; transition: all 0.15s;
    font-family: 'IBM Plex Mono', monospace; letter-spacing: 0.03em;
    text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
  }
  .audit-badge:hover { background: rgba(240,180,41,0.2); }
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
  .tool-section { padding: 0 40px 80px; max-width: 1200px; margin: 0 auto; width: 100%; }
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
  .table-wrap { border: 1px solid var(--border); border-radius: 12px; overflow-x: auto; }
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
  .email-verified { display: block; width: fit-content; font-size: 9px; padding: 1px 6px; border-radius: 3px; background: rgba(34,197,94,0.12); color: #22c55e; font-weight: 600; margin-top: 4px; letter-spacing: 0.02em; font-family: 'IBM Plex Mono', monospace; cursor: help; }
  .email-unverified { display: inline-block; font-size: 9px; padding: 1px 6px; border-radius: 3px; background: rgba(251,191,36,0.12); color: #fbbf24; font-weight: 600; margin-left: 6px; vertical-align: middle; letter-spacing: 0.02em; font-family: 'IBM Plex Mono', monospace; cursor: help; }

  /* Expandable row detail */
  tr.row-expandable { cursor: pointer; }
  tr.row-expandable:hover td { background: rgba(240,180,41,0.03); }
  .expand-row td { padding: 0 !important; border-bottom: 1px solid var(--border); background: var(--surface2); }
  .expand-content { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 20px; }
  .expand-insight { flex: 1; font-size: 12px; color: var(--muted); line-height: 1.5; }
  .expand-actions { display: flex; gap: 12px; flex-shrink: 0; align-items: center; }

  /* Sneak peek animation on first expanded row */
  .expand-peek { animation: expandSlide 0.4s ease-out; }
  .expand-peek .expand-content { animation: peekGlow 2s ease-out; }
  @keyframes expandSlide {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes peekGlow {
    0% { box-shadow: inset 0 0 0 1px rgba(240,180,41,0.4); }
    100% { box-shadow: inset 0 0 0 1px transparent; }
  }
  @keyframes carouselSlideIn {
    from { opacity: 0; transform: translateX(40px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes carouselSlideInR {
    from { opacity: 0; transform: translateX(-40px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .chevron-hint span { animation: chevronPulse 1.5s ease-in-out 0.5s 2; }
  @keyframes chevronPulse {
    0%, 100% { color: var(--muted); }
    50% { color: var(--accent); transform: scale(1.3); }
  }
  .btn-loading-sweep {
    position: relative; overflow: hidden;
    background: linear-gradient(90deg, transparent 30%, rgba(240,180,41,0.15) 50%, transparent 70%);
    background-size: 200% 100%;
    animation: btnSweep 1.5s ease-in-out infinite;
    border-color: rgba(240,180,41,0.4) !important;
    color: var(--accent) !important;
  }
  @keyframes btnSweep {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }

  /* Mobile sneak peek */
  .mobile-card.peek-card { animation: cardPeek 2s ease-out; }
  @keyframes cardPeek {
    0% { border-color: rgba(240,180,41,0.5); box-shadow: 0 0 20px rgba(240,180,41,0.08); }
    100% { border-color: rgba(240,180,41,0.3); box-shadow: none; }
  }
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
    display: flex; align-items: flex-start; justify-content: center;
    z-index: 200; padding: 40px 20px; animation: fadeIn 0.15s ease;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    overflow-y: auto; -webkit-overflow-scrolling: touch;
  }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .modal {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 48px; max-width: 900px; width: 100%;
    position: relative; animation: slideUp 0.25s ease;
    flex-shrink: 0; margin: auto 0;
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

  /* Niche ticker */
  .niche-ticker { overflow: hidden; padding: 14px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin: -8px 0 24px; position: relative; }
  .niche-ticker::before, .niche-ticker::after { content: ''; position: absolute; top: 0; bottom: 0; width: 80px; z-index: 2; pointer-events: none; }
  .niche-ticker::before { left: 0; background: linear-gradient(to right, var(--bg), transparent); }
  .niche-ticker::after { right: 0; background: linear-gradient(to left, var(--bg), transparent); }
  .ticker-track { display: flex; gap: 12px; animation: ticker 120s linear infinite; width: max-content; }
  .ticker-track:hover { animation-play-state: paused; }
  .ticker-item { white-space: nowrap; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); padding: 5px 14px; border: 1px solid var(--border); border-radius: 100px; background: rgba(240,180,41,0.04); transition: all 0.2s; }
  .ticker-item:hover { border-color: var(--accent); color: var(--accent); background: rgba(240,180,41,0.08); }
  @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

  /* Google Places Autocomplete dropdown styling */
  .pac-container { background: #1a1a1f; border: 1px solid #2a2a33; border-radius: 8px; margin-top: 4px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; z-index: 9999; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  .pac-item { padding: 8px 14px; border-bottom: 1px solid #2a2a33; color: #e0e0e0; cursor: pointer; }
  .pac-item:hover { background: rgba(240,180,41,0.08); }
  .pac-item-query { color: #f0b429; font-weight: 500; }
  .pac-matched { color: #f0b429; }
  .pac-icon { display: none; }
  .pac-item .pac-icon-marker { display: none; }
  .pac-logo::after { display: none; }

  /* Legal modal */
  .legal-modal { background: var(--card); border: 1px solid var(--border); border-radius: 16px; max-width: 640px; width: 90vw; max-height: 80vh; overflow-y: auto; padding: 40px; position: relative; }
  .legal-modal h2 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
  .legal-modal .legal-updated { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--muted); margin-bottom: 24px; }
  .legal-modal h3 { font-size: 15px; font-weight: 600; margin: 24px 0 8px; color: var(--accent); }
  .legal-modal p { font-size: 14px; color: var(--muted); line-height: 1.7; margin-bottom: 12px; }
  .legal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: var(--muted); cursor: pointer; font-size: 18px; padding: 4px 8px; }

  /* Outreach modal */
  .outreach-modal { background: var(--card); border: 1px solid var(--border); border-radius: 16px; max-width: 680px; width: 95vw; max-height: 85vh; overflow-y: auto; padding: 32px; position: relative; }

  /* Dashboard */
  .dash { max-width: 900px; margin: 0 auto; padding: 40px 40px 80px; }

  /* Saved Lists */
  .lists-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .list-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 18px; cursor: pointer; transition: all 0.2s; position: relative; }
  .list-card:hover { border-color: var(--accent); transform: translateY(-1px); }
  .list-card-name { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
  .list-card-desc { font-size: 12px; color: var(--muted); margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .list-card-meta { display: flex; gap: 12px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--muted); }
  .list-card-meta strong { color: var(--accent); }
  .list-card-delete { position: absolute; top: 12px; right: 12px; background: none; border: none; color: var(--muted); cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px; opacity: 0; transition: all 0.15s; }
  .list-card:hover .list-card-delete { opacity: 1; }
  .list-card-delete:hover { color: var(--red); background: rgba(239,68,68,0.1); }
  .new-list-card { border-style: dashed; display: flex; align-items: center; justify-content: center; min-height: 100px; color: var(--muted); font-size: 14px; gap: 8px; }
  .new-list-card:hover { color: var(--accent); border-color: var(--accent); }

  /* List Detail View */
  .list-detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .list-detail-name { font-size: 22px; font-weight: 700; }
  .list-detail-desc { font-size: 13px; color: var(--muted); margin-top: 4px; }
  .list-detail-filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .status-filter { font-family: 'IBM Plex Mono', monospace; font-size: 11px; padding: 5px 12px; border-radius: 100px; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; transition: all 0.15s; }
  .status-filter.active { border-color: var(--accent); color: var(--accent); background: rgba(240,180,41,0.08); }
  .status-tag { display: inline-block; font-family: 'IBM Plex Mono', monospace; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; letter-spacing: 0.03em; cursor: pointer; transition: all 0.15s; user-select: none; }
  .status-new { background: rgba(96,165,250,0.12); color: #60a5fa; }
  .status-contacted { background: rgba(251,191,36,0.12); color: #fbbf24; }
  .status-replied { background: rgba(34,197,94,0.12); color: #22c55e; }
  .status-closed { background: rgba(139,92,246,0.12); color: #a78bfa; }
  .lead-note-input { background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; font-size: 12px; color: var(--text); width: 100%; font-family: 'IBM Plex Mono', monospace; resize: none; outline: none; }
  .lead-note-input:focus { border-color: var(--accent); }
  .lead-note-input::placeholder { color: var(--muted); }

  /* Save to List Modal */
  .save-modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; max-width: 440px; width: 90vw; padding: 32px; position: relative; animation: slideUp 0.2s ease; }
  .save-modal h3 { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
  .save-list-option { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid var(--border); border-radius: 10px; margin-bottom: 8px; cursor: pointer; transition: all 0.15s; background: var(--surface2); }
  .save-list-option:hover { border-color: var(--accent); }
  .save-list-option-name { font-weight: 600; font-size: 14px; }
  .save-list-option-count { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--muted); }
  .new-list-inline { display: flex; gap: 8px; margin-top: 12px; }
  .new-list-inline input { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: var(--text); outline: none; font-family: 'IBM Plex Mono', monospace; }
  .new-list-inline input:focus { border-color: var(--accent); }
  .save-count { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); margin-bottom: 16px; }
  @media (max-width: 640px) {
    .lists-grid { grid-template-columns: 1fr; }
    .list-detail-header { flex-direction: column; gap: 12px; }
  }
  .dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
  .dash-greeting { font-size: 24px; font-weight: 700; }
  .dash-greeting span { color: var(--accent); }
  .dash-plan { font-family: 'IBM Plex Mono', monospace; font-size: 11px; padding: 4px 12px; border-radius: 4px; font-weight: 600; letter-spacing: 0.05em; }
  .dash-plan-free { background: rgba(240,180,41,0.12); color: var(--accent); border: 1px solid rgba(240,180,41,0.3); }
  .dash-plan-pro { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
  .dash-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 36px; }
  .dash-stat { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; }
  .dash-stat-label { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .dash-stat-value { font-size: 28px; font-weight: 700; }
  .dash-section { margin-bottom: 32px; }
  .dash-section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .dash-niches { display: flex; gap: 8px; flex-wrap: wrap; }
  .dash-niche { font-family: 'IBM Plex Mono', monospace; font-size: 12px; padding: 6px 14px; border-radius: 100px; border: 1px solid var(--border); background: rgba(240,180,41,0.04); color: var(--muted); }
  .dash-niche strong { color: var(--accent); margin-left: 4px; }
  .dash-history { display: flex; flex-direction: column; gap: 8px; }
  .dash-history-item { display: flex; justify-content: space-between; align-items: center; background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 20px; cursor: pointer; transition: border-color 0.15s; }
  .dash-history-item:hover { border-color: var(--accent); }
  .dash-history-niche { font-weight: 600; font-size: 14px; }
  .dash-history-location { font-size: 12px; color: var(--muted); font-family: 'IBM Plex Mono', monospace; margin-top: 2px; }
  .dash-history-meta { text-align: right; }
  .dash-history-leads { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--accent); font-weight: 600; }
  .dash-history-time { font-size: 11px; color: var(--muted); font-family: 'IBM Plex Mono', monospace; margin-top: 2px; }
  .dash-empty { text-align: center; padding: 48px 20px; color: var(--muted); }
  .dash-empty p { margin-bottom: 16px; font-size: 14px; }
  .dash-actions { display: flex; gap: 12px; margin-bottom: 36px; }
  .dash-back { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); cursor: pointer; transition: color 0.15s; margin-bottom: 24px; display: inline-block; }
  .dash-back:hover { color: var(--accent); }
  @media (max-width: 640px) {
    .dash { padding: 20px 16px 60px; }
    .dash-stats { grid-template-columns: 1fr; }
    .dash-header { flex-direction: column; gap: 12px; }
  }
  .outreach-tabs { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
  .outreach-tab { font-family: 'IBM Plex Mono', monospace; font-size: 11px; padding: 6px 14px; border-radius: 100px; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; transition: all 0.15s; }
  .outreach-tab.active { border-color: var(--accent); color: var(--accent); background: rgba(240,180,41,0.08); }
  .outreach-subject { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--text); font-size: 13px; margin-bottom: 10px; font-family: 'IBM Plex Mono', monospace; }
  .outreach-body { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 14px; color: var(--text); font-size: 13px; min-height: 220px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, sans-serif; resize: vertical; }
  .outreach-actions { display: flex; gap: 10px; margin-top: 16px; align-items: center; }
  .outreach-copied { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #22c55e; }

  /* MOBILE LEAD CARDS — shown below 768px instead of table */
  .mobile-cards { display: none; flex-direction: column; gap: 12px; }
  .mobile-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; cursor: pointer; transition: border-color 0.15s; }
  .mobile-card:hover, .mobile-card.expanded { border-color: rgba(240,180,41,0.3); }
  .mobile-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .mobile-card-name { font-weight: 700; font-size: 14px; line-height: 1.3; }
  .mobile-card-addr { font-size: 11px; color: var(--muted); font-family: 'IBM Plex Mono', monospace; margin-top: 2px; }
  .mobile-card-score { flex-shrink: 0; }
  .mobile-card-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-top: 12px; }
  .mobile-card-field label { display: block; font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; font-family: 'IBM Plex Mono', monospace; margin-bottom: 2px; }
  .mobile-card-field span { font-size: 12px; word-break: break-all; }
  .mobile-card-field a { font-size: 12px; color: var(--accent); text-decoration: none; word-break: break-all; }
  .mobile-card-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
  .mobile-card-expand { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .mobile-card-insight { font-size: 12px; color: var(--muted); line-height: 1.5; margin-bottom: 12px; }
  .mobile-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .mobile-card-socials { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }

  /* Celebration Banner */
  .celebration-overlay {
    position: fixed; inset: 0; z-index: 300;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.9); backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    animation: celebFadeIn 0.3s ease;
  }
  @keyframes celebFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .celebration-card {
    background: var(--surface); border: 1px solid rgba(240,180,41,0.3);
    border-radius: 24px; padding: 48px 40px; max-width: 460px; width: 90%;
    text-align: center; position: relative; overflow: hidden;
    animation: celebSlideUp 0.5s ease 0.1s both;
  }
  @keyframes celebSlideUp { from { opacity:0; transform: translateY(30px) scale(0.95); } to { opacity:1; transform: none; } }
  .celebration-card::before {
    content: ''; position: absolute; inset: -2px;
    background: conic-gradient(from 0deg, var(--accent), var(--accent2), var(--green), var(--accent));
    border-radius: 25px; z-index: -1; opacity: 0.3;
    animation: celebGlow 3s linear infinite;
  }
  @keyframes celebGlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .celebration-card::after {
    content: ''; position: absolute; inset: 1px;
    background: var(--surface); border-radius: 23px; z-index: -1;
  }
  .celebration-emoji { font-size: 56px; margin-bottom: 16px; animation: celebBounce 0.6s ease 0.4s both; }
  @keyframes celebBounce { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
  .celebration-title { font-size: 28px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
  .celebration-plan { color: var(--accent); }
  .celebration-sub { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 28px; }
  .celebration-features {
    display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 28px;
  }
  .celebration-feat {
    font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    padding: 5px 12px; border-radius: 6px;
    background: rgba(240,180,41,0.08); color: var(--accent);
    border: 1px solid rgba(240,180,41,0.15);
  }
  .celebration-confetti {
    position: absolute; top: 0; left: 50%; width: 4px; height: 12px;
    border-radius: 2px; opacity: 0;
    animation: confettiFall 1.5s ease 0.3s both;
  }
  @keyframes confettiFall {
    0% { opacity: 1; transform: translateY(-40px) rotate(0deg); }
    100% { opacity: 0; transform: translateY(200px) rotate(720deg); }
  }

  /* Upgrade nudge in dashboard */
  .dash-upgrade-card {
    padding: 16px 20px; border-radius: 12px; margin-bottom: 16px;
    border: 1px solid rgba(240,180,41,0.2);
    background: linear-gradient(135deg, rgba(240,180,41,0.04), rgba(232,93,4,0.02));
    display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  }
  .dash-upgrade-card .upgrade-info { flex: 1; }
  .dash-upgrade-card .upgrade-title { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
  .dash-upgrade-card .upgrade-desc { font-size: 12px; color: var(--muted); }

  /* Mobile-only elements — hidden by default, shown in mobile media query */
  .hero-mobile { display: none; }
  .m-landing { display: none; }

  /* MOBILE */
  @media (max-width: 768px) {
    .nav { padding: 12px 16px; gap: 8px; }
    .nav-actions { gap: 6px; }
    .nav-actions .btn-sm { padding: 6px 12px; font-size: 12px; }
    .nav-email { display: none; }
    .nav-beta { display: none; }
    .badge { padding: 3px 8px; font-size: 10px; }
    .hero { padding: 28px 20px 20px; }
    .hero-tag { font-size: 9px; padding: 4px 12px; margin-bottom: 16px; }
    .hero h1 { font-size: 26px; letter-spacing: -0.8px; margin-bottom: 10px; line-height: 1.2; }
    .hero h1 br { display: none; }
    .hero-desktop { display: none; }
    .hero-mobile { display: block; }
    .hero p { font-size: 13px; margin-bottom: 0; line-height: 1.5; max-width: 100%; }
    .hero-stats {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0;
      margin-top: 20px; padding-top: 16px;
      border-top: 1px solid var(--border); padding-bottom: 0;
    }
    .stat { padding: 10px 0; }
    .stat-num { font-size: 18px; }
    .stat-label { font-size: 10px; }
    .hero::before { opacity: 0.5; }
    .niche-ticker { display: none; }
    .tool-section { padding: 0 16px 32px; }
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
    .desktop-table { display: none; }
    .mobile-cards { display: flex; }
    .upsell-banner { flex-direction: column !important; gap: 10px !important; text-align: center; padding: 14px 16px !important; }
    .upsell-banner .btn { width: 100%; justify-content: center; }
    .upgrade-bar { flex-direction: column; gap: 12px; padding: 18px 16px; }
    .upgrade-bar .btn { width: 100%; justify-content: center; }
    .loading-title { font-size: 16px; }
    .loading-sub { font-size: 12px; }
    .loading-tip { font-size: 12px; padding: 12px 16px; max-width: 100%; }
    .modal-overlay { padding: 16px 12px; }
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
    .demo-section { display: none; }
    .footer { flex-direction: column; gap: 10px; padding: 20px 16px; text-align: center; }
    .legal-modal { padding: 24px 18px; width: 95vw; }
    .outreach-modal { padding: 24px 18px; width: 95vw; }
    .outreach-actions { flex-wrap: wrap; }
    .outreach-actions .btn { flex: 1; min-width: 120px; justify-content: center; }

    /* ── Mobile Landing Content ── */
    .m-landing { display: flex; flex-direction: column; gap: 0; padding: 0 16px 32px; }

    .m-section-label {
      font-family: 'IBM Plex Mono', monospace; font-size: 10px;
      color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase;
      margin-bottom: 14px; text-align: center;
    }

    .m-how { display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px; }
    .m-how-step {
      display: flex; gap: 14px; align-items: flex-start;
      padding: 14px 16px; background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px;
    }
    .m-how-num {
      font-family: 'IBM Plex Mono', monospace; font-size: 18px;
      font-weight: 800; color: var(--accent); flex-shrink: 0; line-height: 1;
      width: 28px; text-align: center;
    }
    .m-how-text { flex: 1; }
    .m-how-title { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
    .m-how-desc { font-size: 12px; color: var(--muted); line-height: 1.5; }

    .m-niches { margin-bottom: 32px; }
    .m-niche-grid {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;
    }
    .m-niche-chip {
      padding: 10px 8px; background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; font-size: 11px; font-weight: 600; text-align: center;
      cursor: pointer; transition: all 0.15s; color: var(--text);
    }
    .m-niche-chip:active { border-color: var(--accent); color: var(--accent); background: rgba(240,180,41,0.04); }

    .m-demo { margin-bottom: 32px; }
    .m-demo-cards { display: flex; flex-direction: column; gap: 8px; }
    .m-demo-card {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 14px; background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px;
    }
    .m-demo-card-left { flex: 1; min-width: 0; }
    .m-demo-card-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .m-demo-card-meta { font-size: 10px; color: var(--muted); font-family: 'IBM Plex Mono', monospace; margin-top: 2px; }
    .m-demo-card-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .m-demo-card-email { font-size: 10px; color: var(--accent); font-family: 'IBM Plex Mono', monospace; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .m-features { margin-bottom: 32px; }
    .m-feat-list { display: flex; flex-direction: column; gap: 8px; }
    .m-feat {
      display: flex; gap: 12px; align-items: center;
      padding: 12px 14px; background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px;
    }
    .m-feat-icon { font-size: 20px; flex-shrink: 0; width: 32px; text-align: center; }
    .m-feat-text { flex: 1; }
    .m-feat-title { font-size: 13px; font-weight: 600; }
    .m-feat-desc { font-size: 11px; color: var(--muted); margin-top: 1px; }

    .m-proof {
      display: flex; gap: 10px; margin-bottom: 32px;
    }
    .m-proof-item {
      flex: 1; text-align: center; padding: 14px 8px;
      background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    }
    .m-proof-num { font-size: 20px; font-weight: 800; color: var(--accent); }
    .m-proof-label { font-size: 10px; color: var(--muted); margin-top: 2px; }

    .m-bottom-cta {
      text-align: center; padding: 24px 16px;
      background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    }
    .m-bottom-cta h3 { font-size: 18px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
    .m-bottom-cta p { font-size: 12px; color: var(--muted); margin-bottom: 16px; line-height: 1.5; }
    .m-bottom-cta .btn { width: 100%; justify-content: center; }
    .m-bottom-cta .m-sub { font-size: 11px; color: var(--muted); margin-top: 10px; font-family: 'IBM Plex Mono', monospace; }
  }
  @media (max-width: 380px) {
    .hero h1 { font-size: 23px; }
    .logo { font-size: 17px; }
    .logo-mark { width: 28px; height: 28px; }
    .logo-mark svg { width: 28px; height: 28px; }
  }

  /* Sequence Builder */
  .seq-builder { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; }
  .seq-builder-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .seq-builder-header h3 { margin: 0; font-size: 18px; font-weight: 700; }
  .seq-steps { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
  .seq-step-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
  .seq-step-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
  .seq-step-num { font-weight: 700; font-size: 13px; color: var(--accent); font-family: "IBM Plex Mono", monospace; }
  .seq-step-delay { font-size: 12px; color: var(--muted); display: flex; align-items: center; }
  .seq-builder-fields code { background: var(--surface2); padding: 2px 6px; border-radius: 4px; font-size: 12px; color: var(--accent); }

  /* Sequence Detail */
  .seq-detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .seq-enroll-bar { display: flex; gap: 10px; align-items: center; padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
  .seq-steps-preview { display: flex; flex-direction: column; gap: 12px; }
  .seq-step-preview { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; }
  .seq-step-preview-num { font-weight: 700; font-size: 12px; color: var(--accent); font-family: "IBM Plex Mono", monospace; margin-bottom: 6px; }
  .seq-step-preview-subject { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
  .seq-step-preview-body { font-size: 12px; color: var(--muted); line-height: 1.5; white-space: pre-line; }
  .seq-enrollments { display: flex; flex-direction: column; gap: 8px; }
  .seq-enrollment-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; gap: 12px; }
  .seq-card { border-left: 3px solid var(--accent); }

  /* Enrichment display */
  .enrichment-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); }
  .enrichment-chip { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 4px 10px; display: flex; flex-direction: column; gap: 1px; }
  .enrichment-label { font-size: 9px; color: var(--muted); font-family: "IBM Plex Mono", monospace; text-transform: uppercase; letter-spacing: 0.05em; }
  .enrichment-value { font-size: 13px; font-weight: 700; color: var(--text); font-family: "IBM Plex Mono", monospace; }
  .enrichment-signal { font-size: 10px; padding: 3px 8px; border-radius: 6px; background: var(--accent-dim, rgba(240,180,41,0.1)); color: var(--accent); font-weight: 600; white-space: nowrap; }
  .enrichment-locked .enrichment-value { filter: blur(6px); user-select: none; }
  .enrichment-locked .enrichment-signal { filter: blur(4px); user-select: none; }
  .enrichment-unlock { font-size: 11px; color: var(--accent); cursor: pointer; font-weight: 600; white-space: nowrap; padding: 3px 8px; border: 1px solid var(--accent); border-radius: 6px; transition: all 0.15s; }
  .enrichment-unlock:hover { background: var(--accent); color: #000; }

  /* Settings Panel */
  .settings-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; }
  .settings-tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
  .settings-tab { background: none; border: none; padding: 8px 16px; color: var(--muted); cursor: pointer; font-size: 13px; font-weight: 600; border-radius: 8px 8px 0 0; transition: all 0.15s; }
  .settings-tab:hover { color: var(--text); }
  .settings-tab.active { color: var(--accent); border-bottom: 2px solid var(--accent); }
  .settings-section { margin-top: 8px; }
  .settings-list { display: flex; flex-direction: column; gap: 8px; }
  .settings-list-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; gap: 12px; }

  @media (max-width: 600px) {
    .settings-panel { padding: 18px; }
    .settings-tabs { flex-wrap: wrap; }
    .settings-list-item { flex-direction: column; align-items: flex-start; gap: 8px; }
  }

  @media (max-width: 600px) {
    .seq-builder { padding: 18px; }
    .seq-enroll-bar { flex-direction: column; }
    .seq-enrollment-row { flex-direction: column; align-items: flex-start; }
    .seq-detail-header { flex-direction: column; gap: 12px; }
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
  // Health & Wellness
  "Dentist", "Chiropractor", "Veterinarian", "Optometrist", "Physical Therapist",
  "Med Spa / Aesthetics", "Mental Health Therapist", "Dermatologist", "Orthodontist",
  "Urgent Care Clinic", "Pharmacy", "Gym / Fitness Studio", "Personal Trainer", "Yoga Studio",
  // Home Services
  "Plumber", "Electrician", "HVAC Company", "Roofing Contractor", "Landscaping Company",
  "Pest Control", "Painting Contractor", "Flooring Company", "Garage Door Repair",
  "Pool Service", "Cleaning Service", "Handyman", "Solar Installer", "Fence Company",
  // Professional Services
  "Law Firm", "Accountant / CPA", "Insurance Agent", "Real Estate Agent", "Mortgage Broker",
  "Financial Advisor", "Tax Preparer", "Notary Public",
  // Auto
  "Auto Repair Shop", "Auto Detailing", "Car Dealership", "Tire Shop", "Body Shop",
  // Beauty & Personal Care
  "Hair Salon", "Barber Shop", "Nail Salon", "Tattoo Parlor", "Lash & Brow Studio",
  // Food & Hospitality
  "Restaurant", "Catering Company", "Bakery", "Food Truck", "Coffee Shop", "Bar / Brewery",
  // Events & Creative
  "Wedding Photographer", "Event Planner", "Florist", "DJ / Entertainment",
  "Videographer", "Graphic Designer",
  // Education & Childcare
  "Tutoring Service", "Daycare / Preschool", "Driving School", "Music Lessons",
  // Other
  "Marketing Agency", "IT Support / MSP", "Storage Facility", "Dry Cleaner",
  "Print Shop", "Pet Groomer", "Locksmith", "Moving Company", "Towing Service",
];

const DEMO_DATA = {
  "Dentist": { city: "Austin, TX", leads: [
    { name: "Bright Smile Dental", address: "1420 Main St, Austin, TX", email: "info@brightsmile.com", phone: "(512) 555-0142", website: "brightsmile.com", rating: 4.9, score: 94 },
    { name: "Hill Country Family Dentistry", address: "8801 Research Blvd, Austin, TX", email: "hello@hillcountrydental.com", phone: "(512) 555-0287", website: "hillcountrydental.com", rating: 4.8, score: 87 },
    { name: "Austin Dental Works", address: "3500 S Lamar Blvd, Austin, TX", email: "contact@atxdental.com", phone: "(512) 555-0391", website: "atxdental.com", rating: 4.7, score: 82 },
    { name: "Westlake Smiles", address: "701 Capital of TX Hwy, Austin, TX", email: "team@westlakesmiles.com", phone: "(512) 555-0463", website: "westlakesmiles.com", rating: 4.6, score: 78, unclaimed: true },
    { name: "Lakeway Dental Care", address: "2300 Lohmans Crossing, Austin, TX", email: "\u2014", phone: "(512) 555-0518", website: "lakewaydental.com", rating: 4.5, score: 65 },
  ]},
  "Roofing Contractor": { city: "Denver, CO", leads: [
    { name: "Summit Roofing Co", address: "4820 Broadway, Denver, CO", email: "jobs@summitroofing.co", phone: "(303) 555-0184", website: "summitroofing.co", rating: 4.8, score: 91 },
    { name: "Mile High Roof Pros", address: "1200 Larimer St, Denver, CO", email: "info@milehighroofpros.com", phone: "(303) 555-0229", website: "milehighroofpros.com", rating: 4.7, score: 86 },
    { name: "Front Range Exteriors", address: "7600 E Colfax Ave, Denver, CO", email: "bids@frontrangeext.com", phone: "(303) 555-0371", website: "frontrangeext.com", rating: 4.6, score: 80 },
    { name: "Denver Roof Repair", address: "3300 S Federal Blvd, Denver, CO", email: "\u2014", phone: "(303) 555-0445", website: "denverroofrepair.net", rating: 4.5, score: 72 },
    { name: "Apex Roofing Solutions", address: "901 Auraria Pkwy, Denver, CO", email: "hello@apexroof.com", phone: "(303) 555-0502", website: "apexroof.com", rating: 4.4, score: 68, unclaimed: true },
  ]},
  "Hair Salon": { city: "Rancho Cordova, CA", leads: [
    { name: "Luxe Hair Studio", address: "2050 Zinfandel Dr, Rancho Cordova, CA", email: "book@luxehairstudio.com", phone: "(916) 555-0133", website: "luxehairstudio.com", rating: 4.9, score: 93 },
    { name: "The Cutting Edge Salon", address: "10789 Folsom Blvd, Rancho Cordova, CA", email: "info@cuttingedge916.com", phone: "(916) 555-0267", website: "cuttingedge916.com", rating: 4.8, score: 88 },
    { name: "Bella Vida Hair", address: "3301 Mather Field Rd, Rancho Cordova, CA", email: "appts@bellavidahair.com", phone: "(916) 555-0398", website: "bellavidahair.com", rating: 4.7, score: 81 },
    { name: "Shear Perfection", address: "2245 Sunrise Blvd, Rancho Cordova, CA", email: "\u2014", phone: "(916) 555-0412", website: "shearperfection.co", rating: 4.6, score: 74 },
    { name: "Golden Shears", address: "10901 White Rock Rd, Rancho Cordova, CA", email: "style@goldenshears.net", phone: "(916) 555-0589", website: "goldenshears.net", rating: 4.5, score: 69, unclaimed: true },
  ]},
  "Law Firm": { city: "Chicago, IL", leads: [
    { name: "Clark & Associates", address: "120 N LaSalle St, Chicago, IL", email: "intake@clarklaw.com", phone: "(312) 555-0177", website: "clarklaw.com", rating: 4.9, score: 95 },
    { name: "Lakefront Legal Group", address: "444 N Michigan Ave, Chicago, IL", email: "consult@lakefrontlegal.com", phone: "(312) 555-0284", website: "lakefrontlegal.com", rating: 4.8, score: 89 },
    { name: "Windy City Injury Law", address: "77 W Wacker Dr, Chicago, IL", email: "help@windycitylaw.com", phone: "(312) 555-0356", website: "windycitylaw.com", rating: 4.7, score: 83 },
    { name: "Loop Law Office", address: "200 W Adams St, Chicago, IL", email: "info@looplaw.com", phone: "(312) 555-0441", website: "looplaw.com", rating: 4.6, score: 76 },
    { name: "South Side Legal Aid", address: "6401 S Halsted St, Chicago, IL", email: "\u2014", phone: "(312) 555-0528", website: "southsidelegal.org", rating: 4.5, score: 67, unclaimed: true },
  ]},
  "HVAC Company": { city: "Phoenix, AZ", leads: [
    { name: "Desert Cool HVAC", address: "3840 E Indian School Rd, Phoenix, AZ", email: "service@desertcoolhvac.com", phone: "(480) 555-0192", website: "desertcoolhvac.com", rating: 4.9, score: 92 },
    { name: "Sun Valley Air Systems", address: "7005 N 16th St, Phoenix, AZ", email: "info@sunvalleyair.com", phone: "(480) 555-0238", website: "sunvalleyair.com", rating: 4.8, score: 87 },
    { name: "Phoenix Climate Control", address: "2100 W Camelback Rd, Phoenix, AZ", email: "quotes@phxclimate.com", phone: "(480) 555-0371", website: "phxclimate.com", rating: 4.6, score: 79 },
    { name: "AZ Comfort Experts", address: "4420 S Rural Rd, Tempe, AZ", email: "\u2014", phone: "(480) 555-0445", website: "azcomfortexperts.com", rating: 4.5, score: 71 },
    { name: "Cactus Air Pros", address: "9801 N Metro Pkwy, Phoenix, AZ", email: "hello@cactusairpros.com", phone: "(480) 555-0512", website: "cactusairpros.com", rating: 4.4, score: 66, unclaimed: true },
  ]},
  "Restaurant": { city: "Nashville, TN", leads: [
    { name: "Hot Chicken Kitchen", address: "1201 Broadway, Nashville, TN", email: "catering@hotchickenkitchen.com", phone: "(615) 555-0148", website: "hotchickenkitchen.com", rating: 4.9, score: 93 },
    { name: "Music Row Bistro", address: "1600 Division St, Nashville, TN", email: "events@musicrowbistro.com", phone: "(615) 555-0265", website: "musicrowbistro.com", rating: 4.8, score: 86 },
    { name: "The Gulch Grille", address: "500 12th Ave S, Nashville, TN", email: "info@gulchgrille.com", phone: "(615) 555-0387", website: "gulchgrille.com", rating: 4.7, score: 80 },
    { name: "East Side Tacos", address: "1000 Woodland St, Nashville, TN", email: "\u2014", phone: "(615) 555-0419", website: "eastsidetacos.co", rating: 4.6, score: 73 },
    { name: "Germantown Kitchen", address: "1200 4th Ave N, Nashville, TN", email: "hello@germantownkitchen.com", phone: "(615) 555-0534", website: "germantownkitchen.com", rating: 4.5, score: 68, unclaimed: true },
  ]},
};
const DEMO_NICHES = Object.keys(DEMO_DATA);

function getOutreachTemplates(lead) {
  const biz = lead.name || "your business";
  const firstName = lead.ownerName ? lead.ownerName.split(" ")[0] : "";
  const greeting = firstName ? `Hi ${firstName}` : `Hi there`;
  const hasSocial = lead.facebook || lead.instagram || lead.twitter;
  const isUnclaimed = lead.unclaimed;
  const techNote = lead.techStackSummary || "";
  const isOldBuilder = /wix|weebly|squarespace/i.test(techNote);

  const templates = [
    {
      id: "general",
      label: "General Outreach",
      subject: `Quick question about ${biz}`,
      body: `${greeting},\n\nI came across ${biz} and was really impressed by your ${lead.rating ? lead.rating + "-star rating" : "online presence"}. I work with local businesses like yours to help them get more customers through digital marketing.\n\nI had a few ideas specific to your business that I think could make a real impact. Would you be open to a quick 10-minute call this week?\n\nNo pressure either way — just thought it was worth reaching out.\n\nBest,\n[Your Name]`
    },
    {
      id: "website",
      label: "Website Redesign",
      subject: `${biz} — website opportunity`,
      body: `${greeting},\n\nI was looking at the ${biz} website${isOldBuilder ? ` and noticed it's built on ${techNote.split(",")[0].trim()}` : ""} — it's a solid start, but I think there's a big opportunity to turn it into a real lead-generation machine.\n\nA few things I noticed:\n• The site could load faster and be more mobile-friendly\n• There's room to improve the call-to-action flow\n• Some SEO quick wins that could bring in more organic traffic\n\nI specialize in redesigning websites for local businesses — typically my clients see a 30-40% increase in leads within the first few months.\n\nWould it be worth a quick chat? I'd be happy to walk you through what I'd change.\n\nBest,\n[Your Name]`
    },
    {
      id: "social",
      label: "Social Media",
      subject: `Social media strategy for ${biz}`,
      body: `${greeting},\n\nI found ${biz} on Google Maps and noticed you've got a strong reputation with great reviews${!hasSocial ? " — but I couldn't find much social media presence" : ""}.\n\n${!hasSocial ? "Businesses in your niche that are active on Instagram and Facebook typically see 20-30% more walk-ins" : "I think there's an opportunity to turn your social following into more paying customers"}. I work with local businesses to build their social presence with content that actually converts.\n\nHere's what I typically do for businesses like yours:\n• Professional content creation (photos + short-form video)\n• Targeted local audience growth\n• Review generation strategy\n\nWould you be open to hearing more? No commitment — just a 10-minute overview.\n\nBest,\n[Your Name]`
    },
  ];

  if (isUnclaimed) {
    templates.push({
      id: "unclaimed",
      label: "Unclaimed Listing",
      subject: `Urgent: Your ${biz} Google listing needs attention`,
      body: `${greeting},\n\nI'm reaching out because I noticed your Google Business listing for ${biz} hasn't been claimed yet. This means anyone could potentially request ownership of it, and you're missing out on a lot of free features.\n\nWhen a listing is unclaimed, you can't:\n• Respond to customer reviews\n• Update your hours, photos, or contact info\n• Access insights on how customers find you\n• Run Google Ads linked to your listing\n\nI help local businesses claim, optimize, and manage their Google presence. I'd be happy to walk you through the process — it only takes about 15 minutes and could make a big difference for your visibility.\n\nWant me to send over more details?\n\nBest,\n[Your Name]`
    });
  }

  return templates;
}

function OutreachModal({ templates, lead, onClose, apiBase, token }) {
  const [activeTab, setActiveTab] = useState(0);
  const [subject, setSubject] = useState(templates[0]?.subject || "");
  const [body, setBody] = useState(templates[0]?.body || "");
  const [copied, setCopied] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  function selectTemplate(idx) {
    setActiveTab(idx);
    setSubject(templates[idx].subject);
    setBody(templates[idx].body);
    setCopied(false);
    setAiGenerated(false);
  }

  async function generateAiPitch() {
    setAiLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/pitch/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lead, style: "casual" }),
      });
      const data = await res.json();
      if (data.pitch) {
        setSubject(`Quick question about ${lead.name}`);
        setBody(data.pitch);
        setAiGenerated(true);
        setActiveTab(-1); // deselect template tabs
      }
    } catch (e) { console.error("AI pitch failed:", e); }
    setAiLoading(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleMailto() {
    window.open(`mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="outreach-modal">
        <button className="legal-close" onClick={onClose}>&times;</button>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Outreach to {lead.name}</h2>
        <p style={{fontSize:12,color:"var(--muted)",fontFamily:"IBM Plex Mono",marginBottom:16}}>
          {lead.email} {lead.emailVerified && <span className="email-verified">Verified</span>}
        </p>
        <div className="outreach-tabs">
          {templates.map((t, i) => (
            <button key={t.id} className={`outreach-tab ${i === activeTab ? "active" : ""}`} onClick={() => selectTemplate(i)}>
              {t.label}
            </button>
          ))}
          <button
            className={`outreach-tab ${aiGenerated ? "active" : ""}`}
            onClick={generateAiPitch}
            disabled={aiLoading}
            style={aiGenerated ? {} : {borderColor:"rgba(240,180,41,0.3)",color:"var(--accent)"}}
          >
            {aiLoading ? "Writing..." : aiGenerated ? "✨ AI Pitch" : "✨ AI Pitch"}
          </button>
        </div>
        <input className="outreach-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line..." />
        <textarea className="outreach-body" value={body} onChange={e => setBody(e.target.value)} />
        <div className="outreach-actions">
          <button className="btn btn-primary" onClick={handleMailto} style={{fontSize:13}}>
            Open in Mail ↗
          </button>
          <button className="btn btn-outline" onClick={handleCopy} style={{fontSize:13}}>
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          {copied && <span className="outreach-copied">✓ Copied</span>}
        </div>
      </div>
    </div>
  );
}

function SaveToListModal({ leads, apiBase, token, onClose, onSaved }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [savedTo, setSavedTo] = useState(null);

  useEffect(() => {
    fetch(`${apiBase}/api/lists`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setLists(d.lists || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function saveToList(listId, listName) {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/lists/${listId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leads }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedTo(listName);
        onSaved?.(listId, listName);
        setTimeout(() => onClose(), 1200);
      } else {
        alert(data.error || "Failed to save");
      }
    } catch { alert("Failed to save leads"); }
    setSaving(false);
  }

  async function handleCreateAndSave() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${apiBase}/api/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (res.ok && data.list) {
        setLists(prev => [data.list, ...prev]);
        await saveToList(data.list.id, data.list.name);
      } else {
        alert(data.error || "Failed to create list");
      }
    } catch { alert("Failed to create list"); }
    setCreating(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="save-modal">
        <button className="legal-close" onClick={onClose}>&times;</button>
        <h3>Save to List</h3>
        <div className="save-count">{leads.length} lead{leads.length !== 1 ? "s" : ""} selected</div>

        {savedTo ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:32,marginBottom:8}}>✓</div>
            <div style={{fontWeight:700,fontSize:15}}>Saved to "{savedTo}"</div>
          </div>
        ) : loading ? (
          <div style={{textAlign:"center",padding:"24px 0",color:"var(--muted)"}}>Loading lists...</div>
        ) : (
          <>
            {lists.map(l => (
              <div key={l.id} className="save-list-option" onClick={() => !saving && saveToList(l.id, l.name)}>
                <span className="save-list-option-name">{l.name}</span>
                <span className="save-list-option-count">{l.leadCount} leads</span>
              </div>
            ))}
            <div className="new-list-inline">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New list name..."
                onKeyDown={e => e.key === "Enter" && handleCreateAndSave()} />
              <button className="btn btn-primary btn-sm" onClick={handleCreateAndSave} disabled={!newName.trim() || creating || saving}>
                {creating ? "..." : "+ Create & Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", className: "status-new" },
  { value: "contacted", label: "Contacted", className: "status-contacted" },
  { value: "replied", label: "Replied", className: "status-replied" },
  { value: "closed", label: "Closed", className: "status-closed" },
];

function ListDetailView({ listId, apiBase, token, onBack, onOutreach, onRunAudit }) {
  const [list, setList] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => { loadList(); }, [listId]);

  async function loadList() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/lists/${listId}/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setList(data.list);
      setLeads(data.leads || []);
    } catch {}
    setLoading(false);
  }

  async function cycleStatus(lead) {
    const order = ["new", "contacted", "replied", "closed"];
    const next = order[(order.indexOf(lead._status) + 1) % order.length];
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, _status: next } : l));
    await fetch(`${apiBase}/api/lists/${listId}/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: next }),
    });
  }

  async function saveNote(lead) {
    await fetch(`${apiBase}/api/lists/${listId}/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes: noteText }),
    });
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, _notes: noteText } : l));
    setEditingNote(null);
  }

  async function removeLead(lead) {
    setLeads(prev => prev.filter(l => l.id !== lead.id));
    await fetch(`${apiBase}/api/lists/${listId}/leads/${lead.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  if (loading) return <div style={{textAlign:"center",padding:"60px 0",color:"var(--muted)"}}>Loading list...</div>;
  if (!list) return <div style={{textAlign:"center",padding:"60px 0",color:"var(--muted)"}}>List not found.</div>;

  const filtered = filter === "all" ? leads : leads.filter(l => l._status === filter);
  const statusCounts = { all: leads.length };
  for (const l of leads) statusCounts[l._status] = (statusCounts[l._status] || 0) + 1;

  return (
    <>
      <span className="dash-back" onClick={onBack}>&larr; Back to lists</span>
      <div className="list-detail-header">
        <div>
          <div className="list-detail-name">{list.name}</div>
          {list.description && <div className="list-detail-desc">{list.description}</div>}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span className="count-tag">{leads.length} lead{leads.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="list-detail-filters">
        {[{ value: "all", label: "All" }, ...STATUS_OPTIONS].map(s => (
          <button key={s.value} className={`status-filter ${filter === s.value ? "active" : ""}`}
            onClick={() => setFilter(s.value)}>
            {s.label} {statusCounts[s.value] ? `(${statusCounts[s.value]})` : ""}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="dash-empty">
          <p>{filter === "all" ? "No leads in this list yet." : `No ${filter} leads.`}</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(lead => (
            <div key={lead.id} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>{lead.name}</div>
                  <div style={{fontSize:11,color:"var(--muted)",fontFamily:"IBM Plex Mono",marginTop:2}}>{lead.address}</div>
                  <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
                    {lead.email && lead.email !== "—" && (
                      <span style={{fontSize:12,color:"var(--accent)",fontFamily:"IBM Plex Mono"}}>{lead.email}</span>
                    )}
                    {lead.phone && <span style={{fontSize:12,color:"var(--muted)",fontFamily:"IBM Plex Mono"}}>{lead.phone}</span>}
                    {lead.rating && (
                      <span style={{fontSize:12,color:"var(--muted)"}}>★ {lead.rating}</span>
                    )}
                    <span className={`score-pill ${scoreToClass(lead.score)}`} style={{fontSize:10}}>{lead.score}/100</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                  <span className={`status-tag status-${lead._status}`} onClick={() => cycleStatus(lead)}
                    title="Click to change status">
                    {lead._status.toUpperCase()}
                  </span>
                  <button onClick={() => removeLead(lead)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:14,padding:"2px 6px"}}
                    title="Remove from list">&times;</button>
                </div>
              </div>

              {/* Notes */}
              <div style={{marginTop:10}}>
                {editingNote === lead.id ? (
                  <div style={{display:"flex",gap:6}}>
                    <textarea className="lead-note-input" rows={2} value={noteText} onChange={e => setNoteText(e.target.value)}
                      placeholder="Add a note..." autoFocus />
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <button className="btn btn-primary btn-sm" style={{fontSize:11,padding:"4px 10px"}} onClick={() => saveNote(lead)}>Save</button>
                      <button className="btn btn-ghost btn-sm" style={{fontSize:11,padding:"4px 10px"}} onClick={() => setEditingNote(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => { setEditingNote(lead.id); setNoteText(lead._notes || ""); }}
                    style={{fontSize:12,color: lead._notes ? "var(--text)" : "var(--muted)",fontFamily:"IBM Plex Mono",
                      cursor:"pointer",padding:"4px 0",borderBottom:"1px dashed var(--border)",transition:"color 0.15s"}}>
                    {lead._notes || "Click to add a note..."}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div style={{display:"flex",gap:12,marginTop:10}}>
                {lead.email && lead.email !== "—" && (
                  <button onClick={() => onOutreach?.(lead)}
                    className="btn btn-outline btn-sm" style={{fontSize:11,padding:"4px 12px"}}>
                    Send Outreach ↗
                  </button>
                )}
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer"
                    style={{fontSize:11,color:"var(--muted)",textDecoration:"none",fontFamily:"IBM Plex Mono",display:"flex",alignItems:"center"}}>
                    Website ↗
                  </a>
                )}
                {lead.mapsUrl && (
                  <a href={lead.mapsUrl} target="_blank" rel="noopener noreferrer"
                    style={{fontSize:11,color:"var(--muted)",textDecoration:"none",fontFamily:"IBM Plex Mono",display:"flex",alignItems:"center"}}>
                    Maps ↗
                  </a>
                )}
                {onRunAudit && lead.website && (
                  <span className="audit-badge" onClick={() => onRunAudit(lead.website)}>AUDIT</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Sequence Builder (Create / Edit) ─────────────────────────
function SequenceBuilder({ apiBase, token, existing, onClose, onSaved }) {
  const [name, setName] = useState(existing?.name || "");
  const [fromName, setFromName] = useState(existing?.from_name || "");
  const [steps, setSteps] = useState(
    existing?.steps?.length ? existing.steps.map(s => ({
      stepNumber: s.step_number, subject: s.subject, body: s.body, delayHours: s.delay_hours
    })) : [
      { stepNumber: 1, subject: "Quick question about {{business}}", body: "Hi,\n\nI came across {{business}} and was impressed by your {{rating}}-star rating.\n\nI help businesses like yours get more customers through [your service]. Would you be open to a quick chat this week?\n\nBest,\n[Your name]", delayHours: 0 },
      { stepNumber: 2, subject: "Following up — {{business}}", body: "Hi,\n\nJust wanted to follow up on my last email. I know you're busy running {{business}}, so I'll keep this short.\n\n[One sentence value prop]. Can I send over a quick example?\n\nBest,\n[Your name]", delayHours: 48 },
      { stepNumber: 3, subject: "Last note — {{business}}", body: "Hi,\n\nI don't want to be a pest, so this will be my last note. If you're ever looking for help with [your service], feel free to reach out.\n\nWishing {{business}} continued success!\n\nBest,\n[Your name]", delayHours: 120 },
    ]
  );
  const [saving, setSaving] = useState(false);

  function addStep() {
    if (steps.length >= 5) return;
    setSteps(prev => [...prev, {
      stepNumber: prev.length + 1,
      subject: "",
      body: "",
      delayHours: (prev.length + 1) * 48,
    }]);
  }

  function removeStep(idx) {
    if (steps.length <= 1) return;
    setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 })));
  }

  function updateStep(idx, field, value) {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  async function handleSave() {
    if (!name.trim()) return;
    if (steps.some(s => !s.subject.trim() || !s.body.trim())) return;
    setSaving(true);
    try {
      const url = existing ? `${apiBase}/api/sequences/${existing.id}` : `${apiBase}/api/sequences`;
      const method = existing ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, fromName, steps }),
      });
      const data = await res.json();
      if (data.ok || data.sequence) { onSaved(); onClose(); }
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  return (
    <div className="seq-builder">
      <div className="seq-builder-header">
        <h3>{existing ? "Edit Sequence" : "New Email Sequence"}</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>&times;</button>
      </div>
      <div className="seq-builder-fields">
        <div className="field" style={{marginBottom: 12}}>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>Sequence Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Cold outreach — Restaurants" style={{width:"100%",padding:"10px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:14}} />
        </div>
        <div className="field" style={{marginBottom: 16}}>
          <label style={{fontSize:12,color:"var(--muted)",marginBottom:4,display:"block"}}>From Name (shown as sender)</label>
          <input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="e.g., John from LeadReap" style={{width:"100%",padding:"10px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:14}} />
        </div>
      </div>

      <div className="seq-steps">
        {steps.map((step, idx) => (
          <div key={idx} className="seq-step-card">
            <div className="seq-step-header">
              <span className="seq-step-num">Step {step.stepNumber}</span>
              {idx > 0 && (
                <span className="seq-step-delay">
                  Send after
                  <input type="number" min="1" max="720" value={step.delayHours} onChange={e => updateStep(idx, "delayHours", parseInt(e.target.value) || 0)}
                    style={{width:50,padding:"4px 8px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,color:"var(--text)",fontSize:13,margin:"0 6px",textAlign:"center"}} />
                  hours
                </span>
              )}
              {idx === 0 && <span style={{fontSize:12,color:"var(--accent)"}}>Sent immediately</span>}
              {steps.length > 1 && (
                <button className="btn btn-ghost btn-sm" onClick={() => removeStep(idx)} style={{marginLeft:"auto",color:"var(--muted)"}}>&times;</button>
              )}
            </div>
            <input value={step.subject} onChange={e => updateStep(idx, "subject", e.target.value)} placeholder="Subject line..."
              style={{width:"100%",padding:"10px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:14,marginBottom:8}} />
            <textarea value={step.body} onChange={e => updateStep(idx, "body", e.target.value)} placeholder="Email body... Use {{business}}, {{name}}, {{email}}, {{phone}}, {{website}}, {{city}} as placeholders"
              rows={6} style={{width:"100%",padding:"10px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13,lineHeight:1.6,resize:"vertical",fontFamily:"inherit"}} />
          </div>
        ))}
        {steps.length < 5 && (
          <button className="btn btn-ghost" onClick={addStep} style={{width:"100%",padding:"14px",border:"2px dashed var(--border)",borderRadius:10,color:"var(--muted)",fontSize:13}}>
            + Add Step {steps.length + 1}
          </button>
        )}
      </div>

      <div className="seq-builder-hint" style={{fontSize:12,color:"var(--muted)",margin:"12px 0",lineHeight:1.5}}>
        Placeholders: <code>{`{{business}}`}</code> <code>{`{{email}}`}</code> <code>{`{{phone}}`}</code> <code>{`{{website}}`}</code> <code>{`{{city}}`}</code> <code>{`{{rating}}`}</code>
      </div>

      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? "Saving..." : existing ? "Save Changes" : "Create Sequence"}
        </button>
      </div>
    </div>
  );
}

// ─── Sequence Detail View ─────────────────────────────────────
function SequenceDetailView({ sequenceId, apiBase, token, onBack, lists, onEnrollFromList }) {
  const [seq, setSeq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollListId, setEnrollListId] = useState("");

  async function loadSeq() {
    try {
      const res = await fetch(`${apiBase}/api/sequences/${sequenceId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSeq(data.sequence);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { loadSeq(); }, []);

  async function handleEnrollFromList() {
    if (!enrollListId) return;
    setEnrolling(true);
    try {
      // Fetch leads from the list
      const listRes = await fetch(`${apiBase}/api/lists/${enrollListId}/leads`, { headers: { Authorization: `Bearer ${token}` } });
      const listData = await listRes.json();
      const leads = (listData.leads || []).map(l => {
        const ld = JSON.parse(l.leadData || "{}");
        return { email: ld.email, name: ld.name, phone: ld.phone, website: ld.website, address: ld.address, rating: ld.rating, ...ld };
      });

      const res = await fetch(`${apiBase}/api/sequences/${sequenceId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leads }),
      });
      const data = await res.json();
      if (data.ok) {
        loadSeq();
        setEnrollListId("");
      }
    } catch (e) { console.error(e); }
    setEnrolling(false);
  }

  async function toggleStatus() {
    const newStatus = seq.status === "active" ? "paused" : "active";
    await fetch(`${apiBase}/api/sequences/${sequenceId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    setSeq(prev => ({ ...prev, status: newStatus }));
  }

  if (loading) return <div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}>Loading sequence...</div>;
  if (!seq) return <div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}>Sequence not found</div>;

  const stats = seq.stats || {};
  const totalSent = stats.sent || 0;
  const totalPending = stats.pending || 0;
  const totalFailed = stats.failed || 0;

  return (
    <>
      <div className="seq-detail-header">
        <div>
          <h3 style={{margin:0,fontSize:18}}>{seq.name}</h3>
          <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>
            {seq.steps?.length || 0} steps &middot; {seq.enrollments?.length || 0} enrolled &middot;
            <span className={`status-tag status-${seq.status === "active" ? "new" : "closed"}`} style={{marginLeft:6}}>{seq.status}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={toggleStatus}>
            {seq.status === "active" ? "⏸ Pause" : "▶ Activate"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats" style={{marginBottom:20}}>
        <div className="dash-stat"><div className="dash-stat-label">Sent</div><div className="dash-stat-value" style={{color:"#34d399"}}>{totalSent}</div></div>
        <div className="dash-stat"><div className="dash-stat-label">Pending</div><div className="dash-stat-value" style={{color:"var(--accent)"}}>{totalPending}</div></div>
        <div className="dash-stat"><div className="dash-stat-label">Failed</div><div className="dash-stat-value" style={{color:"#f87171"}}>{totalFailed}</div></div>
      </div>

      {/* Enroll from list */}
      <div className="seq-enroll-bar">
        <select value={enrollListId} onChange={e => setEnrollListId(e.target.value)}
          style={{flex:1,padding:"10px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13}}>
          <option value="">Select a list to enroll leads from...</option>
          {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.leadCount} leads)</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={handleEnrollFromList} disabled={!enrollListId || enrolling}>
          {enrolling ? "Enrolling..." : "Enroll Leads"}
        </button>
      </div>

      {/* Steps preview */}
      <div className="dash-section" style={{marginTop:20}}>
        <div className="dash-section-title">📧 Email Steps</div>
        <div className="seq-steps-preview">
          {(seq.steps || []).map((step, i) => (
            <div key={i} className="seq-step-preview">
              <div className="seq-step-preview-num">
                Step {step.step_number}
                {step.delay_hours > 0 && <span style={{fontSize:11,color:"var(--muted)",marginLeft:8}}>+{step.delay_hours}h delay</span>}
              </div>
              <div className="seq-step-preview-subject">{step.subject}</div>
              <div className="seq-step-preview-body">{step.body.slice(0, 120)}{step.body.length > 120 ? "..." : ""}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Enrollments */}
      <div className="dash-section" style={{marginTop:20}}>
        <div className="dash-section-title">👥 Enrolled Leads ({seq.enrollments?.length || 0})</div>
        {seq.enrollments?.length > 0 ? (
          <div className="seq-enrollments">
            {seq.enrollments.map((e, i) => (
              <div key={i} className="seq-enrollment-row">
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14}}>{e.lead_name || e.lead_email}</div>
                  <div style={{fontSize:12,color:"var(--muted)"}}>{e.lead_email}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span className={`status-tag status-${e.status === "completed" ? "closed" : e.status === "active" ? "new" : "replied"}`}>
                    {e.status === "completed" ? "✓ Done" : e.status === "active" ? `Step ${e.current_step + 1}` : e.status}
                  </span>
                  {e.sends?.map((s, si) => (
                    <span key={si} title={`Step ${s.step_number}: ${s.status}`}
                      style={{width:8,height:8,borderRadius:"50%",background: s.status === "sent" ? "#34d399" : s.status === "pending" ? "var(--accent)" : "#f87171"}} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dash-empty" style={{padding:"24px 0"}}>
            <p>No leads enrolled yet. Select a list above to enroll leads.</p>
          </div>
        )}
      </div>
    </>
  );
}

function scoreToClass(score) {
  if (score >= 80) return "score-high";
  if (score >= 60) return "score-med";
  return "score-low";
}

function generateCSV(leads) {
  const headers = ["Business Name", "Email", "Email Verified", "Phone", "Website", "Address", "Rating", "Unclaimed", "Est. Revenue", "Est. Employees", "Business Signals", "LinkedIn", "Facebook", "Instagram", "Twitter", "Lead Score", "Insight"];
  const rows = leads.map(l => [
    `"${l.name}"`, l.email || "", l.emailVerified ? "Verified" : "", l.phone || "", l.website || "", `"${l.address || ""}"`,
    l.rating || "", l.unclaimed ? "Yes" : "No",
    l.enrichment?.revenueRange || "", l.enrichment?.employeeRange || "", `"${(l.enrichment?.signals || []).join(", ")}"`,
    l.linkedinCompany || l.linkedinPerson || "", l.facebook || "", l.instagram || "", l.twitter || "",
    l.score, `"${(l.notes || "").replace(/"/g, '""')}"`
  ]);
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

const LOADING_STEPS = [
  "Scanning Google Maps...",
  "Collecting business details...",
  "Extracting emails & social profiles...",
  "Enriching leads with revenue & employee data...",
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

// ── Feature Carousel (auto-rotating, one at a time) ─────────
const FEATURES = [
  { icon: "✨", title: "AI Pitch Writer", desc: "Click a button and get a hyper-personalized cold email — not a template. References the lead's actual website, reviews, and gaps. Powered by AI." },
  { icon: "🎯", title: "Reddit Intent Monitoring", desc: "Find people actively posting \"looking for a web designer\" or \"need marketing help\" on Reddit. Real-time buy-ready signals delivered to your dashboard." },
  { icon: "🔍", title: "Site Audit Engine", desc: "Run a 10-point diagnostic on any lead's website — SSL, SEO, analytics, social tracking, mobile optimization. Auto-generates sales angles for your pitch." },
  { icon: "📧", title: "Email Sequences", desc: "Automate 3-step cold outreach that sends on autopilot. Personalize with lead data — name, business, city — and let the follow-ups run themselves." },
  { icon: "📊", title: "Lead Enrichment + GBP Signals", desc: "Revenue estimates, employee count, tech stack, plus Google Business signals — stale listings, no review responses, few photos, new businesses." },
  { icon: "🤖", title: "AI Lead Scoring", desc: "Every lead scored 0–100 based on reviews, website quality, social presence, and online signals. Focus your outreach on leads most likely to convert." },
  { icon: "💼", title: "Job Posting Signals", desc: "Businesses hiring for marketing roles are literally advertising they need help. We surface these signals so you can pitch before they hire." },
  { icon: "📄", title: "Proposal Generator", desc: "Auto-generate branded PDF proposals for any lead — findings, recommended services, 3-month plan. Turn cold emails into warm pitches." },
  { icon: "💾", title: "Saved Lists + CRM", desc: "Organize leads into named lists. Tag status (new, contacted, closed), add notes, and build a lightweight pipeline — no external CRM needed." },
  { icon: "⬇️", title: "XLSX + CSV Export", desc: "Download all your leads as a clean spreadsheet. Import directly into HubSpot, GoHighLevel, Mailchimp, or any CRM you already use." },
  { icon: "🔗", title: "Webhooks + API", desc: "Push new leads to Zapier, Make.com, or your own backend in real-time. Build custom integrations with the public REST API and signed webhooks." },
  { icon: "👥", title: "Team Seats + White-Label", desc: "Invite up to 5 team members, share lists, and generate white-label PDF reports for clients. Built for agencies managing multiple accounts." },
];

function FeatureCarousel({ onShowPricing }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const iv = setInterval(() => {
      setDir(1);
      setIdx(i => (i + 1) % FEATURES.length);
    }, 4500);
    return () => clearInterval(iv);
  }, []);

  function goTo(i) {
    setDir(i > idx ? 1 : -1);
    setIdx(i);
  }

  const f = FEATURES[idx];
  return (
    <div style={{marginTop:48,textAlign:"center"}}>
      <div style={{fontSize:11,fontFamily:"IBM Plex Mono",color:"var(--muted)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16}}>
        What&apos;s included with paid plans
      </div>
      <div style={{
        position:"relative",overflow:"hidden",
        maxWidth:520,margin:"0 auto",minHeight:140,
      }}>
        <div key={idx} style={{
          animation: `carouselSlide${dir > 0 ? "In" : "InR"} 0.4s ease`,
          padding:"24px 32px",borderRadius:14,border:"1px solid var(--border)",background:"var(--surface)",
        }}>
          <div style={{fontSize:32,marginBottom:10}}>{f.icon}</div>
          <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>{f.title}</div>
          <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.7,maxWidth:400,margin:"0 auto"}}>{f.desc}</div>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:16}}>
        {FEATURES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === idx ? 24 : 8, height:8, borderRadius:4,
            background: i === idx ? "var(--accent)" : "var(--border)",
            border:"none",cursor:"pointer",transition:"all 0.3s ease",padding:0,
          }} />
        ))}
      </div>
      <div style={{marginTop:20}}>
        <button className="btn btn-outline btn-sm" onClick={onShowPricing}>See All Plans &rarr;</button>
      </div>
    </div>
  );
}

export default function LeadReap({ apiBase = "", token, user, onLoginClick, onLogout, onCheckout, onRefreshAuth, onRunAudit, upgradedPlan, onDismissUpgrade }) {
  const API_BASE = apiBase;
  const [niche, setNiche] = useState(() => {
    // 1. Try to get it from ?niche=...
    let param = new URLSearchParams(window.location.search).get("niche");
    
    // 2. If no query param, try to get it from the path (e.g. /plumbers)
    if (!param && window.location.pathname !== "/" && !window.location.pathname.startsWith("/leads/")) {
       param = decodeURIComponent(window.location.pathname.replace("/", "")); 
    }

    if (!param) return "";
    
    // Clean up dashes (e.g. "roofing-contractors" -> "roofing contractors")
    const cleanParam = param.replace(/-/g, " ");

    const match = INDUSTRIES.find(i => 
      i.toLowerCase() === cleanParam.toLowerCase() || 
      i.toLowerCase() + "s" === cleanParam.toLowerCase() || 
      cleanParam.toLowerCase() + "s" === i.toLowerCase()
    );
    
    return match ? match : "custom";
  });
  
  const [location, setLocation] = useState("");
  const locationRef = useRef(null);
  
  const [customNiche, setCustomNiche] = useState(() => {
    let param = new URLSearchParams(window.location.search).get("niche");
    
    if (!param && window.location.pathname !== "/" && !window.location.pathname.startsWith("/leads/")) {
       param = decodeURIComponent(window.location.pathname.replace("/", "")); 
    }

    if (!param) return "";
    
    const cleanParam = param.replace(/-/g, " ");

    const match = INDUSTRIES.find(i => 
      i.toLowerCase() === cleanParam.toLowerCase() || 
      i.toLowerCase() + "s" === cleanParam.toLowerCase() || 
      cleanParam.toLowerCase() + "s" === i.toLowerCase()
    );
    
    // Capitalize custom niches nicely
    const formattedParam = cleanParam.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return match ? "" : formattedParam;
  });
  const [includeEmail, setIncludeEmail] = useState(true);
  const [includePhone, setIncludePhone] = useState(true);
  const [includeSocial, setIncludeSocial] = useState(false);
  const [leads, setLeads] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [showPricing, setShowPricing] = useState(false);
  const [pricingContext, setPricingContext] = useState(null); // null = generic, or "export" | "search_limit" | "save_list" | "enrichment" | "sequences" | "load_more"
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [toast, setToast] = useState(false);
  const isPro = user && user.plan !== "free";
  const [searchDone, setSearchDone] = useState(false);

  // Recent searches
  const [recentSearches, setRecentSearches] = useState([]);
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/leads/history`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      if (d.searches) setRecentSearches(d.searches);
    }).catch(() => {});
  }, [token, searchDone]);

  // Outreach template modal
  const [showOutreach, setShowOutreach] = useState(false);
  const [outreachLead, setOutreachLead] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // Dashboard
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);

  // Saved Lists
  const [showSaveToList, setShowSaveToList] = useState(false);
  const [dashLists, setDashLists] = useState([]);
  const [viewingListId, setViewingListId] = useState(null);

  // Sequences
  const [dashSequences, setDashSequences] = useState([]);
  const [viewingSequenceId, setViewingSequenceId] = useState(null);
  const [showSequenceBuilder, setShowSequenceBuilder] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);

  // Settings view (teams, webhooks, api keys)
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("team");
  const [teamData, setTeamData] = useState(null);
  const [webhooksData, setWebhooksData] = useState([]);
  const [apiKeysData, setApiKeysData] = useState([]);
  const [newApiKey, setNewApiKey] = useState(null);

  // Reports
  const [showReportModal, setShowReportModal] = useState(null);

  // Intent monitoring
  const [intentMonitors, setIntentMonitors] = useState([]);
  const [intentSignals, setIntentSignals] = useState([]);
  const [intentNewCount, setIntentNewCount] = useState(0);
  const [intentScanning, setIntentScanning] = useState(false);
  const [showIntentFeed, setShowIntentFeed] = useState(false);

  function loadDashLists() {
    if (!token) return;
    const endpoint = user?.plan === "agency" ? "/api/team/lists" : "/api/lists";
    fetch(`${API_BASE}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setDashLists(d.lists || []))
      .catch(() => {});
  }

  function loadSequences() {
    if (!token) return;
    fetch(`${API_BASE}/api/sequences`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setDashSequences(d.sequences || []))
      .catch(() => {});
  }

  function loadTeam() {
    if (!token) return;
    fetch(`${API_BASE}/api/team`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTeamData(d.team)).catch(() => {});
  }
  function loadWebhooks() {
    if (!token) return;
    fetch(`${API_BASE}/api/webhooks`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setWebhooksData(d.webhooks || [])).catch(() => {});
  }
  function loadApiKeys() {
    if (!token) return;
    fetch(`${API_BASE}/api/keys`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setApiKeysData(d.keys || [])).catch(() => {});
  }

  function loadIntentData() {
    if (!token || !isPro) return;
    fetch(`${API_BASE}/api/intent/monitors`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        setIntentMonitors(d.monitors || []);
        setIntentNewCount(d.newSignals || 0);
      }).catch(() => {});
  }
  function loadIntentSignals() {
    if (!token) return;
    fetch(`${API_BASE}/api/intent/signals?limit=50`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setIntentSignals(d.signals || [])).catch(() => {});
  }
  async function triggerIntentScan() {
    setIntentScanning(true);
    try {
      const res = await fetch(`${API_BASE}/api/intent/scan`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.newSignals > 0) loadIntentSignals();
      loadIntentData();
    } catch {}
    setIntentScanning(false);
  }

  function openDashboard() {
    setShowDashboard(true);
    setViewingListId(null);
    setViewingSequenceId(null);
    setShowSequenceBuilder(false);
    setEditingSequence(null);
    setShowSettings(false);
    setShowReportModal(null);
    setShowIntentFeed(false);
    setDashLoading(true);
    loadDashLists();
    loadSequences();
    if (isPro) loadIntentData();
    fetch(`${API_BASE}/api/account`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      setDashData(d);
      setDashLoading(false);
    }).catch(() => setDashLoading(false));
  }

  function openSettings(tab) {
    setShowSettings(true);
    setSettingsTab(tab || (user?.plan === "agency" ? "team" : "webhooks"));
    setNewApiKey(null);
    if (user?.plan !== "free") {
      loadTeam();
      loadWebhooks();
      loadApiKeys();
    }
  }

  async function dashRerun(search) {
    setShowDashboard(false);
    setNiche(INDUSTRIES.includes(search.niche) ? search.niche : "custom");
    if (!INDUSTRIES.includes(search.niche)) setCustomNiche(search.niche);
    setLocation(search.location);

    // If it has a jobId, fetch it instantly from permanent history!
    if (search.jobId) {
      setLoading(true);
      setSearchError("");
      try {
        const res = await fetch(`${API_BASE}/api/leads/history/${search.jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads || []);
          setTotalLeads(data.total || data.leads?.length || 0);
          setSearchDone(true);
          setExpandedRow(0);
          setLoading(false);
          return; // Exit early so we don't trigger a new scrape
        }
      } catch (e) {
        console.warn("Could not load from history, falling back to new search");
      }
    }

    // Fallback: Run a new search if history fetch failed or no jobId exists
    setTimeout(() => {
      handleSearch();
    }, 100);
  }

  // Google Places Autocomplete for location input
  useEffect(() => {
    const GMAPS_KEY = import.meta.env.VITE_GMAPS_KEY;
    if (!GMAPS_KEY || document.getElementById("gmaps-script")) return;
    const script = document.createElement("script");
    script.id = "gmaps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      if (!locationRef.current || !window.google?.maps?.places) return;
      const autocomplete = new window.google.maps.places.Autocomplete(locationRef.current, {
        types: ["(cities)"],
        componentRestrictions: { country: "us" },
      });
      // Use place_changed for autocomplete selection
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const val = place?.formatted_address || place?.name || locationRef.current.value;
        setLocation(val);
      });
      // Mark that Google is managing this input
      locationRef.current.dataset.gmaps = "true";
    };
    script.onerror = () => {
      // API failed to load (bad key, network, etc) — input still works normally
      console.warn("Google Maps API failed to load — location autocomplete disabled");
    };
    document.head.appendChild(script);
  }, []);

  // Animated niche cycling for demo preview
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoFade, setDemoFade] = useState(true);
  useEffect(() => {
    if (loading || searchDone) return;
    const iv = setInterval(() => {
      setDemoFade(false);
      setTimeout(() => {
        setDemoIndex(i => (i + 1) % DEMO_NICHES.length);
        setDemoFade(true);
      }, 500);
    }, 5000);
    return () => clearInterval(iv);
  }, [loading, searchDone]);
  const currentDemo = DEMO_DATA[DEMO_NICHES[demoIndex]];
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
          const t = isPro ? [5, 12, 22, 34] : [3, 8, 14, 22];
          if (attempts < t[0]) nextStep = 0;
          else if (attempts < t[1]) nextStep = 1;
          else if (attempts < t[2]) nextStep = 2;
          else if (attempts < t[3]) nextStep = 3;
          else nextStep = 4;
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
      setExpandedRow(0); // Auto-expand first result to show insight + outreach
    } catch (e) {
      console.error(e);
      setSearchDone(true);
      setSearchError(e.message || "Search failed \u2014 please try again");
    }
    setLoading(false);
  }

  async function handleLoadMore() {
    if (!isPro) { setPricingContext("load_more"); setShowPricing(true); return; }
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
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to start search");
      }
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
    if (!isPro) { setPricingContext("export"); setShowPricing(true); return; }
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
          <div className="logo" onClick={() => { setShowDashboard(false); setShowPricing(false); }} style={{cursor:"pointer"}}>
            <div className="logo-mark"><LogoMark /></div>
            <span>Lead<span>Reap</span></span>
          </div>
          <div className="nav-actions">
            {user ? (
              <>
                <span className="badge mono" style={{ background: isPro ? "rgba(34,197,94,0.12)" : undefined, color: isPro ? "#22c55e" : undefined, borderColor: isPro ? "rgba(34,197,94,0.3)" : undefined }}>
                  {user.plan.toUpperCase()}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={openDashboard} style={{fontFamily:"IBM Plex Mono",fontSize:12}}>Dashboard</button>
                <span className="nav-email" style={{ fontSize: 13, color: "var(--muted)", fontFamily: "IBM Plex Mono, monospace", cursor: "pointer" }} onClick={openDashboard}>{user.email}</span>
                <button className="btn btn-ghost btn-sm" onClick={onLogout}>Log out</button>
              </>
            ) : (
              <>
                <button className="btn btn-outline btn-sm" onClick={onLoginClick}>Log In</button>
                <button className="btn btn-primary btn-sm nav-cta" onClick={() => { setPricingContext(null); setShowPricing(true); }}>Get Full Access &rarr;</button>
              </>
            )}
          </div>
        </nav>

        {showDashboard ? (
          <div className="dash">
            <span className="dash-back" onClick={() => {
              if (showSequenceBuilder) { setShowSequenceBuilder(false); setEditingSequence(null); }
              else if (viewingSequenceId) { setViewingSequenceId(null); loadSequences(); }
              else if (showSettings) { setShowSettings(false); }
              else if (showIntentFeed) { setShowIntentFeed(false); loadIntentData(); }
              else if (viewingListId) { setViewingListId(null); }
              else { setShowDashboard(false); }
            }}>&larr; {showSequenceBuilder ? "Back to sequences" : viewingSequenceId ? "Back to dashboard" : showSettings ? "Back to dashboard" : showIntentFeed ? "Back to dashboard" : viewingListId ? "Back to dashboard" : "Back to search"}</span>

            {showSequenceBuilder ? (
              <SequenceBuilder
                apiBase={API_BASE}
                token={token}
                existing={editingSequence}
                onClose={() => { setShowSequenceBuilder(false); setEditingSequence(null); }}
                onSaved={() => { loadSequences(); }}
              />
            ) : viewingSequenceId ? (
              <SequenceDetailView
                sequenceId={viewingSequenceId}
                apiBase={API_BASE}
                token={token}
                onBack={() => { setViewingSequenceId(null); loadSequences(); }}
                lists={dashLists}
              />
            ) : showSettings ? (
              /* ── Settings Panel ────────────────── */
              <div className="settings-panel">
                <h3 style={{margin:"0 0 16px",fontSize:18,fontWeight:700}}>Settings</h3>
                <div className="settings-tabs">
                  {user?.plan === "agency" && <button className={`settings-tab ${settingsTab === "team" ? "active" : ""}`} onClick={() => setSettingsTab("team")}>Team</button>}
                  {user?.plan !== "free" && <button className={`settings-tab ${settingsTab === "webhooks" ? "active" : ""}`} onClick={() => setSettingsTab("webhooks")}>Webhooks</button>}
                  {user?.plan !== "free" && <button className={`settings-tab ${settingsTab === "api" ? "active" : ""}`} onClick={() => setSettingsTab("api")}>API Keys</button>}
                </div>

                {/* Team Management */}
                {settingsTab === "team" && user?.plan === "agency" && (
                  <div className="settings-section">
                    {!teamData ? (
                      <div>
                        <p style={{color:"var(--muted)",marginBottom:12}}>Create a team to share lists and leads with up to 5 team members.</p>
                        <button className="btn btn-primary" onClick={() => {
                          const name = prompt("Team name:");
                          if (name?.trim()) {
                            fetch(`${API_BASE}/api/team`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name }) })
                              .then(r => r.json()).then(() => loadTeam());
                          }
                        }}>Create Team</button>
                      </div>
                    ) : (
                      <div>
                        <div style={{fontWeight:700,fontSize:16,marginBottom:12}}>{teamData.name}</div>
                        <div className="settings-list">
                          {teamData.members?.map((m, i) => (
                            <div key={i} className="settings-list-item">
                              <div>
                                <div style={{fontWeight:600}}>{m.email}</div>
                                <div style={{fontSize:11,color:"var(--muted)"}}>{m.role === "owner" ? "Owner" : "Member"} &middot; {m.plan} plan</div>
                              </div>
                              {teamData.isOwner && m.role !== "owner" && (
                                <button className="btn btn-ghost btn-sm" style={{color:"#f87171"}} onClick={() => {
                                  if (confirm(`Remove ${m.email}?`)) {
                                    fetch(`${API_BASE}/api/team/members/${m.user_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).then(() => loadTeam());
                                  }
                                }}>Remove</button>
                              )}
                            </div>
                          ))}
                        </div>
                        {teamData.invites?.length > 0 && (
                          <div style={{marginTop:12}}>
                            <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>Pending Invites:</div>
                            {teamData.invites.map((inv, i) => (
                              <div key={i} style={{fontSize:13,color:"var(--accent)",padding:"4px 0"}}>{inv.email}</div>
                            ))}
                          </div>
                        )}
                        {teamData.isOwner && teamData.members?.length < 6 && (
                          <button className="btn btn-outline btn-sm" style={{marginTop:12}} onClick={() => {
                            const email = prompt("Email to invite:");
                            if (email?.trim()) {
                              fetch(`${API_BASE}/api/team/invite`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ email }) })
                                .then(r => r.json()).then(d => { if (d.ok) { loadTeam(); alert(`Invite sent to ${email}. Share this token: ${d.invite?.token}`); } });
                            }
                          }}>+ Invite Member</button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Webhooks */}
                {settingsTab === "webhooks" && (
                  <div className="settings-section">
                    <p style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>Webhooks fire when events happen (search completed, lead status changed). Use them to push data to your CRM.</p>
                    <div className="settings-list">
                      {webhooksData.map(h => (
                        <div key={h.id} className="settings-list-item">
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:600,fontSize:13,wordBreak:"break-all"}}>{h.url}</div>
                            <div style={{fontSize:11,color:"var(--muted)"}}>{h.events} &middot; {h.active ? "Active" : "Paused"}</div>
                          </div>
                          <div style={{display:"flex",gap:6}}>
                            <button className="btn btn-ghost btn-sm" onClick={() => {
                              fetch(`${API_BASE}/api/webhooks/${h.id}/toggle`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: !h.active }) }).then(() => loadWebhooks());
                            }}>{h.active ? "Pause" : "Enable"}</button>
                            <button className="btn btn-ghost btn-sm" style={{color:"#f87171"}} onClick={() => {
                              fetch(`${API_BASE}/api/webhooks/${h.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).then(() => loadWebhooks());
                            }}>&times;</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-outline btn-sm" style={{marginTop:12}} onClick={() => {
                      const url = prompt("Webhook URL (must be HTTPS):");
                      if (url?.trim()) {
                        fetch(`${API_BASE}/api/webhooks`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ url, events: "search.completed,lead.status_changed" }) })
                          .then(r => r.json()).then(d => {
                            if (d.ok) { loadWebhooks(); alert(`Webhook created!\n\nSigning secret: ${d.webhook.secret}\n\nSave this — it won't be shown again.`); }
                            else alert(d.error || "Failed");
                          });
                      }
                    }}>+ Add Webhook</button>
                    <div style={{marginTop:16,padding:12,background:"var(--surface2)",borderRadius:8,fontSize:11,color:"var(--muted)",lineHeight:1.6}}>
                      <strong>Events:</strong> search.completed, lead.status_changed, lead.added, sequence.completed, * (all)<br/>
                      <strong>Headers:</strong> X-LeadReap-Signature (HMAC-SHA256), X-LeadReap-Event<br/>
                      <strong>Compatible with:</strong> Zapier Webhooks, GoHighLevel, HubSpot Workflows, Make.com
                    </div>
                  </div>
                )}

                {/* API Keys */}
                {settingsTab === "api" && (
                  <div className="settings-section">
                    <p style={{fontSize:12,color:"var(--muted)",marginBottom:12}}>Use API keys to integrate LeadReap into your own tools and workflows.</p>
                    {newApiKey && (
                      <div style={{padding:12,background:"#22c55e11",border:"1px solid #22c55e44",borderRadius:8,marginBottom:16}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#22c55e",marginBottom:6}}>New API Key Created — Copy it now!</div>
                        <code style={{fontSize:13,color:"var(--text)",wordBreak:"break-all",fontFamily:"IBM Plex Mono"}}>{newApiKey}</code>
                        <div style={{fontSize:10,color:"var(--muted)",marginTop:6}}>This key won't be shown again.</div>
                      </div>
                    )}
                    <div className="settings-list">
                      {apiKeysData.map(k => (
                        <div key={k.id} className="settings-list-item">
                          <div>
                            <div style={{fontWeight:600,fontSize:13}}>{k.name}</div>
                            <div style={{fontSize:11,color:"var(--muted)",fontFamily:"IBM Plex Mono"}}>{k.key_prefix} &middot; {k.last_used ? `Last used ${new Date(k.last_used).toLocaleDateString()}` : "Never used"}</div>
                          </div>
                          <button className="btn btn-ghost btn-sm" style={{color:"#f87171"}} onClick={() => {
                            if (confirm(`Revoke key "${k.name}"?`)) {
                              fetch(`${API_BASE}/api/keys/${k.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).then(() => { loadApiKeys(); });
                            }
                          }}>Revoke</button>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-outline btn-sm" style={{marginTop:12}} onClick={() => {
                      const name = prompt("Key name (e.g., 'My CRM Integration'):") || "Default";
                      fetch(`${API_BASE}/api/keys`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name }) })
                        .then(r => r.json()).then(d => {
                          if (d.ok) { setNewApiKey(d.key); loadApiKeys(); }
                          else alert(d.error || "Failed");
                        });
                    }}>+ Create API Key</button>
                    <div style={{marginTop:16,padding:12,background:"var(--surface2)",borderRadius:8,fontSize:11,color:"var(--muted)",lineHeight:1.8}}>
                      <strong>Base URL:</strong> <code style={{color:"var(--accent)"}}>{API_BASE || window.location.origin}</code><br/>
                      <strong>Auth:</strong> <code>Authorization: Bearer lr_your_key</code><br/>
                      <strong>Endpoints:</strong><br/>
                      &nbsp;&nbsp;POST /api/v1/search — Start a search<br/>
                      &nbsp;&nbsp;GET /api/v1/search/:id — Poll results<br/>
                      &nbsp;&nbsp;GET /api/v1/lists — Get your lists<br/>
                      &nbsp;&nbsp;GET /api/v1/lists/:id/leads — Get leads from a list
                    </div>
                  </div>
                )}
              </div>
            ) : viewingListId ? (
              <ListDetailView
                listId={viewingListId}
                apiBase={API_BASE}
                token={token}
                onBack={() => { setViewingListId(null); loadDashLists(); }}
                onOutreach={(lead) => { setOutreachLead(lead); setShowOutreach(true); }}
                onRunAudit={onRunAudit}
              />
            ) : showIntentFeed ? (
              /* ── Intent Signal Feed ──────────────────── */
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                  <h3 style={{fontSize:18,fontWeight:700,margin:0}}>
                    🎯 Intent Signals
                    {intentNewCount > 0 && <span style={{marginLeft:8,fontSize:12,background:"rgba(240,180,41,0.12)",color:"var(--accent)",padding:"2px 8px",borderRadius:4,fontFamily:"IBM Plex Mono"}}>{intentNewCount} new</span>}
                  </h3>
                  <button className="btn btn-primary btn-sm" onClick={triggerIntentScan} disabled={intentScanning} style={{fontSize:12}}>
                    {intentScanning ? "Scanning..." : "Scan Now"}
                  </button>
                </div>
                <div style={{marginBottom:20,padding:"14px 16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:intentMonitors.length > 0 ? 12 : 0}}>
                    <span style={{fontSize:12,color:"var(--muted)",fontFamily:"IBM Plex Mono"}}>{intentMonitors.length} monitor{intentMonitors.length !== 1 ? "s" : ""} active</span>
                    <button className="btn btn-outline btn-sm" style={{fontSize:11,padding:"4px 12px"}} onClick={() => {
                      const name = prompt("Monitor name (e.g., 'Web Design Leads'):");
                      if (!name?.trim()) return;
                      const niches = prompt("Target niches, comma-separated (e.g., 'web design, marketing, SEO'):");
                      const nicheList = niches ? niches.split(",").map(n => n.trim()).filter(Boolean) : [];
                      fetch(`${API_BASE}/api/intent/monitors`, {
                        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ name, niches: nicheList, keywords: nicheList }),
                      }).then(r => r.json()).then(() => { loadIntentData(); loadIntentSignals(); });
                    }}>+ New Monitor</button>
                  </div>
                  {intentMonitors.map(m => (
                    <div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:"1px solid var(--border)",gap:8}}>
                      <div>
                        <span style={{fontSize:13,fontWeight:600}}>{m.name}</span>
                        <span style={{fontSize:11,color:"var(--muted)",marginLeft:8,fontFamily:"IBM Plex Mono"}}>{m.niches?.join(", ") || "general"}</span>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button className="btn btn-ghost btn-sm" style={{fontSize:11,padding:"2px 8px",color:m.active ? "var(--green)" : "var(--muted)"}} onClick={() => {
                          fetch(`${API_BASE}/api/intent/monitors/${m.id}/toggle`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: !m.active }) }).then(() => loadIntentData());
                        }}>{m.active ? "Active" : "Paused"}</button>
                        <button className="btn btn-ghost btn-sm" style={{fontSize:11,padding:"2px 8px",color:"var(--red)"}} onClick={() => {
                          if (confirm(`Delete monitor "${m.name}"?`)) fetch(`${API_BASE}/api/intent/monitors/${m.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).then(() => loadIntentData());
                        }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
                {intentSignals.length === 0 ? (
                  <div style={{textAlign:"center",padding:"48px 20px",color:"var(--muted)"}}>
                    <div style={{fontSize:32,marginBottom:12}}>🎯</div>
                    <p style={{fontSize:14,marginBottom:8}}>No intent signals yet</p>
                    <p style={{fontSize:12}}>Create a monitor and click "Scan Now" to find buy-ready leads on Reddit</p>
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {intentSignals.map(sig => (
                      <div key={sig.id} style={{
                        padding:"16px 20px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,
                        borderLeft:`3px solid ${sig.intent_score >= 70 ? "var(--green)" : sig.intent_score >= 50 ? "var(--accent)" : "var(--border)"}`,
                        opacity: sig.status === "dismissed" ? 0.4 : 1,
                      }}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:8}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                              <span style={{fontSize:11,fontFamily:"IBM Plex Mono",color:"var(--muted)",background:"var(--surface2)",padding:"2px 8px",borderRadius:4}}>r/{sig.subreddit}</span>
                              <span style={{fontSize:10,fontFamily:"IBM Plex Mono",color:"var(--muted)"}}>{Math.round(sig.hours_ago)}h ago</span>
                            </div>
                            <a href={sig.url} target="_blank" rel="noopener noreferrer" style={{fontSize:14,fontWeight:600,color:"var(--text)",textDecoration:"none",lineHeight:1.4,display:"block"}}>{sig.title}</a>
                            {sig.body && <p style={{fontSize:12,color:"var(--muted)",marginTop:6,lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{sig.body}</p>}
                          </div>
                          <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                            <div style={{
                              width:40,height:40,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:14,fontWeight:800,fontFamily:"IBM Plex Mono",
                              background:sig.intent_score >= 70 ? "rgba(34,197,94,0.1)" : sig.intent_score >= 50 ? "rgba(240,180,41,0.1)" : "var(--surface2)",
                              color:sig.intent_score >= 70 ? "var(--green)" : sig.intent_score >= 50 ? "var(--accent)" : "var(--muted)",
                              border:`1px solid ${sig.intent_score >= 70 ? "rgba(34,197,94,0.3)" : sig.intent_score >= 50 ? "rgba(240,180,41,0.3)" : "var(--border)"}`,
                            }}>{sig.intent_score}</div>
                            <span style={{fontSize:9,color:"var(--muted)",fontFamily:"IBM Plex Mono"}}>INTENT</span>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                          {sig.matched_niches?.map((n, i) => <span key={i} style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(240,180,41,0.08)",color:"var(--accent)",fontFamily:"IBM Plex Mono",fontWeight:600}}>{n}</span>)}
                          {sig.matched_phrases?.slice(0, 2).map((p, i) => <span key={`p${i}`} style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"var(--surface2)",color:"var(--muted)",fontFamily:"IBM Plex Mono",fontStyle:"italic"}}>"{p}"</span>)}
                        </div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <a href={sig.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{fontSize:11,padding:"5px 14px",textDecoration:"none"}}>Reply on Reddit ↗</a>
                          {sig.status === "new" && <button className="btn btn-ghost btn-sm" style={{fontSize:11,padding:"5px 10px"}} onClick={() => {
                            fetch(`${API_BASE}/api/intent/signals/${sig.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: "viewed" }) }).then(() => loadIntentSignals());
                          }}>Mark Read</button>}
                          <button className="btn btn-ghost btn-sm" style={{fontSize:11,padding:"5px 10px",color:"var(--muted)"}} onClick={() => {
                            fetch(`${API_BASE}/api/intent/signals/${sig.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: "dismissed" }) }).then(() => loadIntentSignals());
                          }}>Dismiss</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : dashLoading ? (
              <div style={{textAlign:"center",padding:"60px 0",color:"var(--muted)"}}>Loading dashboard...</div>
            ) : dashData ? (
              <>
                <div className="dash-header">
                  <div>
                    <div className="dash-greeting">Welcome back<span>,</span> {dashData.email?.split("@")[0]}</div>
                    <div style={{fontSize:13,color:"var(--muted)",fontFamily:"IBM Plex Mono",marginTop:4}}>{dashData.email}</div>
                  </div>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span className={`dash-plan ${dashData.plan === "free" ? "dash-plan-free" : "dash-plan-pro"}`}>
                      {dashData.plan?.toUpperCase()} PLAN
                    </span>
                    {dashData.plan === "free" && (
                      <button className="btn btn-primary btn-sm" onClick={() => { setShowDashboard(false); setPricingContext(null); setShowPricing(true); }}>Upgrade</button>
                    )}
                    {dashData.plan && dashData.plan !== "free" && dashData.plan !== "agency" && (
                      <button className="btn btn-outline btn-sm" style={{fontSize:11}} onClick={() => { setShowDashboard(false); setPricingContext(null); setShowPricing(true); }}>Upgrade Plan</button>
                    )}
                  </div>
                </div>

                <div className="dash-stats">
                  <div className="dash-stat">
                    <div className="dash-stat-label">Total Searches</div>
                    <div className="dash-stat-value">{dashData.stats?.totalSearches || 0}</div>
                  </div>
                  <div className="dash-stat">
                    <div className="dash-stat-label">Leads Found</div>
                    <div className="dash-stat-value" style={{color:"var(--accent)"}}>{dashData.stats?.totalLeads || 0}</div>
                  </div>
                  <div className="dash-stat">
                    <div className="dash-stat-label">Searches Today</div>
                    <div className="dash-stat-value">{dashData.searchesToday || 0}</div>
                  </div>
                </div>

                {/* Free user upgrade nudge */}
                {dashData.plan === "free" && (
                  <div style={{
                    padding:"12px 16px",borderRadius:8,marginBottom:16,
                    border:"1px solid var(--border)",background:"var(--surface)",
                    display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",
                  }}>
                    <span style={{fontSize:13,color:"var(--muted)"}}>
                      You're on the free plan &mdash; <span style={{color:"var(--text)"}}>upgrade for unlimited leads, export, and sequences</span>
                    </span>
                    <button className="btn btn-outline btn-sm" style={{fontSize:12}} onClick={() => { setShowDashboard(false); setPricingContext(null); setShowPricing(true); }}>
                      See Plans
                    </button>
                  </div>
                )}

                {/* Paid user upgrade nudge (Starter → Pro, Pro → Agency) */}
                {dashData.plan === "starter" && (
                  <div className="dash-upgrade-card">
                    <div className="upgrade-info">
                      <div className="upgrade-title">Upgrade to Pro &mdash; just $100</div>
                      <div className="upgrade-desc">Unlimited leads, email sequences, AI pitch writer, enrichment data, intent monitoring, and webhooks</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => onCheckout?.("pro")}>Upgrade &rarr;</button>
                  </div>
                )}
                {dashData.plan === "pro" && (
                  <div className="dash-upgrade-card">
                    <div className="upgrade-info">
                      <div className="upgrade-title">Upgrade to Agency &mdash; just $200</div>
                      <div className="upgrade-desc">Team seats, white-label PDF reports, proposal generator, public API, and shared lists</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => onCheckout?.("agency")}>Upgrade &rarr;</button>
                  </div>
                )}

                <div className="dash-actions">
                  <button className="btn btn-primary" onClick={() => { setShowDashboard(false); document.querySelector('.field select')?.focus(); }}>
                    New Search &rarr;
                  </button>
                  {dashData.plan !== "free" && (
                    <button className="btn btn-outline" onClick={() => { setShowDashboard(false); if (leads.length > 0) handleExport(); }}>
                      Export Last Results
                    </button>
                  )}
                  {dashData.plan !== "free" && (
                    <button className="btn btn-ghost" onClick={() => openSettings("team")} style={{fontSize:13}}>
                      ⚙ Settings
                    </button>
                  )}
                </div>

                {dashData.stats?.topNiches?.length > 0 && (
                  <div className="dash-section">
                    <div className="dash-section-title">Your Top Niches</div>
                    <div className="dash-niches">
                      {dashData.stats.topNiches.map((n, i) => (
                        <span key={i} className="dash-niche" onClick={() => dashRerun({ niche: n.niche, location: "" })} style={{cursor:"pointer"}}>
                          {n.niche}<strong>&times;{n.count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* My Lists */}
                <div className="dash-section">
                  <div className="dash-section-title">📋 My Lists</div>
                  <div className="lists-grid">
                    {dashLists.map(l => (
                      <div key={l.id} className="list-card" onClick={() => setViewingListId(l.id)}>
                        <button className="list-card-delete" onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Delete "${l.name}" and all its leads?`)) {
                            fetch(`${API_BASE}/api/lists/${l.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
                              .then(() => setDashLists(prev => prev.filter(x => x.id !== l.id)));
                          }
                        }}>&times;</button>
                        <div className="list-card-name">{l.name}</div>
                        <div className="list-card-desc">{l.description || "No description"}</div>
                        <div className="list-card-meta">
                          <span><strong>{l.leadCount}</strong> leads</span>
                          <span>{new Date(l.updatedAt || l.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        </div>
                        {user?.plan === "agency" && l.leadCount > 0 && (
                          <button className="btn btn-ghost btn-sm" style={{fontSize:10,marginTop:6,width:"100%",justifyContent:"center",color:"var(--accent)"}} onClick={e => {
                            e.stopPropagation();
                            setShowReportModal(l);
                          }}>📄 Generate Report</button>
                        )}
                      </div>
                    ))}
                    <div className="list-card new-list-card" onClick={() => {
                      const name = prompt("New list name:");
                      if (name && name.trim()) {
                        fetch(`${API_BASE}/api/lists`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ name }),
                        }).then(r => r.json()).then(d => {
                          if (d.list) setDashLists(prev => [d.list, ...prev]);
                        });
                      }
                    }}>
                      + New List
                    </div>
                  </div>
                </div>

                {/* My Sequences */}
                <div className="dash-section">
                  <div className="dash-section-title">📧 My Sequences</div>
                  <div className="lists-grid">
                    {dashSequences.map(s => (
                      <div key={s.id} className="list-card seq-card" onClick={() => setViewingSequenceId(s.id)}>
                        <button className="list-card-delete" onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Delete sequence "${s.name}"? All enrollments will be cancelled.`)) {
                            fetch(`${API_BASE}/api/sequences/${s.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
                              .then(() => setDashSequences(prev => prev.filter(x => x.id !== s.id)));
                          }
                        }}>&times;</button>
                        <div className="list-card-name">{s.name}</div>
                        <div className="list-card-desc">
                          {s.stepCount} steps &middot; {s.enrolledCount} enrolled
                          {s.activeCount > 0 && <span style={{color:"var(--accent)"}}> &middot; {s.activeCount} active</span>}
                        </div>
                        <div className="list-card-meta">
                          <span className={`status-tag status-${s.status === "active" ? "new" : "closed"}`} style={{fontSize:11}}>{s.status}</span>
                          <span>
                            {s.stats?.sent ? `${s.stats.sent} sent` : "No sends yet"}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="list-card new-list-card" onClick={() => {
                      if (user?.plan === "free") { setShowDashboard(false); setPricingContext("sequences"); setShowPricing(true); return; }
                      setShowSequenceBuilder(true);
                      setEditingSequence(null);
                    }}>
                      {user?.plan === "free" ? "🔒 " : "+ "}New Sequence
                    </div>
                  </div>
                </div>

                {/* Intent Signals */}
                {isPro && (
                  <div className="dash-section">
                    <div className="dash-section-title">
                      🎯 Intent Signals
                      {intentNewCount > 0 && (
                        <span style={{marginLeft:8,fontSize:11,background:"rgba(240,180,41,0.12)",color:"var(--accent)",padding:"2px 8px",borderRadius:4,fontFamily:"IBM Plex Mono",fontWeight:600}}>{intentNewCount} new</span>
                      )}
                    </div>
                    <div className="lists-grid">
                      <div className="list-card" onClick={() => { setShowIntentFeed(true); loadIntentSignals(); }} style={{borderLeft:"3px solid var(--accent)"}}>
                        <div className="list-card-name">Reddit Monitoring</div>
                        <div className="list-card-desc">
                          {intentMonitors.length} monitor{intentMonitors.length !== 1 ? "s" : ""}
                          {intentNewCount > 0 && <span style={{color:"var(--accent)"}}> &middot; {intentNewCount} new signals</span>}
                        </div>
                        <div className="list-card-meta">
                          <span style={{fontSize:11,color:"var(--muted)"}}>Find buy-ready leads in real-time</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="dash-section">
                  <div className="dash-section-title">Search History</div>
                  {dashData.stats?.recentSearches?.length > 0 ? (
                    <div className="dash-history">
                      {dashData.stats.recentSearches.map((s, i) => (
                        <div key={i} className="dash-history-item" onClick={() => dashRerun(s)}>
                          <div>
                            <div className="dash-history-niche">{s.niche}</div>
                            <div className="dash-history-location">{s.location}</div>
                          </div>
                          <div className="dash-history-meta">
                            <div className="dash-history-leads">{s.leadCount} leads</div>
                            <div className="dash-history-time">{new Date(s.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="dash-empty">
                      <p>No searches yet. Run your first search to see history here.</p>
                      <button className="btn btn-primary" onClick={() => setShowDashboard(false)}>Start Searching &rarr;</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{textAlign:"center",padding:"60px 0",color:"var(--muted)"}}>Could not load dashboard data.</div>
            )}
          </div>
        ) : (
        <>
        <div className="hero">
          <div className="hero-tag"><div className="dot" /> AI-POWERED LOCAL LEAD PLATFORM</div>
          <h1 className="hero-desktop">Find, score, and close<br /><em>local business</em> leads</h1>
          <h1 className="hero-mobile">Find &amp; close <em>local</em> leads faster</h1>
          <p>Search any niche, any city. Get verified emails, AI-written pitches, site audits, intent signals from Reddit, and revenue estimates &mdash; all in one platform.</p>
          <div className="hero-stats">
            <div className="stat"><div className="stat-num">80+</div><div className="stat-label">Built-in niches</div></div>
            <div className="stat"><div className="stat-num">94%</div><div className="stat-label">Email accuracy</div></div>
            <div className="stat"><div className="stat-num">$0/mo</div><div className="stat-label">No subscriptions</div></div>
            <div className="stat"><div className="stat-num">30s</div><div className="stat-label">Avg search time</div></div>
          </div>
        </div>

        <div className="niche-ticker">
          <div className="ticker-track">
            {[...INDUSTRIES, ...INDUSTRIES].map((n, i) => (
              <span key={i} className="ticker-item" onClick={() => { setNiche(INDUSTRIES.includes(n) ? n : "custom"); if (!INDUSTRIES.includes(n)) setCustomNiche(n); }} style={{cursor:"pointer"}}>{n}</span>
            ))}
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
                <input ref={locationRef} 
                  value={location} 
                  onChange={e => setLocation(e.target.value)} 
                  onBlur={e => { if (locationRef.current) setLocation(locationRef.current.value); }}
                  placeholder="City, State &mdash; e.g. Austin, TX" 
                  autoComplete="off" />
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
            {recentSearches.length > 0 && !searchDone && !loading && (
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,flexWrap:"wrap"}}>
                <span style={{fontSize:11,color:"var(--muted)",fontFamily:"IBM Plex Mono"}}>Recent:</span>
                {recentSearches.slice(0, 5).map((s, i) => (
                  <button key={i} onClick={() => { setNiche(s.niche); setLocation(s.location); }}
                    style={{fontSize:11,fontFamily:"IBM Plex Mono",padding:"3px 10px",borderRadius:100,
                      border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",
                      cursor:"pointer",transition:"all 0.15s"}}
                    onMouseEnter={e => { e.target.style.borderColor="var(--accent)"; e.target.style.color="var(--accent)"; }}
                    onMouseLeave={e => { e.target.style.borderColor="var(--border)"; e.target.style.color="var(--muted)"; }}
                  >
                    {s.niche} · {s.location.split(",")[0]} ({s.leadCount})
                  </button>
                ))}
              </div>
            )}
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
            <div style={{
              display: "flex", gap: 12, marginBottom: 16,
              padding: "10px 16px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--surface)",
              alignItems: "center", justifyContent: "space-between", flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>
                Showing <strong style={{ color: "var(--text)" }}>{visibleLeads.length} of {displayTotal}</strong> leads &mdash; upgrade to see all results + export
              </span>
              <button className="btn btn-outline btn-sm" style={{fontSize:12}} onClick={() => { setPricingContext("load_more"); setShowPricing(true); }}>See Plans</button>
            </div>
          )}

          {!loading && searchDone && searchError && (
            <div className="search-card" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
              <div className="empty-state" style={{ padding: "40px 20px" }}>
                <div className="empty-icon">&#9888;&#65039;</div>
                <div className="empty-title" style={{ color: "#f87171" }}>{searchError}</div>
                <div className="empty-sub">
                  {searchError.includes("limit") || searchError.includes("Rate")
                    ? <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setPricingContext("search_limit"); setShowPricing(true); }}>Upgrade for Unlimited Searches &rarr;</button>
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
                  <button className="btn btn-outline btn-sm" onClick={handleSearch}>↻ Refresh</button>
                  {user && (
                    <button className="btn btn-outline btn-sm" onClick={() => isPro ? setShowSaveToList(true) : (setPricingContext("save_list"), setShowPricing(true))}>
                      💾 {isPro ? "Save to List" : "Save to List"}
                    </button>
                  )}
                  <button className="btn btn-green btn-sm" onClick={handleExport}>
                    ⬇ {isPro ? "Export CSV" : "Export CSV"}
                  </button>
                </div>
              </div>

              <div className="desktop-table">

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
                        <th style={{width:36}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLeads.map((lead, i) => (
                        <React.Fragment key={i}>
                        <tr className="row-expandable" onClick={() => setExpandedRow(expandedRow === i ? null : i)}>
                          <td style={{color:"var(--muted)",fontSize:12,fontFamily:"IBM Plex Mono"}}>{String(i+1).padStart(2,"0")}</td>
                          <td>
                            <div className="name-cell">{lead.name}</div>
                            <div style={{fontSize:11,color:"var(--muted)",marginTop:2,fontFamily:"IBM Plex Mono"}}>{lead.address}</div>
                            {includeSocial && (lead.linkedinCompany || lead.linkedinPerson || lead.facebook || lead.instagram || lead.twitter) && (
                              <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
                                {lead.linkedinCompany && <a href={lead.linkedinCompany} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#0a66c2",textDecoration:"none"}} onClick={e => e.stopPropagation()}>LinkedIn</a>}
                                {lead.linkedinPerson && <a href={lead.linkedinPerson} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#0a66c2",textDecoration:"none"}} onClick={e => e.stopPropagation()}>{lead.ownerName ? `in/${lead.ownerName}` : "LinkedIn Owner"}</a>}
                                {lead.facebook && <a href={lead.facebook} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#1877f2",textDecoration:"none"}} onClick={e => e.stopPropagation()}>Facebook</a>}
                                {lead.instagram && <a href={lead.instagram} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#e1306c",textDecoration:"none"}} onClick={e => e.stopPropagation()}>Instagram</a>}
                                {lead.twitter && <a href={lead.twitter} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:"#1da1f2",textDecoration:"none"}} onClick={e => e.stopPropagation()}>X/Twitter</a>}
                              </div>
                            )}
                          </td>
                          {includeEmail && <td className="email-cell">
                            {lead.email ? <>{lead.email}{lead.emailVerified && <span className="email-verified" title="Mail server verified">Verified</span>}</> : "\u2014"}
                          </td>}
                          {includePhone && <td className="phone-cell">{lead.phoneDisplay || lead.phone || "\u2014"}</td>}
                          <td className="site-cell">
                            {lead.website ? <>
                              <a href={lead.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>{lead.website.replace(/^https?:\/\/(www\.)?/, "")}</a>
                              {onRunAudit && user?.plan === "agency" && (
                                <span className="audit-badge" onClick={e => { e.stopPropagation(); onRunAudit(lead.website); }}>AUDIT</span>
                              )}
                            </> : "\u2014"}
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
                          <td style={{textAlign:"center"}} className={i === 0 && expandedRow === 0 ? "chevron-hint" : ""}><span style={{display:"inline-block",color:"var(--muted)",fontSize:14,transition:"transform 0.2s",transform:expandedRow === i ? "rotate(90deg)" : "rotate(0)"}}>&#9656;</span></td>
                        </tr>
                        {expandedRow === i && (
                          <tr className={`expand-row ${i === 0 ? "expand-peek" : ""}`}>
                            <td colSpan={99}>
                              <div className="expand-content">
                                <div className="expand-insight">
                                  <strong style={{color:"var(--text)",fontSize:11,fontFamily:"IBM Plex Mono",letterSpacing:"0.03em"}}>INSIGHT:</strong> {lead.notes}
                                </div>
                                {lead.enrichment && (
                                  <div className={`enrichment-row ${!isPro ? "enrichment-locked" : ""}`}>
                                    <div className="enrichment-chip">
                                      <span className="enrichment-label">Revenue</span>
                                      <span className="enrichment-value">{lead.enrichment.revenueRange}</span>
                                    </div>
                                    <div className="enrichment-chip">
                                      <span className="enrichment-label">Employees</span>
                                      <span className="enrichment-value">{lead.enrichment.employeeRange}</span>
                                    </div>
                                    {lead.enrichment.yearsInBusiness != null && (
                                      <div className="enrichment-chip">
                                        <span className="enrichment-label">Years</span>
                                        <span className="enrichment-value">{lead.enrichment.yearsInBusiness}+</span>
                                      </div>
                                    )}
                                    {lead.enrichment.signals?.length > 0 && lead.enrichment.signals.slice(0, 3).map((s, si) => (
                                      <span key={si} className="enrichment-signal">{s}</span>
                                    ))}
                                    {!isPro && (
                                      <span className="enrichment-unlock" onClick={(e) => { e.stopPropagation(); setPricingContext("enrichment"); setShowPricing(true); }}>🔒 Upgrade to unlock</span>
                                    )}
                                  </div>
                                )}
                                <div className="expand-actions">
                                  {lead.email && lead.email !== "\u2014" ? (
                                    <button onClick={(e) => { e.stopPropagation(); setOutreachLead(lead); setShowOutreach(true); }}
                                      className="btn btn-primary btn-sm" style={{fontSize:12,whiteSpace:"nowrap"}}>
                                      Send Outreach ↗
                                    </button>
                                  ) : (
                                    <span style={{fontSize:11,color:"var(--muted)",fontFamily:"IBM Plex Mono"}}>No email found</span>
                                  )}
                                  <span style={{fontSize:11,color:"var(--border)"}}>|</span>
                                  {lead.website && (
                                    <a href={lead.website} target="_blank" rel="noopener noreferrer"
                                      style={{fontSize:11,color:"var(--muted)",textDecoration:"none",fontFamily:"IBM Plex Mono"}}
                                      onMouseEnter={e => e.target.style.color="var(--accent)"}
                                      onMouseLeave={e => e.target.style.color="var(--muted)"}
                                      onClick={e => e.stopPropagation()}>
                                      Website
                                    </a>
                                  )}
                                  {lead.mapsUrl && (
                                    <a href={lead.mapsUrl} target="_blank" rel="noopener noreferrer"
                                      style={{fontSize:11,color:"var(--muted)",textDecoration:"none",fontFamily:"IBM Plex Mono"}}
                                      onMouseEnter={e => e.target.style.color="var(--accent)"}
                                      onMouseLeave={e => e.target.style.color="var(--muted)"}
                                      onClick={e => e.stopPropagation()}>
                                      Google Maps
                                    </a>
                                  )}
                                  {onRunAudit && user?.plan === "agency" && lead.website && (
                                    <span className="audit-badge" onClick={e => { e.stopPropagation(); onRunAudit(lead.website); }}>🔍 AUDIT</span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>

              {/* Mobile card layout */}
              <div className={`mobile-cards ${!isPro ? "lock-overlay" : ""}`}>
                {visibleLeads.map((lead, i) => (
                  <div key={i} className={`mobile-card ${expandedRow === i ? "expanded" : ""} ${i === 0 && expandedRow === 0 ? "peek-card" : ""}`} onClick={() => setExpandedRow(expandedRow === i ? null : i)}>
                    <div className="mobile-card-top">
                      <div>
                        <div className="mobile-card-name">{lead.name}</div>
                        <div className="mobile-card-addr">{lead.address}</div>
                      </div>
                      <div className="mobile-card-score">
                        <span className={`score-pill ${scoreToClass(lead.score)}`}>{lead.score}/100</span>
                        <span style={{display:"block",textAlign:"center",color:"var(--muted)",fontSize:12,marginTop:4,transition:"transform 0.2s",transform:expandedRow === i ? "rotate(90deg)" : "rotate(0)"}}>&#9656;</span>
                      </div>
                    </div>
                    <div className="mobile-card-fields">
                      {includeEmail && (
                        <div className="mobile-card-field">
                          <label>Email</label>
                          <span style={{color: lead.email ? "var(--accent)" : "var(--muted)"}}>
                            {lead.email || "\u2014"}
                          </span>
                          {lead.email && lead.emailVerified && (
                            <span className="email-verified" style={{marginLeft:0,marginTop:3,display:"inline-block"}}>Verified</span>
                          )}
                        </div>
                      )}
                      {includePhone && (
                        <div className="mobile-card-field">
                          <label>Phone</label>
                          <span>{lead.phoneDisplay || lead.phone || "\u2014"}</span>
                        </div>
                      )}
                      <div className="mobile-card-field">
                        <label>Website</label>
                        {lead.website ? <a href={lead.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>{lead.website.replace(/^https?:\/\/(www\.)?/, "")}</a> : <span style={{color:"var(--muted)"}}>{"\u2014"}</span>}
                      </div>
                      <div className="mobile-card-field">
                        <label>Rating</label>
                        <span>{"\u2605"} {lead.rating || "\u2014"}</span>
                      </div>
                    </div>
                    <div className="mobile-card-badges">
                      {lead.unclaimed && <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"#f59e0b22",color:"#f59e0b",fontWeight:600}}>UNCLAIMED</span>}
                      {includeSocial && lead.facebook && <span style={{fontSize:10,color:"#1877f2"}}>Facebook</span>}
                      {includeSocial && lead.instagram && <span style={{fontSize:10,color:"#e1306c"}}>Instagram</span>}
                      {includeSocial && lead.linkedinCompany && <span style={{fontSize:10,color:"#0a66c2"}}>LinkedIn</span>}
                    </div>
                    {expandedRow === i && (
                      <div className="mobile-card-expand">
                        <div className="mobile-card-insight">
                          <strong style={{color:"var(--text)"}}>Insight:</strong> {lead.notes}
                        </div>
                        {lead.enrichment && (
                          <div className={`enrichment-row ${!isPro ? "enrichment-locked" : ""}`} style={{marginTop:8}}>
                            <div className="enrichment-chip">
                              <span className="enrichment-label">Revenue</span>
                              <span className="enrichment-value">{lead.enrichment.revenueRange}</span>
                            </div>
                            <div className="enrichment-chip">
                              <span className="enrichment-label">Employees</span>
                              <span className="enrichment-value">{lead.enrichment.employeeRange}</span>
                            </div>
                            {lead.enrichment.signals?.length > 0 && lead.enrichment.signals.slice(0, 2).map((s, si) => (
                              <span key={si} className="enrichment-signal">{s}</span>
                            ))}
                            {!isPro && (
                              <span className="enrichment-unlock" onClick={(e) => { e.stopPropagation(); setPricingContext("enrichment"); setShowPricing(true); }}>🔒 Upgrade</span>
                            )}
                          </div>
                        )}
                        <div className="mobile-card-actions">
                          {lead.email && lead.email !== "\u2014" ? (
                            <button onClick={(e) => { e.stopPropagation(); setOutreachLead(lead); setShowOutreach(true); }}
                              className="btn btn-primary btn-sm" style={{fontSize:12,flex:1,justifyContent:"center"}}>
                              Send Outreach ↗
                            </button>
                          ) : (
                            <span style={{fontSize:11,color:"var(--muted)",fontFamily:"IBM Plex Mono",padding:"8px 0"}}>No email found</span>
                          )}
                        </div>
                        <div style={{display:"flex",gap:16,marginTop:8,alignItems:"center"}}>
                          {lead.website && (
                            <a href={lead.website} target="_blank" rel="noopener noreferrer"
                              style={{fontSize:11,color:"var(--muted)",textDecoration:"none",fontFamily:"IBM Plex Mono"}}
                              onClick={e => e.stopPropagation()}>
                              Website ↗
                            </a>
                          )}
                          {lead.mapsUrl && (
                            <a href={lead.mapsUrl} target="_blank" rel="noopener noreferrer"
                              style={{fontSize:11,color:"var(--muted)",textDecoration:"none",fontFamily:"IBM Plex Mono"}}
                              onClick={e => e.stopPropagation()}>
                              Google Maps ↗
                            </a>
                          )}
                          {onRunAudit && user?.plan === "agency" && lead.website && (
                            <span className="audit-badge" onClick={e => { e.stopPropagation(); onRunAudit(lead.website); }}>AUDIT</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!isPro ? (
                <>
                  {/* Subtle blurred ghost rows */}
                  <div style={{position:"relative",overflow:"hidden"}}>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} style={{padding:"12px 20px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",filter:"blur(5px)",opacity:0.4,userSelect:"none"}}>
                        <div style={{display:"flex",gap:24,alignItems:"center"}}>
                          <span style={{fontFamily:"IBM Plex Mono",fontSize:12,color:"var(--muted)"}}>{String(visibleLeads.length + i + 1).padStart(2,"0")}</span>
                          <div><div style={{fontWeight:600,fontSize:13}}>Business Name Here</div><div style={{fontSize:11,color:"var(--muted)"}}>123 Main St, {location || "City, ST"}</div></div>
                        </div>
                        <span className="score-pill score-high" style={{fontSize:11}}>85/100</span>
                      </div>
                    ))}
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 10%, var(--bg) 95%)",pointerEvents:"none"}} />
                  </div>
                  <div className="upgrade-bar">
                    <p>
                      {displayTotal - visibleLeads.length > 0
                        ? <><strong style={{color:"var(--text)"}}>{displayTotal - visibleLeads.length} more leads</strong> available</>
                        : <>Upgrade for unlimited leads</>
                      }
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={() => { setPricingContext("load_more"); setShowPricing(true); }}>See Plans &rarr;</button>
                  </div>
                </>
              ) : (
                <div className="upgrade-bar">
                  <p style={{color:"var(--muted)"}}>Showing <strong style={{color:"var(--text)"}}>{leads.length} leads</strong> &middot; Batch {batchNum}</p>
                  <button className={`btn btn-outline btn-sm ${loadingMore ? "btn-loading-sweep" : ""}`} onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? "Loading more..." : "Load More Results"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Mobile Landing Content (hidden on desktop via CSS) ── */}
          {!loading && !searchDone && (
            <div className="m-landing">

              {/* Social proof numbers */}
              <div className="m-proof">
                <div className="m-proof-item">
                  <div className="m-proof-num">80+</div>
                  <div className="m-proof-label">Niches</div>
                </div>
                <div className="m-proof-item">
                  <div className="m-proof-num">94%</div>
                  <div className="m-proof-label">Email accuracy</div>
                </div>
                <div className="m-proof-item">
                  <div className="m-proof-num">30s</div>
                  <div className="m-proof-label">Avg search</div>
                </div>
              </div>

              {/* How it works */}
              <div className="m-section-label">How it works</div>
              <div className="m-how">
                <div className="m-how-step">
                  <div className="m-how-num">1</div>
                  <div className="m-how-text">
                    <div className="m-how-title">Pick a niche + city</div>
                    <div className="m-how-desc">Choose from 47 built-in niches or enter a custom one</div>
                  </div>
                </div>
                <div className="m-how-step">
                  <div className="m-how-num">2</div>
                  <div className="m-how-text">
                    <div className="m-how-title">We scrape Google Maps live</div>
                    <div className="m-how-desc">Real-time data — emails, phones, websites, ratings, and more</div>
                  </div>
                </div>
                <div className="m-how-step">
                  <div className="m-how-num">3</div>
                  <div className="m-how-text">
                    <div className="m-how-title">Export and start outreach</div>
                    <div className="m-how-desc">Download CSV, send email sequences, or push to your CRM</div>
                  </div>
                </div>
              </div>

              {/* Popular niches */}
              <div className="m-niches">
                <div className="m-section-label">Popular niches</div>
                <div className="m-niche-grid">
                  {["Plumber", "Dentist", "Roofer", "HVAC", "Real Estate", "Chiropractor", "Law Firm", "Med Spa", "Restaurant"].map(n => (
                    <div key={n} className="m-niche-chip" onClick={() => {
                      const match = INDUSTRIES.find(ind => ind.toLowerCase().includes(n.toLowerCase()));
                      if (match) setNiche(match);
                      else { setNiche("custom"); setCustomNiche(n); }
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}>{n}</div>
                  ))}
                </div>
              </div>

              {/* Sample results preview */}
              <div className="m-demo">
                <div className="m-section-label">Example results</div>
                <div className="m-demo-cards">
                  {currentDemo.leads.slice(0, 3).map((lead, i) => (
                    <div key={i} className="m-demo-card">
                      <div className="m-demo-card-left">
                        <div className="m-demo-card-name">{lead.name}</div>
                        <div className="m-demo-card-meta">
                          {lead.email !== "\u2014" ? lead.email : lead.phone}
                          {lead.unclaimed && " · UNCLAIMED"}
                        </div>
                      </div>
                      <div className="m-demo-card-right">
                        <span className={`score-pill ${scoreToClass(lead.score)}`} style={{fontSize:11}}>{lead.score}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{textAlign:"center",padding:"6px 0",fontSize:11,color:"var(--muted)",fontFamily:"IBM Plex Mono"}}>
                    + {currentDemo.leads.length - 3} more results...
                  </div>
                </div>
              </div>

              {/* Feature highlights */}
              <div className="m-features">
                <div className="m-section-label">What you get</div>
                <div className="m-feat-list">
                  <div className="m-feat">
                    <div className="m-feat-icon">✨</div>
                    <div className="m-feat-text">
                      <div className="m-feat-title">AI pitch writer</div>
                      <div className="m-feat-desc">Personalized cold emails based on each lead's actual data</div>
                    </div>
                  </div>
                  <div className="m-feat">
                    <div className="m-feat-icon">🎯</div>
                    <div className="m-feat-text">
                      <div className="m-feat-title">Reddit intent signals</div>
                      <div className="m-feat-desc">Find people actively looking for your services</div>
                    </div>
                  </div>
                  <div className="m-feat">
                    <div className="m-feat-icon">🔍</div>
                    <div className="m-feat-text">
                      <div className="m-feat-title">Site audit engine</div>
                      <div className="m-feat-desc">10-point diagnostic with ready-to-use sales angles</div>
                    </div>
                  </div>
                  <div className="m-feat">
                    <div className="m-feat-icon">📧</div>
                    <div className="m-feat-text">
                      <div className="m-feat-title">Email sequences</div>
                      <div className="m-feat-desc">3-step automated outreach on autopilot</div>
                    </div>
                  </div>
                  <div className="m-feat">
                    <div className="m-feat-icon">📊</div>
                    <div className="m-feat-text">
                      <div className="m-feat-title">Lead enrichment</div>
                      <div className="m-feat-desc">Revenue, employees, tech stack, GBP signals</div>
                    </div>
                  </div>
                  <div className="m-feat">
                    <div className="m-feat-icon">📄</div>
                    <div className="m-feat-text">
                      <div className="m-feat-title">Proposal generator</div>
                      <div className="m-feat-desc">Branded PDF proposals from lead data</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="m-bottom-cta">
                <h3>Try it now — it's free</h3>
                <p>Search any niche in any city. No credit card, no signup required for your first search.</p>
                <button className="btn btn-primary" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => document.querySelector('.field select')?.focus(), 400); }}>
                  Start Your First Search &rarr;
                </button>
                <div className="m-sub">One-time purchase &middot; No subscription &middot; 30-day guarantee</div>
              </div>

            </div>
          )}

          {!loading && !searchDone && (
            <div className="demo-section">
              <div className="demo-header">
                <span className="demo-label" style={{transition:"opacity 0.5s ease", opacity: demoFade ? 1 : 0}}>
                  Example: &quot;{DEMO_NICHES[demoIndex]}&quot; in {currentDemo.city}
                </span>
                <span className="count-tag" style={{opacity:0.5}}>{"\u2713"} 20 leads found</span>
              </div>
              <div className="demo-wrap" style={{transition:"opacity 0.5s ease", opacity: demoFade ? 1 : 0}}>
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
                      {currentDemo.leads.map((lead, i) => (
                        <tr key={`${demoIndex}-${i}`} style={{opacity: 1 - (i * 0.08)}}>
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

              {/* Auto-rotating feature carousel */}
              <FeatureCarousel onShowPricing={() => { setPricingContext(null); setShowPricing(true); }} />

              {/* Platform differentiators — desktop only */}
              <div style={{marginTop:48,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,maxWidth:900,marginLeft:"auto",marginRight:"auto"}}>
                <div style={{padding:"24px",borderRadius:14,border:"1px solid var(--border)",background:"var(--surface)",textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:10}}>🧠</div>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>AI-Powered Outreach</div>
                  <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.6}}>
                    AI writes personalized pitches referencing each lead's actual website, reviews, and gaps. Plus automated email sequences.
                  </div>
                </div>
                <div style={{padding:"24px",borderRadius:14,border:"1px solid var(--border)",background:"var(--surface)",textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:10}}>🎯</div>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>Buy-Ready Intent Signals</div>
                  <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.6}}>
                    Monitor Reddit for people actively looking for your services. Spot businesses hiring for marketing. Find stale listings and new openings.
                  </div>
                </div>
                <div style={{padding:"24px",borderRadius:14,border:"1px solid var(--border)",background:"var(--surface)",textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:10}}>🔍</div>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>Audit &amp; Close</div>
                  <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.6}}>
                    Run site audits that generate sales angles automatically. Create branded PDF proposals. Turn cold leads into warm pitches.
                  </div>
                </div>
              </div>

              <div style={{textAlign:"center",marginTop:32,marginBottom:16}}>
                <div style={{fontSize:12,color:"var(--muted)",fontFamily:"IBM Plex Mono",lineHeight:1.7}}>
                  Everything your competitors charge <span style={{color:"var(--accent)"}}>$100+/month</span> for &mdash; yours with a one-time purchase.
                </div>
              </div>
            </div>
          )}
        </div>
        </>
        )}

        <footer className="footer">
          <div className="footer-left">&copy; 2026 LeadReap</div>
          <div className="footer-right">
            <span className="footer-link" onClick={() => setShowPrivacy(true)}>Privacy</span>
            <span className="footer-link" onClick={() => setShowTerms(true)}>Terms</span>
            <span className="footer-link" onClick={() => { setPricingContext(null); setShowPricing(true); }}>Pricing</span>
          </div>
        </footer>
      </div>

      {showPricing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPricing(false)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowPricing(false)}>&times;</button>

            {/* Context-aware headline */}
            {pricingContext === "export" ? (
              <>
                <h2>Export your leads to CSV</h2>
                <p>Download all {displayTotal || "your"} leads as a spreadsheet — with emails, phone numbers, scores, and enrichment data.</p>
              </>
            ) : pricingContext === "search_limit" ? (
              <>
                <h2>You've hit the free search limit</h2>
                <p>Unlock unlimited searches — pull as many leads as you need, any niche, any city.</p>
              </>
            ) : pricingContext === "save_list" ? (
              <>
                <h2>Save leads to organized lists</h2>
                <p>Build a pipeline — save, tag, track status, and add notes to every lead.</p>
              </>
            ) : pricingContext === "enrichment" ? (
              <>
                <h2>Unlock revenue &amp; employee estimates</h2>
                <p>See estimated revenue, employee count, and business signals for every lead you find.</p>
              </>
            ) : pricingContext === "sequences" ? (
              <>
                <h2>Automate your outreach</h2>
                <p>Set up 3-step email sequences that send automatically — turn leads into clients on autopilot.</p>
              </>
            ) : pricingContext === "load_more" ? (
              <>
                <h2>Unlock all {displayTotal || ""} leads</h2>
                <p>You're seeing a preview. Get every lead with full contact data, AI scoring, and export tools.</p>
              </>
            ) : (
              <>
                <h2>One-time. No subscription.</h2>
                <p>Pay once, use forever. Every plan includes lifetime access + free updates.</p>
              </>
            )}

            {/* Social proof bar */}
            <div style={{display:"flex",justifyContent:"center",gap:24,padding:"14px 0 28px",borderBottom:"1px solid var(--border)",marginBottom:28,flexWrap:"wrap"}}>
              <span style={{fontSize:12,color:"var(--muted)",fontFamily:"IBM Plex Mono"}}>
                <span style={{color:"var(--green)",fontWeight:700}}>4.9/5</span> avg rating
              </span>
              <span style={{fontSize:12,color:"var(--muted)",fontFamily:"IBM Plex Mono"}}>
                <span style={{color:"var(--accent)",fontWeight:700}}>2,400+</span> leads found today
              </span>
              <span style={{fontSize:12,color:"var(--muted)",fontFamily:"IBM Plex Mono"}}>
                <span style={{color:"var(--text)",fontWeight:700}}>30-day</span> money-back guarantee
              </span>
            </div>

            <div className="pricing-grid">
              {[
                {
                  name: "STARTER", planId: "starter", price: 97, note: "one-time payment",
                  features: ["250 leads/month", "5 niches", "XLSX + CSV export", "Email + phone data", "Saved lists", "Email support"],
                  featured: false
                },
                {
                  name: "PRO", planId: "pro", price: 197, note: "one-time payment",
                  features: ["Unlimited leads", "All niches + custom", "XLSX + CSV export", "Lead enrichment data", "AI pitch writer", "Email sequences", "Intent monitoring", "Webhooks + integrations", "Priority support"],
                  featured: true, badge: "MOST POPULAR"
                },
                {
                  name: "AGENCY", planId: "agency", price: 397, note: "one-time payment",
                  features: ["Everything in Pro", "Team seats (up to 5)", "White-label PDF reports", "Proposal generator", "Public API access", "Shared team lists", "Dedicated support"],
                  featured: false
                }
              ].map((plan, i) => {
                const currentPlan = user?.plan;
                const planOrder = { free: 0, starter: 1, pro: 2, agency: 3 };
                const isCurrent = currentPlan === plan.planId;
                const isDowngrade = (planOrder[currentPlan] || 0) > (planOrder[plan.planId] || 0);
                const isUpgrade = currentPlan && currentPlan !== "free" && !isCurrent && !isDowngrade;
                const priceDiffs = { starter: { pro: 100, agency: 300 }, pro: { agency: 200 } };
                const upgradePrice = isUpgrade ? priceDiffs[currentPlan]?.[plan.planId] : null;

                return (
                <div key={i} className={`plan-card ${plan.featured ? "featured" : ""}`} style={isCurrent ? {borderColor:"var(--green)",opacity:0.8} : isDowngrade ? {opacity:0.5,pointerEvents:"none"} : {}}>
                  {isCurrent && <div className="plan-badge" style={{background:"var(--green)",color:"#000"}}>CURRENT PLAN</div>}
                  {plan.badge && !isCurrent && <div className="plan-badge">{plan.badge}</div>}
                  <div className="plan-name">{plan.name}</div>
                  {upgradePrice ? (
                    <>
                      <div className="plan-price"><sup>$</sup>{upgradePrice}</div>
                      <div className="plan-note" style={{color:"var(--green)"}}>pro-rated upgrade</div>
                    </>
                  ) : (
                    <>
                      <div className="plan-price"><sup>$</sup>{plan.price}</div>
                      <div className="plan-note">{plan.note}</div>
                    </>
                  )}
                  <div className="plan-features">
                    {plan.features.map((f, j) => (
                      <div key={j} className="plan-feature">
                        <span className="check-icon">{"\u2713"}</span> {f}
                      </div>
                    ))}
                  </div>
                  {isCurrent ? (
                    <button className="btn btn-outline" style={{width:"100%",justifyContent:"center",opacity:0.5,cursor:"default"}} disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button
                      className={`btn ${plan.featured ? "btn-primary" : "btn-outline"}`}
                      style={{width:"100%", justifyContent:"center"}}
                      onClick={() => handleUnlock(plan.planId)}
                    >
                      {upgradePrice ? `Upgrade for $${upgradePrice}` : `Get ${plan.name} Access`} &rarr;
                    </button>
                  )}
                </div>
                );
              })}
            </div>

            {/* Value anchor + guarantee */}
            <div style={{marginTop:32,textAlign:"center"}}>
              <div style={{display:"inline-flex",gap:8,alignItems:"center",padding:"10px 20px",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:10,marginBottom:16}}>
                <span style={{fontSize:18}}>🛡</span>
                <span style={{fontSize:13,color:"var(--text)",fontWeight:600}}>30-Day Money-Back Guarantee</span>
                <span style={{fontSize:12,color:"var(--muted)"}}>&mdash; no questions asked</span>
              </div>
              <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.7}}>
                Secure checkout via Stripe &middot; Instant access after purchase<br />
                <span style={{color:"var(--accent)"}}>Other tools charge $100+/month.</span> LeadReap is a one-time purchase.
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">✓ {showSaveToList ? "Saved to list!" : isPro && !leads.length ? "Upgraded to PRO!" : isPro ? "CSV downloaded!" : "Welcome to PRO!"}</div>
      )}

      {showOutreach && outreachLead && (() => {
        const templates = getOutreachTemplates(outreachLead);
        return (
          <OutreachModal
            templates={templates}
            lead={outreachLead}
            onClose={() => { setShowOutreach(false); setOutreachLead(null); }}
            apiBase={API_BASE}
            token={token}
          />
        );
      })()}

      {showSaveToList && leads.length > 0 && (
        <SaveToListModal
          leads={leads}
          apiBase={API_BASE}
          token={token}
          onClose={() => setShowSaveToList(false)}
          onSaved={(listId, listName) => {
            setToast(true);
            setTimeout(() => setToast(false), 3000);
          }}
        />
      )}

      {showReportModal && (() => {
        const ReportModal = () => {
          const [agencyName, setAgencyName] = useState("");
          const [clientName, setClientName] = useState("");
          const [rNiche, setRNiche] = useState("");
          const [rLocation, setRLocation] = useState("");
          const [contactEmail, setContactEmail] = useState(user?.email || "");
          const [contactPhone, setContactPhone] = useState("");
          const [generating, setGenerating] = useState(false);

          async function handleGenerate() {
            setGenerating(true);
            try {
              const res = await fetch(`${API_BASE}/api/reports/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  listId: showReportModal.id,
                  agencyName: agencyName || "Market Intelligence",
                  clientName, niche: rNiche || "Local Businesses",
                  location: rLocation || "",
                  contactEmail, contactPhone,
                }),
              });
              if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `report-${showReportModal.name}.pdf`;
                a.click(); URL.revokeObjectURL(url);
                setShowReportModal(null);
              } else {
                alert("Report generation failed");
              }
            } catch (e) { alert("Error: " + e.message); }
            setGenerating(false);
          }

          return (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowReportModal(null)}>
              <div className="save-modal" style={{maxWidth:500}}>
                <button style={{position:"absolute",top:16,right:16,background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:18}} onClick={() => setShowReportModal(null)}>&times;</button>
                <h3 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Generate White-Label Report</h3>
                <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>PDF report for "{showReportModal.name}" ({showReportModal.leadCount} leads)</p>

                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Your agency / company name" style={{padding:"10px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13}} />
                  <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client name (optional)" style={{padding:"10px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13}} />
                  <div style={{display:"flex",gap:8}}>
                    <input value={rNiche} onChange={e => setRNiche(e.target.value)} placeholder="Niche (e.g., Plumbers)" style={{flex:1,padding:"10px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13}} />
                    <input value={rLocation} onChange={e => setRLocation(e.target.value)} placeholder="Location" style={{flex:1,padding:"10px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13}} />
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Your contact email" style={{flex:1,padding:"10px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13}} />
                    <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Phone (optional)" style={{flex:1,padding:"10px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13}} />
                  </div>
                </div>

                <button className="btn btn-primary" style={{width:"100%",marginTop:16}} onClick={handleGenerate} disabled={generating}>
                  {generating ? "Generating PDF..." : "Download Report PDF"}
                </button>
              </div>
            </div>
          );
        };
        return <ReportModal />;
      })()}

      {showPrivacy && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPrivacy(false)}>
          <div className="legal-modal">
            <button className="legal-close" onClick={() => setShowPrivacy(false)}>&times;</button>
            <h2>Privacy Policy</h2>
            <div className="legal-updated">Last updated: March 1, 2026</div>
            <h3>Information We Collect</h3>
            <p>LeadReap collects your email address when you create an account, payment information processed securely through Stripe, and search queries you perform within the platform. We do not sell, share, or distribute your personal information to third parties.</p>
            <h3>How We Use Your Data</h3>
            <p>Your email is used solely for account authentication (magic link login) and important service communications. Search data is used to deliver results and improve our scraping accuracy. We do not send marketing emails unless you explicitly opt in.</p>
            <h3>Data from Searches</h3>
            <p>Business information returned by LeadReap (names, phone numbers, emails, websites) is sourced from publicly available data on Google Maps and business websites. LeadReap does not create or fabricate contact data. Users are responsible for complying with applicable laws (including CAN-SPAM and GDPR) when using scraped data for outreach.</p>
            <h3>Data Security</h3>
            <p>Sessions are secured with encrypted tokens. Payment processing is handled entirely by Stripe — we never store your credit card information. Search result caches are stored temporarily and automatically purged.</p>
            <h3>Your Rights</h3>
            <p>You may request deletion of your account and all associated data at any time by contacting us. Upon deletion, all personal data including search history will be permanently removed.</p>
            <h3>Contact</h3>
            <p>For privacy-related questions, reach out to us at privacy@leadreap.com.</p>
          </div>
        </div>
      )}

      {showTerms && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowTerms(false)}>
          <div className="legal-modal">
            <button className="legal-close" onClick={() => setShowTerms(false)}>&times;</button>
            <h2>Terms of Service</h2>
            <div className="legal-updated">Last updated: March 1, 2026</div>
            <h3>Service Description</h3>
            <p>LeadReap is a lead generation tool that searches publicly available business information from Google Maps and business websites. We provide data aggregation and scoring — we do not guarantee the accuracy, completeness, or deliverability of any contact information returned.</p>
            <h3>Acceptable Use</h3>
            <p>You agree to use LeadReap for lawful business purposes only. You are solely responsible for how you use the data obtained through our service, including compliance with CAN-SPAM, GDPR, CCPA, and any other applicable regulations. Automated mass scraping beyond normal usage, reselling raw data, or using the service for harassment is prohibited.</p>
            <h3>Accounts &amp; Billing</h3>
            <p>Free accounts include limited searches per day with capped results. Paid plans are one-time purchases processed securely through Stripe. You receive lifetime access immediately upon payment. Refunds are available within 30 days of purchase if you are unsatisfied.</p>
            <h3>Intellectual Property</h3>
            <p>The LeadReap platform, scoring algorithms, and interface are proprietary. Data returned by searches is sourced from public information and is not owned by LeadReap. You may use search results for your own business purposes.</p>
            <h3>Limitation of Liability</h3>
            <p>LeadReap is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use of our service, including but not limited to lost revenue, bounced emails, or inaccurate data. Our total liability shall not exceed the amount you paid in the preceding 12 months.</p>
            <h3>Changes</h3>
            <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance. Material changes will be communicated via email.</p>
            <h3>Contact</h3>
            <p>For questions about these terms, contact us at support@leadreap.com.</p>
          </div>
        </div>
      )}

      {/* UPGRADE CELEBRATION */}
      {upgradedPlan && (
        <div className="celebration-overlay" onClick={e => e.target === e.currentTarget && onDismissUpgrade?.()}>
          {/* Confetti particles */}
          {[...Array(20)].map((_, i) => (
            <div key={i} className="celebration-confetti" style={{
              left: `${10 + Math.random() * 80}%`,
              background: ["#f0b429","#22c55e","#e85d04","#3b82f6","#a855f7"][i % 5],
              animationDelay: `${0.2 + Math.random() * 0.6}s`,
              animationDuration: `${1 + Math.random() * 1}s`,
              width: `${3 + Math.random() * 4}px`,
              height: `${8 + Math.random() * 8}px`,
            }} />
          ))}
          <div className="celebration-card">
            <div className="celebration-emoji">🎉</div>
            <div className="celebration-title">
              Welcome to <span className="celebration-plan">{upgradedPlan.toUpperCase()}</span>
            </div>
            <div className="celebration-sub">
              {upgradedPlan === "agency"
                ? "You now have full access to the entire LeadReap platform — team seats, API, white-label reports, and everything else."
                : upgradedPlan === "pro"
                ? "You've unlocked unlimited leads, email sequences, enrichment data, and all the tools to grow your business."
                : "You've unlocked more leads, CSV export, and the tools to start closing more clients."
              }
            </div>
            <div className="celebration-features">
              {(upgradedPlan === "agency"
                ? ["Unlimited Leads", "Team Seats", "API Access", "PDF Reports", "Email Sequences"]
                : upgradedPlan === "pro"
                ? ["Unlimited Leads", "Email Sequences", "Lead Enrichment", "Webhooks", "CSV Export"]
                : ["250 Leads/mo", "CSV Export", "Saved Lists", "Email + Phone"]
              ).map((f, i) => (
                <span key={i} className="celebration-feat">{f}</span>
              ))}
            </div>
            <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",fontSize:16,padding:"14px 0"}} onClick={() => { onDismissUpgrade?.(); onRefreshAuth?.(); }}>
              Start Using {upgradedPlan.charAt(0).toUpperCase() + upgradedPlan.slice(1)} &rarr;
            </button>
          </div>
        </div>
      )}
    </>
  );
}
