const pptxgen = require("pptxgenjs");
const fs = require("fs");

const pptx = new pptxgen();

// Brand colours
const DEEP = "EAF6F1";
const SKY = "6DC0C8";
const ROSE = "F5B896";
const AMBER = "F2D080";
const MINT = "9FD4B0";
const WHITE = "0D3B2E";
const GLASS = "FFFFFF"; // Simulated glass panel on dark bg
const GLASS_BORDER = "C5E8DC";

// Pale opaque tints for the flat variant (Canva-friendly)
const PALE_SKY   = "D5EDEE";
const PALE_ROSE  = "FAE5D8";
const PALE_AMBER = "F9ECD3";
const PALE_MINT  = "DCEDD8";
const PANEL_BORDER_FLAT = "D5E8DC";

// Layout
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";

// Master slide
pptx.defineSlideMaster({
  title: "PRISM",
  background: { color: DEEP },
});

// Helper: standalone colour flares in 4 corners (simulates web flare backdrop)
function addFlares(slide) {
  // Flat variant: four opaque pale-tint corner ovals — no transparency, no
  // overlap, no white hotspots. Canva imports these cleanly.
  slide.addShape(pptx.shapes.OVAL, { x: -3.5, y: -3.5, w: 7.5, h: 7.5, fill: { color: PALE_SKY }, line: { width: 0 } });
  slide.addShape(pptx.shapes.OVAL, { x: 9.3, y: -3.5, w: 7.5, h: 7.5, fill: { color: PALE_ROSE }, line: { width: 0 } });
  slide.addShape(pptx.shapes.OVAL, { x: 9.3, y: 3.5, w: 7.5, h: 7.5, fill: { color: PALE_AMBER }, line: { width: 0 } });
  slide.addShape(pptx.shapes.OVAL, { x: -3.5, y: 3.5, w: 7.5, h: 7.5, fill: { color: PALE_MINT }, line: { width: 0 } });
}

// Helper: flat glass panel — opaque white, subtle mint border, no shadow/bevel
function addGlassPanel(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.15,
    fill: { color: GLASS },
    line: { color: PANEL_BORDER_FLAT, width: 1 },
    ...opts,
  });
}

// Helper: spectrum line → now single-colour aqua→sage 2-stop
function addSpectrumLine(slide, x, y, w) {
  const colors = [SKY, MINT];
  const segW = w / colors.length;
  colors.forEach((c, i) => {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: x + i * segW, y, w: segW, h: 0.04,
      fill: { color: c },
      line: { width: 0 },
    });
  });
}

// Helper: add logo
function addLogo(slide) {
  slide.addText("IFC", {
    x: 0.6, y: 0.35, w: 1, h: 0.4,
    fontFace: "Arial", fontSize: 14, bold: true, color: WHITE,
    letterSpacing: 3,
  });
}

// Helper: section label
function addLabel(slide, text) {
  slide.addText(text.toUpperCase(), {
    x: 0.8, y: 0.9, w: 4, h: 0.3,
    fontFace: "Arial", fontSize: 8, bold: true, color: WHITE,
    letterSpacing: 4, transparency: 60,
  });
}

// ═══════════════════════════════════════
// SLIDE 1: TITLE
// ═══════════════════════════════════════
const s1 = pptx.addSlide({ masterName: "PRISM" });
addFlares(s1);

addLogo(s1);

s1.addText([
  { text: "The Largest Wealth Transfer\nin History Is ", options: { color: WHITE, fontFace: "Arial", fontSize: 36, bold: true, lineSpacing: 42 } },
  { text: "Happening Now.", options: { color: SKY, fontFace: "Arial", fontSize: 36, bold: true } },
], { x: 0.8, y: 1.8, w: 9, h: 2.5, valign: "top" });

s1.addText("Most financial institutions are not ready. We make them ready — and we prove the business case.", {
  x: 0.8, y: 4.2, w: 8, h: 0.8,
  fontFace: "Arial", fontSize: 14, color: WHITE, transparency: 40, lineSpacing: 22,
});

