const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// react-icons imports — solid fill style
const { FaUsers, FaHandshake, FaChartLine, FaClipboardList, FaSitemap,
  FaChartBar, FaTrophy, FaBullseye, FaLightbulb, FaGlobeEurope,
  FaCertificate, FaFileAlt, FaChalkboardTeacher, FaMoneyBillWave,
  FaClock, FaProjectDiagram, FaDatabase, FaBriefcase, FaBullhorn,
  FaRocket, FaCheckCircle, FaShieldAlt, FaUserTie, FaPeopleCarry,
  FaSearchDollar, FaBalanceScale, FaUnlock, FaKey, FaCompass,
  FaStar, FaHeart, FaArrowUp, FaLayerGroup, FaPuzzlePiece,
  FaGem, FaEye } = require("react-icons/fa");

// Brand
const DEEP = "EAF6F1";
const SKY = "6DC0C8";
const ROSE = "F5B896";
const AMBER = "F2D080";
const MINT = "9FD4B0";
const WHITE = "0D3B2E";
const GLASS = "FFFFFF";
const GLASS_BORDER = "C5E8DC";

// Icon rendering
function renderIconSvg(IconComponent, color, size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, "#" + color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// Unified pastel flare background — all 4 colours blurred into one panel
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
  const buf = await sharp(Buffer.from(svg)).blur(200).png().toBuffer();
  return "data:image/png;base64," + buf.toString("base64");
}

