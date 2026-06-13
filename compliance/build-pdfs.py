#!/usr/bin/env python3
"""Render the compliance markdown pack to clean, professional PDFs.

One PDF per document + a combined pack. Unlockt header, page numbers, and a
"Draft — for review, not legal advice" footer on every page.
"""
import os, re, html, glob
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable, ListFlowable, ListItem, XPreformatted, PageBreak)
from reportlab.lib.styles import ParagraphStyle

SRC = os.path.expanduser("~/IFC/compliance")
OUT = os.path.join(SRC, "pdf")
os.makedirs(OUT, exist_ok=True)

# ---- Prism brand palette
INK   = colors.HexColor("#0D3B2E")
SKY   = colors.HexColor("#2E8E99")   # darkened teal for ink-on-white legibility
ROSE  = colors.HexColor("#C97B4A")
MINT  = colors.HexColor("#9FD4B0")
LIGHT = colors.HexColor("#EAF6F1")
GREY  = colors.HexColor("#5b6b64")
RULE  = colors.HexColor("#cdddd4")
QUOTEBG = colors.HexColor("#f3f7f5")
CODEBG  = colors.HexColor("#eef1ef")

# ---- fonts (Arial Unicode = full glyph coverage so ✓ ⚠ → € ™ render)
pdfmetrics.registerFont(TTFont("U",  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"))
pdfmetrics.registerFont(TTFont("UB", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))
pdfmetrics.registerFontFamily("U", normal="U", bold="UB", italic="U", boldItalic="UB")
MENLO = "/System/Library/Fonts/Menlo.ttc"
if os.path.exists(MENLO):
    pdfmetrics.registerFont(TTFont("Mono", MENLO, subfontIndex=0))
    MONO = "Mono"
else:
    MONO = "U"  # fallback: still has box-drawing glyphs, just not monospaced

def style(name, **kw):
    base = dict(fontName="U", fontSize=10, leading=15, textColor=INK)
    base.update(kw); return ParagraphStyle(name, **base)

BODY  = style("body", spaceAfter=7)
H1    = style("h1", fontName="UB", fontSize=19, leading=23, spaceBefore=2, spaceAfter=4)
H2    = style("h2", fontName="UB", fontSize=14, leading=18, spaceBefore=16, spaceAfter=6)
H3    = style("h3", fontName="UB", fontSize=11.5, leading=15, spaceBefore=12, spaceAfter=4)
H4    = style("h4", fontName="UB", fontSize=10.5, leading=14, textColor=SKY, spaceBefore=8, spaceAfter=3)
LI    = style("li", spaceAfter=3, leading=14)
CELL  = style("cell", fontSize=8.7, leading=11.5, spaceAfter=0)
CELLH = style("cellh", fontName="UB", fontSize=8.7, leading=11.5, textColor=colors.white)
CODE  = ParagraphStyle("code", fontName=MONO, fontSize=8, leading=10.5, textColor=INK)

CONTENT_W = A4[0] - 4*cm

def inline(md):
    """markdown inline -> reportlab mini-markup."""
    toks = []
    md = re.sub(r"`([^`]+)`", lambda m: toks.append(m.group(1)) or f"\x00{len(toks)-1}\x00", md)
    s = html.escape(md)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<i>\1</i>", s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2"><font color="#2E8E99">\1</font></a>', s)
    s = re.sub(r"\x00(\d+)\x00",
               lambda m: f'<font face="{MONO}" size="8.5" backColor="#eef1ef"> '
                         + html.escape(toks[int(m.group(1))]) + ' </font>', s)
    return s

def split_row(line):
    line = line.strip()
    if line.startswith("|"): line = line[1:]
    if line.endswith("|"): line = line[:-1]
    return [c.strip() for c in line.split("|")]

def col_widths(n):
    presets = {1:[1.0], 2:[.30,.70], 3:[.24,.38,.38], 4:[.22,.26,.26,.26]}
    w = presets.get(n, [1.0/n]*n)
    return [x*CONTENT_W for x in w]

def make_table(rows):
    head, body = rows[0], rows[1:]
    data = [[Paragraph(inline(c), CELLH) for c in head]]
    for r in body:
        # pad/truncate to header width
        r = (r + [""]*len(head))[:len(head)]
        data.append([Paragraph(inline(c), CELL) for c in r])
    t = Table(data, colWidths=col_widths(len(head)), repeatRows=1)
    ts = [("BACKGROUND",(0,0),(-1,0),INK),
          ("VALIGN",(0,0),(-1,-1),"TOP"),
          ("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),
          ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
          ("LINEBELOW",(0,0),(-1,-1),0.4,RULE),
          ("LINEAFTER",(0,0),(-2,-1),0.4,RULE)]
    for i in range(1,len(data)):
        if i % 2 == 0: ts.append(("BACKGROUND",(0,i),(-1,i),LIGHT))
    t.setStyle(TableStyle(ts))
    return t

def parse(lines):
    """markdown lines -> list of flowables."""
    out, i, n = [], 0, len(lines)
    while i < n:
        ln = lines[i]
        s = ln.strip()
        # fenced code
        if s.startswith("```"):
            i += 1; buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i]); i += 1
            i += 1
            code = "\n".join(buf)
            box = Table([[XPreformatted(html.escape(code), CODE)]], colWidths=[CONTENT_W])
            box.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),CODEBG),
                ("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),
                ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)]))
            out += [box, Spacer(1,8)]; continue
        # blockquote (may contain nested markdown)
        if s.startswith(">"):
            buf = []
            while i < n and lines[i].strip().startswith(">"):
                buf.append(re.sub(r"^\s*>\s?","",lines[i])); i += 1
            inner = parse(buf)
            box = Table([[inner]], colWidths=[CONTENT_W])
            box.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),QUOTEBG),
                ("LINEBEFORE",(0,0),(0,-1),3,SKY),
                ("LEFTPADDING",(0,0),(-1,-1),14),("RIGHTPADDING",(0,0),(-1,-1),12),
                ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),4)]))
            out += [box, Spacer(1,8)]; continue
        # table
        if "|" in s and i+1 < n and re.match(r"^\s*\|?[\s:\-|]+\|?\s*$", lines[i+1]) and "-" in lines[i+1]:
            rows = [split_row(lines[i])]; i += 2
            while i < n and lines[i].strip().startswith("|"):
                rows.append(split_row(lines[i])); i += 1
            out += [make_table(rows), Spacer(1,10)]; continue
        # horizontal rule
        if re.match(r"^\s*---+\s*$", ln):
            out.append(HRFlowable(width="100%", thickness=0.6, color=RULE,
                                  spaceBefore=6, spaceAfter=10)); i += 1; continue
        # headings
        m = re.match(r"^(#{1,4})\s+(.*)$", s)
        if m:
            lvl = len(m.group(1)); txt = inline(m.group(2))
            out.append(Paragraph(txt, [H1,H2,H3,H4][lvl-1]))
            if lvl == 1:
                out.append(HRFlowable(width="100%", thickness=1.2, color=SKY, spaceAfter=10))
            i += 1; continue
        # unordered list
        if re.match(r"^\s*[-*]\s+", ln):
            items = []
            while i < n and re.match(r"^\s*[-*]\s+", lines[i]):
                items.append(ListItem(Paragraph(inline(re.sub(r"^\s*[-*]\s+","",lines[i])), LI),
                                      leftIndent=14, value="bullet")); i += 1
            out += [ListFlowable(items, bulletType="bullet", start="•",
                                 bulletColor=SKY, leftIndent=12), Spacer(1,5)]; continue
        # ordered list
        if re.match(r"^\s*\d+\.\s+", ln):
            items = []
            while i < n and re.match(r"^\s*\d+\.\s+", lines[i]):
                items.append(ListItem(Paragraph(inline(re.sub(r"^\s*\d+\.\s+","",lines[i])), LI),
                                      leftIndent=14)); i += 1
            out += [ListFlowable(items, bulletType="1", leftIndent=12), Spacer(1,5)]; continue
        # blank
        if not s:
            i += 1; continue
        # paragraph (gather until blank/structural)
        para = [s]; i += 1
        while i < n:
            nx = lines[i].strip()
            if (not nx or nx.startswith(("#",">","```","- ","* ","|","---"))
                    or re.match(r"^\d+\.\s",nx)): break
            para.append(nx); i += 1
        out.append(Paragraph(inline(" ".join(para)), BODY))
    return out

