// scraper/exporter.js
// Exports leads to XLSX with professional formatting:
// - Color-coded lead score column (green/yellow/red)
// - Clickable hyperlinks for website, Maps, LinkedIn
// - Frozen header row
// - Auto-fitted column widths
// - Summary sheet with stats

import ExcelJS from "exceljs";

// Score color bands
function scoreColor(score) {
  if (score >= 80) return { argb: "FF22C55E" }; // green
  if (score >= 60) return { argb: "FFF0B429" }; // amber
  return { argb: "FFEF4444" };                   // red
}

function scoreBackground(score) {
  if (score >= 80) return { argb: "1522C55E" };
  if (score >= 60) return { argb: "15F0B429" };
  return { argb: "15EF4444" };
}

const EMAIL_QUALITY_COLORS = {
  owner:    { argb: "FF22C55E" },
  personal: { argb: "FF60A5FA" },
  business: { argb: "FF94A3B8" },
  free:     { argb: "FFF59E0B" },
  generic:  { argb: "FF94A3B8" },
  invalid:  { argb: "FFEF4444" },
};

export async function exportToXLSX(leads, meta = {}) {
  const wb = new ExcelJS.Workbook();

  wb.creator = "LeadReap";
  wb.created = new Date();
  wb.properties.date1904 = false;

  // ── Sheet 1: Leads ────────────────────────────────────────
  const ws = wb.addWorksheet("Leads", {
    views: [{ state: "frozen", ySplit: 1 }], // freeze header row
    pageSetup: { fitToPage: true, orientation: "landscape" },
  });

  // Column definitions
  ws.columns = [
    { key: "score",          header: "Score",          width: 8  },
    { key: "name",           header: "Business Name",  width: 30 },
    { key: "ownerName",      header: "Contact Name",   width: 22 },
    { key: "ownerTitle",     header: "Title",          width: 18 },
    { key: "email",          header: "Email",          width: 30 },
    { key: "emailQuality",   header: "Email Type",     width: 16 },
    { key: "phone",          header: "Phone",          width: 16 },
    { key: "address",        header: "Address",        width: 35 },
    { key: "category",       header: "Category",       width: 22 },
    { key: "rating",         header: "Rating",         width: 8  },
    { key: "reviews",        header: "Reviews",        width: 9  },
    { key: "website",        header: "Website",        width: 30 },
    { key: "techStack",      header: "Tech Stack",     width: 20 },
    { key: "revenueRange",   header: "Est. Revenue",   width: 18 },
    { key: "employeeRange",  header: "Est. Employees", width: 16 },
    { key: "signals",        header: "Business Signals",width: 30 },
    { key: "linkedinCompany",header: "LinkedIn",       width: 30 },
    { key: "notes",          header: "Insight",        width: 45 },
    { key: "mapsUrl",        header: "Google Maps",    width: 15 },
  ];

  // Style header row
  const headerRow = ws.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A0A0B" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF2A2A35" } },
    };
  });

  // Add lead rows
  leads.forEach((lead, i) => {
    const row = ws.addRow({
      score:           lead.score,
      name:            lead.name,
      ownerName:       lead.ownerName || "",
      ownerTitle:      lead.ownerTitle || "",
      email:           lead.email || "",
      emailQuality:    lead.emailQualityLabel || "",
      phone:           lead.phoneDisplay || lead.phone || "",
      address:         lead.address || "",
      category:        lead.category || "",
      rating:          lead.rating ? `${lead.rating} ★` : "",
      reviews:         lead.reviews || 0,
      website:         lead.website || "",
      techStack:       lead.techStackSummary || "",
      revenueRange:    lead.enrichment?.revenueRange || "",
      employeeRange:   lead.enrichment?.employeeRange || "",
      signals:         (lead.enrichment?.signals || []).join(", "),
      linkedinCompany: lead.linkedinCompany || "",
      notes:           lead.notes || "",
      mapsUrl:         lead.mapsUrl || "",
    });

    row.height = 18;

    // Alternate row background
    const rowBg = i % 2 === 0 ? "FFFFFFFF" : "FFF8F8FA";

    row.eachCell({ includeEmpty: true }, cell => {
      cell.alignment = { vertical: "middle", wrapText: false };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      cell.font = { size: 10 };
    });

    // Score cell — color coded
    const scoreCell = row.getCell("score");
    scoreCell.font = { bold: true, color: scoreColor(lead.score), size: 10 };
    scoreCell.fill = { type: "pattern", pattern: "solid", fgColor: scoreBackground(lead.score) };
    scoreCell.alignment = { horizontal: "center", vertical: "middle" };

    // Email — colored by quality
    if (lead.email && lead.emailQuality) {
      const emailCell = row.getCell("email");
      emailCell.font = {
        size: 10,
        color: EMAIL_QUALITY_COLORS[lead.emailQuality] || { argb: "FF333333" },
        underline: true,
      };
      emailCell.value = { text: lead.email, hyperlink: `mailto:${lead.email}` };
    }

    // Website — clickable hyperlink
    if (lead.website) {
      const webCell = row.getCell("website");
      webCell.value = { text: lead.website.replace(/^https?:\/\//, ""), hyperlink: lead.website };
      webCell.font = { size: 10, color: { argb: "FF60A5FA" }, underline: true };
    }

    // LinkedIn — clickable
    if (lead.linkedinCompany) {
      const liCell = row.getCell("linkedinCompany");
      liCell.value = { text: "View Profile →", hyperlink: lead.linkedinCompany };
      liCell.font = { size: 10, color: { argb: "FF0077B5" }, underline: true };
    }

    // Google Maps — clickable
    if (lead.mapsUrl) {
      const mapsCell = row.getCell("mapsUrl");
      mapsCell.value = { text: "Open Maps →", hyperlink: lead.mapsUrl };
      mapsCell.font = { size: 10, color: { argb: "FF4285F4" }, underline: true };
    }

    // Rating — highlight if high
    if (lead.rating >= 4.5) {
      row.getCell("rating").font = { bold: true, color: { argb: "FFF0B429" }, size: 10 };
    }
  });

  // Auto-filter on header row
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: ws.columns.length },
  };

  // ── Sheet 2: Summary ───────────────────────────────────────
  const ws2 = wb.addWorksheet("Summary");
  ws2.columns = [{ width: 30 }, { width: 25 }];

  const addSummaryRow = (label, value, bold = false) => {
    const row = ws2.addRow([label, value]);
    if (bold) {
      row.getCell(1).font = { bold: true, size: 11 };
      row.getCell(2).font = { bold: true, size: 11 };
    }
    row.getCell(1).alignment = { horizontal: "right" };
    row.getCell(2).alignment = { horizontal: "left" };
  };

  ws2.addRow(["LeadReap Export"]).font = { bold: true, size: 14 };
  ws2.addRow([]);
  addSummaryRow("Search:", `${meta.niche} in ${meta.location}`, true);
  addSummaryRow("Exported:", new Date().toLocaleString());
  addSummaryRow("Total Leads:", leads.length, true);
  ws2.addRow([]);

  const highScore = leads.filter(l => l.score >= 80).length;
  const midScore  = leads.filter(l => l.score >= 60 && l.score < 80).length;
  const lowScore  = leads.filter(l => l.score < 60).length;
  const withEmail = leads.filter(l => l.email).length;
  const withPhone = leads.filter(l => l.phone).length;
  const withWeb   = leads.filter(l => l.website).length;

  addSummaryRow("🟢 High Score (80+):", highScore);
  addSummaryRow("🟡 Mid Score (60-79):", midScore);
  addSummaryRow("🔴 Low Score (<60):", lowScore);
  ws2.addRow([]);
  addSummaryRow("📧 Leads with Email:", `${withEmail} (${Math.round(withEmail/leads.length*100)}%)`);
  addSummaryRow("📞 Leads with Phone:", `${withPhone} (${Math.round(withPhone/leads.length*100)}%)`);
  addSummaryRow("🌐 Leads with Website:", `${withWeb} (${Math.round(withWeb/leads.length*100)}%)`);
  ws2.addRow([]);

  // Tech stack breakdown
  const techCounts = {};
  leads.forEach(l => (l.techStack || []).forEach(t => {
    techCounts[t.name] = (techCounts[t.name] || 0) + 1;
  }));
  if (Object.keys(techCounts).length > 0) {
    ws2.addRow(["Tech Stack Breakdown"]).font = { bold: true };
    Object.entries(techCounts).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
      addSummaryRow(`  ${name}:`, count);
    });
  }

  return wb;
}

export async function exportToBuffer(leads, meta) {
  const wb = await exportToXLSX(leads, meta);
  return wb.xlsx.writeBuffer();
}
