const pptxgen = require("pptxgenjs");

const pptx = new pptxgen();

// Brand colours
const DEEP = "EAF6F1";
const SKY = "CFE8EC";
const ROSE = "7FC4CC";
const AMBER = "4A9FAA";
const MINT = "2A7082";
const WHITE = "0D3B2E";
const GLASS = "FFFFFF";
const GLASS_BORDER = "C5E8DC";

pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";

pptx.defineSlideMaster({
  title: "PRISM",
  background: { color: DEEP },
});

// Helper: glass panel
function glass(slide, x, y, w, h) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    rectRadius: 0.2,
    fill: { color: GLASS, transparency: 40 },
    line: { color: GLASS_BORDER, width: 0.75, transparency: 50 },
  });
}

// Helper: icon label
function label(slide, x, y, w, text) {
  slide.addText(text, {
    x, y, w, h: 0.3,
    fontFace: "Arial", fontSize: 8, color: WHITE, transparency: 40,
    align: "center",
  });
}

// Helper: spectrum line
function spectrumLine(slide, x, y, w) {
  const colors = [SKY, ROSE, AMBER, MINT];
  const segW = w / colors.length;
  colors.forEach((c, i) => {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: x + i * segW, y, w: segW, h: 0.035,
      fill: { color: c }, line: { width: 0 },
    });
  });
}

// ═══════════════════════════════════════
// SLIDE 1: TITLE
// ═══════════════════════════════════════
const title = pptx.addSlide({ masterName: "PRISM" });
title.addShape(pptx.shapes.OVAL, {
  x: 7, y: -1.5, w: 8, h: 8,
  fill: { color: SKY, transparency: 88 }, line: { width: 0 },
});
title.addText("IBC", {
  x: 0.6, y: 0.35, w: 1, h: 0.4,
  fontFace: "Arial", fontSize: 14, bold: true, color: WHITE, letterSpacing: 3,
});
title.addText("Prism Icon Library", {
  x: 0.8, y: 2.2, w: 8, h: 1,
  fontFace: "Arial", fontSize: 36, bold: true, color: WHITE,
});
title.addText("On-brand icons for presentations, documents, and digital assets.\nAll icons use the Prism spectrum palette and glassmorphic styling.", {
  x: 0.8, y: 3.3, w: 8, h: 0.8,
  fontFace: "Arial", fontSize: 13, color: WHITE, transparency: 35, lineSpacing: 20,
});
spectrumLine(title, 0.8, 4.4, 5);

// ═══════════════════════════════════════
// ICON BUILDER FUNCTIONS
// ═══════════════════════════════════════

// Each icon is built from basic shapes inside a glass card

function iconDiagnose(slide, cx, cy, color) {
  // Magnifying glass: circle + line
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.25, y: cy - 0.3, w: 0.5, h: 0.5,
    fill: { color: DEEP, transparency: 60 },
    line: { color, width: 2 },
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx + 0.18, y: cy + 0.18, w: 0.28, h: 0.06,
    fill: { color }, line: { width: 0 },
    rotate: 45,
  });
}

function iconStrategy(slide, cx, cy, color) {
  // Target: concentric circles
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.3, y: cy - 0.3, w: 0.6, h: 0.6,
    fill: { color: DEEP, transparency: 60 },
    line: { color, width: 1.5 },
  });
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.18, y: cy - 0.18, w: 0.36, h: 0.36,
    fill: { color: DEEP, transparency: 60 },
    line: { color, width: 1.5 },
  });
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.06, y: cy - 0.06, w: 0.12, h: 0.12,
    fill: { color },
    line: { width: 0 },
  });
}

function iconBuild(slide, cx, cy, color) {
  // Stacked blocks
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.28, y: cy + 0.05, w: 0.56, h: 0.2,
    rectRadius: 0.04,
    fill: { color, transparency: 30 }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.2, y: cy - 0.17, w: 0.4, h: 0.2,
    rectRadius: 0.04,
    fill: { color, transparency: 15 }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.12, y: cy - 0.35, w: 0.24, h: 0.16,
    rectRadius: 0.04,
    fill: { color }, line: { width: 0 },
  });
}

