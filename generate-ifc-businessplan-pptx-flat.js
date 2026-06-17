// Generate IFC Business Plan 2026 — Prism-style PPTX (Canva-friendly flat variant)
// Output: /Users/jvanwaveren/IFC/IFC_BusinessPlan_2026_flat.pptx
//
// Same 12 slides and layout as generate-ifc-businessplan-pptx.js, but the
// visual effects Canva's PPTX importer struggles with have been flattened:
//   • Transparent overlapping corner ovals  → opaque pale-tinted accent corners
//   • Frosted-glass transparent panels      → opaque white panels, subtle border
//   • Outer drop shadows                    → removed
// Typography, layout, palette and content are identical to the atmospheric
// version. Cleanly editable after Upload → PPTX in Canva.

const pptxgen = require("pptxgenjs");
const pptx = new pptxgen();

// ── Brand colours ───────────────────────────────────────────
const DEEP = "EAF6F1";
const SKY = "6DC0C8";
const ROSE = "F5B896";
const AMBER = "F2D080";
const MINT = "9FD4B0";
const INK = "0D3B2E";       // primary text
const GLASS = "FFFFFF";
// Pale opaque tints (~20% of each accent mixed into DEEP) — replace the
// transparent flare ovals. Canva imports solid fills cleanly.
const PALE_SKY   = "D5EDEE";
const PALE_ROSE  = "FAE5D8";
const PALE_AMBER = "F9ECD3";
const PALE_MINT  = "DCEDD8";
const PANEL_BORDER = "D5E8DC"; // subtle mint border for flat glass

// ── Layout ──────────────────────────────────────────────────
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.defineSlideMaster({ title: "PRISM", background: { color: DEEP } });

// ── Helpers ─────────────────────────────────────────────────
function addFlares(slide) {
  // Four opaque pale-tint corner ovals — no transparency, no overlap between
  // them. Imports to Canva as clean, independently editable shapes.
  slide.addShape(pptx.shapes.OVAL, { x: -3.5, y: -3.5, w: 7.5, h: 7.5, fill: { color: PALE_SKY }, line: { width: 0 } });
  slide.addShape(pptx.shapes.OVAL, { x: 9.3, y: -3.5, w: 7.5, h: 7.5, fill: { color: PALE_ROSE }, line: { width: 0 } });
  slide.addShape(pptx.shapes.OVAL, { x: 9.3, y: 3.5, w: 7.5, h: 7.5, fill: { color: PALE_AMBER }, line: { width: 0 } });
  slide.addShape(pptx.shapes.OVAL, { x: -3.5, y: 3.5, w: 7.5, h: 7.5, fill: { color: PALE_MINT }, line: { width: 0 } });
}

function addGlassPanel(slide, x, y, w, h, opts = {}) {
  // Flat opaque white panel with a subtle mint border. No transparency,
  // no drop shadow, no bevel highlight — so Canva renders it as a clean
  // editable rounded rectangle.
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.15,
    fill: { color: GLASS },
    line: { color: PANEL_BORDER, width: 1 },
    ...opts,
  });
}

function addAccentBar(slide, x, y, h, color) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x, y, w: 0.06, h,
    fill: { color }, line: { width: 0 }, rectRadius: 0.03,
  });
}

function addSpectrumLine(slide, x, y, w) {
  // Dark leader + 4 refracted stripes (sky/rose/amber/mint)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x, y, w: w * 0.35, h: 0.03,
    fill: { color: INK }, line: { width: 0 },
  });
  const stripeW = w * 0.65;
  const stripeX = x + w * 0.35;
  [SKY, ROSE, AMBER, MINT].forEach((c, i) => {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: stripeX, y: y - 0.12 + i * 0.08, w: stripeW, h: 0.025,
      fill: { color: c }, line: { width: 0 },
    });
  });
}

function addLogo(slide) {
  slide.addText("IFC", {
    x: 0.6, y: 0.35, w: 1, h: 0.4,
    fontFace: "Arial", fontSize: 14, bold: true, color: INK,
    charSpacing: 4,
  });
}

function addPageTag(slide, text) {
  slide.addText(text, {
    x: 9, y: 0.35, w: 4, h: 0.4,
    fontFace: "Arial", fontSize: 9, color: INK, charSpacing: 3,
    transparency: 55, align: "right",
  });
}

function addLabel(slide, text) {
  slide.addText(text.toUpperCase(), {
    x: 0.8, y: 0.9, w: 6, h: 0.3,
    fontFace: "Arial", fontSize: 8, bold: true, color: INK,
    charSpacing: 4, transparency: 55,
  });
}

function sectionFrame(slide, idx, name) {
  addFlares(slide);
  addLogo(slide);
  addPageTag(slide, `${String(idx).padStart(2, "0")} · ${name}`);
  addLabel(slide, `${String(idx).padStart(2, "0")} · ${name}`);
}