async function main() {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = "IFC";
  pptx.title = "IFC Prism Icon Library";

  const bgMain = await makeFlareBgData();
  pptx.defineSlideMaster({
    title: "PRISM",
    background: { data: bgMain },
  });

  // Frameless glass panel — no line, soft shadow, see-through so bg shows
  function addGlass(slide, x, y, w, h, opts = {}) {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h,
      rectRadius: 0.2,
      fill: { color: GLASS, transparency: 62 },
      shadow: { type: "outer", color: "2A5046", blur: 30, offset: 6, angle: 90, opacity: 0.12 },
      ...opts,
    });
  }

  // Helper: spectrum line (2-stop sky→sage)
  function addSpectrum(slide, x, y, w) {
    [SKY, MINT].forEach((c, i) => {
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: x + i * (w / 2), y, w: w / 2, h: 0.04,
        fill: { color: c }, line: { width: 0 },
      });
    });
  }

  // ═══════════════════════════════════════
  // SLIDE 1: TITLE
  // ═══════════════════════════════════════
  const s1 = pptx.addSlide({ masterName: "PRISM" });

  s1.addText("IFC", {
    x: 0.6, y: 0.35, w: 1.5, h: 0.4,
    fontFace: "Sora", fontSize: 14, bold: true, color: WHITE, charSpacing: 3, margin: 0,
  });

  s1.addText("Prism Icon Library", {
    x: 0.8, y: 2.0, w: 8, h: 1.2,
    fontFace: "Sora", fontSize: 40, bold: true, color: WHITE, margin: 0,
  });

  s1.addText("24 solid-fill business icons in the Prism brand style.\nFully editable, scalable, and ready for presentations, documents, and digital assets.", {
    x: 0.8, y: 3.3, w: 7, h: 0.9,
    fontFace: "Inter", fontSize: 14, color: WHITE, transparency: 35, lineSpacing: 22, margin: 0,
  });

  addSpectrum(s1, 0.8, 4.6, 5);

  // Render 4 preview icons for title slide
  const previewIcons = [
    [FaUsers, SKY], [FaChartLine, ROSE], [FaGlobeEurope, AMBER], [FaShieldAlt, MINT],
  ];
  for (let i = 0; i < previewIcons.length; i++) {
    const data = await iconToBase64Png(previewIcons[i][0], previewIcons[i][1]);
    s1.addImage({ data, x: 0.8 + i * 1.6, y: 5.3, w: 0.7, h: 0.7 });
  }

  // ═══════════════════════════════════════
  // ICON PAGES
  // ═══════════════════════════════════════

  const iconSets = [
    {
      title: "METHODOLOGY & PROCESS",
      icons: [
        { comp: FaSearchDollar, label: "Diagnose", color: SKY },
        { comp: FaBullseye, label: "Strategise", color: ROSE },
        { comp: FaPuzzlePiece, label: "Build & Test", color: AMBER },
        { comp: FaChartBar, label: "Measure", color: MINT },
        { comp: FaArrowUp, label: "Scale", color: SKY },
        { comp: FaLightbulb, label: "Insight", color: ROSE },
        { comp: FaClock, label: "Timeline", color: AMBER },
        { comp: FaClipboardList, label: "Planning", color: MINT },
      ],
      glow: { color: ROSE, x: -2, y: 3 },
    },
    {
      title: "BUSINESS & VALUE",
      icons: [
        { comp: FaMoneyBillWave, label: "Revenue", color: AMBER },
        { comp: FaGlobeEurope, label: "Global", color: SKY },
        { comp: FaUsers, label: "Team", color: ROSE },
        { comp: FaCertificate, label: "Certified", color: MINT },
        { comp: FaDatabase, label: "Data", color: SKY },
        { comp: FaProjectDiagram, label: "Network", color: ROSE },
        { comp: FaFileAlt, label: "Report", color: AMBER },
        { comp: FaHandshake, label: "Partnership", color: MINT },
      ],
      glow: { color: AMBER, x: 9, y: -2 },
    },
    {
      title: "BRAND & IDENTITY",
      icons: [
        { comp: FaHeart, label: "Inclusion", color: ROSE },
        { comp: FaTrophy, label: "Success", color: AMBER },
        { comp: FaRocket, label: "Startup", color: MINT },
        { comp: FaEye, label: "Transparency", color: SKY },
        { comp: FaShieldAlt, label: "Trust", color: SKY },
        { comp: FaUnlock, label: "Break Through", color: ROSE },
        { comp: FaGem, label: "Premium", color: AMBER },
        { comp: FaStar, label: "Excellence", color: MINT },
      ],
      glow: { color: MINT, x: 4, y: 3 },
    },
  ];

  for (const set of iconSets) {
    const slide = pptx.addSlide({ masterName: "PRISM" });

    // Category label
    slide.addText(set.title, {
      x: 0.6, y: 0.35, w: 8, h: 0.35,
      fontFace: "Sora", fontSize: 9, bold: true, color: WHITE, transparency: 50, charSpacing: 3, margin: 0,
    });

    // 8 icons in 4x2 grid
    for (let i = 0; i < set.icons.length; i++) {
      const icon = set.icons[i];
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 0.6 + col * 3.15;
      const y = 1.0 + row * 3.15;
      const cardW = 2.85;
      const cardH = 2.85;

      addGlass(slide, x, y, cardW, cardH);

      // Render icon
      const iconData = await iconToBase64Png(icon.comp, icon.color, 256);
      slide.addImage({
        data: iconData,
        x: x + (cardW - 1) / 2,
        y: y + 0.45,
        w: 1,
        h: 1,
      });

      // Label
      slide.addText(icon.label, {
        x, y: y + 1.7, w: cardW, h: 0.35,
        fontFace: "Inter", fontSize: 12, color: WHITE, align: "center", margin: 0,
      });

      // Color name
      slide.addText("#" + icon.color, {
        x, y: y + 2.05, w: cardW, h: 0.3,
        fontFace: "Inter", fontSize: 9, color: WHITE, transparency: 55, align: "center", margin: 0,
      });

    }
  }

  // ═══════════════════════════════════════
  // SLIDE 5: ALL ICONS AT A GLANCE
  // ═══════════════════════════════════════
  const s5 = pptx.addSlide({ masterName: "PRISM" });

  s5.addText("All Icons — Quick Reference", {
    x: 0.6, y: 0.25, w: 8, h: 0.45,
    fontFace: "Sora", fontSize: 18, bold: true, color: WHITE, margin: 0,
  });

  // All 24 icons in 8x3 compact grid
  const allIcons = [
    ...iconSets[0].icons,
    ...iconSets[1].icons,
    ...iconSets[2].icons,
  ];

  for (let i = 0; i < allIcons.length; i++) {
    const icon = allIcons[i];
    const col = i % 8;
    const row = Math.floor(i / 8);
    const x = 0.4 + col * 1.6;
    const y = 0.95 + row * 2.1;

    // Small glass card
    addGlass(s5, x, y, 1.35, 1.8);

    const iconData = await iconToBase64Png(icon.comp, icon.color, 256);
    slide = s5;
    s5.addImage({
      data: iconData,
      x: x + (1.35 - 0.6) / 2,
      y: y + 0.2,
      w: 0.6,
      h: 0.6,
    });

    s5.addText(icon.label, {
      x, y: y + 0.95, w: 1.35, h: 0.35,
      fontFace: "Inter", fontSize: 8, color: WHITE, align: "center", margin: 0,
    });

  }

  // ═══════════════════════════════════════
  // SLIDE 6: USAGE GUIDE
  // ═══════════════════════════════════════
  const s6 = pptx.addSlide({ masterName: "PRISM" });

  s6.addText("IFC", {
    x: 0.6, y: 0.35, w: 1.5, h: 0.4,
    fontFace: "Sora", fontSize: 14, bold: true, color: WHITE, charSpacing: 3, margin: 0,
  });

  s6.addText("How to use these icons", {
    x: 0.8, y: 1.2, w: 8, h: 0.6,
    fontFace: "Sora", fontSize: 28, bold: true, color: WHITE, margin: 0,
  });

  const guidelines = [
    { title: "Always on dark backgrounds", body: "These icons are designed for the deep violet #1A0A2E background. On light backgrounds, use inverted (dark) versions.", color: SKY },
    { title: "One spectrum colour per icon", body: "Each icon uses one of four spectrum colours: Sky, Rose, Amber, or Mint. Never combine multiple colours in one icon.", color: ROSE },
    { title: "Glass panel framing", body: "For presentation use, place icons on frosted glass cards. For inline use in documents, icons work without frames.", color: AMBER },
    { title: "Consistent sizing", body: "In presentations: 0.5\" inline, 1\" featured. Scale proportionally. All icons are 256px PNG — sharp at any slide size.", color: MINT },
  ];

  for (let i = 0; i < guidelines.length; i++) {
    const g = guidelines[i];
    const x = 0.8 + (i % 2) * 6.2;
    const y = 2.1 + Math.floor(i / 2) * 2.5;

    addGlass(s6, x, y, 5.8, 2.1);

    s6.addText(g.title, {
      x: x + 0.3, y: y + 0.25, w: 5.2, h: 0.35,
      fontFace: "Sora", fontSize: 14, bold: true, color: WHITE, margin: 0,
    });

    s6.addText(g.body, {
      x: x + 0.3, y: y + 0.7, w: 5.2, h: 1.1,
      fontFace: "Inter", fontSize: 11, color: WHITE, transparency: 30, lineSpacing: 18, margin: 0,
    });
  }

  addSpectrum(s6, 0.8, 7.0, 4);

  // ═══════════════════════════════════════
  // GENERATE
  // ═══════════════════════════════════════
  const outPath = "/Users/jvanwaveren/IFC/IFC_Prism_IconLibrary.pptx";
  await pptx.writeFile({ fileName: outPath });
  console.log("Created: " + outPath);
}

main().catch(err => console.error("Error:", err));
