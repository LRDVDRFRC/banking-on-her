const pptxgen = require("pptxgenjs");

const pptx = new pptxgen();

// Meridian brand
const BG = "1A3326";
const DEEP = "2F4A3A";
const ORANGE = "E8833A";
const PARCHMENT = "F6F1E7";
const TERRACOTTA = "C4623A";
const MUTED = "8A9A8E";
const BORDER = "3E5A48";

const SERIF = "Playfair Display";
const SANS = "Lato";

pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "IBC";
pptx.title = "IBC Meridian Pitch Deck";

pptx.defineSlideMaster({ title: "MERIDIAN", background: { color: BG } });

// Editorial card
function addCard(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: DEEP, transparency: 25 },
    line: { color: BORDER, width: 0.75 },
    ...opts,
  });
}

function addRule(slide, x, y, w, color = ORANGE, h = 0.03) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color }, line: { width: 0 },
  });
}

function addLogo(slide) {
  slide.addText("IBC", {
    x: 0.6, y: 0.35, w: 1, h: 0.4,
    fontFace: SANS, fontSize: 14, bold: true, color: PARCHMENT, charSpacing: 3, margin: 0,
  });
}

function addLabel(slide, text) {
  slide.addText(text.toUpperCase(), {
    x: 0.6, y: 0.9, w: 6, h: 0.3,
    fontFace: SANS, fontSize: 9, bold: true, color: ORANGE, charSpacing: 4, margin: 0,
  });
}

// ═══════════════════════════════════════
// SLIDE 1: TITLE
// ═══════════════════════════════════════
const s1 = pptx.addSlide({ masterName: "MERIDIAN" });
addLogo(s1);

s1.addText([
  { text: "The Largest Wealth Transfer\nin History Is ", options: { color: PARCHMENT } },
  { text: "Happening Now.", options: { italic: true, color: ORANGE } },
], {
  x: 0.8, y: 1.8, w: 11.5, h: 2.8,
  fontFace: SERIF, fontSize: 40, bold: true, lineSpacing: 48, margin: 0,
});

addRule(s1, 0.8, 4.5, 4);

s1.addText("Most financial institutions are not ready. We make them ready — and we prove the business case.", {
  x: 0.8, y: 4.8, w: 10, h: 0.9,
  fontFace: SANS, fontSize: 14, color: PARCHMENT, transparency: 30, lineSpacing: 22, margin: 0,
});

s1.addText("IBC  ·  THE INCLUSIVE BUSINESS COLLECTIVE", {
  x: 0.8, y: 6.7, w: 10, h: 0.3,
  fontFace: SANS, fontSize: 9, color: MUTED, charSpacing: 3, margin: 0,
});

// ═══════════════════════════════════════
// SLIDE 2: WHY WE EXIST
// ═══════════════════════════════════════
const s2 = pptx.addSlide({ masterName: "MERIDIAN" });
addLogo(s2);
addLabel(s2, "Why We Exist");

s2.addText([
  { text: "The numbers ", options: { color: PARCHMENT } },
  { text: "that changed our trajectory.", options: { italic: true, color: ORANGE } },
], {
  x: 0.8, y: 1.3, w: 12, h: 0.8,
  fontFace: SERIF, fontSize: 28, bold: true, margin: 0,
});

addRule(s2, 0.8, 2.15, 3);

const stats = [
  { num: "50%+", body: "of European wealth is now controlled by women — a figure accelerating as boomers transfer assets to partners who outlive them." },
  { num: "36%", body: "higher profitability at companies with diverse executive teams. This is not a values argument — it is a revenue argument." },
  { num: "60+", body: "countries where our methodology is being deployed through the World Bank. This is proof of concept at global scale." },
];

