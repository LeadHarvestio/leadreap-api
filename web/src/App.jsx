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
    // We use a slight delay to ensure the modal content is fully rendered
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
    pdf.save(`LeadReap-Audit-${auditData.url.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  }

  // ─── Navigation & Routing ─────────────────────────────────
  const path = window.location.pathname;
  if (path === '/compare/apollo' || path === '/compare/apollo/') return <ApolloAlternative />;
  if (path.startsWith('/leads/')) {
    const slug = path.replace('/leads/', '').replace(/\/$/, '');
    if (slug) return <NicheLandingPage slug={slug} />;
  }

  if (loading) return <div style={{background:"#0a0a0b", height:"100vh"}} />;

  return (
    <>
      <LeadReap
        apiBase={API_BASE}
        token={token}
        user={user}
        onLoginClick={() => setShowLogin(true)}
        onLogout={() => { localStorage.removeItem("lh_token"); setToken(null); setUser(null); }}
        onRefreshAuth={checkAuth}
        onRunAudit={handleRunAudit} // This allows the button in LeadReap.jsx to work
      />

      {/* AUDIT RESULTS MODAL */}
      {showAuditModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20, backdropFilter: "blur(10px)"
        }}>
          <div style={{
            background: "#111114", border: "1px solid #2a2a35",
            borderRadius: 24, padding: 40, maxWidth: 700, width: "100%",
            maxHeight: "90vh", overflowY: "auto", position: "relative",
            fontFamily: "Syne, sans-serif", color: "#e8e8f0"
          }}>
            <button
              onClick={() => setShowAuditModal(false)}
              style={{
                position: "absolute", top: 24, right: 24, background: "#18181d",
                border: "1px solid #2a2a35", color: "#6b6b80", width: 36, height: 36,
                borderRadius: 10, cursor: "pointer", fontSize: 20
              }}
            >×</button>

            <div id="audit-report-content">
              {auditLoading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Analyzing Site...</h2>
                  <p style={{ color: "#6b6b80" }}>LeadReap is performing a 5-point SEO & Tech diagnostic.</p>
                </div>
              ) : auditData && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: 40, border: `4px solid ${auditData.score > 60 ? '#10b981' : '#f0b429'}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800
                    }}>
                      {auditData.score}
                    </div>
                    <div>
                      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Site Audit Report</h2>
                      <p style={{ color: "#6b6b80", fontSize: 14 }}>{auditData.url}</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
                    <AuditItemDisplay label="SSL Security" pass={auditData.tech.ssl} />
                    <AuditItemDisplay label="H1 Header" pass={auditData.seo.h1} />
                    <AuditItemDisplay label="SEO Title" pass={auditData.seo.title} />
                    <AuditItemDisplay label="Facebook Pixel" pass={auditData.tech.pixel} />
                    <AuditItemDisplay label="Google Analytics" pass={auditData.tech.analytics} />
                    <AuditItemDisplay label="Meta Description" pass={auditData.seo.description} />
                  </div>

                  <div style={{ background: "rgba(240, 180, 41, 0.05)", border: "1px solid rgba(240, 180, 41, 0.2)", borderRadius: 16, padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0b429", marginBottom: 12 }}>💡 The Sales Angle</h3>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "#d1d1d6" }}>
                      {!auditData.tech.pixel && <p style={{ marginBottom: 10 }}>• <strong>No Tracking:</strong> "I noticed you don't have a Facebook pixel. You're losing 98% of your traffic because you can't retarget them."</p>}
                      {!auditData.seo.h1 && <p style={{ marginBottom: 10 }}>• <strong>SEO Gap:</strong> "Google doesn't know exactly what you sell because your H1 tags are missing. We can fix this in 5 minutes."</p>}
                      {!auditData.tech.ssl && <p style={{ marginBottom: 10 }}>• <strong>Trust Warning:</strong> "Your site shows 'Not Secure' to customers. This scares away local leads."</p>}
                    </div>
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
                  fontSize: "15px", fontWeight: "700", cursor: "pointer", marginTop: "24px"
                }}
              >
                📥 Download Professional PDF Report
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Helper components stay outside the main export
function AuditItemDisplay({ label, pass }) {
  return (
    <div style={{
      padding: "12px 16px", background: "#18181d", border: "1px solid #2a2a35",
      borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between"
    }}>
      <span style={{ fontSize: 13, color: "#a1a1aa" }}>{label}</span>
      <span style={{ color: pass ? "#10b981" : "#f87171", fontWeight: 700 }}>
        {pass ? "✓ PASS" : "✕ MISSING"}
      </span>
    </div>
  );
}