addSpectrumLine(s1, 0.8, 5.3, 5);


// ═══════════════════════════════════════
// SLIDE 2: WHY WE EXIST
// ═══════════════════════════════════════
const s2 = pptx.addSlide({ masterName: "PRISM" });
addFlares(s2);

addLogo(s2);
addLabel(s2, "Why We Exist");

s2.addText("The numbers that changed our trajectory.", {
  x: 0.8, y: 1.3, w: 8, h: 0.8,
  fontFace: "Arial", fontSize: 26, bold: true, color: WHITE, lineSpacing: 32,
});

// Three stat cards
const stats = [
  { num: "50%+", color: SKY, body: "of European wealth is now controlled by women — a figure accelerating as boomers transfer assets to partners who outlive them." },
  { num: "36%", color: ROSE, body: "higher profitability at companies with diverse executive teams. This is not a values argument — it is a revenue argument." },
  { num: "60+", color: AMBER, body: "countries where our methodology is being deployed through the World Bank. This is proof of concept at global scale." },
];

stats.forEach((s, i) => {
  const x = 0.8 + i * 4;
  addGlassPanel(s2, x, 2.5, 3.6, 3.8);
  s2.addText(s.num, {
    x: x + 0.3, y: 2.8, w: 3, h: 1,
    fontFace: "Arial", fontSize: 42, bold: true, color: s.color,
  });
  s2.addText(s.body, {
    x: x + 0.3, y: 3.8, w: 3, h: 2.2,
    fontFace: "Arial", fontSize: 11, color: WHITE, transparency: 30, lineSpacing: 18, valign: "top",
  });
});


// ═══════════════════════════════════════
// SLIDE 3: WHO WE ARE
// ═══════════════════════════════════════
const s3 = pptx.addSlide({ masterName: "PRISM" });
addFlares(s3);

addLogo(s3);
addLabel(s3, "Who We Are");

s3.addText("A science-based inclusion consultancy — built for the business side.", {
  x: 0.8, y: 1.3, w: 10, h: 0.6,
  fontFace: "Arial", fontSize: 22, bold: true, color: WHITE, lineSpacing: 28,
});

s3.addText("IFC helps medium and large corporates convert underserved markets into measurable commercial growth. We are not a DEI programme. We are not an HR initiative. We are a business performance firm.", {
  x: 0.8, y: 2.0, w: 10, h: 0.7,
  fontFace: "Arial", fontSize: 12, color: WHITE, transparency: 35, lineSpacing: 18,
});

const points = [
  { title: "We make the business case, not the moral case", body: "We come with revenue numbers. Underserved markets are a commercial opportunity with a calculable cost of inaction.", color: SKY },
  { title: "We go through the client door, not the HR door", body: "We help companies reach, serve, and grow revenue from diverse clients externally. An almost entirely unoccupied space.", color: ROSE },
  { title: "We deliver at world-class scale", body: "Evidence-based methodology. 60+ country delivery via the World Bank. International credibility at ministerial and C-suite level.", color: AMBER },
  { title: "DEI fatigue is our opening", body: "The backlash against HR-driven DEI is real. Boards want commercial results. We are the only firm positioned to deliver them.", color: MINT },
];

points.forEach((p, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.8 + col * 6;
  const y = 3.0 + row * 2;

  // Left accent border
  s3.addShape(pptx.shapes.RECTANGLE, {
    x, y, w: 0.06, h: 1.7,
    fill: { color: p.color },
    line: { width: 0 },
    rectRadius: 0.03,
  });

  addGlassPanel(s3, x + 0.12, y, 5.5, 1.7);

  s3.addText(p.title, {
    x: x + 0.4, y: y + 0.15, w: 5, h: 0.4,
    fontFace: "Arial", fontSize: 12, bold: true, color: WHITE,
  });
  s3.addText(p.body, {
    x: x + 0.4, y: y + 0.6, w: 5, h: 0.9,
    fontFace: "Arial", fontSize: 10.5, color: WHITE, transparency: 35, lineSpacing: 16, valign: "top",
  });
});