stats.forEach((s, i) => {
  const x = 0.8 + i * 4;
  addCard(s2, x, 2.7, 3.6, 4);
  s2.addText(s.num, {
    x: x + 0.3, y: 3.0, w: 3, h: 1.3,
    fontFace: SERIF, italic: true, fontSize: 56, bold: true, color: ORANGE, margin: 0,
  });
  addRule(s2, x + 0.3, 4.35, 0.6, TERRACOTTA);
  s2.addText(s.body, {
    x: x + 0.3, y: 4.55, w: 3, h: 2,
    fontFace: SANS, fontSize: 11, color: PARCHMENT, transparency: 25, lineSpacing: 18, valign: "top", margin: 0,
  });
});

// ═══════════════════════════════════════
// SLIDE 3: WHO WE ARE
// ═══════════════════════════════════════
const s3 = pptx.addSlide({ masterName: "MERIDIAN" });
addLogo(s3);
addLabel(s3, "Who We Are");

s3.addText([
  { text: "A science-based ", options: { color: PARCHMENT } },
  { text: "inclusion consultancy", options: { italic: true, color: ORANGE } },
  { text: " — built for the business side.", options: { color: PARCHMENT } },
], {
  x: 0.8, y: 1.3, w: 12, h: 0.7,
  fontFace: SERIF, fontSize: 22, bold: true, margin: 0,
});

s3.addText("IBC helps medium and large corporates convert underserved markets into measurable commercial growth. We are not a DEI programme. We are not an HR initiative. We are a business performance firm.", {
  x: 0.8, y: 2.1, w: 11.5, h: 0.7,
  fontFace: SANS, fontSize: 12, color: PARCHMENT, transparency: 35, lineSpacing: 18, margin: 0,
});

addRule(s3, 0.8, 2.9, 3);

const points = [
  { title: "We make the business case, not the moral case", body: "We come with revenue numbers. Underserved markets are a commercial opportunity with a calculable cost of inaction." },
  { title: "We go through the client door, not the HR door", body: "We help companies reach, serve, and grow revenue from diverse clients externally. An almost entirely unoccupied space." },
  { title: "We deliver at world-class scale", body: "Evidence-based methodology. 60+ country delivery via the World Bank. International credibility at ministerial and C-suite level." },
  { title: "DEI fatigue is our opening", body: "The backlash against HR-driven DEI is real. Boards want commercial results. We are the only firm positioned to deliver them." },
];

points.forEach((p, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.8 + col * 6.2;
  const y = 3.3 + row * 1.95;

  addCard(s3, x, y, 5.9, 1.75);

  s3.addShape(pptx.shapes.RECTANGLE, {
    x: x, y: y + 0.25, w: 0.06, h: 1.25,
    fill: { color: ORANGE }, line: { width: 0 },
  });

  s3.addText(p.title, {
    x: x + 0.3, y: y + 0.2, w: 5.5, h: 0.45,
    fontFace: SERIF, italic: true, fontSize: 14, bold: true, color: PARCHMENT, margin: 0,
  });
  s3.addText(p.body, {
    x: x + 0.3, y: y + 0.7, w: 5.5, h: 1,
    fontFace: SANS, fontSize: 10.5, color: PARCHMENT, transparency: 35, lineSpacing: 16, valign: "top", margin: 0,
  });
});

// ═══════════════════════════════════════
// SLIDE 4: HOW WE WORK
// ═══════════════════════════════════════
const s4 = pptx.addSlide({ masterName: "MERIDIAN" });
addLogo(s4);
addLabel(s4, "How We Work");

s4.addText([
  { text: "The ", options: { color: PARCHMENT } },
  { text: "Gender Capital Lab ", options: { italic: true, color: ORANGE } },
  { text: "Methodology", options: { color: PARCHMENT } },
], {
  x: 0.8, y: 1.3, w: 12, h: 0.7,
  fontFace: SERIF, fontSize: 26, bold: true, margin: 0,
});

addRule(s4, 0.8, 2.15, 3);