// ═══════════════════════════════════════════════════════════
// SLIDE 1 — COVER
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide({ masterName: "PRISM" });
  addFlares(s);
  addLogo(s);
  addPageTag(s, "Business Plan · 2026");

  s.addText("INCLUSIVE FINANCE COLLECTIVE · BUSINESS PLAN 2026", {
    x: 0.8, y: 1.2, w: 11, h: 0.3,
    fontFace: "Arial", fontSize: 9, bold: true, color: INK, charSpacing: 4, transparency: 55,
  });

  s.addText([
    { text: "Women are reshaping the economy — as ", options: { color: INK, fontFace: "Arial", fontSize: 32, bold: true } },
    { text: "entrepreneurs, earners\nand wealth owners.", options: { color: SKY, fontFace: "Arial", fontSize: 32, bold: true } },
    { text: "\nThe financial industry hasn't caught up.\nThe blind spots are the business case.", options: { color: INK, fontFace: "Arial", fontSize: 32, bold: true, lineSpacing: 42 } },
  ], { x: 0.8, y: 1.7, w: 11.8, h: 3.8, valign: "top" });

  addSpectrumLine(s, 0.8, 5.7, 7);

  s.addText(
    "Women's position in the economy has shifted across entrepreneurship, career and wealth ownership — and the legacy FS playbook wasn't built for any of it. This plan turns those blind spots into revenue: methodology, revenue architecture, go-to-market and the 90-day sprint.",
    {
      x: 0.8, y: 6.1, w: 10, h: 1,
      fontFace: "Arial", fontSize: 11, color: INK, transparency: 30, lineSpacing: 17,
    }
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 2 — EXECUTIVE SUMMARY
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide({ masterName: "PRISM" });
  sectionFrame(s, 1, "Executive Summary");

  s.addText("A business performance firm for the blind spots banks can't afford to keep.", {
    x: 0.8, y: 1.3, w: 11, h: 0.9,
    fontFace: "Arial", fontSize: 22, bold: true, color: INK, lineSpacing: 28,
  });

  s.addText(
    "IFC is a science-based inclusion consultancy for financial institutions. We are not DEI. We are not HR. We help banks, wealth managers and insurers convert underserved women and diverse client segments into measurable revenue — with a fact-based methodology, a 60-country delivery network, and the most influential founder bench in the category.",
    {
      x: 0.8, y: 2.2, w: 11.5, h: 0.9,
      fontFace: "Arial", fontSize: 11, color: INK, transparency: 32, lineSpacing: 17,
    }
  );

  const kpis = [
    { label: "MANDATE", num: "60", body: "Countries covered by the World Bank implementation mandate over four years." },
    { label: "MARKET", num: "50%+", body: "Share of European wealth now controlled by women — one of several blind spots, alongside entrepreneurship and senior careers." },
    { label: "FOCUS", num: "FS", body: "Banks, asset managers, insurers, intermediaries. Narrow by design." },
    { label: "YEAR 3", num: "50%", body: "Match founder pre-IFC salaries at half the time while building the leading gender-lens finance network." },
  ];
  kpis.forEach((k, i) => {
    const x = 0.8 + i * 3.05;
    addGlassPanel(s, x, 3.25, 2.85, 2.3);
    s.addText(k.label, { x: x + 0.25, y: 3.35, w: 2.5, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: INK, charSpacing: 3, transparency: 45 });
    s.addText(k.num, { x: x + 0.25, y: 3.7, w: 2.5, h: 0.8, fontFace: "Arial", fontSize: 34, bold: true, color: SKY });
    s.addText(k.body, { x: x + 0.25, y: 4.55, w: 2.5, h: 1, fontFace: "Arial", fontSize: 9.5, color: INK, transparency: 30, lineSpacing: 14, valign: "top" });
  });

  // Plan in one paragraph
  addGlassPanel(s, 0.8, 5.8, 11.7, 1.35);
  s.addText("THE PLAN IN ONE PARAGRAPH", { x: 1, y: 5.88, w: 6, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: INK, charSpacing: 3, transparency: 45 });
  s.addText(
    "Name and quantify the blind spots the legacy FS playbook was not built for — across women as entrepreneurs, earners and wealth owners. Use the founders' networks as the fastest path to enterprise decision-makers and the 60-country World Bank mandate as proof of scale. The Gender Capital Lab™ methodology delivers advisory, academy, membership and platform revenue. In 90 days: publish the business case, book five corporate pilots, sign the first paying client.",
    { x: 1, y: 6.2, w: 11.3, h: 0.9, fontFace: "Arial", fontSize: 10, color: INK, transparency: 20, lineSpacing: 15, valign: "top" }
  );
}

