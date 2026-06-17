/**
 * Gender Capital Lab™ Sprint — Day-2 proposition deck generator
 * ------------------------------------------------------------------
 * Produces the board-ready presentation the client sees on Day 2.
 * Worked example: BeFrank · closing the gender pension gap.
 *
 * Reuses the Prism brand system (flares + glass panels) from
 * generate-prism-pptx.js so output is on-brand with zero design time.
 *
 * Run:  node 03_generate-sprint-deck.js
 * Out:  IFC_Sprint_BeFrank_Proposition.pptx
 *
 * The Build Engine fills the «TOKENS» with real client data overnight.
 * Numbers marked (illustratief) are placeholders for the worked example.
 */

const pptxgen = require("pptxgenjs");
const pptx = new pptxgen();

// ── Brand colours (Prism) ────────────────────────────────────────
const DEEP = "EAF6F1";        // pale mint (light fills on dark bg)
const SKY = "6DC0C8";         // teal
const ROSE = "F5B896";        // peach
const AMBER = "F2D080";       // gold
const MINT = "9FD4B0";        // mint
const INK = "0D3B2E";         // deep green — page bg + text on light
const GLASS = "FFFFFF";
const GLASS_BORDER = "C5E8DC";

// ── Layout / master ──────────────────────────────────────────────
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.defineSlideMaster({ title: "SPRINT", background: { color: INK } });

// ── Helpers (ported from generate-prism-pptx.js) ─────────────────
function addFlares(slide) {
  const corners = [
    { x: -3.5, y: -3.5, c: SKY, t: 72 }, { x: 7.5, y: -3.5, c: ROSE, t: 74 },
    { x: 7.5, y: 2.5, c: AMBER, t: 76 }, { x: -3.5, y: 2.5, c: MINT, t: 72 },
  ];
  corners.forEach(o => slide.addShape(pptx.shapes.OVAL, {
    x: o.x, y: o.y, w: 9, h: 9, fill: { color: o.c, transparency: o.t }, line: { width: 0 },
  }));
  const flashes = [
    { x: 0.5, y: 0.5, w: 2.2, t: 55 }, { x: 10.5, y: 0.8, w: 2, t: 60 },
    { x: 10, y: 4.8, w: 2.2, t: 58 }, { x: 0.8, y: 4.8, w: 2, t: 60 },
  ];
  flashes.forEach(o => slide.addShape(pptx.shapes.OVAL, {
    x: o.x, y: o.y, w: o.w, h: o.w, fill: { color: "FFFFFF", transparency: o.t }, line: { width: 0 },
  }));
}

function addGlassPanel(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.2,
    fill: { color: GLASS, transparency: 30 },
    line: { color: "FFFFFF", width: 1, transparency: 15 },
    shadow: { type: "outer", color: "2A5046", blur: 22, offset: 10, angle: 90, opacity: 0.18 },
    ...opts,
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: x + 0.15, y: y + 0.04, w: w - 0.3, h: 0.025,
    fill: { color: "FFFFFF", transparency: 10 }, line: { width: 0 },
  });
}

// Prism mark (implicit 3D logo): extruded glass triangle with ground shadow,
// spectrum beams emerging from behind it. Mirrors the SVG in
// 03_proposition-deck.html (420×150 design units).
function addPrismMark(slide, x, y, w) {
  const h = w * (150 / 420);
  const X = v => x + (v / 420) * w;
  const Y = v => y + (v / 150) * h;
  // ground shadow
  slide.addShape(pptx.shapes.OVAL, {
    x: X(90), y: Y(125), w: X(214) - X(90), h: Y(139) - Y(125),
    fill: { color: INK, transparency: 86 }, line: { width: 0 },
  });
  // spectrum beams (drawn first so they tuck behind the glass)
  [
    { c: ROSE, sy: 60, ey: 27 },
    { c: AMBER, sy: 73, ey: 60 },
    { c: MINT, sy: 86, ey: 93 },
    { c: SKY, sy: 98, ey: 125 },
  ].forEach(r => {
    const x1 = X(180), y1 = Y(r.sy), x2 = X(402), y2 = Y(r.ey);
    slide.addShape(pptx.shapes.LINE, {
      x: x1, y: Math.min(y1, y2), w: x2 - x1, h: Math.abs(y2 - y1),
      flipV: y2 < y1,
      line: { color: r.c, width: 4, transparency: 15 },
    });
  });
  // extruded back face (depth)
  slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
    x: X(112), y: Y(7), w: X(220) - X(112), h: Y(105) - Y(7),
    fill: { color: INK, transparency: 72 }, line: { width: 0 },
  });
  // front glass face
  slide.addShape(pptx.shapes.ISOSCELES_TRIANGLE, {
    x: X(96), y: Y(16), w: X(204) - X(96), h: Y(114) - Y(16),
    fill: { color: "FFFFFF", transparency: 35 },
    line: { color: "FFFFFF", width: 1.5, transparency: 10 },
  });
}

