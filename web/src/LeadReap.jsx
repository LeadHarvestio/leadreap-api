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
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* AUDIT BADGE */
  .audit-badge { 
    background: rgba(240, 180, 41, 0.1); 
    border: 1px solid rgba(240, 180, 41, 0.3); 
    color: var(--accent); 
    border-radius: 6px; 
    padding: 4px 8px; 
    font-size: 11px; 
    font-weight: 700; 
    cursor: pointer; 
    transition: all 0.2s;
    margin-left: 8px;
  }
  .audit-badge:hover { background: rgba(240, 180, 41, 0.2); }

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
  _ to { opacity: 1; transform: translateX(0); }
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
  @media (max-width: 768px) {
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

function OutreachModal({ templates, lead, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const [subject, setSubject] = useState(templates[0]?.subject || "");
  const [body, setBody] = useState(templates[0]?.body || "");
  const [copied, setCopied] = useState(false);

  function selectTemplate(idx) {
    setActiveTab(idx);
    setSubject(templates[idx].subject);
    setBody(templates[idx].body);
    setCopied(false);
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

function ListDetailView({ listId, apiBase, token, onBack, onOutreach }) {
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
      { stepNumber: 3, subject: "Last note — {{business}}", body: "Hi,\n\nI don't want to be a pest, so this will be my last note. If you're ever looking for help with [your service], feel free to reach out.\n\nWishing {{