const steps = [
  { num: "01", title: "Diagnose", body: "Gender Lens Framework. Data-driven analysis of where a financial institution is leaving money on the table.", output: "Opportunity map with quantified business potential" },
  { num: "02", title: "Strategise", body: "Turn diagnosis into an executive-ready strategy. A fact-based business case that makes the commercial argument impossible to ignore.", output: "Investment-grade strategy & business case" },
  { num: "03", title: "Build & Test", body: "Train internal teams, build certified practitioners and pilot improved products in a safe-to-fail environment.", output: "Validated solutions + certified practitioners" },
  { num: "04", title: "Measure & Scale", body: "Embed proven interventions across the organisation. Measure impact rigorously. Build the case for scaling.", output: "Proven impact + scaling strategy" },
];

steps.forEach((s, i) => {
  const x = 0.8 + i * 3.1;
  addCard(s4, x, 2.6, 2.85, 4.6);

  s4.addText(s.num, {
    x: x + 0.25, y: 2.75, w: 1, h: 0.4,
    fontFace: SANS, fontSize: 10, bold: true, color: TERRACOTTA, charSpacing: 2, margin: 0,
  });
  s4.addText(s.title, {
    x: x + 0.25, y: 3.1, w: 2.4, h: 0.5,
    fontFace: SERIF, italic: true, fontSize: 18, bold: true, color: ORANGE, margin: 0,
  });
  addRule(s4, x + 0.25, 3.65, 0.5, TERRACOTTA);
  s4.addText(s.body, {
    x: x + 0.25, y: 3.8, w: 2.4, h: 1.6,
    fontFace: SANS, fontSize: 10, color: PARCHMENT, transparency: 30, lineSpacing: 16, valign: "top", margin: 0,
  });

  s4.addShape(pptx.shapes.RECTANGLE, {
    x: x + 0.2, y: 5.55, w: 2.45, h: 1.5,
    fill: { color: BG, transparency: 10 },
    line: { color: BORDER, width: 0.5 },
  });
  s4.addText("OUTPUT", {
    x: x + 0.35, y: 5.65, w: 2, h: 0.25,
    fontFace: SANS, fontSize: 7, bold: true, color: ORANGE, charSpacing: 2, margin: 0,
  });
  s4.addText(s.output, {
    x: x + 0.35, y: 5.9, w: 2.15, h: 1.1,
    fontFace: SANS, fontSize: 9, color: PARCHMENT, transparency: 25, lineSpacing: 14, valign: "top", margin: 0,
  });
});

// ═══════════════════════════════════════
// SLIDE 5: WHAT IT DELIVERS
// ═══════════════════════════════════════
const s5 = pptx.addSlide({ masterName: "MERIDIAN" });
addLogo(s5);
addLabel(s5, "What It Delivers");

s5.addText([
  { text: "Four layers ", options: { italic: true, color: ORANGE } },
  { text: "of value.", options: { color: PARCHMENT } },
], {
  x: 0.8, y: 1.3, w: 10, h: 0.7,
  fontFace: SERIF, fontSize: 28, bold: true, margin: 0,
});

addRule(s5, 0.8, 2.15, 3);

const products = [
  { label: "Entry Product", title: "Readiness Scan", body: "AI-enabled diagnostic: zero measurement, bias audit, readiness rating (A-D). Fast, affordable, creates the business case for the next step." },
  { label: "Core Engagement", title: "Advisory Trajectory", body: "Bespoke work across employee & organisation, data, marketing, ecosystems and propositions. Menu-based: clients choose their modules." },
  { label: "Capability Building", title: "Academy & Certification", body: "Train and certify internal practitioners at Associate, Advisor and Fellow level. Builds lasting organisational capability." },
  { label: "Recurring Revenue", title: "Membership & Platform", body: "Peer learning, tools, benchmarks. Year 2-3: digital layer with AI-assisted advisory. Scales without headcount." },
];

