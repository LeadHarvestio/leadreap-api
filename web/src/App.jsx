import { useState, useEffect, useCallback } from "react";
import LeadReap from "./LeadReap";
import NicheLandingPage from "./NicheLandingPage";
import ApolloAlternative from "./ApolloAlternative";

// In dev, Vite proxies /api to localhost:3001
// In production, set this to your Railway URL
const API_BASE = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("lh_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginStep, setLoginStep] = useState("email"); // email | code | done
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ─── Check session on mount ────────────────────────────────
  const checkAuth = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
      } else {
        localStorage.removeItem("lh_token");
        setToken(null);
      }
    } catch {
      // API not reachable — keep token, will retry
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // ─── Handle magic link from URL (e.g. /login?code=ABC123) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const plan = params.get("plan"); // from post-payment redirect

    if (code) {
      verifyCode(code);
      window.history.replaceState({}, "", "/");
    }
    if (plan) {
      // User returned from successful payment — refresh their auth
      checkAuth();
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // ─── Request magic link ────────────────────────────────────
  async function requestMagicLink() {
    if (!loginEmail.includes("@")) { setLoginError("Enter a valid email"); return; }
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/magic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = await res.json();
      if (data.ok) {
        setLoginStep("code");
      } else {
        setLoginError(data.error || "Failed to send login email");
      }
    } catch {
      setLoginError("Network error — is the backend running?");
    }
    setLoginLoading(false);
  }

  // ─── Verify magic code ─────────────────────────────────────
  async function verifyCode(codeOverride) {
    const code = codeOverride || loginCode;
    if (!code) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("lh_token", data.token);
        setToken(data.token);
        setUser(data.user);
        setShowLogin(false);
        setLoginStep("email");
        setLoginCode("");
        setLoginEmail("");
      } else {
        setLoginError(data.error || "Invalid code");
      }
    } catch {
      setLoginError("Network error");
    }
    setLoginLoading(false);
  }

  // ─── Logout ────────────────────────────────────────────────
  async function logout() {
    if (token) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("lh_token");
    setToken(null);
    setUser(null);
  }

  // ─── Checkout (redirect to LemonSqueezy / Stripe) ───────────────────
  async function handleCheckout(plan) {
    try {
      const res = await fetch(`${API_BASE}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan, email: user?.email || loginEmail }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Checkout failed — try again");
      }
    } catch {
      alert("Network error — is the backend running?");
    }
  }

  // ─── Render ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#0a0a0b", color: "#f0b429",
        fontFamily: "Syne, sans-serif", fontSize: 20,
      }}>
        Loading...
      </div>
    );
  }

  // ─── ROUTING LOGIC ADDED HERE ───
  const path = window.location.pathname;
  
  // 1. The Apollo Alternative page
  if (path === '/compare/apollo' || path === '/compare/apollo/') {
    return <ApolloAlternative />;
  }

  // 2. The SEO Niche pages
  if (path.startsWith('/leads/')) {
    const slug = path.replace('/leads/', '').replace(/\/$/, '');
    if (slug) {
      // Show the SEO Landing Page
      return <NicheLandingPage slug={slug} />;
    }
  }

  // ─── MAIN APP RENDER ───
  return (
    <>
      <LeadReap
        apiBase={API_BASE}
        token={token}
        user={user}
        onLoginClick={() => setShowLogin(true)}
        onLogout={logout}
        onCheckout={handleCheckout}
        onRefreshAuth={checkAuth}
      />

      {/* LOGIN MODAL */}
      {showLogin && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999, padding: 20,
          }}
          onClick={e => e.target === e.currentTarget && setShowLogin(false)}
        >
          <div style={{
            background: "#111114", border: "1px solid #2a2a35",
            borderRadius: 20,
