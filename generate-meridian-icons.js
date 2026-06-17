const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

const { FaUsers, FaHandshake, FaChartLine, FaClipboardList,
  FaChartBar, FaTrophy, FaBullseye, FaLightbulb, FaGlobeEurope,
  FaCertificate, FaFileAlt, FaMoneyBillWave,
  FaClock, FaProjectDiagram, FaDatabase,
  FaRocket, FaShieldAlt, FaSearchDollar, FaUnlock,
  FaStar, FaHeart, FaArrowUp, FaPuzzlePiece,
  FaGem, FaEye } = require("react-icons/fa");

// Meridian brand
const BG = "1A3326";          // deep green
const DEEP = "2F4A3A";        // raised green
const ORANGE = "E8833A";      // warm orange (was gold)
const PARCHMENT = "F6F1E7";   // cream
const TERRACOTTA = "C4623A";  // earthy red
const MUTED = "8A9A8E";       // dusty green for secondary text
const BORDER = "3E5A48";

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

async function main() {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = "IBC";
  pptx.title = "IBC Meridian Icon Library";

  pptx.defineSlideMaster({ title: "MERIDIAN", background: { color: BG } });

  // Editorial card (flat, subtle border — no glass)
  function addCard(slide, x, y, w, h) {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x, y, w, h,
      fill: { color: DEEP, transparency: 25 },
      line: { color: BORDER, width: 0.75 },
    });
  }

  // Thin orange rule
  function addRule(slide, x, y, w, color = ORANGE) {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x, y, w, h: 0.03,
      fill: { color }, line: { width: 0 },
    });
  }

  // ═══════════════════════════════════════
  // SLIDE 1: TITLE
  // ═══════════════════════════════════════
  const s1 = pptx.addSlide({ masterName: "MERIDIAN" });

  s1.addText("IBC", {
    x: 0.6, y: 0.35, w: 1.5, h: 0.4,
    fontFace: "Lato", fontSize: 14, bold: true, color: PARCHMENT, charSpacing: 3, margin: 0,
  });

  s1.addText([
    { text: "Meridian ", options: { italic: true, color: PARCHMENT } },
    { text: "Icon Library", options: { color: ORANGE } },
  ], {
    x: 0.8, y: 2.0, w: 11, h: 1.4,
    fontFace: "Playfair Display", fontSize: 44, bold: true, margin: 0,
  });

  s1.addText("Twenty-four solid-fill business icons in the Meridian brand style.\nEditorial, earthy, and ready for presentations, documents, and digital assets.", {
    x: 0.8, y: 3.5, w: 9, h: 0.9,
    fontFace: "Lato", fontSize: 14, color: PARCHMENT, transparency: 30, lineSpacing: 22, margin: 0,
  });

  addRule(s1, 0.8, 4.8, 4);

  const previewIcons = [
    [FaUsers, ORANGE], [FaChartLine, TERRACOTTA], [FaGlobeEurope, PARCHMENT], [FaShieldAlt, ORANGE],
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
        { comp: FaSearchDollar, label: "Diagnose", color: ORANGE },
        { comp: FaBullseye, label: "Strategise", color: TERRACOTTA },
        { comp: FaPuzzlePiece, label: "Build & Test", color: PARCHMENT },
        { comp: FaChartBar, label: "Measure", color: ORANGE },
        { comp: FaArrowUp, label: "Scale", color: TERRACOTTA },
        { comp: FaLightbulb, label: "Insight", color: PARCHMENT },
        { comp: FaClock, label: "Timeline", color: ORANGE },
        { comp: FaClipboardList, label: "Planning", color: TERRACOTTA },
      ],
    },
    {
      title: "BUSINESS & VALUE",
      icons: [
        { comp: FaMoneyBillWave, label: "Revenue", color: ORANGE },
        { comp: FaGlobeEurope, label: "Global", color: PARCHMENT },
        { comp: FaUsers, label: "Team", color: TERRACOTTA },
        { comp: FaCertificate, label: "Certified", color: ORANGE },
        { comp: FaDatabase, label: "Data", color: PARCHMENT },
        { comp: FaProjectDiagram, label: "Network", color: TERRACOTTA },
        { comp: FaFileAlt, label: "Report", color: ORANGE },
        { comp: FaHandshake, label: "Partnership", color: PARCHMENT },
      ],
    },
    {
      title: "BRAND & IDENTITY",
      icons: [
        { comp: FaHeart, label: "Inclusion", color: TERRACOTTA },
        { comp: FaTrophy, label: "Success", color: ORANGE },
        { comp: FaRocket, label: "Startup", color: PARCHMENT },
        { comp: FaEye, label: "Transparency", color: ORANGE },
        { comp: FaShieldAlt, label: "Trust", color: TERRACOTTA },
        { comp: FaUnlock, label: "Break Through", color: ORANGE },
        { comp: FaGem, label: "Premium", color: PARCHMENT },
        { comp: FaStar, label: "Excellence", color: TERRACOTTA },
      ],
    },
  ];

  for (const set of iconSets) {
    const slide = pptx.addSlide({ masterName: "MERIDIAN" });

    slide.addText(set.title, {
      x: 0.6, y: 0.35, w: 8, h: 0.35,
      fontFace: "Lato", fontSize: 9, bold: true, color: ORANGE, charSpacing: 3, margin: 0,
    });

    addRule(slide, 0.6, 0.8, 2);

    for (let i = 0; i < set.icons.length; i++) {
      const icon = set.icons[i];
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 0.6 + col * 3.15;
      const y = 1.0 + row * 3.15;
      const cardW = 2.85;
      const cardH = 2.85;

      addCard(slide, x, y, cardW, cardH);

      const iconData = await iconToBase64Png(icon.comp, icon.color, 256);
      slide.addImage({
        data: iconData,
        x: x + (cardW - 1) / 2,
        y: y + 0.45,
        w: 1, h: 1,
      });

      slide.addText(icon.label, {
        x, y: y + 1.7, w: cardW, h: 0.4,
        fontFace: "Playfair Display", italic: true, fontSize: 14, color: PARCHMENT, align: "center", margin: 0,
      });

      slide.addText("#" + icon.color, {
        x, y: y + 2.1, w: cardW, h: 0.3,
        fontFace: "Lato", fontSize: 9, color: MUTED, align: "center", margin: 0,
      });

      // Small accent dot
      slide.addShape(pptx.shapes.OVAL, {
        x: x + (cardW - 0.18) / 2, y: y + 2.45, w: 0.18, h: 0.18,
        fill: { color: icon.color }, line: { width: 0 },
      });
    }
  }

  // ═══════════════════════════════════════
  // SLIDE 5: ALL ICONS AT A GLANCE
  // ═══════════════════════════════════════
  const s5 = pptx.addSlide({ masterName: "MERIDIAN" });

  s5.addText([
    { text: "All Icons ", options: { color: PARCHMENT } },
    { text: "— Quick Reference", options: { italic: true, color: ORANGE } },
  ], {
    x: 0.6, y: 0.25, w: 10, h: 0.55,
    fontFace: "Playfair Display", fontSize: 20, bold: true, margin: 0,
  });

  addRule(s5, 0.6, 0.85, 2);

  const allIcons = [...iconSets[0].icons, ...iconSets[1].icons, ...iconSets[2].icons];

  for (let i = 0; i < allIcons.length; i++) {
    const icon = allIcons[i];
    const col = i % 8;
    const row = Math.floor(i / 8);
    const x = 0.4 + col * 1.6;
    const y = 1.1 + row * 2.0;

    addCard(s5, x, y, 1.35, 1.75);

    const iconData = await iconToBase64Png(icon.comp, icon.color, 256);
    s5.addImage({
      data: iconData,
      x: x + (1.35 - 0.6) / 2,
      y: y + 0.2,
      w: 0.6, h: 0.6,
    });

    s5.addText(icon.label, {
      x, y: y + 0.95, w: 1.35, h: 0.35,
      fontFace: "Lato", fontSize: 8, color: PARCHMENT, align: "center", margin: 0,
    });

    s5.addShape(pptx.shapes.OVAL, {
      x: x + (1.35 - 0.12) / 2, y: y + 1.4, w: 0.12, h: 0.12,
      fill: { color: icon.color }, line: { width: 0 },
    });
  }

  // ═══════════════════════════════════════
  // SLIDE 6: USAGE
  // ═══════════════════════════════════════
  const s6 = pptx.addSlide({ masterName: "MERIDIAN" });

  s6.addText("IBC", {
    x: 0.6, y: 0.35, w: 1.5, h: 0.4,
    fontFace: "Lato", fontSize: 14, bold: true, color: PARCHMENT, charSpacing: 3, margin: 0,
  });

  s6.addText([
    { text: "How to use ", options: { color: PARCHMENT } },
    { text: "these icons", options: { italic: true, color: ORANGE } },
  ], {
    x: 0.8, y: 1.2, w: 10, h: 0.7,
    fontFace: "Playfair Display", fontSize: 30, bold: true, margin: 0,
  });

  addRule(s6, 0.8, 2.0, 3);

  const guidelines = [
    { title: "Always on earth tones", body: "These icons are designed for the deep green #1A3326 background. On light backgrounds, use inverted (dark) versions." },
    { title: "Meridian palette only", body: "Each icon uses warm orange, terracotta, or parchment. Never combine multiple colours in one icon." },
    { title: "Editorial framing", body: "For presentations, place icons on muted deep-green cards. For inline use in documents, icons work without frames." },
    { title: "Consistent sizing", body: "In presentations: 0.5\" inline, 1\" featured. All icons are 256px PNG — sharp at any slide size." },
  ];

  for (let i = 0; i < guidelines.length; i++) {
    const g = guidelines[i];
    const x = 0.8 + (i % 2) * 6.2;
    const y = 2.4 + Math.floor(i / 2) * 2.5;

    addCard(s6, x, y, 5.8, 2.1);

    // Left accent rule
    s6.addShape(pptx.shapes.RECTANGLE, {
      x: x, y: y + 0.25, w: 0.06, h: 1.6,
      fill: { color: ORANGE }, line: { width: 0 },
    });

    s6.addText(g.title, {
      x: x + 0.35, y: y + 0.25, w: 5.2, h: 0.45,
      fontFace: "Playfair Display", italic: true, fontSize: 16, bold: true, color: PARCHMENT, margin: 0,
    });

    s6.addText(g.body, {
      x: x + 0.35, y: y + 0.8, w: 5.2, h: 1.2,
      fontFace: "Lato", fontSize: 11, color: PARCHMENT, transparency: 30, lineSpacing: 18, margin: 0,
    });
  }

  addRule(s6, 0.8, 7.1, 4);

  // ═══════════════════════════════════════
  const outPath = "/Users/jvanwaveren/IFC/IFC_Meridian_IconLibrary.pptx";
  await pptx.writeFile({ fileName: outPath });
  console.log("Created: " + outPath);
}

main().catch(err => console.error("Error:", err));