products.forEach((p, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.8 + col * 6.2;
  const y = 2.6 + row * 2.35;

  addCard(s5, x, y, 5.9, 2.1);

  s5.addText(p.label.toUpperCase(), {
    x: x + 0.3, y: y + 0.2, w: 4, h: 0.25,
    fontFace: SANS, fontSize: 8, bold: true, color: TERRACOTTA, charSpacing: 2, margin: 0,
  });
  s5.addText(p.title, {
    x: x + 0.3, y: y + 0.5, w: 5.5, h: 0.5,
    fontFace: SERIF, italic: true, fontSize: 18, bold: true, color: ORANGE, margin: 0,
  });
  addRule(s5, x + 0.3, y + 1.0, 0.6, TERRACOTTA);
  s5.addText(p.body, {
    x: x + 0.3, y: y + 1.1, w: 5.5, h: 1,
    fontFace: SANS, fontSize: 11, color: PARCHMENT, transparency: 30, lineSpacing: 17, valign: "top", margin: 0,
  });
});

// ═══════════════════════════════════════
// SLIDE 6: USE CASE
// ═══════════════════════════════════════
const s6 = pptx.addSlide({ masterName: "MERIDIAN" });
addLogo(s6);
addLabel(s6, "Use Case");

s6.addText([
  { text: "Bank ", options: { color: PARCHMENT } },
  { text: "in the Netherlands", options: { italic: true, color: ORANGE } },
], {
  x: 0.8, y: 1.3, w: 10, h: 0.7,
  fontFace: SERIF, fontSize: 28, bold: true, margin: 0,
});

addRule(s6, 0.8, 2.15, 3);

addCard(s6, 0.8, 2.5, 11.7, 4.3);

const cases = [
  { label: "Client", body: "Mid-size Dutch bank with 200k+ retail clients. Wealth management arm underserving women clients who now control 52% of inherited assets." },
  { label: "Problem", body: "Products designed for male clients. Female client attrition at 3x industry average after inheritance events. Estimated annual revenue loss: EUR 12M." },
  { label: "IBC Intervention", body: "Readiness Scan (Day 1) revealed D-rating across propositions and marcom. Advisory trajectory redesigned 3 key products. Academy certified 24 internal practitioners." },
  { label: "Result", body: "Female client retention improved 41%. New wealth product generated EUR 8.2M in first year. Bank became IBC Certified Gender Lab partner." },
];

cases.forEach((c, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 1.2 + col * 5.8;
  const y = 2.75 + row * 1.9;

  s6.addText(c.label.toUpperCase(), {
    x, y, w: 4, h: 0.3,
    fontFace: SANS, fontSize: 9, bold: true, color: ORANGE, charSpacing: 2, margin: 0,
  });
  s6.addText(c.body, {
    x, y: y + 0.35, w: 5.2, h: 1.4,
    fontFace: SANS, fontSize: 11, color: PARCHMENT, transparency: 25, lineSpacing: 17, valign: "top", margin: 0,
  });
});

// Timeline
const tlLabels = ["Day 1", "Month 2", "Month 4", "Month 8"];
addRule(s6, 1.5, 7.0, 9.5);
tlLabels.forEach((label, i) => {
  const x = 1.5 + i * (9.5 / 3);
  s6.addShape(pptx.shapes.OVAL, {
    x: x - 0.08, y: 6.87, w: 0.2, h: 0.2,
    fill: { color: ORANGE }, line: { width: 0 },
  });
  s6.addText(label, {
    x: x - 0.5, y: 7.15, w: 1.2, h: 0.3,
    fontFace: SANS, fontSize: 9, bold: true, color: PARCHMENT, transparency: 35, align: "center", margin: 0,
  });
});

// ═══════════════════════════════════════
// SLIDE 7: TEAM
// ═══════════════════════════════════════
const s7 = pptx.addSlide({ masterName: "MERIDIAN" });
addLogo(s7);
addLabel(s7, "Team");

