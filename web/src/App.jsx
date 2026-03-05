import { useState, useEffect, useCallback } from "react";
import LeadReap from "./LeadReap";
import NicheLandingPage from "./NicheLandingPage";
import ApolloAlternative from "./ApolloAlternative"; // <-- ADD THIS LINE
import { useState, useEffect, useCallback } from "react";
import LeadReap from "./LeadReap";
import NicheLandingPage from "./NicheLandingPage"; // <-- ADDED IMPORT

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

  // 1. Check for the Apollo Comparison Page
  if (path === '/compare/apollo' || path === '/compare/apollo/') {
    return <ApolloAlternative />;
  }

  // 2. Check for Niche Landing Pages
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
            borderRadius: 20, padding: 48, maxWidth: 440, width: "100%",
            position: "relative", fontFamily: "Syne, sans-serif", color: "#e8e8f0",
          }}>
            <button
              onClick={() => setShowLogin(false)}
              style={{
                position: "absolute", top: 16, right: 16, background: "#18181d",
                border: "1px solid #2a2a35", color: "#6b6b80", width: 32, height: 32,
                borderRadius: 8, cursor: "pointer", fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >×</button>

            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: -1 }}>
              {loginStep === "email" ? "Log in to LeadReap" : "Enter your code"}
            </h2>
            <p style={{ color: "#6b6b80", marginBottom: 32, fontSize: 14 }}>
              {loginStep === "email"
                ? "We'll send you a magic login link — no password needed."
                : `We sent a code to ${loginEmail}. Check your email (and spam).`
              }
            </p>

            {loginError && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171", padding: "10px 16px", borderRadius: 8, marginBottom: 16,
                fontSize: 13, fontFamily: "IBM Plex Mono, monospace",
              }}>{loginError}</div>
            )}

            {loginStep === "email" ? (
              <>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && requestMagicLink()}
                  style={{
                    width: "100%", background: "#18181d", border: "1px solid #2a2a35",
                    borderRadius: 10, padding: "14px 16px", fontSize: 15,
                    fontFamily: "IBM Plex Mono, monospace", color: "#e8e8f0",
                    outline: "none", marginBottom: 16, boxSizing: "border-box",
                  }}
                  autoFocus
                />
                <button
                  onClick={requestMagicLink}
                  disabled={loginLoading}
                  style={{
                    width: "100%", background: "#f0b429", color: "#000",
                    border: "none", borderRadius: 10, padding: "14px 0",
                    fontSize: 15, fontWeight: 700, cursor: loginLoading ? "wait" : "pointer",
                    fontFamily: "Syne, sans-serif",
                  }}
                >
                  {loginLoading ? "Sending..." : "Send Login Code →"}
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter 8-character code"
                  value={loginCode}
                  onChange={e => setLoginCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && verifyCode()}
                  maxLength={8}
                  style={{
                    width: "100%", background: "#18181d", border: "1px solid #2a2a35",
                    borderRadius: 10, padding: "14px 16px", fontSize: 22,
                    fontFamily: "IBM Plex Mono, monospace", color: "#f0b429",
                    outline: "none", marginBottom: 16, letterSpacing: 4,
                    textAlign: "center", boxSizing: "border-box",
                  }}
                  autoFocus
                />
                <button
                  onClick={() => verifyCode()}
                  disabled={loginLoading || loginCode.length < 6}
                  style={{
                    width: "100%", background: "#f0b429", color: "#000",
                    border: "none", borderRadius: 10, padding: "14px 0",
                    fontSize: 15, fontWeight: 700, cursor: loginLoading ? "wait" : "pointer",
                    fontFamily: "Syne, sans-serif",
                    opacity: loginCode.length < 6 ? 0.5 : 1,
                  }}
                >
                  {loginLoading ? "Verifying..." : "Verify & Log In →"}
                </button>
                <button
                  onClick={() => { setLoginStep("email"); setLoginError(""); }}
                  style={{
                    width: "100%", background: "transparent", border: "1px solid #2a2a35",
                    color: "#6b6b80", borderRadius: 10, padding: "12px 0",
                    fontSize: 13, cursor: "pointer", marginTop: 10,
                    fontFamily: "Syne, sans-serif",
                  }}
                >
                  ← Try a different email
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