// ═══════════════════════════════════════
// SLIDE 4: HOW WE WORK
// ═══════════════════════════════════════
const s4 = pptx.addSlide({ masterName: "PRISM" });
addFlares(s4);

addLogo(s4);
addLabel(s4, "How We Work");

s4.addText("The Gender Capital Lab Methodology", {
  x: 0.8, y: 1.3, w: 10, h: 0.6,
  fontFace: "Arial", fontSize: 24, bold: true, color: WHITE,
});

const steps = [
  { num: "01", title: "Diagnose", body: "Gender Lens Framework. Data-driven analysis of where a financial institution is leaving money on the table.", output: "Opportunity map with quantified business potential", color: SKY },
  { num: "02", title: "Strategise", body: "Turn diagnosis into an executive-ready strategy. A fact-based business case that makes the commercial argument impossible to ignore.", output: "Investment-grade strategy & business case", color: ROSE },
  { num: "03", title: "Build & Test", body: "Train internal teams, build certified practitioners and pilot improved products in a safe-to-fail environment.", output: "Validated solutions + certified practitioners", color: AMBER },
  { num: "04", title: "Measure & Scale", body: "Embed proven interventions across the organisation. Measure impact rigorously. Build the case for scaling.", output: "Proven impact + scaling strategy", color: MINT },
];

steps.forEach((s, i) => {
  const x = 0.8 + i * 3.1;
  addGlassPanel(s4, x, 2.3, 2.8, 4.5);

  s4.addText(s.num, {
    x: x + 0.25, y: 2.5, w: 1, h: 0.4,
    fontFace: "Arial", fontSize: 11, bold: true, color: s.color, letterSpacing: 2,
  });
  s4.addText(s.title, {
    x: x + 0.25, y: 2.9, w: 2.3, h: 0.4,
    fontFace: "Arial", fontSize: 15, bold: true, color: s.color,
  });
  s4.addText(s.body, {
    x: x + 0.25, y: 3.4, w: 2.3, h: 1.5,
    fontFace: "Arial", fontSize: 10, color: WHITE, transparency: 30, lineSpacing: 16, valign: "top",
  });

  // Output box (flat: solid deep tint, opaque mint border)
  s4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: x + 0.2, y: 5.3, w: 2.4, h: 1.1,
    rectRadius: 0.12,
    fill: { color: DEEP },
    line: { color: PANEL_BORDER_FLAT, width: 0.75 },
  });
  s4.addText("OUTPUT", {
    x: x + 0.35, y: 5.4, w: 2, h: 0.25,
    fontFace: "Arial", fontSize: 7, bold: true, color: s.color, letterSpacing: 2,
  });
  s4.addText(s.output, {
    x: x + 0.35, y: 5.65, w: 2.1, h: 0.65,
    fontFace: "Arial", fontSize: 9, color: WHITE, transparency: 30, lineSpacing: 14, valign: "top",
  });
});


// ═══════════════════════════════════════
// SLIDE 5: WHAT IT DELIVERS
// ═══════════════════════════════════════
const s5 = pptx.addSlide({ masterName: "PRISM" });
addFlares(s5);

addLogo(s5);
addLabel(s5, "What It Delivers");

s5.addText("Four layers of value.", {
  x: 0.8, y: 1.3, w: 8, h: 0.6,
  fontFace: "Arial", fontSize: 24, bold: true, color: WHITE,
});

const products = [
  { label: "Entry Product", title: "Readiness Scan", body: "AI-enabled diagnostic: zero measurement, bias audit, readiness rating (A-D). Fast, affordable, creates the business case for the next step.", color: SKY },
  { label: "Core Engagement", title: "Advisory Trajectory", body: "Bespoke work across employee & organisation, data, marketing, ecosystems and propositions. Menu-based: clients choose their modules.", color: ROSE },
  { label: "Capability Building", title: "Academy & Certification", body: "Train and certify internal practitioners at Associate, Advisor and Fellow level. Builds lasting organisational capability.", color: AMBER },
  { label: "Recurring Revenue", title: "Membership & Platform", body: "Peer learning, tools, benchmarks. Year 2-3: digital layer with AI-assisted advisory. Scales without headcount.", color: MINT },
];

