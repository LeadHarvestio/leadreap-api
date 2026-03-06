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

  // Audit state
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

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

  // ─── Checkout (redirect to Stripe) ───────────────────
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

  // ─── Audit Engine ─────────────────────────────────────────
  async function handleRunAudit(url) {
    if (!url) return;
    setAuditLoading(true);
    setAuditData(null);
    setShowAuditModal(true);
    try {
      const res = await fetch(`${API_BASE}/api/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        setShowAuditModal(false);
      } else {
        setAuditData(data);
      }
    } catch {
      alert("Audit failed. The site may be down or blocking requests.");
      setShowAuditModal(false);
    }
    setAuditLoading(false);
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
        onRunAudit={handleRunAudit}
      />

      {/* AUDIT RESULTS MODAL */}
      {showAuditModal && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.9)",
          display:"flex", alignItems:"flex-start", justifyContent:"center",
          zIndex:1000, padding:"40px 20px", backdropFilter:"blur(10px)",
          WebkitBackdropFilter:"blur(10px)", overflowY:"auto",
        }} onClick={e => e.target === e.currentTarget && setShowAuditModal(false)}>
          <div style={{
            background:"#111114", border:"1px solid #2a2a35",
            borderRadius:20, padding:"40px", maxWidth:680, width:"100%",
            position:"relative", fontFamily:"Syne, sans-serif", color:"#e8e8f0",
            flexShrink:0,
          }}>
            <button onClick={() => setShowAuditModal(false)} style={{
              position:"absolute",top:20,right:20,background:"#18181d",
              border:"1px solid #2a2a35",color:"#6b6b80",width:32,height:32,
              borderRadius:8,cursor:"pointer",fontSize:18,display:"flex",
              alignItems:"center",justifyContent:"center",
            }}>×</button>

            {auditLoading ? (
              <div style={{textAlign:"center",padding:"60px 0"}}>
                <div style={{fontSize:32,marginBottom:12}}>🔍</div>
                <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>Analyzing site...</h2>
                <p style={{color:"#6b6b80",fontSize:14}}>Running a 6-point SEO &amp; tech diagnostic</p>
              </div>
            ) : auditData ? (
              <div id="audit-report-content">
                <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:28}}>
                  <div style={{
                    width:72,height:72,borderRadius:36,
                    border:`4px solid ${auditData.score >= 70 ? "#22c55e" : auditData.score >= 40 ? "#f0b429" : "#ef4444"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:24,fontWeight:800,flexShrink:0,
                  }}>{auditData.score}</div>
                  <div>
                    <h2 style={{fontSize:20,fontWeight:800,marginBottom:4}}>Site Audit Report</h2>
                    <p style={{color:"#6b6b80",fontSize:13,fontFamily:"IBM Plex Mono, monospace",wordBreak:"break-all"}}>{auditData.url}</p>
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
                  {[
                    { label: "SSL Security", pass: auditData.tech.ssl },
                    { label: "H1 Header", pass: auditData.seo.h1 },
                    { label: "SEO Title", pass: auditData.seo.title },
                    { label: "Meta Description", pass: auditData.seo.description },
                    { label: "Facebook Pixel", pass: auditData.tech.pixel },
                    { label: "Google Analytics", pass: auditData.tech.analytics },
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding:"12px 16px",background:"#18181d",border:"1px solid #2a2a35",
                      borderRadius:10,display:"flex",alignItems:"center",justifyContent:"space-between",
                    }}>
                      <span style={{fontSize:13,color:"#a1a1aa"}}>{item.label}</span>
                      <span style={{color:item.pass ? "#22c55e" : "#ef4444",fontWeight:700,fontSize:12,fontFamily:"IBM Plex Mono"}}>
                        {item.pass ? "✓ PASS" : "✕ FAIL"}
                      </span>
                    </div>
                  ))}
                </div>

                {auditData.salesAngles?.length > 0 && (
                  <div style={{
                    background:"rgba(240,180,41,0.04)",border:"1px solid rgba(240,180,41,0.15)",
                    borderRadius:14,padding:20,marginBottom:20,
                  }}>
                    <h3 style={{fontSize:14,fontWeight:700,color:"#f0b429",marginBottom:12,fontFamily:"IBM Plex Mono"}}>
                      SALES ANGLES
                    </h3>
                    {auditData.salesAngles.map((angle, i) => (
                      <div key={i} style={{marginBottom:i < auditData.salesAngles.length - 1 ? 12 : 0}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#e8e8f0",marginBottom:2}}>{angle.issue}</div>
                        <div style={{fontSize:12,color:"#a1a1aa",lineHeight:1.6,fontStyle:"italic"}}>"{angle.hook}"</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{fontSize:11,color:"#6b6b80",textAlign:"center",fontFamily:"IBM Plex Mono",marginTop:8}}>
                  Audited {new Date(auditData.checkedAt).toLocaleString()}
                </div>
              </div>

                <button onClick={async () => {
                  try {
                    const html2canvas = (await import("html2canvas")).default;
                    const jsPDF = (await import("jspdf")).default;
                    const el = document.getElementById("audit-report-content");
                    if (!el) return;
                    const canvas = await html2canvas(el, { backgroundColor: "#111114", scale: 2 });
                    const imgData = canvas.toDataURL("image/png");
                    const pdf = new jsPDF("p", "mm", "a4");
                    const w = pdf.internal.pageSize.getWidth();
                    const h = (canvas.height * w) / canvas.width;
                    pdf.addImage(imgData, "PNG", 0, 0, w, h);
                    pdf.save(`LeadReap-Audit-${auditData.url.replace(/[^a-z0-9]/gi, "_").slice(0, 40)}.pdf`);
                  } catch (e) {
                    console.error("PDF export failed:", e);
                    alert("PDF export failed — try right-click → Print → Save as PDF instead.");
                  }
                }} style={{
                  width:"100%",background:"#f0b429",color:"#000",border:"none",
                  borderRadius:10,padding:"14px",fontSize:15,fontWeight:700,
                  cursor:"pointer",fontFamily:"Syne, sans-serif",marginTop:16,
                }}>
                  📥 Download PDF Report
                </button>
            ) : null}
            </div>
          </div>
        </div>
      )}

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
