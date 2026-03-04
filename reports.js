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