function addLogo(slide) {
  slide.addText([
    { text: "UNLOCKT", options: { bold: true, color: INK, letterSpacing: 3 } },
    { text: "  ×  BeFrank", options: { bold: false, color: INK, letterSpacing: 1 } },
  ], { x: 0.6, y: 0.35, w: 4, h: 0.4, fontFace: "Arial", fontSize: 13 });
}

function addLabel(slide, text) {
  slide.addText(text.toUpperCase(), {
    x: 0.8, y: 0.9, w: 6, h: 0.3,
    fontFace: "Arial", fontSize: 8, bold: true, color: INK, letterSpacing: 4, transparency: 55,
  });
}

function addTitle(slide, text, size = 24) {
  slide.addText(text, {
    x: 0.8, y: 1.3, w: 11.5, h: 0.8,
    fontFace: "Arial", fontSize: size, bold: true, color: INK, lineSpacing: size + 6,
  });
}

const newSlide = (label, title, titleSize) => {
  const s = pptx.addSlide({ masterName: "SPRINT" });
  addFlares(s); addLogo(s);
  if (label) addLabel(s, label);
  if (title) addTitle(s, title, titleSize);
  return s;
};

// ════════════════════════════════════════════════════════════════
// 1 · TITLE
// ════════════════════════════════════════════════════════════════
const s1 = pptx.addSlide({ masterName: "SPRINT" });
addFlares(s1); addLogo(s1);
s1.addText("24-UUR PROPOSITIE SPRINT", {
  x: 0.8, y: 1.7, w: 8, h: 0.3, fontFace: "Arial", fontSize: 9, bold: true, color: INK, letterSpacing: 4, transparency: 40,
});
s1.addText([
  { text: "Van inzicht naar propositie.\n", options: { color: INK, fontSize: 38, bold: true, lineSpacing: 44 } },
  { text: "In 24 uur.", options: { color: SKY, fontSize: 38, bold: true } },
], { x: 0.8, y: 2.1, w: 11, h: 2.2, fontFace: "Arial", valign: "top" });
s1.addText("Hoe BeFrank de pensioenuitvoerder wordt die de kloof als eerste dicht.", {
  x: 0.8, y: 4.5, w: 9, h: 0.7, fontFace: "Arial", fontSize: 14, color: INK, transparency: 30, lineSpacing: 22,
});
addPrismMark(s1, 0.8, 5.35, 3.5);
s1.addText("«datum»  ·  Gender Capital Lab™ Sprint", {
  x: 0.8, y: 6.5, w: 8, h: 0.3, fontFace: "Arial", fontSize: 10, color: INK, transparency: 50,
});

