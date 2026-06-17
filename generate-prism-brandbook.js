const pptxgen = require("pptxgenjs");
const sharp = require("sharp");

// ─── BRAND PALETTE ───
const DEEP = "EAF6F1";       // mist bg
const SKY = "6DC0C8";        // aqua
const ROSE = "F5B896";       // peach
const AMBER = "F2D080";      // honey
const MINT = "9FD4B0";       // sage
const WHITE = "0D3B2E";      // deep forest ink
const GLASS = "FFFFFF";
const INK_SOFT = "2A5046";

// ─── BACKGROUND GENERATOR ────────────────────────────
// One unified soft pastel wash — all four colours blurred together
// into a single see-through panel with one touch of white light.
async function makeFlareBgData() {
  const W = 1920, H = 1080;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <rect width="100%" height="100%" fill="#${DEEP}"/>
      <circle cx="${W*0.18}" cy="${H*0.25}" r="900"  fill="#${SKY}"   fill-opacity="0.95"/>
      <circle cx="${W*0.82}" cy="${H*0.20}" r="900"  fill="#${ROSE}"  fill-opacity="0.95"/>
      <circle cx="${W*0.85}" cy="${H*0.85}" r="950"  fill="#${AMBER}" fill-opacity="0.95"/>
      <circle cx="${W*0.15}" cy="${H*0.80}" r="900"  fill="#${MINT}"  fill-opacity="0.95"/>
      <circle cx="${W*0.58}" cy="${H*0.32}" r="340"  fill="#FFFFFF"   fill-opacity="0.9"/>
    </svg>
  `;
  const buf = await sharp(Buffer.from(svg))
    .blur(200)
    .png()
    .toBuffer();
  return "data:image/png;base64," + buf.toString("base64");
}

async function main() {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = "IFC";
  pptx.title = "IFC Prism Brand Book";

  // Bake background
  const bgMain = await makeFlareBgData();

  pptx.defineSlideMaster({
    title: "PRISM",
    background: { data: bgMain },
  });

  // ─── HELPERS ─────────────────────────────
  function addGlass(slide, x, y, w, h, opts = {}) {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h,
      rectRadius: 0.2,
      fill: { color: GLASS, transparency: 62 },
      shadow: { type: "outer", color: INK_SOFT, blur: 30, offset: 6, angle: 90, opacity: 0.12 },
      ...opts,
    });
  }

  function addLogo(slide) {
    slide.addText("IFC", {
      x: 0.6, y: 0.35, w: 1.5, h: 0.4,
      fontFace: "Sora", fontSize: 14, bold: true, color: WHITE, charSpacing: 3, margin: 0,
    });
  }

  function addLabel(slide, text) {
    slide.addText(text.toUpperCase(), {
      x: 0.8, y: 0.9, w: 6, h: 0.3,
      fontFace: "Sora", fontSize: 8, bold: true, color: WHITE, charSpacing: 4, transparency: 60,
    });
  }

  function addPageNum(slide, num, total) {
    slide.addText(`${String(num).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
      x: 12, y: 7.05, w: 1.2, h: 0.3,
      fontFace: "Sora", fontSize: 8, color: WHITE, transparency: 55, charSpacing: 2, align: "right",
    });
  }

  function addSpectrum(slide, x, y, w) {
    [SKY, MINT].forEach((c, i) => {
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: x + i * (w / 2), y, w: w / 2, h: 0.04,
        fill: { color: c }, line: { width: 0 },
      });
    });
  }

  const TOTAL = 11;

  // ═══════════════════════════════════════
  // 01 · COVER
  // ═══════════════════════════════════════
  const s1 = pptx.addSlide({ masterName: "PRISM" });
  addLogo(s1);

  s1.addText("BRAND BOOK · 2026", {
    x: 0.8, y: 2.0, w: 8, h: 0.3,
    fontFace: "Sora", fontSize: 9, bold: true, color: WHITE, charSpacing: 4, transparency: 40,
  });
  s1.addText("Prism.", {
    x: 0.8, y: 2.4, w: 10, h: 1.6,
    fontFace: "Sora", fontSize: 96, bold: true, color: WHITE, margin: 0,
  });
  s1.addText("The visual system for Inclusive Finance Collective —\nlight, transparency, and the colours of progress.", {
    x: 0.8, y: 4.3, w: 9, h: 1.2,
    fontFace: "Inter", fontSize: 16, color: WHITE, transparency: 25, lineSpacing: 24,
  });
  addSpectrum(s1, 0.8, 6.2, 5);
  addPageNum(s1, 1, TOTAL);

  // ═══════════════════════════════════════
  // 02 · BRAND ESSENCE
  // ═══════════════════════════════════════
  const s2 = pptx.addSlide({ masterName: "PRISM" });
  addLogo(s2);
  addLabel(s2, "01 · Essence");

  s2.addText("Clarity through colour.", {
    x: 0.8, y: 1.3, w: 10, h: 0.9,
    fontFace: "Sora", fontSize: 38, bold: true, color: WHITE, margin: 0,
  });
  s2.addText("Prism is the house style for IFC. A prism doesn't invent light — it reveals what's already there. That's our job: making the full spectrum of financial inclusion visible to the people who make the decisions.", {
    x: 0.8, y: 2.5, w: 10.5, h: 1.4,
    fontFace: "Inter", fontSize: 15, color: WHITE, transparency: 25, lineSpacing: 24,
  });

  const pillars = [
    { t: "Transparent", b: "Glass, layers, see-through honesty." },
    { t: "Bright",      b: "Soft spring light, never dark." },
    { t: "Human",       b: "Warm ink, rounded forms, no harsh lines." },
    { t: "Precise",     b: "Science-based, data-anchored, quietly rigorous." },
  ];
  pillars.forEach((p, i) => {
    const x = 0.8 + i * 3.05;
    addGlass(s2, x, 4.3, 2.85, 2.3);
    s2.addText(p.t, { x: x + 0.25, y: 4.55, w: 2.6, h: 0.5, fontFace: "Sora", fontSize: 17, bold: true, color: WHITE, margin: 0 });
    s2.addText(p.b, { x: x + 0.25, y: 5.1, w: 2.6, h: 1.3, fontFace: "Inter", fontSize: 11, color: WHITE, transparency: 30, lineSpacing: 16, margin: 0 });
  });
  addPageNum(s2, 2, TOTAL);

  // ═══════════════════════════════════════
  // 03 · LOGO
  // ═══════════════════════════════════════
  const s3 = pptx.addSlide({ masterName: "PRISM" });
  addLogo(s3);
  addLabel(s3, "02 · Logo");

  s3.addText("Three letters, one promise.", {
    x: 0.8, y: 1.3, w: 10, h: 0.8,
    fontFace: "Sora", fontSize: 30, bold: true, color: WHITE, margin: 0,
  });

  addGlass(s3, 0.8, 2.4, 6, 4.2);
  s3.addText("IFC", {
    x: 0.8, y: 3.3, w: 6, h: 2,
    fontFace: "Sora", fontSize: 110, bold: true, color: WHITE, align: "center", charSpacing: 6, margin: 0,
  });
  s3.addText("INCLUSIVE FINANCE COLLECTIVE", {
    x: 0.8, y: 5.5, w: 6, h: 0.3,
    fontFace: "Sora", fontSize: 9, bold: true, color: WHITE, transparency: 40, charSpacing: 3, align: "center",
  });

  addGlass(s3, 7.2, 2.4, 5.3, 4.2);
  s3.addText("USAGE", {
    x: 7.45, y: 2.65, w: 4.8, h: 0.3,
    fontFace: "Sora", fontSize: 8, bold: true, color: WHITE, charSpacing: 3, transparency: 40,
  });
  s3.addText([
    { text: "Monogram\n", options: { fontFace: "Sora", fontSize: 13, bold: true, color: WHITE } },
    { text: "Use the IFC monogram as the primary identifier in small spaces, favicons, and sign-offs.\n\n", options: { fontFace: "Inter", fontSize: 11, color: WHITE, transparency: 30, lineSpacing: 17 } },
    { text: "Clear space\n", options: { fontFace: "Sora", fontSize: 13, bold: true, color: WHITE } },
    { text: "Always leave at least the height of one letter on all sides.\n\n", options: { fontFace: "Inter", fontSize: 11, color: WHITE, transparency: 30, lineSpacing: 17 } },
    { text: "Minimum size\n", options: { fontFace: "Sora", fontSize: 13, bold: true, color: WHITE } },
    { text: "24px on screen. 8mm in print.", options: { fontFace: "Inter", fontSize: 11, color: WHITE, transparency: 30, lineSpacing: 17 } },
  ], { x: 7.45, y: 3.0, w: 4.8, h: 3.5, valign: "top", margin: 0 });

  addPageNum(s3, 3, TOTAL);

  // ═══════════════════════════════════════
  // 04 · COLOUR SYSTEM
  // ═══════════════════════════════════════
  const s4 = pptx.addSlide({ masterName: "PRISM" });
  addLogo(s4);
  addLabel(s4, "03 · Colour");

  s4.addText("Four standalone flares.", {
    x: 0.8, y: 1.3, w: 10, h: 0.8,
    fontFace: "Sora", fontSize: 30, bold: true, color: WHITE, margin: 0,
  });
  s4.addText("Each colour stands alone — never blended into a rainbow. They live in the background as light, not as pattern.", {
    x: 0.8, y: 2.1, w: 11, h: 0.5,
    fontFace: "Inter", fontSize: 13, color: WHITE, transparency: 30,
  });

  // 2×2 grid aligned with the corner flares so each card sits on its colour
  const colors = [
    { name: "Aqua",  hex: "#6DC0C8", role: "Trust · Tech",   fill: SKY,   x: 0.8, y: 2.9 },
    { name: "Peach", hex: "#F5B896", role: "Warmth · Voice", fill: ROSE,  x: 7.0, y: 2.9 },
    { name: "Sage",  hex: "#9FD4B0", role: "Balance · Care", fill: MINT,  x: 0.8, y: 5.0 },
    { name: "Honey", hex: "#F2D080", role: "Growth · Value", fill: AMBER, x: 7.0, y: 5.0 },
  ];
  const cw = 5.5, ch = 1.85;
  colors.forEach((col) => {
    addGlass(s4, col.x, col.y, cw, ch, { fill: { color: col.fill } });
    s4.addText(col.name, {
      x: col.x + 0.4, y: col.y + 0.25, w: cw - 0.8, h: 0.55,
      fontFace: "Sora", fontSize: 24, bold: true, color: WHITE, margin: 0,
    });
    s4.addText(col.hex, {
      x: col.x + 0.4, y: col.y + 0.85, w: cw - 0.8, h: 0.35,
      fontFace: "Inter", fontSize: 13, color: WHITE, transparency: 25, margin: 0,
    });
    s4.addText(col.role, {
      x: col.x + 0.4, y: col.y + 1.25, w: cw - 0.8, h: 0.35,
      fontFace: "Sora", fontSize: 9, bold: true, color: WHITE, transparency: 45, charSpacing: 2,
    });
  });

  s4.addText([
    { text: "INK  ", options: { fontFace: "Sora", fontSize: 8, bold: true, color: WHITE, charSpacing: 3 } },
    { text: "#0D3B2E   ", options: { fontFace: "Inter", fontSize: 11, color: WHITE, transparency: 30 } },
    { text: "MIST  ", options: { fontFace: "Sora", fontSize: 8, bold: true, color: WHITE, charSpacing: 3 } },
    { text: "#EAF6F1", options: { fontFace: "Inter", fontSize: 11, color: WHITE, transparency: 30 } },
  ], { x: 0.8, y: 6.9, w: 10, h: 0.3 });

  addPageNum(s4, 4, TOTAL);

  // ═══════════════════════════════════════
  // 05 · TYPOGRAPHY
  // ═══════════════════════════════════════
  const s5 = pptx.addSlide({ masterName: "PRISM" });
  addLogo(s5);
  addLabel(s5, "04 · Typography");

  s5.addText("Sora & Inter.", {
    x: 0.8, y: 1.3, w: 10, h: 0.8,
    fontFace: "Sora", fontSize: 30, bold: true, color: WHITE, margin: 0,
  });

  addGlass(s5, 0.8, 2.5, 6, 4.2);
  s5.addText("Aa", { x: 1.0, y: 2.7, w: 5.6, h: 2.4, fontFace: "Sora", fontSize: 150, bold: true, color: WHITE, margin: 0 });
  s5.addText("SORA · DISPLAY", { x: 1.0, y: 5.3, w: 5.6, h: 0.3, fontFace: "Sora", fontSize: 8, bold: true, color: WHITE, charSpacing: 3, transparency: 40 });
  s5.addText("Headlines, monograms, section labels. Used bold at scale.", {
    x: 1.0, y: 5.65, w: 5.6, h: 0.5, fontFace: "Inter", fontSize: 12, color: WHITE, transparency: 30, lineSpacing: 18,
  });
  s5.addText("ABCDEFGHIJKLMNOPQRSTUVWXYZ\n1234567890", {
    x: 1.0, y: 6.2, w: 5.6, h: 0.4, fontFace: "Sora", fontSize: 9, color: WHITE, transparency: 40, charSpacing: 1,
  });

  addGlass(s5, 7.2, 2.5, 5.3, 4.2);
  s5.addText("Aa", { x: 7.4, y: 2.7, w: 5, h: 2.4, fontFace: "Inter", fontSize: 150, color: WHITE, margin: 0 });
  s5.addText("INTER · BODY", { x: 7.4, y: 5.3, w: 5, h: 0.3, fontFace: "Sora", fontSize: 8, bold: true, color: WHITE, charSpacing: 3, transparency: 40 });
  s5.addText("Paragraphs, UI, captions. Set at 14–16pt with generous line-height.", {
    x: 7.4, y: 5.65, w: 5, h: 0.5, fontFace: "Inter", fontSize: 12, color: WHITE, transparency: 30, lineSpacing: 18,
  });
  s5.addText("abcdefghijklmnopqrstuvwxyz\n1234567890", {
    x: 7.4, y: 6.2, w: 5, h: 0.4, fontFace: "Inter", fontSize: 9, color: WHITE, transparency: 40,
  });

  addPageNum(s5, 5, TOTAL);

  // ═══════════════════════════════════════
  // 06 · GLASS SYSTEM
  // ═══════════════════════════════════════
  const s6 = pptx.addSlide({ masterName: "PRISM" });
  addLogo(s6);
  addLabel(s6, "05 · Glass");

  s6.addText("Glass, layered.", {
    x: 0.8, y: 1.3, w: 10, h: 0.8,
    fontFace: "Sora", fontSize: 30, bold: true, color: WHITE, margin: 0,
  });
  s6.addText("Every surface is a pane of frosted glass — backdrop-blurred, slightly 3D, with a top bevel of white light.", {
    x: 0.8, y: 2.1, w: 11, h: 0.5,
    fontFace: "Inter", fontSize: 13, color: WHITE, transparency: 30,
  });

  addGlass(s6, 0.8, 2.9, 6, 3.9);
  s6.addText("SAMPLE", { x: 1.0, y: 3.1, w: 5.6, h: 0.3, fontFace: "Sora", fontSize: 8, bold: true, color: WHITE, charSpacing: 3, transparency: 40 });
  s6.addText("Prism glass card", { x: 1.0, y: 3.45, w: 5.6, h: 0.7, fontFace: "Sora", fontSize: 26, bold: true, color: WHITE, margin: 0 });
  s6.addText("Transparent white fill · subtle shadow · top-edge bevel · rounded corners at 0.2in · sits above the four-corner colour flares.", {
    x: 1.0, y: 4.25, w: 5.6, h: 1.5, fontFace: "Inter", fontSize: 12, color: WHITE, transparency: 30, lineSpacing: 20,
  });

  addGlass(s6, 7.2, 2.9, 5.3, 3.9);
  const recipe = [
    { t: "Fill", v: "white · 72% opacity" },
    { t: "Border", v: "white · 1px · 85% opacity" },
    { t: "Radius", v: "0.2 in (≈ 16 px)" },
    { t: "Shadow", v: "ink · blur 22 · offset 10 · 18%" },
    { t: "Bevel", v: "top highlight strip, 90% white" },
    { t: "Backdrop", v: "blur 24px · saturate 1.25" },
  ];
  recipe.forEach((r, i) => {
    const y = 3.15 + i * 0.55;
    s6.addText(r.t.toUpperCase(), {
      x: 7.45, y, w: 1.5, h: 0.3,
      fontFace: "Sora", fontSize: 9, bold: true, color: WHITE, charSpacing: 2, transparency: 35,
    });
    s6.addText(r.v, {
      x: 9.0, y, w: 3.4, h: 0.3,
      fontFace: "Inter", fontSize: 11, color: WHITE, transparency: 25,
    });
  });

  addPageNum(s6, 6, TOTAL);

  // ═══════════════════════════════════════
  // 07 · BUTTONS & CTAs
  // ═══════════════════════════════════════
  const s7 = pptx.addSlide({ masterName: "PRISM" });
  addLogo(s7);
  addLabel(s7, "06 · Buttons");

  s7.addText("Colour at the edges.", {
    x: 0.8, y: 1.3, w: 10, h: 0.8,
    fontFace: "Sora", fontSize: 30, bold: true, color: WHITE, margin: 0,
  });
  s7.addText("Buttons are glass panels with a colour halo — the spectrum runs along the edge, not inside the label.", {
    x: 0.8, y: 2.1, w: 11, h: 0.5,
    fontFace: "Inter", fontSize: 13, color: WHITE, transparency: 30,
  });

  const buttons = [
    { name: "Aqua",  hex: "#6DC0C8", color: SKY },
    { name: "Peach", hex: "#F5B896", color: ROSE },
    { name: "Honey", hex: "#F2D080", color: AMBER },
    { name: "Sage",  hex: "#9FD4B0", color: MINT },
  ];
  buttons.forEach((b, i) => {
    const x = 0.8 + (i % 2) * 6.3;
    const y = 3.0 + Math.floor(i / 2) * 1.6;
    const w = 5.7, h = 1.1;

    // 3D base — darker offset shadow slab sitting just below the face
    s7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: y + 0.08, w, h,
      rectRadius: 0.14,
      fill: { color: b.color, transparency: 60 },
    });
    // Glass face with colour border + soft colour halo
    s7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h,
      rectRadius: 0.14,
      fill: { color: GLASS, transparency: 22 },
      line: { color: b.color, width: 2.5 },
      shadow: { type: "outer", color: b.color, blur: 28, offset: 0, angle: 90, opacity: 0.55 },
    });
    // Name — in its colour
    s7.addText(b.name, {
      x, y: y + 0.12, w, h: 0.5,
      fontFace: "Sora", fontSize: 20, bold: true, color: b.color, align: "center", margin: 0,
    });
    // Hex code
    s7.addText(b.hex, {
      x, y: y + 0.6, w, h: 0.4,
      fontFace: "Inter", fontSize: 12, color: WHITE, transparency: 25, align: "center", charSpacing: 1, margin: 0,
    });
  });

  addPageNum(s7, 7, TOTAL);

  // ═══════════════════════════════════════
  // 08 · LIGHT FLARES (explanation, no visible ovals)
  // ═══════════════════════════════════════
  const s8 = pptx.addSlide({ masterName: "PRISM" });
  addLogo(s8);
  addLabel(s8, "07 · Light Flares");

  s8.addText("The background is light.", {
    x: 0.8, y: 1.3, w: 11, h: 0.8,
    fontFace: "Sora", fontSize: 30, bold: true, color: WHITE, margin: 0,
  });
  s8.addText("Every slide, page and screen uses the same four-corner flare system. Aqua · Peach · Honey · Sage — each one standing on its own, blurred into light.", {
    x: 0.8, y: 2.1, w: 11.5, h: 0.6,
    fontFace: "Inter", fontSize: 13, color: WHITE, transparency: 30, lineSpacing: 20,
  });

  // Large glass recipe panel spanning the slide — the background itself is the demo
  addGlass(s8, 0.8, 3.0, 11.7, 3.9);
  s8.addText("FLARE RECIPE", {
    x: 1.1, y: 3.2, w: 5, h: 0.3,
    fontFace: "Sora", fontSize: 8, bold: true, color: WHITE, charSpacing: 3, transparency: 40,
  });
  const fr = [
    { t: "TOP LEFT",     v: "Aqua  #6DC0C8" },
    { t: "TOP RIGHT",    v: "Peach #F5B896" },
    { t: "BOTTOM RIGHT", v: "Honey #F2D080" },
    { t: "BOTTOM LEFT",  v: "Sage  #9FD4B0" },
    { t: "HOTSPOTS",     v: "White · 4 points" },
    { t: "BLUR",         v: "180px Gaussian" },
  ];
  fr.forEach((r, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 1.1 + col * 5.5;
    const y = 3.7 + row * 0.9;
    s8.addText(r.t, { x, y, w: 2.3, h: 0.3, fontFace: "Sora", fontSize: 9, bold: true, color: WHITE, charSpacing: 2, transparency: 30 });
    s8.addText(r.v, { x: x + 2.4, y, w: 2.9, h: 0.3, fontFace: "Inter", fontSize: 12, color: WHITE, transparency: 20 });
  });

  addPageNum(s8, 8, TOTAL);

  // ═══════════════════════════════════════
  // 09 · VOICE & TONE
  // ═══════════════════════════════════════
  const s9 = pptx.addSlide({ masterName: "PRISM" });
  addLogo(s9);
  addLabel(s9, "08 · Voice");

  s9.addText("Quiet confidence.", {
    x: 0.8, y: 1.3, w: 10, h: 0.8,
    fontFace: "Sora", fontSize: 30, bold: true, color: WHITE, margin: 0,
  });
  s9.addText("We write the way we design: clear, warm, evidence-led. No jargon, no lectures, no emojis.", {
    x: 0.8, y: 2.1, w: 11, h: 0.5,
    fontFace: "Inter", fontSize: 13, color: WHITE, transparency: 30,
  });

  const voice = [
    { is: "We are", isn: "We are not", a: "Plain-spoken.\nPrecise.\nOptimistic.\nSpecific with numbers.", b: "Buzzword-heavy.\nPreachy.\nGrim.\nVague with claims." },
    { is: "We say", isn: "We don't say", a: "“Financial inclusion is a business opportunity.”\n“Here's the data.”\n“Let's make it work.”", b: "“Empowerment journey.”\n“Game-changing synergy.”\n“Disrupting the status quo.”" },
  ];
  voice.forEach((v, i) => {
    const x = 0.8 + i * 6.3;
    addGlass(s9, x, 2.9, 5.7, 4.0);
    s9.addText(v.is.toUpperCase(), { x: x + 0.3, y: 3.05, w: 3, h: 0.3, fontFace: "Sora", fontSize: 9, bold: true, color: WHITE, charSpacing: 3 });
    s9.addText(v.a, { x: x + 0.3, y: 3.4, w: 5.1, h: 1.4, fontFace: "Inter", fontSize: 12, color: WHITE, transparency: 20, lineSpacing: 20 });
    s9.addText(v.isn.toUpperCase(), { x: x + 0.3, y: 5.0, w: 3, h: 0.3, fontFace: "Sora", fontSize: 9, bold: true, color: WHITE, charSpacing: 3, transparency: 55 });
    s9.addText(v.b, { x: x + 0.3, y: 5.35, w: 5.1, h: 1.4, fontFace: "Inter", fontSize: 12, color: WHITE, transparency: 55, italic: true, lineSpacing: 20 });
  });

  addPageNum(s9, 9, TOTAL);

  // ═══════════════════════════════════════
  // 10 · DO'S & DON'TS
  // ═══════════════════════════════════════
  const s10 = pptx.addSlide({ masterName: "PRISM" });
  addLogo(s10);
  addLabel(s10, "09 · Rules");

  s10.addText("Do's & Don'ts.", {
    x: 0.8, y: 1.3, w: 10, h: 0.8,
    fontFace: "Sora", fontSize: 30, bold: true, color: WHITE, margin: 0,
  });

  const rules = [
    { kind: "DO",    text: "Keep glass surfaces transparent — always readable but never fully opaque." },
    { kind: "DO",    text: "Use the four flares in corners. Let them stand alone, never blend into a gradient." },
    { kind: "DO",    text: "Set body copy in Inter at 14–16pt with line-height 1.5×." },
    { kind: "DON'T", text: "Build rainbow gradients or pride-flag stacks. One flare per corner, no blending." },
    { kind: "DON'T", text: "Place coloured text on coloured backgrounds. Ink on mist, always." },
    { kind: "DON'T", text: "Add drop shadows darker than ink · 18%. Keep the world light." },
  ];
  rules.forEach((r, i) => {
    const x = 0.8 + (i % 2) * 6.3;
    const y = 2.5 + Math.floor(i / 2) * 1.45;
    addGlass(s10, x, y, 5.7, 1.25);
    s10.addText(r.kind, {
      x: x + 0.3, y: y + 0.25, w: 1.2, h: 0.3,
      fontFace: "Sora", fontSize: 9, bold: true, color: WHITE, charSpacing: 2, transparency: 25,
    });
    s10.addText(r.text, {
      x: x + 0.3, y: y + 0.55, w: 5.2, h: 0.7,
      fontFace: "Inter", fontSize: 12, color: WHITE, transparency: 20, lineSpacing: 18,
    });
  });

  addPageNum(s10, 10, TOTAL);

  // ═══════════════════════════════════════
  // 11 · CLOSING
  // ═══════════════════════════════════════
  const s11 = pptx.addSlide({ masterName: "PRISM" });
  addLogo(s11);

  s11.addText("Let's build in the light.", {
    x: 0.8, y: 2.8, w: 12, h: 1.4,
    fontFace: "Sora", fontSize: 58, bold: true, color: WHITE, margin: 0,
  });
  s11.addText("Prism · Brand System · Inclusive Finance Collective · 2026", {
    x: 0.8, y: 4.4, w: 12, h: 0.4,
    fontFace: "Inter", fontSize: 13, color: WHITE, transparency: 35,
  });
  addSpectrum(s11, 0.8, 5.0, 5);
  s11.addText("hello@inclusivefinance.co", {
    x: 0.8, y: 6.6, w: 6, h: 0.4,
    fontFace: "Sora", fontSize: 11, bold: true, color: WHITE, charSpacing: 2,
  });

  addPageNum(s11, 11, TOTAL);

  // ─── EXPORT ───
  const outPath = "/Users/jvanwaveren/IFC/IFC_Prism_BrandBook.pptx";
  await pptx.writeFile({ fileName: outPath });
  console.log("Created: " + outPath);
}

main().catch(err => { console.error(err); process.exit(1); });