def doc_title(path, fls):
    with open(path) as f:
        for line in f:
            m = re.match(r"^#\s+(.*)", line.strip())
            if m: return re.sub(r"[*`]","",m.group(1))
    return os.path.basename(path)

def decorate(title):
    def paint(canvas, doc):
        canvas.saveState()
        W, H = A4
        # header
        canvas.setFont("UB", 9); canvas.setFillColor(INK)
        canvas.drawString(2*cm, H-1.45*cm, "UNLOCKT")
        canvas.setFont("U", 8); canvas.setFillColor(GREY)
        canvas.drawString(3.7*cm, H-1.45*cm, "· Gender Capital Lab™ Sprint")
        canvas.setFont("U", 8); canvas.setFillColor(GREY)
        canvas.drawRightString(W-2*cm, H-1.45*cm, title[:60])
        canvas.setStrokeColor(SKY); canvas.setLineWidth(1)
        canvas.line(2*cm, H-1.62*cm, W-2*cm, H-1.62*cm)
        # footer
        canvas.setStrokeColor(RULE); canvas.setLineWidth(0.5)
        canvas.line(2*cm, 1.35*cm, W-2*cm, 1.35*cm)
        canvas.setFont("U", 7.5); canvas.setFillColor(GREY)
        canvas.drawString(2*cm, 1.0*cm, "Draft — for review, not legal advice")
        canvas.drawRightString(W-2*cm, 1.0*cm, f"Page {canvas.getPageNumber()}")
        canvas.restoreState()
    return paint

def build(path, outpath):
    with open(path) as f:
        lines = f.read().split("\n")
    fls = parse(lines)
    title = doc_title(path, fls)
    d = SimpleDocTemplate(outpath, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm,
                          topMargin=2.3*cm, bottomMargin=1.8*cm,
                          title=title, author="Unlockt")
    d.build(fls, onFirstPage=decorate(title), onLaterPages=decorate(title))
    return title

# order: README first, then 01..09
files = [os.path.join(SRC,"README.md")] + sorted(glob.glob(os.path.join(SRC,"0*.md")))
made = []
for p in files:
    base = os.path.splitext(os.path.basename(p))[0]
    name = "00_README" if base=="README" else base
    out = os.path.join(OUT, name+".pdf")
    t = build(p, out)
    made.append((name, t))
    print(f"  {name}.pdf  ·  {t}")
print(f"\n{len(made)} PDFs -> {OUT}")