// ════════════════════════════════════════════════════════════════
// 2 · DE OPDRACHT (the mandate we locked on Day 1)
// ════════════════════════════════════════════════════════════════
const s2 = newSlide("Dag 1 · De opdracht", "Dit is wat we gisteren hebben vastgelegd.");
addGlassPanel(s2, 0.8, 2.3, 11.7, 1.5);
s2.addText("“Hoe wordt BeFrank de uitvoerder die de pensioenkloof voor vrouwen meetbaar dicht — zonder dat de deelnemer iets hoeft te doen?”", {
  x: 1.2, y: 2.5, w: 11, h: 1.1, fontFace: "Arial", fontSize: 17, italic: true, bold: true, color: INK, lineSpacing: 26, valign: "middle",
});
const metrics = [
  { k: "Succesmaat 1", v: "Projectiekloof bij vrouwelijke deelnemers ↓ «X»% in 18 mnd", c: SKY },
  { k: "Succesmaat 2", v: "Activatie van deeltijders rond levensgebeurtenissen ↑", c: ROSE },
  { k: "Succesmaat 3", v: "Werkgevers met gap-dashboard: «X» in jaar 1", c: AMBER },
];
metrics.forEach((m, i) => {
  const x = 0.8 + i * 3.95;
  addGlassPanel(s2, x, 4.2, 3.7, 2.0);
  s2.addText(m.k.toUpperCase(), { x: x + 0.3, y: 4.4, w: 3.1, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: m.c, letterSpacing: 2 });
  s2.addText(m.v, { x: x + 0.3, y: 4.8, w: 3.1, h: 1.2, fontFace: "Arial", fontSize: 12, color: INK, transparency: 20, lineSpacing: 18, valign: "top" });
});

// ════════════════════════════════════════════════════════════════
// 3 · DIAGNOSE (readiness rings, 0–100% — circle border fills to the score)
// ════════════════════════════════════════════════════════════════
const s3 = newSlide("Dag 1 · Diagnose", "Uw readiness, in uw eigen cijfers.");
const dims = [
  { n: "Mens & organisatie", p: 52, c: ROSE },
  { n: "Data", p: 68, c: SKY },
  { n: "Marketing & communicatie", p: 48, c: ROSE },
  { n: "Ecosystemen", p: 30, c: AMBER },
  { n: "Proposities", p: 45, c: ROSE },
];
dims.forEach((d, i) => {
  const x = 0.8 + i * 2.42;
  addGlassPanel(s3, x, 2.4, 2.25, 2.6);
  const size = 1.35, rx = x + (2.25 - size) / 2, ry = 2.62;
  // track: full light circle
  s3.addShape(pptx.shapes.OVAL, {
    x: rx, y: ry, w: size, h: size,
    fill: { color: GLASS, transparency: 100 },
    line: { color: INK, width: 4.5, transparency: 90 },
  });
  // fill: coloured arc from 12 o'clock, clockwise to the score (PPT angle 0 = 3 o'clock)
  s3.addShape(pptx.shapes.ARC, {
    x: rx, y: ry, w: size, h: size,
    fill: { color: GLASS, transparency: 100 },
    line: { color: d.c, width: 4.5 },
    angleRange: [270, (270 + d.p * 3.6) % 360],
  });
  s3.addText(d.p + "%", {
    x: rx, y: ry + size / 2 - 0.28, w: size, h: 0.56,
    fontFace: "Arial", fontSize: 15, bold: true, color: d.c, align: "center", valign: "middle",
  });
  s3.addText(d.n, { x: x + 0.15, y: 4.1, w: 1.95, h: 0.8, fontFace: "Arial", fontSize: 11, color: INK, transparency: 20, align: "center", valign: "top", lineSpacing: 15 });
});
addGlassPanel(s3, 0.8, 5.3, 11.7, 1.1);
s3.addText([
  { text: "Totaaloordeel:  ", options: { color: INK, fontSize: 14, bold: true } },
  { text: "49% — latent. ", options: { color: ROSE, fontSize: 14, bold: true } },
  { text: "De ambitie en de data zijn er; de propositie en het ecosysteem zijn de onbenutte kans.", options: { color: INK, fontSize: 12, transparency: 20 } },
], { x: 1.1, y: 5.45, w: 11, h: 0.55, fontFace: "Arial", valign: "middle", lineSpacing: 18 });
s3.addText("0–34% blinde vlek  ·  35–59% latent  ·  60–79% in opbouw  ·  80–100% koploper", {
  x: 1.1, y: 6.0, w: 11, h: 0.3, fontFace: "Arial", fontSize: 9, color: INK, transparency: 50,
});