function iconMeasure(slide, cx, cy, color) {
  // Bar chart: 3 bars
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.26, y: cy - 0.05, w: 0.14, h: 0.35,
    rectRadius: 0.03,
    fill: { color, transparency: 40 }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.07, y: cy - 0.25, w: 0.14, h: 0.55,
    rectRadius: 0.03,
    fill: { color, transparency: 20 }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx + 0.12, y: cy - 0.15, w: 0.14, h: 0.45,
    rectRadius: 0.03,
    fill: { color }, line: { width: 0 },
  });
}

function iconScale(slide, cx, cy, color) {
  // Arrow pointing up-right
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.28, y: cy + 0.04, w: 0.55, h: 0.05,
    fill: { color }, line: { width: 0 },
    rotate: -35,
  });
  // Arrowhead triangle
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx + 0.15, y: cy - 0.28, w: 0.18, h: 0.18,
    fill: { color }, line: { width: 0 },
  });
}

function iconGlobe(slide, cx, cy, color) {
  // Globe: circle with lines
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.28, y: cy - 0.28, w: 0.56, h: 0.56,
    fill: { color: DEEP, transparency: 60 },
    line: { color, width: 1.5 },
  });
  // Horizontal line
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.25, y: cy - 0.02, w: 0.5, h: 0.04,
    fill: { color, transparency: 40 }, line: { width: 0 },
  });
  // Vertical ellipse (meridian)
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.12, y: cy - 0.26, w: 0.24, h: 0.52,
    fill: { color: DEEP, transparency: 80 },
    line: { color, width: 1, transparency: 30 },
  });
}

function iconPeople(slide, cx, cy, color) {
  // Two people: circles + rounded rects
  // Person 1
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.22, y: cy - 0.32, w: 0.2, h: 0.2,
    fill: { color }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.27, y: cy - 0.08, w: 0.3, h: 0.35,
    rectRadius: 0.08,
    fill: { color, transparency: 30 }, line: { width: 0 },
  });
  // Person 2
  slide.addShape(pptx.shapes.OVAL, {
    x: cx + 0.02, y: cy - 0.32, w: 0.2, h: 0.2,
    fill: { color, transparency: 20 }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.03, y: cy - 0.08, w: 0.3, h: 0.35,
    rectRadius: 0.08,
    fill: { color, transparency: 50 }, line: { width: 0 },
  });
}

function iconRevenue(slide, cx, cy, color) {
  // Coin stack
  for (let i = 0; i < 3; i++) {
    slide.addShape(pptx.shapes.OVAL, {
      x: cx - 0.2, y: cy + 0.12 - i * 0.16, w: 0.4, h: 0.16,
      fill: { color, transparency: i * 15 },
      line: { color: DEEP, width: 0.5 },
    });
  }
}

function iconCertificate(slide, cx, cy, color) {
  // Shield shape (rounded rect + triangle bottom)
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.22, y: cy - 0.3, w: 0.44, h: 0.4,
    rectRadius: 0.06,
    fill: { color, transparency: 20 },
    line: { color, width: 1.5 },
  });
  // Checkmark (two rectangles)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.1, y: cy - 0.06, w: 0.18, h: 0.05,
    fill: { color }, line: { width: 0 },
    rotate: 40,
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx + 0.02, y: cy - 0.2, w: 0.28, h: 0.05,
    fill: { color }, line: { width: 0 },
    rotate: -40,
  });
  // Bottom triangle effect
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.15, y: cy + 0.1, w: 0.3, h: 0.18,
    fill: { color, transparency: 20 },
    line: { width: 0 },
    rotate: 0,
  });
}

function iconData(slide, cx, cy, color) {
  // Database: stacked ovals
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.24, y: cy - 0.3, w: 0.48, h: 0.18,
    fill: { color }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.24, y: cy - 0.22, w: 0.48, h: 0.4,
    fill: { color, transparency: 30 },
    line: { color, width: 1, transparency: 30 },
  });
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.24, y: cy + 0.1, w: 0.48, h: 0.18,
    fill: { color, transparency: 20 },
    line: { width: 0 },
  });
}

