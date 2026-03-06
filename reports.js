// ─────────────────────────────────────────────────────────────
// REPORTS — White-label PDF lead reports for Agency users
// "We found 47 businesses in your area with unclaimed listings."
// ─────────────────────────────────────────────────────────────

import PDFDocument from "pdfkit";

const COLORS = {
  dark: "#0a0a0b",
  accent: "#f0b429",
  text: "#333333",
  muted: "#888888",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  white: "#ffffff",
  surface: "#f8f8fa",
  border: "#e0e0e0",
};

function scoreColor(score) {
  if (score >= 80) return COLORS.green;
  if (score >= 60) return COLORS.amber;
  return COLORS.red;
}

/**
 * Generate a white-label PDF report.
 *
 * @param {Object} options
 * @param {string} options.agencyName - "Acme Digital Agency"
 * @param {string} options.clientName - "John's Plumbing" or location
 * @param {string} options.niche - "Plumbers"
 * @param {string} options.location - "Austin, TX"
 * @param {Array} options.leads - Array of lead objects
 * @param {string} [options.subtitle] - Optional subtitle
 * @param {string} [options.contactEmail] - Agency contact email
 * @param {string} [options.contactPhone] - Agency contact phone
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateReport({
  agencyName = "LeadReap",
  clientName = "",
  niche,
  location,
  leads,
  subtitle = "",
  contactEmail = "",
  contactPhone = "",
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 60, bottom: 60, left: 50, right: 50 },
      info: {
        Title: `Market Report — ${niche} in ${location}`,
        Author: agencyName,
        Creator: "LeadReap",
      },
    });

    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const contentW = pageW - 100; // 50px margins each side
    const leftM = 50;

    // ── Cover Page ──────────────────────────────────────────
    // Dark header bar
    doc.rect(0, 0, pageW, 200).fill(COLORS.dark);

    // Agency name
    doc.fontSize(28).font("Helvetica-Bold").fillColor(COLORS.white)
      .text(agencyName, leftM, 60, { width: contentW });

    // Report title
    doc.fontSize(14).font("Helvetica").fillColor(COLORS.accent)
      .text("Market Intelligence Report", leftM, 100, { width: contentW });

    // Prepared for
    doc.fontSize(11).fillColor(COLORS.muted)
      .text(`Prepared ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, leftM, 130, { width: contentW });

    if (clientName) {
      doc.fontSize(11).fillColor(COLORS.muted)
        .text(`Prepared for: ${clientName}`, leftM, 150, { width: contentW });
    }

    // Big headline
    doc.fontSize(32).font("Helvetica-Bold").fillColor(COLORS.dark)
      .text(`${niche}`, leftM, 240, { width: contentW });
    doc.fontSize(18).font("Helvetica").fillColor(COLORS.muted)
      .text(`in ${location}`, leftM, 282, { width: contentW });

    if (subtitle) {
      doc.fontSize(12).fillColor(COLORS.text)
        .text(subtitle, leftM, 320, { width: contentW });
    }

    // Key stats boxes
    const statsY = 380;
    const boxW = (contentW - 20) / 3;

    const withEmail = leads.filter(l => l.email).length;
    const withWebsite = leads.filter(l => l.website).length;
    const unclaimed = leads.filter(l => l.unclaimed).length;
    const avgScore = leads.length ? Math.round(leads.reduce((s, l) => s + (l.score || 0), 0) / leads.length) : 0;
    const highScore = leads.filter(l => l.score >= 80).length;

    const stats = [
      { label: "Total Businesses Found", value: String(leads.length), color: COLORS.accent },
      { label: "With Email Contact", value: `${withEmail} (${leads.length ? Math.round(withEmail / leads.length * 100) : 0}%)`, color: COLORS.green },
      { label: "Unclaimed Listings", value: String(unclaimed), color: COLORS.red },
    ];

    stats.forEach((stat, i) => {
      const x = leftM + i * (boxW + 10);
      doc.rect(x, statsY, boxW, 70).lineWidth(1).strokeColor(COLORS.border).stroke();
      doc.fontSize(22).font("Helvetica-Bold").fillColor(stat.color)
        .text(stat.value, x + 12, statsY + 14, { width: boxW - 24 });
      doc.fontSize(9).font("Helvetica").fillColor(COLORS.muted)
        .text(stat.label, x + 12, statsY + 44, { width: boxW - 24 });
    });

    // Second row of stats
    const stats2Y = statsY + 90;
    const stats2 = [
      { label: "Average Lead Score", value: `${avgScore}/100`, color: scoreColor(avgScore) },
      { label: "High-Score Leads (80+)", value: String(highScore), color: COLORS.green },
      { label: "With Website", value: `${withWebsite} (${leads.length ? Math.round(withWebsite / leads.length * 100) : 0}%)`, color: COLORS.accent },
    ];

    stats2.forEach((stat, i) => {
      const x = leftM + i * (boxW + 10);
      doc.rect(x, stats2Y, boxW, 70).lineWidth(1).strokeColor(COLORS.border).stroke();
      doc.fontSize(22).font("Helvetica-Bold").fillColor(stat.color)
        .text(stat.value, x + 12, stats2Y + 14, { width: boxW - 24 });
      doc.fontSize(9).font("Helvetica").fillColor(COLORS.muted)
        .text(stat.label, x + 12, stats2Y + 44, { width: boxW - 24 });
    });

    // Footer on cover
    const coverFootY = doc.page.height - 80;
    doc.fontSize(9).font("Helvetica").fillColor(COLORS.muted)
      .text(`Generated by ${agencyName}`, leftM, coverFootY, { width: contentW });
    if (contactEmail) {
      doc.text(`${contactEmail}${contactPhone ? "  •  " + contactPhone : ""}`, leftM, coverFootY + 14, { width: contentW });
    }

    // ── Lead Detail Pages ───────────────────────────────────
    const leadsPerPage = 12;
    const sortedLeads = [...leads].sort((a, b) => (b.score || 0) - (a.score || 0));

    for (let page = 0; page < Math.ceil(sortedLeads.length / leadsPerPage); page++) {
      doc.addPage();

      // Page header
      doc.rect(0, 0, pageW, 45).fill(COLORS.dark);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.accent)
        .text(`${agencyName}`, leftM, 15, { width: contentW / 2 });
      doc.fontSize(9).font("Helvetica").fillColor(COLORS.muted)
        .text(`${niche} in ${location} — Page ${page + 2}`, pageW / 2, 15, { width: contentW / 2, align: "right" });

      // Table header
      let y = 65;
      const cols = [
        { label: "Score", x: leftM, w: 40 },
        { label: "Business", x: leftM + 45, w: 140 },
        { label: "Email", x: leftM + 190, w: 145 },
        { label: "Phone", x: leftM + 340, w: 85 },
        { label: "Revenue Est.", x: leftM + 430, w: 85 },
      ];

      doc.rect(leftM, y, contentW, 20).fill(COLORS.surface);
      cols.forEach(col => {
        doc.fontSize(8).font("Helvetica-Bold").fillColor(COLORS.muted)
          .text(col.label, col.x + 4, y + 5, { width: col.w - 8 });
      });
      y += 24;

      const pageLeads = sortedLeads.slice(page * leadsPerPage, (page + 1) * leadsPerPage);
      pageLeads.forEach((lead, i) => {
        if (i % 2 === 0) {
          doc.rect(leftM, y, contentW, 38).fill("#fafafa");
        }

        // Score
        doc.fontSize(12).font("Helvetica-Bold").fillColor(scoreColor(lead.score || 0))
          .text(String(lead.score || 0), cols[0].x + 4, y + 6, { width: cols[0].w - 8 });

        // Business name + category
        doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.text)
          .text((lead.name || "").slice(0, 28), cols[1].x + 4, y + 3, { width: cols[1].w - 8 });
        if (lead.category) {
          doc.fontSize(7).font("Helvetica").fillColor(COLORS.muted)
            .text(lead.category.slice(0, 30), cols[1].x + 4, y + 17, { width: cols[1].w - 8 });
        }
        if (lead.enrichment?.signals?.length > 0) {
          doc.fontSize(6).font("Helvetica").fillColor(COLORS.accent)
            .text(lead.enrichment.signals.slice(0, 2).join(" • "), cols[1].x + 4, y + 27, { width: cols[1].w - 8 });
        }

        // Email
        doc.fontSize(8).font("Helvetica").fillColor(lead.email ? COLORS.text : COLORS.muted)
          .text(lead.email || "—", cols[2].x + 4, y + 6, { width: cols[2].w - 8 });
        if (lead.emailQualityLabel) {
          doc.fontSize(7).fillColor(COLORS.muted)
            .text(lead.emailQualityLabel, cols[2].x + 4, y + 19, { width: cols[2].w - 8 });
        }

        // Phone
        doc.fontSize(8).font("Helvetica").fillColor(lead.phone ? COLORS.text : COLORS.muted)
          .text(lead.phoneDisplay || lead.phone || "—", cols[3].x + 4, y + 6, { width: cols[3].w - 8 });

        // Revenue
        doc.fontSize(8).font("Helvetica").fillColor(COLORS.text)
          .text(lead.enrichment?.revenueRange || "—", cols[4].x + 4, y + 6, { width: cols[4].w - 8 });
        if (lead.enrichment?.employeeRange) {
          doc.fontSize(7).fillColor(COLORS.muted)
            .text(`${lead.enrichment.employeeRange} employees`, cols[4].x + 4, y + 19, { width: cols[4].w - 8 });
        }

        y += 40;
      });

      // Page footer
      doc.fontSize(8).font("Helvetica").fillColor(COLORS.muted)
        .text("Confidential — Prepared for client use only", leftM, doc.page.height - 50, { width: contentW, align: "center" });
    }

    // ── Summary / Insights Page ─────────────────────────────
    doc.addPage();
    doc.rect(0, 0, pageW, 45).fill(COLORS.dark);
    doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.accent)
      .text(`${agencyName}`, leftM, 15, { width: contentW / 2 });
    doc.fontSize(9).font("Helvetica").fillColor(COLORS.muted)
      .text("Summary & Recommendations", pageW / 2, 15, { width: contentW / 2, align: "right" });

    let sy = 70;

    doc.fontSize(20).font("Helvetica-Bold").fillColor(COLORS.dark)
      .text("Key Findings", leftM, sy);
    sy += 35;

    const findings = [];
    if (unclaimed > 0) findings.push(`${unclaimed} business${unclaimed > 1 ? "es have" : " has"} unclaimed Google listing${unclaimed > 1 ? "s" : ""} — these owners haven't claimed their online presence and are prime candidates for digital marketing services.`);
    const noWebsite = leads.filter(l => !l.website).length;
    if (noWebsite > 0) findings.push(`${noWebsite} business${noWebsite > 1 ? "es" : ""} found without a website — strong opportunity for web design and development services.`);
    if (withEmail > 0) findings.push(`${withEmail} direct email contact${withEmail > 1 ? "s" : ""} found, ready for personalized outreach campaigns.`);
    if (highScore > 0) findings.push(`${highScore} high-authority lead${highScore > 1 ? "s" : ""} (score 80+) identified as priority outreach targets.`);

    // Tech stack insights
    const techCounts = {};
    leads.forEach(l => (l.techStack || []).forEach(t => { techCounts[t.name] = (techCounts[t.name] || 0) + 1; }));
    const topTech = Object.entries(techCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topTech.length > 0) {
      findings.push(`Most common technologies: ${topTech.map(([name, count]) => `${name} (${count})`).join(", ")}.`);
    }

    findings.forEach((finding, i) => {
      doc.fontSize(10).font("Helvetica").fillColor(COLORS.text)
        .text(`${i + 1}.  ${finding}`, leftM, sy, { width: contentW, lineGap: 3 });
      sy += doc.heightOfString(finding, { width: contentW - 20 }) + 16;
    });

    sy += 20;
    doc.fontSize(20).font("Helvetica-Bold").fillColor(COLORS.dark)
      .text("Recommendations", leftM, sy);
    sy += 35;

    const recs = [
      "Begin outreach to high-score leads first — these businesses have the strongest digital presence and are most likely to respond.",
      unclaimed > 0 ? "Prioritize unclaimed listings — these businesses need help managing their online presence and are highly receptive to service offers." : null,
      noWebsite > 0 ? "Target businesses without websites with web development packages — this is the lowest-hanging fruit for new client acquisition." : null,
      "Follow up within 48 hours of initial contact — response rates drop significantly after the first week.",
      "Use the enrichment data to personalize your pitch — reference their specific revenue range and business signals.",
    ].filter(Boolean);

    recs.forEach((rec, i) => {
      doc.fontSize(10).font("Helvetica").fillColor(COLORS.text)
        .text(`${i + 1}.  ${rec}`, leftM, sy, { width: contentW, lineGap: 3 });
      sy += doc.heightOfString(rec, { width: contentW - 20 }) + 14;
    });

    // CTA at bottom
    if (contactEmail || contactPhone) {
      sy = Math.max(sy + 30, doc.page.height - 180);
      doc.rect(leftM, sy, contentW, 80).lineWidth(2).strokeColor(COLORS.accent).stroke();
      doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.dark)
        .text("Ready to take action?", leftM + 20, sy + 16, { width: contentW - 40 });
      doc.fontSize(11).font("Helvetica").fillColor(COLORS.text)
        .text(`Contact ${agencyName} to discuss these findings and start your outreach campaign.`, leftM + 20, sy + 38, { width: contentW - 40 });
      doc.fontSize(10).fillColor(COLORS.accent)
        .text(`${contactEmail}${contactPhone ? "  •  " + contactPhone : ""}`, leftM + 20, sy + 56, { width: contentW - 40 });
    }

    doc.fontSize(8).font("Helvetica").fillColor(COLORS.muted)
      .text("Confidential — Prepared for client use only", leftM, doc.page.height - 50, { width: contentW, align: "center" });

    doc.end();
  });
}

// ─────────────────────────────────────────────────────────────
// AI PITCH WRITER — Generates hyper-personalized outreach
// ─────────────────────────────────────────────────────────────

export async function generateAIPitch(lead, { style = "casual", agencyName = "", agencyService = "" } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return generateFallbackPitch(lead, { style, agencyName, agencyService });
  }

  const signals = [];
  if (lead.unclaimed) signals.push("Their Google Business listing is UNCLAIMED — anyone could claim it");
  if (!lead.website) signals.push("They have NO website at all");
  if (lead.gbpSignals?.isStale) signals.push("Their listing appears stale with no recent activity");
  if (lead.gbpSignals?.isNewBusiness) signals.push("They opened within the last year — brand new business");
  if (lead.gbpSignals?.photoCount < 5) signals.push("Very few photos on their Google listing");
  if (!lead.gbpSignals?.hasOwnerResponses && lead.reviews >= 10) signals.push("They never respond to customer reviews");
  if (lead.techStackSummary?.includes("Wix")) signals.push("Their website is built on Wix — likely needs a professional upgrade");
  if (lead.techStackSummary?.includes("Weebly")) signals.push("Their website is built on Weebly — outdated platform");
  if (!lead.facebook && !lead.instagram) signals.push("No social media presence found");
  if (lead.reviews < 20 && lead.rating) signals.push(`Only ${lead.reviews} reviews despite being established`);
  if (lead.rating && lead.rating < 4.0) signals.push(`Below-average ${lead.rating}-star rating — reputation management opportunity`);

  const prompt = `You are writing a cold outreach email for a marketing/web agency to send to a local business owner. Write ONLY the email body — no subject line, no explanation, no formatting notes.

BUSINESS DATA:
- Name: ${lead.name}
- Category: ${lead.category || "Local Business"}
- Rating: ${lead.rating || "N/A"} stars (${lead.reviews || 0} reviews)
- Website: ${lead.website || "NONE"}
- Location: ${lead.address || "Unknown"}
${lead.ownerName ? `- Owner: ${lead.ownerName}` : ""}

KEY SIGNALS (these are your pitch angles):
${signals.length > 0 ? signals.map(s => `• ${s}`).join("\n") : "• General local business with room for digital growth"}

STYLE: ${style === "formal" ? "Professional and polished" : style === "bold" ? "Confident and direct, mention specific numbers/stats" : "Casual, friendly, like a helpful neighbor"}
${agencyName ? `AGENCY: ${agencyName}` : ""}
${agencyService ? `PRIMARY SERVICE: ${agencyService}` : ""}

RULES:
- Reference their SPECIFIC business name and at least 2 signals above
- Keep it under 150 words
- End with a soft call-to-action (quick call, not a hard sell)
- Sound human, not like a template
- Do NOT use placeholder brackets like [Your Name]
- Sign off with just a first name or the agency name`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text;
    if (!text) throw new Error("No response from AI");

    return {
      pitch: text.trim(),
      signals,
      model: "claude-sonnet",
      generated: true,
    };
  } catch (err) {
    console.error("[AI Pitch] API error:", err.message);
    return generateFallbackPitch(lead, { style, agencyName, agencyService });
  }
}

function generateFallbackPitch(lead, { style, agencyName, agencyService }) {
  const biz = lead.name || "your business";
  const greeting = lead.ownerName ? `Hi ${lead.ownerName.split(" ")[0]}` : "Hi there";

  const angles = [];
  if (lead.unclaimed) angles.push(`I noticed your Google listing for ${biz} hasn't been claimed yet — this means you're missing out on a ton of free visibility and anyone could potentially take control of it.`);
  if (!lead.website) angles.push(`I couldn't find a website for ${biz} — in today's market, that's leaving a lot of potential customers on the table.`);
  if (lead.reviews < 20 && lead.rating) angles.push(`With ${lead.reviews} reviews and a solid ${lead.rating}-star rating, there's a huge opportunity to boost your online presence and get more customers through the door.`);
  if (lead.gbpSignals?.isNewBusiness) angles.push(`Congrats on the new business! The first year is when establishing a strong online presence makes the biggest impact.`);

  const mainAngle = angles[0] || `I came across ${biz} and was impressed by your ${lead.rating ? lead.rating + "-star rating" : "presence"} — I think there's room to turn that into even more customers.`;

  const pitch = `${greeting},

${mainAngle}

I help local businesses like yours get more customers through ${agencyService || "digital marketing and web presence optimization"}. I had a few specific ideas for ${biz} that I think could make a real difference.

Would you be open to a quick 10-minute call this week? No pressure — just want to share what I found.

Best,
${agencyName || "[Your Name]"}`;

  return {
    pitch: pitch.trim(),
    signals: angles.length > 0 ? ["Custom pitch based on business signals"] : ["Generic outreach"],
    model: "template-fallback",
    generated: false,
  };
}

// ─────────────────────────────────────────────────────────────
// AUDIT PDF — Clean server-generated PDF for site audits
// ─────────────────────────────────────────────────────────────

export function generateAuditPDF(auditData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 0, bufferPages: true });
    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;   // 612
    const H = doc.page.height;  // 792
    const M = 40;               // margin
    const cW = W - M * 2;       // content width 532

    // ── Full dark background ──
    doc.rect(0, 0, W, H).fill("#0f1117");

    // ── Gold accent bar at top ──
    doc.rect(0, 0, W, 4).fill(COLORS.accent);

    // ── Branding ──
    doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.accent).text("LEADREAP", M, 22);
    doc.fontSize(8).font("Helvetica").fillColor("#555").text("SITE AUDIT REPORT", M + 72, 24);

    // ── Score circle (centered, prominent) ──
    const scoreColor = auditData.score >= 70 ? COLORS.green : auditData.score >= 40 ? COLORS.amber : COLORS.red;
    const cx = W / 2, cy = 96;
    doc.circle(cx, cy, 40).lineWidth(4).strokeColor(scoreColor).stroke();
    doc.circle(cx, cy, 34).lineWidth(1).strokeColor(scoreColor).opacity(0.3).stroke();
    doc.opacity(1);
    doc.fontSize(32).font("Helvetica-Bold").fillColor(scoreColor)
      .text(String(auditData.score), cx - 28, cy - 16, { width: 56, align: "center" });
    doc.fontSize(7).font("Helvetica").fillColor("#888")
      .text("OUT OF 100", cx - 28, cy + 18, { width: 56, align: "center" });

    // ── URL + timestamp ──
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#eee")
      .text(auditData.url, M, 152, { width: cW, align: "center" });
    doc.fontSize(8).font("Helvetica").fillColor("#555")
      .text(`Audited ${new Date(auditData.checkedAt).toLocaleString()}`, M, 170, { width: cW, align: "center" });

    // ── Divider ──
    doc.moveTo(M, 192).lineTo(W - M, 192).lineWidth(0.5).strokeColor("#1f2029").stroke();

    // ── Section: Diagnostic Results ──
    doc.fontSize(11).font("Helvetica-Bold").fillColor(COLORS.accent).text("DIAGNOSTIC RESULTS", M, 206);

    const checks = [
      { label: "SSL Security", pass: auditData.tech?.ssl },
      { label: "SEO Title", pass: auditData.seo?.title },
      { label: "Meta Description", pass: auditData.seo?.description },
      { label: "H1 Header", pass: auditData.seo?.h1 },
      { label: "Mobile Viewport", pass: auditData.seo?.viewport },
      { label: "Facebook Pixel", pass: auditData.tech?.pixel },
      { label: "Google Analytics", pass: auditData.tech?.analytics },
      { label: "Schema Markup", pass: auditData.seo?.schemaMarkup },
      { label: "Open Graph Tags", pass: auditData.seo?.ogTags },
    ];

    // 2-column card grid
    const colW = (cW - 14) / 2;
    const rowH = 32;
    const gridY = 228;

    checks.forEach((check, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = M + col * (colW + 14);
      const y = gridY + row * (rowH + 6);

      doc.roundedRect(x, y, colW, rowH, 5).fill("#181a24");
      doc.fontSize(9.5).font("Helvetica").fillColor("#ccc")
        .text(check.label, x + 12, y + 10, { width: colW - 80 });
      const badge = check.pass ? "✓  PASS" : "✕  FAIL";
      doc.fontSize(9).font("Helvetica-Bold").fillColor(check.pass ? COLORS.green : COLORS.red)
        .text(badge, x + colW - 72, y + 10, { width: 60, align: "right" });
    });

    // ── Summary bar ──
    const passCount = checks.filter(c => c.pass).length;
    const failCount = checks.length - passCount;
    const barY = gridY + Math.ceil(checks.length / 2) * (rowH + 6) + 10;

    doc.roundedRect(M, barY, cW, 42, 5).fill("#181a24");
    const third = cW / 3;
    doc.fontSize(17).font("Helvetica-Bold").fillColor(COLORS.green)
      .text(String(passCount), M, barY + 6, { width: third, align: "center" });
    doc.fontSize(7).font("Helvetica").fillColor("#666")
      .text("PASSED", M, barY + 26, { width: third, align: "center" });
    doc.fontSize(17).font("Helvetica-Bold").fillColor(COLORS.red)
      .text(String(failCount), M + third, barY + 6, { width: third, align: "center" });
    doc.fontSize(7).font("Helvetica").fillColor("#666")
      .text("FAILED", M + third, barY + 26, { width: third, align: "center" });
    doc.fontSize(17).font("Helvetica-Bold").fillColor(scoreColor)
      .text(`${auditData.score}/100`, M + third * 2, barY + 6, { width: third, align: "center" });
    doc.fontSize(7).font("Helvetica").fillColor("#666")
      .text("SCORE", M + third * 2, barY + 26, { width: third, align: "center" });

    // ── Tech Stack ──
    let curY = barY + 60;
    const techItems = [];
    if (auditData.tech?.wordpress) techItems.push("WordPress");
    if (auditData.tech?.wix) techItems.push("Wix");
    if (auditData.tech?.squarespace) techItems.push("Squarespace");
    if (auditData.tech?.shopify) techItems.push("Shopify");
    if (auditData.tech?.gtm) techItems.push("Google Tag Manager");
    if (auditData.tech?.hotjar) techItems.push("Hotjar");
    if (auditData.tech?.chatWidget) techItems.push("Live Chat Widget");

    if (techItems.length > 0) {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(COLORS.accent).text("DETECTED TECHNOLOGY", M, curY);
      curY += 18;
      doc.roundedRect(M, curY, cW, 28, 5).fill("#181a24");
      doc.fontSize(9.5).font("Helvetica").fillColor("#ccc")
        .text(techItems.join("   •   "), M + 12, curY + 9, { width: cW - 24 });
      curY += 42;
    }

    // ── Sales Angles ──
    if (auditData.salesAngles?.length > 0) {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(COLORS.accent).text("SALES ANGLES", M, curY);
      curY += 20;

      for (const angle of auditData.salesAngles) {
        if (curY > H - 80) break; // don't overflow page
        const hookLen = angle.hook.length;
        const cardH = hookLen > 100 ? 56 : hookLen > 60 ? 48 : 42;

        doc.roundedRect(M, curY, cW, cardH, 5).fill("#181a24");
        // Red severity accent on left
        doc.roundedRect(M, curY, 3, cardH, 1.5).fill(COLORS.red);

        doc.fontSize(10).font("Helvetica-Bold").fillColor("#eee")
          .text(angle.issue, M + 14, curY + 8, { width: cW - 26 });
        doc.fontSize(8.5).font("Helvetica").fillColor("#999")
          .text(angle.hook, M + 14, curY + 22, { width: cW - 26 });

        curY += cardH + 6;
      }
    }

    // ── Footer ──
    doc.rect(0, H - 36, W, 36).fill("#0a0b0e");
    doc.moveTo(0, H - 36).lineTo(W, H - 36).lineWidth(0.5).strokeColor("#1f2029").stroke();
    doc.fontSize(7.5).font("Helvetica").fillColor("#555")
      .text("Generated by LeadReap  •  leadreap.com", M, H - 24, { width: cW, align: "center" });

    doc.end();
  });
}

// ─────────────────────────────────────────────────────────────
// PROPOSAL GENERATOR — Branded PDF proposal from lead + audit data
// ─────────────────────────────────────────────────────────────

export function generateProposal({ lead, auditData, agencyName, contactEmail, contactPhone, services }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const leftM = 50;
    const contentW = W - 100;
    const biz = lead.name || "Business";

    // ── Cover Page ──
    doc.rect(0, 0, W, 180).fill(COLORS.dark);
    doc.fontSize(28).font("Helvetica-Bold").fillColor("#ffffff")
      .text(agencyName || "Growth Proposal", leftM, 60, { width: contentW });
    doc.fontSize(14).fillColor(COLORS.accent)
      .text(`Prepared for ${biz}`, leftM, 100, { width: contentW });
    doc.fontSize(10).fillColor("#888888")
      .text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), leftM, 130, { width: contentW });

    doc.moveDown(6);

    // ── Business Overview ──
    doc.fontSize(18).font("Helvetica-Bold").fillColor(COLORS.dark).text("Business Overview");
    doc.moveDown(0.5);

    const overview = [
      ["Business", biz],
      ["Category", lead.category || "Local Business"],
      ["Location", lead.address || "—"],
      ["Rating", lead.rating ? `${lead.rating} stars (${lead.reviews || 0} reviews)` : "—"],
      ["Website", lead.website || "None"],
      ["Email", lead.email || "—"],
    ];

    for (const [label, value] of overview) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.muted).text(label.toUpperCase(), leftM, doc.y, { continued: true, width: 100 });
      doc.font("Helvetica").fillColor(COLORS.dark).text(`  ${value}`);
      doc.moveDown(0.3);
    }

    doc.moveDown(1);

    // ── Key Findings ──
    doc.fontSize(18).font("Helvetica-Bold").fillColor(COLORS.dark).text("Key Findings");
    doc.moveDown(0.5);

    const findings = [];
    if (lead.unclaimed) findings.push({ issue: "Unclaimed Google Listing", severity: "high", detail: "Anyone could claim this listing. The business is missing out on free features like responding to reviews, updating hours, and posting updates." });
    if (!lead.website) findings.push({ issue: "No Website", severity: "high", detail: "This business has no web presence beyond Google Maps. They're invisible to anyone searching online." });
    if (lead.gbpSignals?.isStale) findings.push({ issue: "Stale Online Presence", severity: "medium", detail: "No recent activity on their Google listing. This signals to customers and Google that the business may be inactive." });
    if (!lead.gbpSignals?.hasOwnerResponses && lead.reviews >= 10) findings.push({ issue: "No Review Responses", severity: "medium", detail: `${lead.reviews} reviews and the owner has never responded. This is a missed opportunity to build trust and loyalty.` });
    if (lead.gbpSignals?.photoCount < 5) findings.push({ issue: "Few Photos", severity: "low", detail: "Listings with 10+ photos get 35% more clicks. This business has fewer than 5." });
    if (lead.reviews < 20) findings.push({ issue: "Low Review Count", severity: "medium", detail: `Only ${lead.reviews} reviews. A structured review generation campaign could significantly boost visibility.` });
    if (lead.techStackSummary?.includes("Wix") || lead.techStackSummary?.includes("Weebly")) findings.push({ issue: "Outdated Website Platform", severity: "medium", detail: "Built on a DIY platform that limits SEO performance and conversion optimization." });
    if (!lead.facebook && !lead.instagram) findings.push({ issue: "No Social Media", severity: "medium", detail: "No Facebook or Instagram presence found. Missing out on the #1 discovery channel for local businesses." });

    if (findings.length === 0) {
      findings.push({ issue: "General Digital Presence", severity: "low", detail: "Solid foundation, but there's always room to optimize and grow online visibility." });
    }

    for (const f of findings) {
      const color = f.severity === "high" ? "#ef4444" : f.severity === "medium" ? COLORS.accent : COLORS.muted;
      doc.fontSize(12).font("Helvetica-Bold").fillColor(color).text(`● ${f.issue}`);
      doc.fontSize(10).font("Helvetica").fillColor(COLORS.dark).text(f.detail, { indent: 16 });
      doc.moveDown(0.5);
    }

    // ── Page break for recommendations ──
    doc.addPage();

    // ── Recommended Services ──
    doc.fontSize(18).font("Helvetica-Bold").fillColor(COLORS.dark).text("Recommended 3-Month Plan");
    doc.moveDown(0.5);

    const recs = services?.length > 0 ? services : [
      { name: "Google Business Optimization", desc: "Claim, verify, and fully optimize the Google Business Profile with photos, posts, hours, and keyword-rich descriptions.", timeline: "Week 1-2" },
      { name: "Website Design & SEO", desc: "Build a fast, mobile-optimized website with local SEO targeting and clear calls-to-action.", timeline: "Week 2-4" },
      { name: "Review Generation Strategy", desc: "Implement automated review request system to build social proof and improve search rankings.", timeline: "Week 3-6" },
      { name: "Social Media Setup", desc: "Create and optimize Facebook and Instagram profiles. Establish content calendar and posting schedule.", timeline: "Week 4-8" },
      { name: "Ongoing Management", desc: "Monthly reporting, review monitoring, content updates, and performance optimization.", timeline: "Month 2-3+" },
    ];

    for (let i = 0; i < recs.length; i++) {
      const r = recs[i];
      doc.fontSize(12).font("Helvetica-Bold").fillColor(COLORS.accent).text(`${i + 1}. ${r.name}`);
      doc.fontSize(10).font("Helvetica").fillColor(COLORS.dark).text(r.desc, { indent: 16 });
      if (r.timeline) {
        doc.fontSize(9).fillColor(COLORS.muted).text(`Timeline: ${r.timeline}`, { indent: 16 });
      }
      doc.moveDown(0.5);
    }

    doc.moveDown(1);

    // ── CTA ──
    const ctaY = doc.y;
    doc.rect(leftM, ctaY, contentW, 70).fill(COLORS.dark);
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#ffffff")
      .text("Ready to get started?", leftM + 20, ctaY + 15, { width: contentW - 40 });
    doc.fontSize(10).fillColor(COLORS.accent)
      .text(`${contactEmail || ""}${contactPhone ? "  •  " + contactPhone : ""}`, leftM + 20, ctaY + 40, { width: contentW - 40 });

    doc.fontSize(8).font("Helvetica").fillColor(COLORS.muted)
      .text(`Prepared by ${agencyName || "Your Agency"} — Confidential`, leftM, doc.page.height - 40, { width: contentW, align: "center" });

    doc.end();
  });
}