// ════════════════════════════════════════════════════════════════
// 4 · DE KANS, GEKWANTIFICEERD
// ════════════════════════════════════════════════════════════════
const s4 = newSlide("Dag 1 · De kans", "De kloof is geen idee. Het is een getal.");
const gapStats = [
  { num: "36–40%", color: SKY, body: "lager pensioen voor vrouwen in NL — de op één na grootste kloof van de EU. Bron: Eurostat / OESO." },
  { num: "€400", color: ROSE, body: "minder per maand bij pensionering, gemiddeld. Dit is besteedbaar inkomen, geen abstractie." },
  { num: "«X»%", color: AMBER, body: "van BeFrank’s vrouwelijke deelnemers ligt op een traject onder vergelijkbare mannen. (uit dataroom)" },
];
gapStats.forEach((s, i) => {
  const x = 0.8 + i * 3.95;
  addGlassPanel(s4, x, 2.5, 3.7, 3.5);
  s4.addText(s.num, { x: x + 0.3, y: 2.8, w: 3.1, h: 1, fontFace: "Arial", fontSize: 40, bold: true, color: s.color });
  s4.addText(s.body, { x: x + 0.3, y: 3.9, w: 3.1, h: 1.9, fontFace: "Arial", fontSize: 11, color: INK, transparency: 25, lineSpacing: 17, valign: "top" });
});
s4.addText("Kosten van nietsdoen: elke maand dat de kloof open blijft, is een deelnemer die straks tekortkomt — en een reputatierisico voor een merk dat ‘eerlijk’ belooft.", {
  x: 0.8, y: 6.2, w: 11.7, h: 0.6, fontFace: "Arial", fontSize: 11, italic: true, color: INK, transparency: 30, lineSpacing: 16,
});

// ════════════════════════════════════════════════════════════════
// 5 · THE ONE (the chosen proposition)
// ════════════════════════════════════════════════════════════════
const s5 = newSlide("Dag 1 · De propositie", null);
s5.addText("De Pensioen-APK", {
  x: 0.8, y: 1.5, w: 11, h: 0.9, fontFace: "Arial", fontSize: 40, bold: true, color: SKY,
});
s5.addText("Een automatische check + nudge die de kloof-vergrotende levensgebeurtenissen detecteert — en de deelnemer op het juiste moment één eerlijke keuze voorlegt.", {
  x: 0.8, y: 2.5, w: 11, h: 1.0, fontFace: "Arial", fontSize: 16, color: INK, transparency: 20, lineSpacing: 24,
});
const pillars = [
  { t: "Detecteert", b: "Minder uren, ouderschapsverlof, salarisdaling, baanwissel — zichtbaar in BeFrank’s eigen systemen op het moment dat het gebeurt.", c: SKY },
  { t: "Duidt", b: "Vertaalt de gebeurtenis naar wat het over 30 jaar betekent: ‘dit kost je €«X»/maand straks’. Persoonlijk, niet abstract.", c: ROSE },
  { t: "Doet", b: "Één knop in Mijn Pensioen: vrijwillig bijstorten of het verschil compenseren. Default zo gezet dat nietsdoen de kloof niet vergroot.", c: AMBER },
];
pillars.forEach((p, i) => {
  const x = 0.8 + i * 3.95;
  addGlassPanel(s5, x, 3.9, 3.7, 2.6);
  s5.addText(p.t, { x: x + 0.3, y: 4.1, w: 3.1, h: 0.4, fontFace: "Arial", fontSize: 15, bold: true, color: p.c });
  s5.addText(p.b, { x: x + 0.3, y: 4.6, w: 3.1, h: 1.8, fontFace: "Arial", fontSize: 11, color: INK, transparency: 25, lineSpacing: 17, valign: "top" });
});