function iconNetwork(slide, cx, cy, color) {
  // 4 dots with connecting lines
  const dots = [
    [cx - 0.2, cy - 0.2], [cx + 0.2, cy - 0.15],
    [cx - 0.15, cy + 0.15], [cx + 0.18, cy + 0.2],
  ];
  // Lines between dots
  [[0,1],[0,2],[1,3],[2,3],[0,3]].forEach(([a,b]) => {
    const dx = dots[b][0] - dots[a][0];
    const dy = dots[b][1] - dots[a][1];
    const len = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: dots[a][0], y: dots[a][1],
      w: len, h: 0.025,
      fill: { color, transparency: 50 }, line: { width: 0 },
      rotate: angle,
    });
  });
  dots.forEach(([dx, dy]) => {
    slide.addShape(pptx.shapes.OVAL, {
      x: dx - 0.06, y: dy - 0.06, w: 0.12, h: 0.12,
      fill: { color }, line: { width: 0 },
    });
  });
}

function iconLightbulb(slide, cx, cy, color) {
  // Bulb top
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.2, y: cy - 0.35, w: 0.4, h: 0.4,
    fill: { color, transparency: 20 },
    line: { color, width: 1.5 },
  });
  // Base
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.1, y: cy + 0.02, w: 0.2, h: 0.2,
    rectRadius: 0.04,
    fill: { color, transparency: 40 },
    line: { width: 0 },
  });
  // Rays
  [-35, 0, 35].forEach(angle => {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: cx - 0.015, y: cy - 0.5, w: 0.03, h: 0.12,
      fill: { color, transparency: 30 }, line: { width: 0 },
      rotate: angle,
    });
  });
}

function iconPrism(slide, cx, cy, color) {
  // Triangle (prism)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.25, y: cy + 0.05, w: 0.5, h: 0.06,
    fill: { color }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.25, y: cy + 0.05, w: 0.35, h: 0.06,
    fill: { color }, line: { width: 0 },
    rotate: -55,
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.02, y: cy + 0.05, w: 0.35, h: 0.06,
    fill: { color }, line: { width: 0 },
    rotate: 55,
  });
  // Spectrum rays
  const rayColors = [SKY, ROSE, AMBER, MINT];
  rayColors.forEach((c, i) => {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: cx + 0.2, y: cy - 0.2 + i * 0.12, w: 0.3, h: 0.03,
      fill: { color: c }, line: { width: 0 },
      rotate: -10 + i * 8,
    });
  });
}

function iconHeart(slide, cx, cy, color) {
  // Heart from two circles + square
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.22, y: cy - 0.25, w: 0.26, h: 0.26,
    fill: { color }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.04, y: cy - 0.25, w: 0.26, h: 0.26,
    fill: { color }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.2, y: cy - 0.1, w: 0.4, h: 0.28,
    fill: { color }, line: { width: 0 },
    rotate: 45,
  });
}

function iconClock(slide, cx, cy, color) {
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.28, y: cy - 0.28, w: 0.56, h: 0.56,
    fill: { color: DEEP, transparency: 60 },
    line: { color, width: 1.5 },
  });
  // Hour hand
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.02, y: cy - 0.18, w: 0.04, h: 0.2,
    fill: { color }, line: { width: 0 },
  });
  // Minute hand
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.02, y: cy - 0.02, w: 0.04, h: 0.16,
    fill: { color }, line: { width: 0 },
    rotate: 90,
  });
  // Center dot
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.04, y: cy - 0.04, w: 0.08, h: 0.08,
    fill: { color }, line: { width: 0 },
  });
}

function iconLock(slide, cx, cy, color) {
  // Lock body
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.2, y: cy - 0.05, w: 0.4, h: 0.32,
    rectRadius: 0.06,
    fill: { color }, line: { width: 0 },
  });
  // Lock shackle (arc simulated with oval)
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.14, y: cy - 0.28, w: 0.28, h: 0.3,
    fill: { color: DEEP, transparency: 60 },
    line: { color, width: 2 },
  });
  // Cover bottom of shackle
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.14, y: cy - 0.05, w: 0.28, h: 0.12,
    fill: { color: DEEP, transparency: 60 },
    line: { width: 0 },
  });
  // Keyhole
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.05, y: cy + 0.04, w: 0.1, h: 0.1,
    fill: { color: DEEP }, line: { width: 0 },
  });
}

