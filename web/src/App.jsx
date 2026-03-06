import { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import LeadReap from "./LeadReap";
import NicheLandingPage from "./NicheLandingPage";
import ApolloAlternative from "./ApolloAlternative";

const API_BASE = import.meta.env.VITE_API_URL || "";

// ENSURE THIS LINE SAYS "export default" to fix your Vercel build error
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("lh_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login State
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginStep, setLoginStep] = useState("email");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Audit State
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // ─── Auth Logic ───────────────────────────────────────────
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
    } catch (e) {
      console.warn("Auth check failed");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // ─── Login Handlers ───────────────────────────────────────
  async function handleSendCode() {
    if (!loginEmail || !loginEmail.includes("@")) {
      setLoginError("Please enter a valid email address.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/magic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setLoginStep("code");
      } else {
        setLoginError(data.error || "Failed to send login code.");
      }
    } catch {
      setLoginError("Network error. Please try again.");
    }
    setLoginLoading(false);
  }

  async function handleVerifyCode() {
    if (!loginCode.trim()) {
      setLoginError("Please enter the code from your email.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: loginCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("lh_token", data.token);
        setToken(data.token);
        setUser(data.user);
        setShowLogin(false);
        setLoginStep("email");
        setLoginEmail("");
        setLoginCode("");
      } else {
        setLoginError(data.error || "Invalid or expired code. Please try again.");
      }
    } catch {
      setLoginError("Network error. Please try again.");
    }
    setLoginLoading(false);
  }

  function handleCloseLogin() {
    setShowLogin(false);
    setLoginStep("email");
    setLoginEmail("");
    setLoginCode("");
    setLoginError("");
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
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        setShowAuditModal(false);
      } else {
        setAuditData(data);
      }
    } catch (err) {
      alert("Audit failed. Site may be blocking requests.");
      setShowAuditModal(false);
    }
    setAuditLoading(false);
  }

  // ─── PDF Export ───────────────────────────────────────────
  async function exportAuditToPDF() {
    const element = document.getElementById("audit-report-content");
    const canvas = await html2canvas(element, {
      backgroundColor: "#111114",
      scale: 2,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`LeadReap-Audit-${auditData.url.replace(/[^a-z0-9]/gi, "_")}.pdf`);
  }

  // ─── Navigation & Routing ─────────────────────────────────
  const path = window.location.pathname;
  if (path === "/compare/apollo" || path === "/compare/apollo/") return <ApolloAlternative />;
  if (path.startsWith("/leads/")) {
    const slug = path.replace("/leads/", "").replace(/\/$/, "");
    if (slug) return <NicheLandingPage slug={slug} />;
  }

  if (loading) return <div style={{ background: "#0a0a0b", height: "100vh" }} />;

  const s = {
    overlay: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 500, padding: 20, backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)", animation: "fadeIn 0.15s ease",
    },
    modal: {
      background: "#111114", border: "1px solid #2a2a35",
      borderRadius: 20, padding: "40px 36px", maxWidth: 420, width: "100%",
      position: "relative", fontFamily: "Syne, sans-serif", color: "#e8e8f0",
    },
    close: {
      position: "absolute", top: 16, right: 16, background: "#18181d",
      border: "1px solid #2a2a35", color: "#6b6b80", width: 30, height: 30,
      borderRadius: 8, cursor: "pointer", fontSize: 18, display: "flex",
      alignItems: "center", justifyContent: "center",
    },
    label: {
      display: "block", fontSize: 12, color: "#6b6b80",
      marginBottom: 6, fontFamily: "IBM Plex Mono, monospace",
    },
    input: {
      width: "100%", background: "#18181d", border: "1px solid #2a2a35",
      borderRadius: 10, padding: "12px 16px", color: "#e8e8f0",
      fontSize: 14, fontFamily: "IBM Plex Mono, monospace",
      outline: "none", boxSizing: "border-box", marginBottom: 14,
    },
    btn: {
      width: "100%", background: "#f0b429", color: "#000",
      border: "none", borderRadius: 10, padding: "13px 20px",
      fontSize: 14, fontWeight: 700, cursor: "pointer",
      fontFamily: "Syne, sans-serif", marginBottom: 10,
    },
    btnDisabled: {
      width: "100%", background: "#333", color: "#666",
      border: "none", borderRadius: 10, padding: "13px 20px",
      fontSize: 14, fontWeight: 700, cursor: "not-allowed",
      fontFamily: "Syne, sans-serif", marginBottom: 10,
    },
    err: { fontSize: 12, color: "#f87171", marginBottom: 10, textAlign: "center" },
    back: {
      background: "none", border: "none", color: "#6b6b80",
      fontSize: 12, cursor: "pointer", fontFamily: "IBM Plex Mono, monospace",
      display: "block", margin: "0 auto", padding: "4px 8px",
    },
  };

  return (
    <>
      <LeadReap
        apiBase={API_BASE}
        token={token}
        user={user}
        onLoginClick={() => setShowLogin(true)}
        onLogout={() => { localStorage.removeItem("lh_token"); setToken(null); setUser(null); }}
        onRefreshAuth={checkAuth}
        onRunAudit={handleRunAudit}
      />

      {/* ── LOGIN MODAL ── */}
      {showLogin && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && handleCloseLogin()}>
          <div style={s.modal}>
            <button style={s.close} onClick={handleCloseLogin}>×</button>

            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: "-0.5px" }}>
                {loginStep === "email" ? "Sign in to LeadReap" : "Check your inbox"}
              </h2>
              <p style={{ fontSize: 13, color: "#6b6b80", lineHeight: 1.5 }}>
                {loginStep === "email"
                  ? "Enter your email and we'll send you a magic login code — no password needed."
                  : `We sent a 6-digit code to ${loginEmail}. Enter it below to log in.`}
              </p>
            </div>

            {loginError && <div style={s.err}>{loginError}</div>}

            {loginStep === "email" ? (
              <>
                <label style={s.label}>EMAIL ADDRESS</label>
                <input
                  style={s.input}
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendCode()}
                  autoFocus
                />
                <button
                  style={loginLoading ? s.btnDisabled : s.btn}
                  onClick={handleSendCode}
                  disabled={loginLoading}
                >
                  {loginLoading ? "Sending..." : "Send Login Code →"}
                </button>
                <p style={{ fontSize: 11, color: "#6b6b80", textAlign: "center", fontFamily: "IBM Plex Mono, monospace" }}>
                  New users get a free account automatically.
                </p>
              </>
            ) : (
              <>
                <label style={s.label}>LOGIN CODE</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={loginCode}
                  onChange={e => setLoginCode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleVerifyCode()}
                  autoFocus
                  maxLength={8}
                />
                <button
                  style={loginLoading ? s.btnDisabled : s.btn}
                  onClick={handleVerifyCode}
                  disabled={loginLoading}
                >
                  {loginLoading ? "Verifying..." : "Verify & Log In →"}
                </button>
                <button style={s.back} onClick={() => { setLoginStep("email"); setLoginError(""); }}>
                  ← Use a different email
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── AUDIT RESULTS MODAL ── */}
      {showAuditModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20, backdropFilter: "blur(10px)",
        }}>
          <div style={{
            background: "#111114", border: "1px solid #2a2a35",
            borderRadius: 24, padding: 40, maxWidth: 700, width: "100%",
            maxHeight: "90vh", overflowY: "auto", position: "relative",
            fontFamily: "Syne, sans-serif", color: "#e8e8f0",
          }}>
            <button
              onClick={() => setShowAuditModal(false)}
              style={{
                position: "absolute", top: 24, right: 24, background: "#18181d",
                border: "1px solid #2a2a35", color: "#6b6b80", width: 36, height: 36,
                borderRadius: 10, cursor: "pointer", fontSize: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >×</button>

            <div id="audit-report-content">
              {auditLoading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "radial-gradient(circle at 30% 30%, #f0b429, #e85d04)",
                    margin: "0 auto 24px", animation: "orbPulse 2s ease-in-out infinite",
                  }} />
                  <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Analyzing Site...</h2>
                  <p style={{ color: "#6b6b80" }}>LeadReap is performing a 5-point SEO &amp; Tech diagnostic.</p>
                </div>
              ) : auditData && (
                <>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: 40, flexShrink: 0,
                      border: `4px solid ${auditData.score >= 80 ? "#10b981" : auditData.score >= 40 ? "#f0b429" : "#ef4444"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, fontWeight: 800,
                    }}>
                      {auditData.score}
                    </div>
                    <div>
                      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Site Audit Report</h2>
                      <p style={{ color: "#6b6b80", fontSize: 14 }}>{auditData.url}</p>
                      <p style={{ color: "#6b6b80", fontSize: 12, fontFamily: "IBM Plex Mono, monospace", marginTop: 4 }}>
                        {auditData.score >= 80 ? "✓ Technically healthy site" : auditData.score >= 40 ? "⚠ Several issues found" : "✕ Major issues found — high opportunity"}
                      </p>
                    </div>
                  </div>

                  {/* Audit Checks Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
                    <AuditItemDisplay label="SSL Security" pass={auditData.tech.ssl}
                      failMsg="Site uses HTTP — shows 'Not Secure' to visitors" />
                    <AuditItemDisplay label="H1 Header Tag" pass={auditData.seo.h1}
                      failMsg="No H1 found — Google can't determine primary topic" />
                    <AuditItemDisplay label="SEO Title Tag" pass={auditData.seo.title}
                      failMsg="Missing title tag — invisible in search results" />
                    <AuditItemDisplay label="Meta Description" pass={auditData.seo.description}
                      failMsg="No meta description — hurts click-through rate" />
                    <AuditItemDisplay label="Facebook Pixel" pass={auditData.tech.pixel}
                      failMsg="No pixel installed — can't retarget website visitors" />
                    <AuditItemDisplay label="Google Analytics" pass={auditData.tech.analytics}
                      failMsg="No analytics — flying blind on traffic data" />
                  </div>

                  {/* Sales Angles */}
                  {(!auditData.tech.pixel || !auditData.seo.h1 || !auditData.tech.ssl || !auditData.seo.description || !auditData.seo.title) && (
                    <div style={{
                      background: "rgba(240, 180, 41, 0.05)", border: "1px solid rgba(240, 180, 41, 0.2)",
                      borderRadius: 16, padding: 24,
                    }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0b429", marginBottom: 14 }}>
                        💡 The Sales Angle — Use These in Your Cold Outreach
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {!auditData.tech.pixel && (
                          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "12px 16px" }}>
                            <strong style={{ fontSize: 13, color: "#e8e8f0", display: "block", marginBottom: 4 }}>🎯 No Retargeting Pixel</strong>
                            <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, margin: 0 }}>
                              "I noticed you don't have a Facebook Pixel on your site. That means 98% of your visitors leave and you have no way to bring them back. We can fix this in about 10 minutes."
                            </p>
                          </div>
                        )}
                        {!auditData.seo.h1 && (
                          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "12px 16px" }}>
                            <strong style={{ fontSize: 13, color: "#e8e8f0", display: "block", marginBottom: 4 }}>🔍 SEO Structure Gap</strong>
                            <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, margin: 0 }}>
                              "Google doesn't know exactly what you sell because your H1 tags are missing. This alone could be costing you dozens of organic leads per month."
                            </p>
                          </div>
                        )}
                        {!auditData.tech.ssl && (
                          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "12px 16px" }}>
                            <strong style={{ fontSize: 13, color: "#e8e8f0", display: "block", marginBottom: 4 }}>🔒 Security Warning</strong>
                            <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, margin: 0 }}>
                              "Your site shows 'Not Secure' in Chrome. This warning causes roughly 85% of visitors to immediately leave — and Google penalizes non-HTTPS sites in rankings."
                            </p>
                          </div>
                        )}
                        {!auditData.seo.description && (
                          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "12px 16px" }}>
                            <strong style={{ fontSize: 13, color: "#e8e8f0", display: "block", marginBottom: 4 }}>📋 Missing Meta Description</strong>
                            <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, margin: 0 }}>
                              "Your search result listing has no description. Google auto-generates one — often poorly. Writing a compelling description can double your click-through rate."
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Branding footer for PDF */}
                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #2a2a35", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#6b6b80" }}>
                      Generated by LeadReap · {new Date().toLocaleDateString()}
                    </span>
                    <span style={{ fontSize: 11, color: "#6b6b80" }}>leadreap.com</span>
                  </div>
                </>
              )}
            </div>

            {!auditLoading && auditData && (
              <button
                onClick={exportAuditToPDF}
                style={{
                  width: "100%", background: "#f0b429", color: "#000",
                  border: "none", borderRadius: "12px", padding: "16px",
                  fontSize: "15px", fontWeight: "700", cursor: "pointer", marginTop: "24px",
                  fontFamily: "Syne, sans-serif",
                }}
              >
                📥 Download Branded PDF Report
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Helper Components ─────────────────────────────────────────
function AuditItemDisplay({ label, pass, failMsg }) {
  return (
    <div style={{
      padding: "12px 16px", background: "#18181d",
      border: `1px solid ${pass ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
      borderRadius: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: pass ? 0 : 4 }}>
        <span style={{ fontSize: 13, color: "#a1a1aa", fontWeight: 600 }}>{label}</span>
        <span style={{ color: pass ? "#10b981" : "#f87171", fontWeight: 700, fontSize: 12, fontFamily: "IBM Plex Mono, monospace" }}>
          {pass ? "✓ PASS" : "✕ FAIL"}
        </span>
      </div>
      {!pass && failMsg && (
        <p style={{ fontSize: 11, color: "#6b6b80", margin: 0, lineHeight: 1.4 }}>{failMsg}</p>
      )}
    </div>
  );
}