// ════════════════════════════════════════════════════════════════
// 6 · PERSONA
// ════════════════════════════════════════════════════════════════
const s6 = newSlide("Build · Persona", "Voor wie we dit bouwen.");
addGlassPanel(s6, 0.8, 2.4, 5.5, 4.0);
s6.addText("Sanne, 34", { x: 1.2, y: 2.7, w: 4.7, h: 0.6, fontFace: "Arial", fontSize: 26, bold: true, color: SKY });
s6.addText("Net 3 dagen gaan werken na haar tweede kind. Werkt bij een BeFrank-werkgever. Logt twee keer per jaar in op Mijn Pensioen, denkt dat ‘het wel goed zit’.", {
  x: 1.2, y: 3.4, w: 4.7, h: 1.4, fontFace: "Arial", fontSize: 13, color: INK, transparency: 20, lineSpacing: 20, valign: "top",
});
s6.addText("“NiemandIemand heeft me ooit verteld wat parttime gaan met mijn pensioen doet.”".replace("NiemandIemand", "Niemand"), {
  x: 1.2, y: 5.0, w: 4.7, h: 1.1, fontFace: "Arial", fontSize: 15, italic: true, bold: true, color: INK, lineSpacing: 22, valign: "top",
});
const facts = [
  { k: "De kloof voor Sanne", v: "~€«X»/maand minder pensioen op haar huidige traject", c: ROSE },
  { k: "Het moment", v: "De urenwijziging — nu zichtbaar in het systeem", c: SKY },
  { k: "Wat ze nodig heeft", v: "Geen folder. Één eerlijke keuze, op het juiste moment.", c: AMBER },
];
facts.forEach((f, i) => {
  const y = 2.4 + i * 1.35;
  addGlassPanel(s6, 6.6, y, 5.9, 1.2);
  s6.addText(f.k.toUpperCase(), { x: 6.9, y: y + 0.15, w: 5.3, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: f.c, letterSpacing: 2 });
  s6.addText(f.v, { x: 6.9, y: y + 0.5, w: 5.3, h: 0.6, fontFace: "Arial", fontSize: 13, color: INK, transparency: 20, lineSpacing: 18, valign: "top" });
});

// ════════════════════════════════════════════════════════════════
// 7 · KLANTREIS (current vs proposed)
// ════════════════════════════════════════════════════════════════
const s7 = newSlide("Build · Klantreis", "Het moment dat de kloof ontstaat — herontworpen.");
// current
addGlassPanel(s7, 0.8, 2.4, 5.7, 4.0, { fill: { color: GLASS, transparency: 55 } });
s7.addText("VANDAAG", { x: 1.1, y: 2.6, w: 5, h: 0.3, fontFace: "Arial", fontSize: 9, bold: true, color: ROSE, letterSpacing: 3 });
["Sanne gaat parttime werken.", "Werkgever past de inleg aan.", "Geen signaal, geen melding.", "Mijn Pensioen toont een lager getal — zonder uitleg.", "Sanne merkt het pas bij pensionering."].forEach((t, i) => {
  s7.addText("—  " + t, { x: 1.1, y: 3.1 + i * 0.62, w: 5.1, h: 0.55, fontFace: "Arial", fontSize: 12, color: INK, transparency: 30, lineSpacing: 16, valign: "top" });
});
// proposed
addGlassPanel(s7, 6.8, 2.4, 5.7, 4.0);
s7.addText("MET DE PENSIOEN-APK", { x: 7.1, y: 2.6, w: 5, h: 0.3, fontFace: "Arial", fontSize: 9, bold: true, color: SKY, letterSpacing: 3 });
["Urenwijziging triggert de APK automatisch.", "Sanne krijgt één bericht: wat dit over 30 jaar betekent.", "Eerlijk, persoonlijk, geen jargon.", "Één knop: compenseren of bijstorten.", "Default beschermt haar als ze niets doet."].forEach((t, i) => {
  s7.addText("✓  " + t, { x: 7.1, y: 3.1 + i * 0.62, w: 5.1, h: 0.55, fontFace: "Arial", fontSize: 12, color: INK, transparency: 15, lineSpacing: 16, valign: "top" });
});