function iconUnlock(slide, cx, cy, color) {
  // Same as lock but shackle is open
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.2, y: cy - 0.05, w: 0.4, h: 0.32,
    rectRadius: 0.06,
    fill: { color }, line: { width: 0 },
  });
  // Open shackle
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.14, y: cy - 0.35, w: 0.28, h: 0.3,
    fill: { color: DEEP, transparency: 60 },
    line: { color, width: 2 },
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.14, y: cy - 0.1, w: 0.28, h: 0.15,
    fill: { color: DEEP, transparency: 60 },
    line: { width: 0 },
  });
  // Keyhole
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.05, y: cy + 0.04, w: 0.1, h: 0.1,
    fill: { color: DEEP }, line: { width: 0 },
  });
  // Break line (opening effect)
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx + 0.12, y: cy - 0.35, w: 0.06, h: 0.2,
    fill: { color: DEEP }, line: { width: 0 },
  });
}

function iconDocument(slide, cx, cy, color) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.18, y: cy - 0.3, w: 0.36, h: 0.55,
    rectRadius: 0.04,
    fill: { color: DEEP, transparency: 50 },
    line: { color, width: 1.5 },
  });
  // Lines
  [-0.12, -0.02, 0.08].forEach(dy => {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: cx - 0.1, y: cy + dy, w: 0.2, h: 0.03,
      fill: { color, transparency: 40 }, line: { width: 0 },
    });
  });
}

function iconStar(slide, cx, cy, color) {
  // 5-point star approximation with overlapping shapes
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.04, y: cy - 0.32, w: 0.08, h: 0.3,
    fill: { color }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.04, y: cy - 0.32, w: 0.08, h: 0.3,
    fill: { color }, line: { width: 0 },
    rotate: 72,
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.04, y: cy - 0.32, w: 0.08, h: 0.3,
    fill: { color }, line: { width: 0 },
    rotate: 144,
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.04, y: cy - 0.32, w: 0.08, h: 0.3,
    fill: { color }, line: { width: 0 },
    rotate: 216,
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.04, y: cy - 0.32, w: 0.08, h: 0.3,
    fill: { color }, line: { width: 0 },
    rotate: 288,
  });
}

function iconArrowUp(slide, cx, cy, color) {
  // Upward arrow
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.04, y: cy - 0.1, w: 0.08, h: 0.4,
    fill: { color }, line: { width: 0 },
  });
  // Arrowhead
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx - 0.18, y: cy - 0.15, w: 0.08, h: 0.25,
    fill: { color }, line: { width: 0 },
    rotate: 45,
  });
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: cx + 0.1, y: cy - 0.15, w: 0.08, h: 0.25,
    fill: { color }, line: { width: 0 },
    rotate: -45,
  });
}

function iconSpectrum(slide, cx, cy) {
  // 4 horizontal bars in spectrum colors
  const colors = [SKY, ROSE, AMBER, MINT];
  colors.forEach((c, i) => {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: cx - 0.25, y: cy - 0.25 + i * 0.15, w: 0.5, h: 0.1,
      rectRadius: 0.05,
      fill: { color: c }, line: { width: 0 },
    });
  });
}

function iconGlass(slide, cx, cy, color) {
  // Glass panel icon — layered rectangles
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.15, y: cy - 0.2, w: 0.35, h: 0.45,
    rectRadius: 0.06,
    fill: { color, transparency: 60 },
    line: { color, width: 1, transparency: 30 },
  });
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.05, y: cy - 0.28, w: 0.35, h: 0.45,
    rectRadius: 0.06,
    fill: { color, transparency: 30 },
    line: { color, width: 1, transparency: 20 },
  });
}