products.forEach((p, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.8 + col * 6;
  const y = 2.3 + row * 2.4;

  addGlassPanel(s5, x, y, 5.6, 2.1);

  s5.addText(p.label.toUpperCase(), {
    x: x + 0.3, y: y + 0.2, w: 4, h: 0.25,
    fontFace: "Arial", fontSize: 8, bold: true, color: p.color, letterSpacing: 2,
  });
  s5.addText(p.title, {
    x: x + 0.3, y: y + 0.5, w: 4.5, h: 0.35,
    fontFace: "Arial", fontSize: 14, bold: true, color: WHITE,
  });
  s5.addText(p.body, {
    x: x + 0.3, y: y + 0.9, w: 4.8, h: 1,
    fontFace: "Arial", fontSize: 10.5, color: WHITE, transparency: 30, lineSpacing: 16, valign: "top",
  });
});


// ═══════════════════════════════════════
// SLIDE 6: USE CASE
// ═══════════════════════════════════════
const s6 = pptx.addSlide({ masterName: "PRISM" });
addFlares(s6);

addLogo(s6);
addLabel(s6, "Use Case");

s6.addText("Bank in the Netherlands", {
  x: 0.8, y: 1.3, w: 8, h: 0.6,
  fontFace: "Arial", fontSize: 24, bold: true, color: WHITE,
});

addGlassPanel(s6, 0.8, 2.2, 11.7, 4.8);

const cases = [
  { label: "Client", body: "Mid-size Dutch bank with 200k+ retail clients. Wealth management arm underserving women clients who now control 52% of inherited assets.", color: SKY },
  { label: "Problem", body: "Products designed for male clients. Female client attrition at 3x industry average after inheritance events. Estimated annual revenue loss: EUR 12M.", color: ROSE },
  { label: "IFC Intervention", body: "Readiness Scan (Day 1) revealed D-rating across propositions and marcom. Advisory trajectory redesigned 3 key products. Academy certified 24 internal practitioners.", color: AMBER },
  { label: "Result", body: "Female client retention improved 41%. New wealth product generated EUR 8.2M in first year. Bank became IFC Certified Gender Lab partner.", color: MINT },
];

cases.forEach((c, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 1.2 + col * 5.8;
  const y = 2.5 + row * 2;

  s6.addText(c.label.toUpperCase(), {
    x, y, w: 4, h: 0.3,
    fontFace: "Arial", fontSize: 9, bold: true, color: c.color, letterSpacing: 2,
  });
  s6.addText(c.body, {
    x, y: y + 0.35, w: 5, h: 1.3,
    fontFace: "Arial", fontSize: 11, color: WHITE, transparency: 25, lineSpacing: 17, valign: "top",
  });
});

// Timeline
const tlColors = [SKY, ROSE, AMBER, MINT];
const tlLabels = ["Day 1", "Month 2", "Month 4", "Month 8"];
addSpectrumLine(s6, 1.5, 6.2, 9.5);
tlLabels.forEach((label, i) => {
  const x = 1.5 + i * (9.5 / 3);
  // Dot
  s6.addShape(pptx.shapes.OVAL, {
    x: x - 0.08, y: 6.05, w: 0.2, h: 0.2,
    fill: { color: tlColors[i] },
    line: { width: 0 },
  });
  s6.addText(label, {
    x: x - 0.5, y: 6.35, w: 1.2, h: 0.3,
    fontFace: "Arial", fontSize: 9, bold: true, color: WHITE, transparency: 40, align: "center",
  });
});