// ════════════════════════════════════════════════════════════════
// 8 · BUSINESS CASE
// ════════════════════════════════════════════════════════════════
const s8 = newSlide("Build · Business case", "De cijfers achter de propositie.");
const bc = [
  { num: "«X»k", color: SKY, k: "Adresseerbaar", body: "vrouwelijke deelnemers in BeFrank’s boek op een kloof-traject. (uit dataroom)" },
  { num: "+«X»%", color: ROSE, k: "Activatie", body: "verwachte stijging in vrijwillige bijstortingen rond levensgebeurtenissen. (aanname — zichtbaar)" },
  { num: "«X»%", color: MINT, k: "Retentie / ESG", body: "lagere uitstroom + hard ESG-/SFDR-verhaal voor werkgevers en toezichthouder." },
  { num: "€«X»", color: AMBER, k: "Kosten nietsdoen", body: "reputatie- en commercieel risico per jaar dat de kloof open blijft." },
];
bc.forEach((b, i) => {
  const x = 0.8 + i * 2.95;
  addGlassPanel(s8, x, 2.5, 2.75, 3.7);
  s8.addText(b.num, { x: x + 0.25, y: 2.7, w: 2.3, h: 0.8, fontFace: "Arial", fontSize: 30, bold: true, color: b.color });
  s8.addText(b.k.toUpperCase(), { x: x + 0.25, y: 3.55, w: 2.3, h: 0.3, fontFace: "Arial", fontSize: 9, bold: true, color: b.color, letterSpacing: 2 });
  s8.addText(b.body, { x: x + 0.25, y: 3.9, w: 2.3, h: 2.1, fontFace: "Arial", fontSize: 10.5, color: INK, transparency: 25, lineSpacing: 16, valign: "top" });
});
s8.addText("Alle aannames staan open en zijn aanpasbaar. Dit is het model dat het bestuur mag uitdagen — niet een black box.", {
  x: 0.8, y: 6.4, w: 11.7, h: 0.5, fontFace: "Arial", fontSize: 11, italic: true, color: INK, transparency: 30,
});

// ════════════════════════════════════════════════════════════════
// 9 · MARKETING & COMMUNICATIE
// ════════════════════════════════════════════════════════════════
const s9 = newSlide("Build · Communicatie", "In de stem van BeFrank. Geen folder.");
addGlassPanel(s9, 0.8, 2.4, 11.7, 1.3);
s9.addText("Positionering:  “Een pensioen dat bij jou past — ook als je leven verandert.”", {
  x: 1.2, y: 2.6, w: 11, h: 0.9, fontFace: "Arial", fontSize: 18, bold: true, italic: true, color: INK, valign: "middle",
});
// sample message mock
addGlassPanel(s9, 0.8, 4.0, 5.7, 2.4);
s9.addText("PUSH IN MIJN PENSIOEN", { x: 1.1, y: 4.2, w: 5, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: SKY, letterSpacing: 2 });
s9.addText("Hoi Sanne — je werkt nu wat minder. Slim! En je pensioen? Dat kunnen we samen even bijhouden. In 2 minuten zie je wat het verschil is, en wat je eraan kunt doen. Geen gedoe.", {
  x: 1.1, y: 4.6, w: 5.1, h: 1.6, fontFace: "Arial", fontSize: 13, color: INK, transparency: 15, lineSpacing: 20, valign: "top",
});
// principles
const princ = ["Warm en direct — nooit belerend.", "Persoonlijk getal, geen percentages.", "Één actie per bericht.", "Eerlijk over wat het kost én oplevert."];
addGlassPanel(s9, 6.8, 4.0, 5.7, 2.4);
s9.addText("PRINCIPES", { x: 7.1, y: 4.2, w: 5, h: 0.3, fontFace: "Arial", fontSize: 8, bold: true, color: ROSE, letterSpacing: 2 });
princ.forEach((t, i) => s9.addText("—  " + t, { x: 7.1, y: 4.6 + i * 0.42, w: 5.1, h: 0.4, fontFace: "Arial", fontSize: 12, color: INK, transparency: 20, valign: "top" }));

// ════════════════════════════════════════════════════════════════
// 10 · PROTOTYPE
// ════════════════════════════════════════════════════════════════
const s10 = newSlide("Build · Prototype", "Het voelt niet als een idee. Het voelt echt.");
addGlassPanel(s10, 0.8, 2.4, 4.2, 4.0);
s10.addText("«Mijn Pensioen — klikbaar conceptscherm»", {
  x: 1.0, y: 4.0, w: 3.8, h: 0.8, fontFace: "Arial", fontSize: 12, italic: true, color: INK, transparency: 35, align: "center", lineSpacing: 18,
});
s10.addText("[ schermafbeelding van het prototype — ingevoegd door Presentation Builder ]", {
  x: 1.0, y: 5.4, w: 3.8, h: 0.6, fontFace: "Arial", fontSize: 9, color: INK, transparency: 45, align: "center", lineSpacing: 14,
});
const flow = [
  { t: "1 · De trigger", b: "‘Je uren zijn aangepast.’ De APK opent vanzelf." },
  { t: "2 · Het inzicht", b: "Één scherm: jouw kloof, in euro’s per maand." },
  { t: "3 · De keuze", b: "Compenseer met één tik — of stel in dat het automatisch meebeweegt." },
  { t: "4 · De bevestiging", b: "‘Goed geregeld. We houden het voor je in de gaten.’" },
];
flow.forEach((f, i) => {
  const y = 2.4 + i * 1.0;
  addGlassPanel(s10, 5.4, y, 7.1, 0.85);
  s10.addText(f.t, { x: 5.7, y: y + 0.12, w: 2.4, h: 0.6, fontFace: "Arial", fontSize: 12, bold: true, color: SKY, valign: "middle" });
  s10.addText(f.b, { x: 8.0, y: y + 0.12, w: 4.3, h: 0.6, fontFace: "Arial", fontSize: 11, color: INK, transparency: 20, valign: "middle", lineSpacing: 15 });
});