function iconHandshake(slide, cx, cy, color) {
  // Two hands meeting
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx - 0.32, y: cy - 0.06, w: 0.3, h: 0.12,
    rectRadius: 0.04,
    fill: { color, transparency: 20 }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: cx + 0.02, y: cy - 0.06, w: 0.3, h: 0.12,
    rectRadius: 0.04,
    fill: { color, transparency: 40 }, line: { width: 0 },
  });
  slide.addShape(pptx.shapes.OVAL, {
    x: cx - 0.08, y: cy - 0.08, w: 0.16, h: 0.16,
    fill: { color }, line: { width: 0 },
  });
}

// ═══════════════════════════════════════
// SLIDE 2: METHODOLOGY ICONS
// ═══════════════════════════════════════
const s2 = pptx.addSlide({ masterName: "PRISM" });
s2.addShape(pptx.shapes.OVAL, {
  x: -2, y: 3, w: 6, h: 6,
  fill: { color: ROSE, transparency: 90 }, line: { width: 0 },
});

s2.addText("METHODOLOGY & PROCESS", {
  x: 0.6, y: 0.35, w: 6, h: 0.35,
  fontFace: "Arial", fontSize: 9, bold: true, color: WHITE, transparency: 50, letterSpacing: 3,
});

const methodIcons = [
  { fn: iconDiagnose, label: "Diagnose", color: SKY },
  { fn: iconStrategy, label: "Strategise", color: ROSE },
  { fn: iconBuild, label: "Build", color: AMBER },
  { fn: iconMeasure, label: "Measure", color: MINT },
  { fn: iconScale, label: "Scale", color: SKY },
  { fn: iconPrism, label: "Prism / Refract", color: ROSE },
  { fn: iconLightbulb, label: "Insight", color: AMBER },
  { fn: iconClock, label: "Timeline", color: MINT },
];

methodIcons.forEach((icon, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const x = 0.8 + col * 3.1;
  const y = 1.2 + row * 3;

  glass(s2, x, y, 2.7, 2.6);

  // Icon
  icon.fn(s2, x + 1.35, y + 1.0, icon.color);

  // Label
  label(s2, x, y + 1.8, 2.7, icon.label);

  // Color dot
  s2.addShape(pptx.shapes.OVAL, {
    x: x + 1.25, y: y + 2.15, w: 0.2, h: 0.2,
    fill: { color: icon.color, transparency: 50 }, line: { width: 0 },
  });
});


// ═══════════════════════════════════════
// SLIDE 3: BUSINESS & VALUE ICONS
// ═══════════════════════════════════════
const s3 = pptx.addSlide({ masterName: "PRISM" });
s3.addShape(pptx.shapes.OVAL, {
  x: 8, y: -2, w: 7, h: 7,
  fill: { color: AMBER, transparency: 90 }, line: { width: 0 },
});

s3.addText("BUSINESS & VALUE", {
  x: 0.6, y: 0.35, w: 6, h: 0.35,
  fontFace: "Arial", fontSize: 9, bold: true, color: WHITE, transparency: 50, letterSpacing: 3,
});

const bizIcons = [
  { fn: iconRevenue, label: "Revenue", color: AMBER },
  { fn: iconGlobe, label: "Global", color: SKY },
  { fn: iconPeople, label: "Team / People", color: ROSE },
  { fn: iconCertificate, label: "Certified", color: MINT },
  { fn: iconData, label: "Data", color: SKY },
  { fn: iconNetwork, label: "Network", color: ROSE },
  { fn: iconDocument, label: "Report", color: AMBER },
  { fn: iconHandshake, label: "Partnership", color: MINT },
];

bizIcons.forEach((icon, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const x = 0.8 + col * 3.1;
  const y = 1.2 + row * 3;

  glass(s3, x, y, 2.7, 2.6);
  icon.fn(s3, x + 1.35, y + 1.0, icon.color);
  label(s3, x, y + 1.8, 2.7, icon.label);
  s3.addShape(pptx.shapes.OVAL, {
    x: x + 1.25, y: y + 2.15, w: 0.2, h: 0.2,
    fill: { color: icon.color, transparency: 50 }, line: { width: 0 },
  });
});


// ═══════════════════════════════════════
// SLIDE 4: BRAND & IDENTITY ICONS
// ═══════════════════════════════════════
const s4 = pptx.addSlide({ masterName: "PRISM" });
s4.addShape(pptx.shapes.OVAL, {
  x: 3, y: 2, w: 7, h: 7,
  fill: { color: MINT, transparency: 90 }, line: { width: 0 },
});