s7.addText([
  { text: "The ", options: { color: PARCHMENT } },
  { text: "founders.", options: { italic: true, color: ORANGE } },
], {
  x: 0.8, y: 1.3, w: 10, h: 0.7,
  fontFace: SERIF, fontSize: 28, bold: true, margin: 0,
});

addRule(s7, 0.8, 2.15, 3);

const founders = [
  { initials: "CK", name: "Chantal Korteweg", role: "Chief Expert & External Relations", bio: "Internationally recognised expert. Network spanning ministers, royalty and C-suite executives. Leads the methodology and World Bank relationship across 60 countries." },
  { initials: "BJ", name: "Britt Jacobs", role: "Chief Delivery & Learning", bio: "Speaker academy founder, learning design and HR capability expert. Leads service design, the academy, certification and client delivery quality." },
  { initials: "JW", name: "Jan van Waveren", role: "Chief Commercial & Marketing", bio: "Strategic positioning and commercial engine. Leads the pitch, prospect development, brand identity and commercial conversion." },
];

founders.forEach((f, i) => {
  const x = 0.8 + i * 4.2;
  addCard(s7, x, 2.6, 3.9, 4.5);

  s7.addShape(pptx.shapes.OVAL, {
    x: x + 1.4, y: 2.85, w: 1.1, h: 1.1,
    fill: { color: ORANGE, transparency: 15 },
    line: { color: TERRACOTTA, width: 1.5 },
  });
  s7.addText(f.initials, {
    x: x + 1.4, y: 2.85, w: 1.1, h: 1.1,
    fontFace: SERIF, italic: true, fontSize: 20, bold: true, color: BG, align: "center", valign: "middle", margin: 0,
  });

  s7.addText(f.name, {
    x: x + 0.3, y: 4.15, w: 3.3, h: 0.4,
    fontFace: SERIF, italic: true, fontSize: 16, bold: true, color: PARCHMENT, align: "center", margin: 0,
  });
  s7.addText(f.role, {
    x: x + 0.3, y: 4.55, w: 3.3, h: 0.3,
    fontFace: SANS, fontSize: 9, color: ORANGE, align: "center", charSpacing: 1, margin: 0,
  });
  addRule(s7, x + 1.6, 4.9, 0.7, TERRACOTTA);
  s7.addText(f.bio, {
    x: x + 0.3, y: 5.0, w: 3.3, h: 2,
    fontFace: SANS, fontSize: 10, color: PARCHMENT, transparency: 30, lineSpacing: 16, align: "center", valign: "top", margin: 0,
  });
});

// ═══════════════════════════════════════
// SLIDE 8: CLOSE
// ═══════════════════════════════════════
const s8 = pptx.addSlide({ masterName: "MERIDIAN" });

s8.addText([
  { text: "The women inheriting\nthe world\u2019s wealth need firms that ", options: { color: PARCHMENT } },
  { text: "understand them.", options: { italic: true, color: ORANGE } },
], {
  x: 0.8, y: 1.8, w: 11.5, h: 3,
  fontFace: SERIF, fontSize: 32, bold: true, lineSpacing: 44, margin: 0,
});

addRule(s8, 0.8, 4.7, 4);

s8.addText("We are that firm. And we move now.", {
  x: 0.8, y: 5.0, w: 10, h: 0.6,
  fontFace: SANS, italic: true, fontSize: 16, color: PARCHMENT, transparency: 25, margin: 0,
});

s8.addText("IBC  ·  THE INCLUSIVE BUSINESS COLLECTIVE  ·  2026", {
  x: 0.8, y: 6.7, w: 10, h: 0.4,
  fontFace: SANS, fontSize: 10, color: MUTED, charSpacing: 3, margin: 0,
});

// ═══════════════════════════════════════
const outPath = "/Users/jvanwaveren/IFC/IFC_PitchDeck_Meridian.pptx";
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log("Created: " + outPath);
}).catch(err => {
  console.error("Error:", err);
});