// ═══════════════════════════════════════
// SLIDE 7: TEAM
// ═══════════════════════════════════════
const s7 = pptx.addSlide({ masterName: "PRISM" });
addFlares(s7);

addLogo(s7);
addLabel(s7, "Team");

s7.addText("The founders.", {
  x: 0.8, y: 1.3, w: 8, h: 0.6,
  fontFace: "Arial", fontSize: 24, bold: true, color: WHITE,
});

const founders = [
  { initials: "CK", name: "Chantal Korteweg", role: "Chief Expert & External Relations", bio: "Internationally recognised expert. Network spanning ministers, royalty and C-suite executives. Leads the methodology and World Bank relationship across 60 countries.", grad: [SKY, ROSE] },
  { initials: "BJ", name: "Britt Jacobs", role: "Chief Delivery & Learning", bio: "Speaker academy founder, learning design and HR capability expert. Leads service design, the academy, certification and client delivery quality.", grad: [ROSE, AMBER] },
  { initials: "JW", name: "Jan van Waveren", role: "Chief Commercial & Marketing", bio: "Strategic positioning and commercial engine. Leads the pitch, prospect development, brand identity and commercial conversion.", grad: [AMBER, MINT] },
];

founders.forEach((f, i) => {
  const x = 0.8 + i * 4.2;
  addGlassPanel(s7, x, 2.3, 3.8, 4.5);

  // Avatar circle (flat: opaque accent fill, no transparency)
  s7.addShape(pptx.shapes.OVAL, {
    x: x + 1.35, y: 2.6, w: 1.1, h: 1.1,
    fill: { color: f.grad[0] },
    line: { color: f.grad[1], width: 1.5 },
  });
  s7.addText(f.initials, {
    x: x + 1.35, y: 2.65, w: 1.1, h: 1.1,
    fontFace: "Arial", fontSize: 18, bold: true, color: WHITE, align: "center", valign: "middle",
  });

  s7.addText(f.name, {
    x: x + 0.3, y: 3.9, w: 3.2, h: 0.35,
    fontFace: "Arial", fontSize: 14, bold: true, color: WHITE, align: "center",
  });
  s7.addText(f.role, {
    x: x + 0.3, y: 4.25, w: 3.2, h: 0.3,
    fontFace: "Arial", fontSize: 9, color: WHITE, transparency: 50, align: "center",
  });
  s7.addText(f.bio, {
    x: x + 0.3, y: 4.7, w: 3.2, h: 1.8,
    fontFace: "Arial", fontSize: 10, color: WHITE, transparency: 30, lineSpacing: 16, align: "center", valign: "top",
  });
});


// ═══════════════════════════════════════
// SLIDE 8: CLOSE
// ═══════════════════════════════════════
const s8 = pptx.addSlide({ masterName: "PRISM" });
addFlares(s8);

s8.addText([
  { text: "The women inheriting the world\u2019s\nwealth need firms that ", options: { color: WHITE, fontFace: "Arial", fontSize: 30, bold: true, lineSpacing: 38 } },
  { text: "understand them.", options: { color: SKY, fontFace: "Arial", fontSize: 30, bold: true } },
], { x: 0.8, y: 1.8, w: 10, h: 2 });

s8.addText("We are that firm. And we move now.", {
  x: 0.8, y: 3.8, w: 8, h: 0.6,
  fontFace: "Arial", fontSize: 16, color: WHITE, transparency: 25,
});

addSpectrumLine(s8, 0.8, 4.8, 5);

s8.addText("IFC  ·  The Inclusive Finance Collective  ·  2026", {
  x: 0.8, y: 5.6, w: 8, h: 0.4,
  fontFace: "Arial", fontSize: 10, color: WHITE, transparency: 65, letterSpacing: 2,
});


// ═══════════════════════════════════════
// GENERATE
// ═══════════════════════════════════════
const outPath = "/Users/jvanwaveren/IFC/IFC_PitchDeck_Prism_flat.pptx";
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log("Created: " + outPath);
}).catch(err => {
  console.error("Error:", err);
});