// ═══════════════════════════════════════════════════════════
// SLIDE 3 — THE OPPORTUNITY
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide({ masterName: "PRISM" });
  sectionFrame(s, 2, "Why Now");

  s.addText("The women's economy has shifted. Banks haven't.", {
    x: 0.8, y: 1.3, w: 11, h: 0.7, fontFace: "Arial", fontSize: 22, bold: true, color: INK,
  });
  s.addText("Four blind spots the legacy FS playbook was not built for. Each one is measurable, underserved, and a board-level revenue question.", {
    x: 0.8, y: 2.0, w: 11, h: 0.6, fontFace: "Arial", fontSize: 11, color: INK, transparency: 30, lineSpacing: 16,
  });

  const points = [
    { title: "Women as Entrepreneurs", body: "Women are founding and scaling businesses at record rates — and meeting a funding, credit and advice gap legacy SME banking never closed. The women's business book is one of the fastest-growing FS segments globally, and one of the least understood.", color: SKY },
    { title: "Women as Earners & Professionals", body: "Senior careers, dual-income households and rising individual incomes are reshaping who the primary FS relationship is with. Advice journeys, product defaults and marcom are still calibrated to the previous client — and the attrition shows.", color: ROSE },
    { title: "Women as Wealth Owners", body: "Personal wealth, co-ownership and the largest inheritance event in modern history — women already control 50%+ of European wealth and the share is accelerating. Most wealth managers have not restructured product, advice or onboarding to serve the actual owner.", color: AMBER },
    { title: "Legacy Blind Spots Cost Revenue", body: "Products, funnels, marcom and advice built for the previous client. Each blind spot is quantifiable: lost share of wallet, lower retention, NPS drag, reputation cost. What gets measured gets closed — and that is where we start.", color: MINT },
  ];

  points.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * 6.1;
    const y = 2.9 + row * 2.1;
    addAccentBar(s, x, y, 1.85, p.color);
    addGlassPanel(s, x + 0.12, y, 5.85, 1.85);
    s.addText(p.title, { x: x + 0.4, y: y + 0.18, w: 5.4, h: 0.4, fontFace: "Arial", fontSize: 13, bold: true, color: INK });
    s.addText(p.body, { x: x + 0.4, y: y + 0.6, w: 5.4, h: 1.15, fontFace: "Arial", fontSize: 10, color: INK, transparency: 30, lineSpacing: 15, valign: "top" });
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 4 — IDENTITY
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide({ masterName: "PRISM" });
  sectionFrame(s, 3, "Who We Are");

  s.addText("A business performance firm. Not a values campaign.", {
    x: 0.8, y: 1.3, w: 11, h: 0.7, fontFace: "Arial", fontSize: 22, bold: true, color: INK,
  });
  s.addText("IFC is a science-based inclusion consultancy built for the business side of financial institutions. We bring diagnostic tools, workshops and tailored solutions. We deliver internationally — across 60+ countries in partnership with the World Bank.", {
    x: 0.8, y: 2.0, w: 11, h: 0.8, fontFace: "Arial", fontSize: 11, color: INK, transparency: 30, lineSpacing: 16,
  });

  const cards = [
    { label: "WE ARE", title: "A business performance firm", body: "Fact-based, financial-grade business cases. We quantify the cost of inaction and close it." },
    { label: "WE ARE NOT", title: "A DEI or HR programme", body: "We do not do general culture change, broad DEI work, or HR consultancy. That discipline is our edge." },
    { label: "WE GO THROUGH", title: "The client door", body: "Every other inclusion firm works the HR door. We help institutions reach, serve and grow revenue from diverse clients externally." },
  ];
  cards.forEach((c, i) => {
    const x = 0.8 + i * 4.05;
    addGlassPanel(s, x, 3.1, 3.85, 2.6);
    s.addText(c.label, { x: x + 0.35, y: 3.25, w: 3.4, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: INK, charSpacing: 3, transparency: 45 });
    s.addText(c.title, { x: x + 0.35, y: 3.55, w: 3.4, h: 0.6, fontFace: "Arial", fontSize: 14, bold: true, color: INK, lineSpacing: 20 });
    s.addText(c.body, { x: x + 0.35, y: 4.25, w: 3.4, h: 1.4, fontFace: "Arial", fontSize: 10, color: INK, transparency: 30, lineSpacing: 15, valign: "top" });
  });

  addSpectrumLine(s, 0.8, 6.15, 7);

  s.addText([
    { text: "We do not come with values. We come with ", options: { color: INK, fontFace: "Arial", fontSize: 20, bold: false } },
    { text: "revenue numbers.", options: { color: SKY, fontFace: "Arial", fontSize: 20, bold: true } },
  ], { x: 0.8, y: 6.5, w: 12, h: 0.7 });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 5 — WHO WE SERVE
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide({ masterName: "PRISM" });
  sectionFrame(s, 4, "Who We Serve");

  s.addText("Leaders who see the commercial opportunity — not just the compliance requirement.", {
    x: 0.8, y: 1.3, w: 11.5, h: 0.7, fontFace: "Arial", fontSize: 22, bold: true, color: INK, lineSpacing: 28,
  });
  s.addText("Medium and large corporates whose boards and C-suites treat underserved client segments as a revenue problem, not a values problem. Primary focus: financial services.", {
    x: 0.8, y: 2.05, w: 11.5, h: 0.7, fontFace: "Arial", fontSize: 11, color: INK, transparency: 30, lineSpacing: 16,
  });

  const audiences = [
    { label: "PRIMARY", title: "Financial Institutions", body: "Banks, wealth managers, asset managers, insurers and intermediaries (accountants, mortgage brokers). Clearest cost of inaction, fastest commercial brief." },
    { label: "MULTILATERAL", title: "International Organisations", body: "World Bank, EIB, Financial Alliance for Women — deploying the IFC methodology across 60+ countries as market infrastructure." },
    { label: "POLICY", title: "Regulators & Supervisors", body: "Policy makers turning awareness of gender-lens finance into binding guidance, benchmarks and market standards." },
  ];
  audiences.forEach((a, i) => {
    const x = 0.8 + i * 4.05;
    addGlassPanel(s, x, 2.95, 3.85, 2.3);
    s.addText(a.label, { x: x + 0.3, y: 3.1, w: 3.5, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: INK, charSpacing: 3, transparency: 45 });
    s.addText(a.title, { x: x + 0.3, y: 3.4, w: 3.5, h: 0.5, fontFace: "Arial", fontSize: 14, bold: true, color: INK });
    s.addText(a.body, { x: x + 0.3, y: 3.95, w: 3.5, h: 1.3, fontFace: "Arial", fontSize: 10, color: INK, transparency: 30, lineSpacing: 15, valign: "top" });
  });

  // Named prospects bar
  addGlassPanel(s, 0.8, 5.5, 11.7, 1.65);
  s.addText("INITIAL NAMED PROSPECTS", { x: 1, y: 5.6, w: 6, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: INK, charSpacing: 3, transparency: 45 });

  const cols = [
    { head: "DUTCH ANCHORS", body: "ABN AMRO · ING · Van Lanschot · Insinger Gilissen · Code V" },
    { head: "GLOBAL & MULTILATERAL", body: "World Bank · EIB · Financial Alliance for Women" },
    { head: "COMPETITOR / CHANNEL", body: "EY · PwC · Deloitte — competitors and potential distribution partners." },
  ];
  cols.forEach((c, i) => {
    const x = 1 + i * 3.85;
    s.addText(c.head, { x, y: 5.95, w: 3.7, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: INK, charSpacing: 3, transparency: 40 });
    s.addText(c.body, { x, y: 6.25, w: 3.7, h: 0.85, fontFace: "Arial", fontSize: 9.5, color: INK, transparency: 25, lineSpacing: 15, valign: "top" });
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 6 — DIFFERENTIATION
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide({ masterName: "PRISM" });
  sectionFrame(s, 5, "What Makes Us Different");

  s.addText("An almost entirely unoccupied space — with a lean, precise delivery model.", {
    x: 0.8, y: 1.3, w: 11.5, h: 0.7, fontFace: "Arial", fontSize: 22, bold: true, color: INK,
  });
  s.addText("Every other inclusion firm works the HR door. We work the client door. That single choice redefines the buyer, the brief and the business case.", {
    x: 0.8, y: 2.05, w: 11, h: 0.6, fontFace: "Arial", fontSize: 11, color: INK, transparency: 30, lineSpacing: 16,
  });

  const diffs = [
    { title: "Fact-based, not moral-case", body: "Gender gap analysis, funnel data, product-fit audits, reputation metrics. Impossible to ignore, measurable, and tied to portfolio outcomes.", color: SKY },
    { title: "Exclusive FS focus", body: "Deep sector expertise in banking, wealth management and insurance. We do not chase adjacent DEI work. Precision beats scope.", color: ROSE },
    { title: "Proven at 60-country scale", body: "The World Bank mandate signals market infrastructure — not a pilot. The same IP that serves WB powers our commercial clients at home.", color: AMBER },
    { title: "Doors no budget can open", body: "Founder bench reaches ministers, royalty and global C-suites. First conversations happen on personal authority — not cold outreach.", color: MINT },
  ];
  diffs.forEach((d, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * 6.1;
    const y = 2.9 + row * 1.85;
    addAccentBar(s, x, y, 1.6, d.color);
    addGlassPanel(s, x + 0.12, y, 5.85, 1.6);
    s.addText(d.title, { x: x + 0.4, y: y + 0.18, w: 5.4, h: 0.4, fontFace: "Arial", fontSize: 13, bold: true, color: INK });
    s.addText(d.body, { x: x + 0.4, y: y + 0.6, w: 5.4, h: 0.95, fontFace: "Arial", fontSize: 10, color: INK, transparency: 30, lineSpacing: 15, valign: "top" });
  });

  // Tag row
  const tags = ["CLIENT-SIDE", "FINANCIAL-GRADE", "FS-ONLY", "WORLD BANK BACKED", "CERTIFIED PARTNER NETWORK", "NO OVERHEAD EMPIRE"];
  let tx = 0.8;
  tags.forEach(t => {
    const w = 0.17 + t.length * 0.08;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: tx, y: 6.75, w, h: 0.32, rectRadius: 0.16,
      fill: { color: GLASS },
      line: { color: PANEL_BORDER, width: 0.75 },
    });
    s.addText(t, { x: tx, y: 6.75, w, h: 0.32, fontFace: "Arial", fontSize: 7.5, bold: true, color: INK, charSpacing: 2, align: "center", valign: "middle", transparency: 25 });
    tx += w + 0.15;
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 7 — GENDER CAPITAL LAB
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide({ masterName: "PRISM" });
  sectionFrame(s, 6, "The Gender Capital Lab");

  s.addText("A four-step methodology from diagnosis to embedded, scaled change.", {
    x: 0.8, y: 1.3, w: 11.5, h: 0.7, fontFace: "Arial", fontSize: 22, bold: true, color: INK,
  });
  s.addText("The operating system of the firm. Every engagement — from a World Bank country deployment to a single corporate advisory — runs through this loop.", {
    x: 0.8, y: 2.05, w: 11.5, h: 0.6, fontFace: "Arial", fontSize: 11, color: INK, transparency: 30, lineSpacing: 16,
  });

  const steps = [
    { num: "01", title: "Diagnose", sub: "GENDER LENS FRAMEWORK", body: "Data-driven analysis of where an FI is leaving money on the table: gender gap in portfolio, funnel analysis, product-fit audit, client behaviour mapping.", out: "Opportunity map with quantified business potential.", color: SKY },
    { num: "02", title: "Strategise", sub: "OPPORTUNITY MAP", body: "Turn diagnosis into an executive-ready strategy. Gender-lens finance framed as a commercial imperative.", out: "Investment-grade strategy & business case.", color: ROSE },
    { num: "03", title: "Build & Test", sub: "ACADEMY + PILOTS", body: "Train internal teams, build certified practitioners (Associate → Advisor → Fellow), pilot improved products and propositions in safe-to-fail environments.", out: "Validated solutions + certified practitioners.", color: AMBER },
    { num: "04", title: "Measure & Scale", sub: "EMBED & GROW", body: "Rigorous impact measurement, embed proven interventions across the organisation and build the case for scaling — internally and as a market signal.", out: "Proven impact + scaling strategy.", color: MINT },
  ];
  steps.forEach((p, i) => {
    const x = 0.8 + i * 3.05;
    addGlassPanel(s, x, 2.95, 2.85, 3.35);
    s.addText(p.num, { x: x + 0.3, y: 3.08, w: 1, h: 0.4, fontFace: "Arial", fontSize: 11, bold: true, color: p.color, charSpacing: 2 });
    s.addText(p.title, { x: x + 0.3, y: 3.4, w: 2.5, h: 0.5, fontFace: "Arial", fontSize: 15, bold: true, color: INK });
    s.addText(p.sub, { x: x + 0.3, y: 3.85, w: 2.5, h: 0.3, fontFace: "Arial", fontSize: 7.5, bold: true, color: INK, charSpacing: 2, transparency: 45 });
    s.addText(p.body, { x: x + 0.3, y: 4.2, w: 2.5, h: 1.25, fontFace: "Arial", fontSize: 9.5, color: INK, transparency: 30, lineSpacing: 14, valign: "top" });

    // Output pill
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.25, y: 5.55, w: 2.4, h: 0.6, rectRadius: 0.08,
      fill: { color: DEEP }, line: { color: PANEL_BORDER, width: 0.75 },
    });
    s.addText("OUTPUT", { x: x + 0.35, y: 5.6, w: 2.2, h: 0.2, fontFace: "Arial", fontSize: 7, bold: true, color: INK, charSpacing: 2, transparency: 45 });
    s.addText(p.out, { x: x + 0.35, y: 5.78, w: 2.2, h: 0.35, fontFace: "Arial", fontSize: 8, color: INK, transparency: 20, lineSpacing: 11, valign: "top" });
  });

  // Five dimensions banner
  addGlassPanel(s, 0.8, 6.5, 11.7, 0.75);
  s.addText("FIVE UNLOCKED DIMENSIONS", { x: 1, y: 6.56, w: 4, h: 0.25, fontFace: "Arial", fontSize: 8, bold: true, color: INK, charSpacing: 3, transparency: 45 });
  s.addText("Employee & Organisation  ·  Data  ·  Marketing & Communications  ·  Ecosystems  ·  Propositions", {
    x: 1, y: 6.83, w: 11.3, h: 0.4, fontFace: "Arial", fontSize: 10, color: INK, transparency: 20,
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 8 — REVENUE ARCHITECTURE
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide({ masterName: "PRISM" });
  sectionFrame(s, 7, "Revenue Architecture");

  s.addText("Five interlocking streams — each one widens client depth.", {
    x: 0.8, y: 1.3, w: 11, h: 0.7, fontFace: "Arial", fontSize: 22, bold: true, color: INK,
  });
  s.addText("A deliberate ladder: fast entry diagnostic, deep advisory, certification that builds the network, membership that monetises the community, and a platform that scales without headcount.", {
    x: 0.8, y: 2.05, w: 11.5, h: 0.7, fontFace: "Arial", fontSize: 11, color: INK, transparency: 30, lineSpacing: 16,
  });

  const streams = [
    { num: "01", name: "Readiness Scan", body: "Entry-level AI-enabled diagnostic. Bias audit + A–D readiness rating. Creates the business case for the next step.", tag: "ENTRY", color: SKY },
    { num: "02", name: "Advisory Trajectory", body: "Bespoke engagement across employee & org, data, marcom, ecosystems, propositions. Menu-based modules. Core revenue of Y1–2.", tag: "CORE", color: ROSE },
    { num: "03", name: "Academy & Certification", body: "Train and certify practitioners (Associate → Advisor → Fellow). Organisations earn Certified Gender Lab status.", tag: "CAPABILITY", color: AMBER },
    { num: "04", name: "Membership Community", body: "Recurring subscription. Peer learning, tools, benchmarks for certified organisations. Scales without headcount.", tag: "RECURRING", color: MINT },
    { num: "05", name: "Platform (Year 2–3)", body: "Digital layer: allyship tracks, AI-assisted advisory, continuous scan capability. Low-touch, high-margin. Basis for funder panel.", tag: "SCALE", color: SKY },
  ];

  addGlassPanel(s, 0.8, 2.95, 11.7, 3.7);

  streams.forEach((r, i) => {
    const y = 3.1 + i * 0.71;
    if (i > 0) {
      s.addShape(pptx.shapes.RECTANGLE, { x: 1, y: y - 0.02, w: 11.3, h: 0.01, fill: { color: INK, transparency: 90 }, line: { width: 0 } });
    }
    s.addText(r.num, { x: 1, y: y + 0.1, w: 0.6, h: 0.5, fontFace: "Arial", fontSize: 14, bold: true, color: INK, transparency: 55 });
    s.addText(r.name, { x: 1.7, y: y + 0.1, w: 3.3, h: 0.5, fontFace: "Arial", fontSize: 12, bold: true, color: INK });
    s.addText(r.body, { x: 5.1, y: y + 0.08, w: 6, h: 0.55, fontFace: "Arial", fontSize: 9.5, color: INK, transparency: 30, lineSpacing: 14, valign: "top" });
    s.addText(r.tag, { x: 11.2, y: y + 0.18, w: 1.2, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: r.color, charSpacing: 2, align: "right" });
  });

  s.addText("Year 3 innovation track: a funder panel co-invests in solutions and receives a dividend on commercial success. Community → platform → moat.", {
    x: 0.8, y: 6.8, w: 11, h: 0.4, fontFace: "Arial", fontSize: 9.5, color: INK, transparency: 40, italic: true,
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 9 — GO-TO-MARKET
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide({ masterName: "PRISM" });
  sectionFrame(s, 8, "Go-to-Market");

  s.addText("First 10 corporate clients beyond the World Bank. 90-day window. Four channels in parallel.", {
    x: 0.8, y: 1.3, w: 11.5, h: 0.8, fontFace: "Arial", fontSize: 20, bold: true, color: INK, lineSpacing: 26,
  });
  s.addText("The blind-spot argument opens the CFO conversation, not just the CSR conversation. Every channel is engineered to reach that buyer — fast.", {
    x: 0.8, y: 2.15, w: 11.5, h: 0.6, fontFace: "Arial", fontSize: 11, color: INK, transparency: 30, lineSpacing: 16,
  });

  const channels = [
    { title: "01 · Chantal's Network — Direct Executive Access", body: "Relationships at C-suite, ministerial and royal level. Fastest path to a first conversation. Personal outreach — not brochures.", target: "TARGET: 5 MEETINGS IN 30 DAYS", color: SKY },
    { title: "02 · World Bank as Credibility Signal", body: "Not just a contract — a reference that transforms the sales conversation. Request warm introductions to corporate partners and FIs in priority markets.", target: "TARGET: 3 WARM INTROS PER PRIORITY MARKET", color: ROSE },
    { title: "03 · Keynotes + Thought Leadership", body: "Britt's speaker capability + Chantal's authority + sharp positioning = speaker slots at banking summits and wealth forums.", target: "TARGET: 3 KEYNOTES IN 60 DAYS · 3+ LEADS EACH", color: AMBER },
    { title: `04 · Flagship Report — "The Trillion-Euro Blind Spot"`, body: "Publish the business case. Quantify the cost of ignoring women and diverse clients in FS. Distribute to 50 CEOs. Establish definitive-voice status.", target: "TARGET: PUBLISHED + DISTRIBUTED IN 60 DAYS", color: MINT },
  ];
  channels.forEach((c, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * 6.1;
    const y = 3.0 + row * 2.1;
    addAccentBar(s, x, y, 1.85, c.color);
    addGlassPanel(s, x + 0.12, y, 5.85, 1.85);
    s.addText(c.title, { x: x + 0.4, y: y + 0.15, w: 5.4, h: 0.4, fontFace: "Arial", fontSize: 12, bold: true, color: INK });
    s.addText(c.body, { x: x + 0.4, y: y + 0.58, w: 5.4, h: 0.85, fontFace: "Arial", fontSize: 9.5, color: INK, transparency: 30, lineSpacing: 14, valign: "top" });
    s.addText(c.target, { x: x + 0.4, y: y + 1.5, w: 5.4, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: c.color, charSpacing: 2 });
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 10 — 90-DAY SPRINT
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide({ masterName: "PRISM" });
  sectionFrame(s, 9, "The 90-Day Sprint");

  s.addText("April · May · June — the end of the preparation phase.", {
    x: 0.8, y: 1.3, w: 11.5, h: 0.7, fontFace: "Arial", fontSize: 22, bold: true, color: INK,
  });
  s.addText(`Every milestone has a named owner. No "we". World Bank visibility is explicit at each stage. This is the proof the firm is building, not preparing.`, {
    x: 0.8, y: 2.05, w: 11.5, h: 0.6, fontFace: "Arial", fontSize: 11, color: INK, transparency: 30, lineSpacing: 16,
  });

  const months = [
    { month: "April", sub: "FOUNDATION & FIRST CLIENTS", color: SKY, items: [
      "Due diligence + peer analysis (OYR benchmark)",
      "Finalise huisstijl and brand guide",
      "Shared Drive, tools, working agreements",
      "Build & enrich prospect list — FS priority",
      "Pitch deck v1 — fact-based, no DEI fluff",
      "First external presentations (target: 2 meetings)",
      "Commercial terms, contribution %, governance",
    ]},
    { month: "May", sub: "VALIDATE & SELL", color: ROSE, items: [
      "Desk research: ING / ABN / Van Lanschot offer",
      "Readiness Scan pilots with 1–2 anchor clients",
      "Customer journey (incl. 24-hour scan format)",
      "Price architecture: A/B/C/D + subscription tiers",
      "Pitch deck live — min. 5 qualified conversations",
      "Explore Certified Audit product definition",
      "World Bank: confirm scope, deliverables, first milestone",
    ]},
    { month: "June", sub: "FIRST REVENUE & ARCHITECTURE", color: AMBER, items: [
      "Close first paying client (≥ 1 advisory trajectory)",
      "Platform architecture sketch",
      "Define funnel stages + CRM process",
      "Membership community soft launch — founding members",
      "Subscription model ready to sell",
      "Begin Certified Practitioner programme design (Britt)",
      "Review: on track for Year 1 revenue goal?",
    ]},
  ];
  months.forEach((m, i) => {
    const x = 0.8 + i * 4.05;
    addGlassPanel(s, x, 2.95, 3.85, 4);
    s.addText(m.month, { x: x + 0.3, y: 3.08, w: 3.4, h: 0.5, fontFace: "Arial", fontSize: 16, bold: true, color: INK });
    s.addText(m.sub, { x: x + 0.3, y: 3.55, w: 3.4, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: INK, charSpacing: 3, transparency: 45 });
    m.items.forEach((item, j) => {
      const y = 3.95 + j * 0.42;
      s.addShape(pptx.shapes.OVAL, { x: x + 0.3, y: y + 0.1, w: 0.1, h: 0.1, fill: { color: m.color }, line: { width: 0 } });
      s.addText(item, { x: x + 0.48, y, w: 3.25, h: 0.4, fontFace: "Arial", fontSize: 9, color: INK, transparency: 22, lineSpacing: 12, valign: "top" });
    });
  });

  s.addText("Forcing function: the World Bank did not ask for a side project. They asked for us. The sprint exists so the firm exists in the shape that mandate deserves.", {
    x: 0.8, y: 7.05, w: 11.5, h: 0.3, fontFace: "Arial", fontSize: 9, color: INK, transparency: 45, italic: true,
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 11 — TEAM & ROADMAP
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide({ masterName: "PRISM" });
  sectionFrame(s, 10, "Team & Roadmap");

  s.addText("Three founders. Clear roles. A ladder from Year 1 to Year 3.", {
    x: 0.8, y: 1.3, w: 11.5, h: 0.7, fontFace: "Arial", fontSize: 22, bold: true, color: INK,
  });

  const founders = [
    { initials: "CK", name: "Chantal Korteweg", role: "Chief Expert & External Relations", bio: "Leads the methodology, the World Bank relationship, and access to the senior network — ministers, royalty, C-suite.", color: SKY },
    { initials: "BJ", name: "Britt Jacobs", role: "Chief Delivery & Learning", bio: "Leads service design, the academy, certification, and client delivery quality. Speaker capability anchors thought leadership.", color: ROSE },
    { initials: "CM", name: "Chief Commercial & Marketing", role: "Founding Partner", bio: "Leads positioning, the pitch, prospect development, brand and commercial conversion. Owns the firm's revenue engine.", color: AMBER },
  ];
  founders.forEach((f, i) => {
    const x = 0.8 + i * 4.05;
    addGlassPanel(s, x, 2.2, 3.85, 2.4);
    // Avatar
    s.addShape(pptx.shapes.OVAL, { x: x + 1.55, y: 2.4, w: 0.75, h: 0.75, fill: { color: f.color }, line: { width: 0 } });
    s.addText(f.initials, { x: x + 1.55, y: 2.4, w: 0.75, h: 0.75, fontFace: "Arial", fontSize: 13, bold: true, color: DEEP, align: "center", valign: "middle" });
    s.addText(f.name, { x: x + 0.3, y: 3.25, w: 3.4, h: 0.4, fontFace: "Arial", fontSize: 13, bold: true, color: INK, align: "center" });
    s.addText(f.role, { x: x + 0.3, y: 3.6, w: 3.4, h: 0.3, fontFace: "Arial", fontSize: 9, color: INK, transparency: 45, align: "center" });
    s.addText(f.bio, { x: x + 0.3, y: 3.95, w: 3.4, h: 0.85, fontFace: "Arial", fontSize: 9, color: INK, transparency: 30, lineSpacing: 13, align: "center", valign: "top" });
  });

  // Year 1→3 roadmap
  addGlassPanel(s, 0.8, 4.85, 11.7, 2.3);
  s.addText("YEAR 1 → YEAR 3", { x: 1, y: 4.95, w: 4, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: INK, charSpacing: 3, transparency: 45 });

  const years = [
    { y: "Year 1", title: "FOUNDATION.", body: "World Bank delivery underway. First 10 corporate clients beyond WB. Readiness Scan + Advisory Trajectory live. Certified Practitioner programme designed. Flagship report published. Operating model and governance finalised." },
    { y: "Year 2", title: "SCALE.", body: "Certified partner shell activated — trained ZZP practitioners take on larger mandates without permanent headcount. Membership community monetised. Advisory Trajectory scales across Dutch and European FIs. World Bank expands into additional countries." },
    { y: "Year 3", title: "PLATFORM.", body: "AI-assisted advisory layer deployed. Funder panel co-invests in new products. IFC is the definitive voice on the commercial case for inclusion. Founders match prior salaries at 50% of the time." },
  ];
  years.forEach((yr, i) => {
    const y = 5.35 + i * 0.58;
    s.addText(yr.y, { x: 1, y, w: 1.3, h: 0.4, fontFace: "Arial", fontSize: 11, bold: true, color: INK, transparency: 45 });
    s.addText([
      { text: yr.title + " ", options: { color: INK, fontFace: "Arial", fontSize: 9.5, bold: true } },
      { text: yr.body, options: { color: INK, fontFace: "Arial", fontSize: 9.5 } },
    ], { x: 2.4, y: y - 0.02, w: 10, h: 0.55, lineSpacing: 14, valign: "top" });
  });
}

// ═══════════════════════════════════════════════════════════
// SLIDE 12 — CLOSE
// ═══════════════════════════════════════════════════════════
{
  const s = pptx.addSlide({ masterName: "PRISM" });
  addFlares(s);
  addLogo(s);
  addPageTag(s, "11 · Close");
  addLabel(s, "11 · The Bottom Line");

  s.addText([
    { text: "We left Hei~Bos with a methodology, a revenue model, a network map, a 90-day plan, and a shared definition of success.\n\n", options: { color: INK, fontFace: "Arial", fontSize: 26, bold: true, lineSpacing: 36 } },
    { text: "The only thing left to do is execute.", options: { color: SKY, fontFace: "Arial", fontSize: 30, bold: true } },
  ], { x: 0.8, y: 1.8, w: 11.5, h: 3.5, valign: "top" });

  s.addText("The women reshaping the economy — as entrepreneurs, earners and wealth owners — need firms that understand them. We are that firm. And we move now.", {
    x: 0.8, y: 5.3, w: 11, h: 0.9, fontFace: "Arial", fontSize: 14, color: INK, transparency: 30, lineSpacing: 22,
  });

  addSpectrumLine(s, 0.8, 6.3, 7);

  s.addText("INCLUSIVE FINANCE COLLECTIVE · BUSINESS PLAN 2026", {
    x: 0.8, y: 6.75, w: 11.5, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: INK, charSpacing: 4, transparency: 55,
  });
}

// ── Write out ───────────────────────────────────────────────
const outPath = "/Users/jvanwaveren/IFC/IFC_BusinessPlan_2026_flat.pptx";
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log("Created: " + outPath);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