s4.addText("BRAND & IDENTITY", {
  x: 0.6, y: 0.35, w: 6, h: 0.35,
  fontFace: "Arial", fontSize: 9, bold: true, color: WHITE, transparency: 50, letterSpacing: 3,
});

const brandIcons = [
  { fn: iconHeart, label: "Inclusion", color: ROSE },
  { fn: iconStar, label: "Excellence", color: AMBER },
  { fn: iconArrowUp, label: "Growth", color: MINT },
  { fn: iconSpectrum, label: "Spectrum", color: SKY },
  { fn: iconGlass, label: "Transparency", color: SKY },
  { fn: iconLock, label: "Barrier", color: ROSE },
  { fn: iconUnlock, label: "Break Through", color: AMBER },
  { fn: iconLightbulb, label: "Innovation", color: MINT },
];

brandIcons.forEach((icon, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const x = 0.8 + col * 3.1;
  const y = 1.2 + row * 3;

  glass(s4, x, y, 2.7, 2.6);
  icon.fn(s4, x + 1.35, y + 1.0, icon.color);
  label(s4, x, y + 1.8, 2.7, icon.label);
  s4.addShape(pptx.shapes.OVAL, {
    x: x + 1.25, y: y + 2.15, w: 0.2, h: 0.2,
    fill: { color: icon.color, transparency: 50 }, line: { width: 0 },
  });
});


// ═══════════════════════════════════════
// SLIDE 5: USAGE GUIDE
// ═══════════════════════════════════════
const s5 = pptx.addSlide({ masterName: "PRISM" });
s5.addShape(pptx.shapes.OVAL, {
  x: 9, y: 1, w: 5, h: 5,
  fill: { color: SKY, transparency: 88 }, line: { width: 0 },
});

s5.addText("IBC", {
  x: 0.6, y: 0.35, w: 1, h: 0.4,
  fontFace: "Arial", fontSize: 14, bold: true, color: WHITE, letterSpacing: 3,
});

s5.addText("How to use these icons", {
  x: 0.8, y: 1.2, w: 8, h: 0.6,
  fontFace: "Arial", fontSize: 28, bold: true, color: WHITE,
});

const guidelines = [
  { title: "Always on glass", body: "Place icons on frosted glass panels against the deep violet background. Never on solid white or light backgrounds.", color: SKY },
  { title: "One spectrum colour per icon", body: "Each icon uses a single spectrum colour (Sky, Rose, Amber, or Mint). Never mix colours within one icon.", color: ROSE },
  { title: "Consistent sizing", body: "Icons should be rendered at consistent sizes within a composition. Use the glass card as the bounding frame.", color: AMBER },
  { title: "Editable shapes", body: "All icons are built from native PowerPoint shapes — fully editable, scalable, and colour-adjustable.", color: MINT },
];

guidelines.forEach((g, i) => {
  const x = 0.8 + (i % 2) * 6.2;
  const y = 2.2 + Math.floor(i / 2) * 2.4;

  glass(s5, x, y, 5.8, 2);

  s5.addShape(pptx.shapes.OVAL, {
    x: x + 0.3, y: y + 0.35, w: 0.12, h: 0.12,
    fill: { color: g.color }, line: { width: 0 },
  });

  s5.addText(g.title, {
    x: x + 0.55, y: y + 0.25, w: 4.8, h: 0.35,
    fontFace: "Arial", fontSize: 14, bold: true, color: WHITE,
  });
  s5.addText(g.body, {
    x: x + 0.55, y: y + 0.7, w: 4.8, h: 1,
    fontFace: "Arial", fontSize: 11, color: WHITE, transparency: 35, lineSpacing: 18,
  });
});

spectrumLine(s5, 0.8, 6.8, 4);


// ═══════════════════════════════════════
// GENERATE
// ═══════════════════════════════════════
const outPath = "/Users/jvanwaveren/IFC/archive/IBC_Prism_IconLibrary.pptx";
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log("Created: " + outPath);
}).catch(err => {
  console.error("Error:", err);
});