// ════════════════════════════════════════════════════════════════
// 11 · ROADMAP (pilot → Advisory Trajectory)
// ════════════════════════════════════════════════════════════════
const s11 = newSlide("Vervolg", "Van propositie naar werkende pilot.");
const phases = [
  { num: "Nu → wk 6", title: "Pilot", body: "1 werkgever, 1 levensgebeurtenis (urenwijziging). Meet activatie en kloof-effect.", color: SKY },
  { num: "Wk 6 → 6 mnd", title: "Advisory Trajectory", body: "Uitbouw over alle levensgebeurtenissen, defaults herontworpen, marcom-team getraind.", color: ROSE },
  { num: "6 → 18 mnd", title: "Embed & Scale", body: "Werkgever-dashboard, certificering, continue scan. De kloof als merkbelofte.", color: AMBER },
];
phases.forEach((p, i) => {
  const x = 0.8 + i * 3.95;
  addGlassPanel(s11, x, 2.5, 3.7, 3.6);
  s11.addText(p.num.toUpperCase(), { x: x + 0.3, y: 2.7, w: 3.1, h: 0.3, fontFace: "Arial", fontSize: 9, bold: true, color: p.color, letterSpacing: 2 });
  s11.addText(p.title, { x: x + 0.3, y: 3.05, w: 3.1, h: 0.5, fontFace: "Arial", fontSize: 17, bold: true, color: p.color });
  s11.addText(p.body, { x: x + 0.3, y: 3.7, w: 3.1, h: 2.2, fontFace: "Arial", fontSize: 11.5, color: INK, transparency: 25, lineSpacing: 18, valign: "top" });
  if (i < 2) s11.addText("→", { x: x + 3.55, y: 3.9, w: 0.5, h: 0.5, fontFace: "Arial", fontSize: 22, bold: true, color: INK, transparency: 40, align: "center" });
});

// ════════════════════════════════════════════════════════════════
// 12 · DE BESLISSING
// ════════════════════════════════════════════════════════════════
const s12 = pptx.addSlide({ masterName: "SPRINT" });
addFlares(s12); addLogo(s12);
s12.addText("DE BESLISSING", { x: 0.8, y: 2.0, w: 8, h: 0.3, fontFace: "Arial", fontSize: 9, bold: true, color: INK, letterSpacing: 4, transparency: 40 });
s12.addText([
  { text: "Wil BeFrank de uitvoerder zijn\ndie de kloof ", options: { color: INK, fontSize: 34, bold: true, lineSpacing: 42 } },
  { text: "als eerste dicht?", options: { color: SKY, fontSize: 34, bold: true } },
], { x: 0.8, y: 2.5, w: 11, h: 2, fontFace: "Arial", valign: "top" });
s12.addText("Greenlight de 6-weken pilot. Eén werkgever. Eén moment. Een meetbaar resultaat.", {
  x: 0.8, y: 4.7, w: 10, h: 0.6, fontFace: "Arial", fontSize: 15, color: INK, transparency: 25, lineSpacing: 22,
});
addPrismMark(s12, 0.8, 5.5, 3.5);

// ── Write ────────────────────────────────────────────────────────
const OUT = "IFC_Sprint_BeFrank_Proposition.pptx";
pptx.writeFile({ fileName: OUT }).then(() => console.log("✓ Wrote " + OUT + " (" + pptx.slides.length + " slides)"));
