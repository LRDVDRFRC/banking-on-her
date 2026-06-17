#!/usr/bin/env python3
"""Build the step-by-step demo guide PDF (Dutch) with screenshots."""
import os, html
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, Image, PageBreak, KeepTogether)
from reportlab.lib.styles import ParagraphStyle

HERE = os.path.expanduser("~/IFC/demo")
SHOTS = os.path.join(HERE, "shots")
OUT = os.path.join(HERE, "Unlockt-Demo-Handleiding.pdf")

INK  = colors.HexColor("#0D3B2E")
SKY  = colors.HexColor("#2E8E99")
GREY = colors.HexColor("#5b6b64")
RULE = colors.HexColor("#cdddd4")
LIGHT= colors.HexColor("#EAF6F1")
SKYC = colors.HexColor("#6DC0C8"); ROSE=colors.HexColor("#F5B896")
AMBER= colors.HexColor("#F2D080"); MINT=colors.HexColor("#9FD4B0")

pdfmetrics.registerFont(TTFont("U",  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"))
pdfmetrics.registerFont(TTFont("UB", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))
pdfmetrics.registerFontFamily("U", normal="U", bold="UB", italic="U", boldItalic="UB")

def S(name, **kw):
    b = dict(fontName="U", fontSize=10.5, leading=15.5, textColor=INK); b.update(kw)
    return ParagraphStyle(name, **b)

KICK  = S("kick", fontName="UB", fontSize=8, leading=11, textColor=SKY, spaceAfter=3)
TITLE = S("title", fontName="UB", fontSize=16, leading=20, spaceAfter=7)
BODY  = S("body", spaceAfter=6)
COVERT= S("covert", fontName="UB", fontSize=27, leading=31, textColor=INK)
COVERS= S("covers", fontSize=13, leading=18, textColor=GREY)
LOGIN = S("login", fontSize=11, leading=17, textColor=INK)

CW = A4[0] - 4*cm

STEPS = [
    ("Stap 1", "", "Inloggen & het sprintoverzicht", "01_home.png",
     "Ga naar <b>ifc-sprint-platform.vercel.app</b> en log in: gebruikersnaam "
     "<b>unlockt</b>, wachtwoord <b>3istheMagicnumber!</b>. Je ziet het overzicht "
     "van alle sprints. Klik bij <b>BeFrank (demo)</b> op <b>Dashboard</b>."),
    ("Stap 2", "", "Het dashboard — de cockpit", "02_dashboard.png",
     "Per klant zie je hier de readiness-ringen van het team, wáár het team het "
     "onderling oneens is (daar zit altijd het gesprek), de benchmark tegen andere "
     "sprints, en de data room met de documenten die de klant heeft geüpload."),
    ("Stap 3", "Sprintdag · 09:00", "Findings — de spiegel", "03_findings.png",
     "Klik op <b>Findings</b>. Dit is ons ochtenduur, volledig door het platform "
     "samengesteld: de scores, letterlijke quotes uit de AI-interviews met hun eigen "
     "mensen, inzichten uit hun documenten, en een door AI gemaakt marktonderzoek over "
     "BeFrank. Dit is het moment waarop de klant zichzelf herkent."),
    ("Stap 4", "Avond ervoor · T–1", "De pre-read", "04_preread.png",
     "Bovenaan findings staat <b>Pre-read version</b>. Dit Nederlandse teaser-document "
     "gaat de avond vóór de sprint naar de klant — door AI geschreven uit hun eigen "
     "cijfers en het marktonderzoek. Nieuwsgierig makend, zonder de onthulling te "
     "verklappen."),
    ("Stap 5", "Sprintdag · 12:30", "Ideation canvas", "05_canvas.png",
     "Terug op het dashboard → <b>Ideation canvas</b>. Concepten staan op het raster "
     "<b>levensmoment × mechanisme</b>. De diversiteitscheck bewaakt dat de gekozen 3–5 "
     "echt verschillen, en <b>Suggest concepts</b> laat AI ideeën aandragen op basis van "
     "de findings."),
    ("Stap 6", "Sprintdag · 14:00", "Het prototype", "06_prototype.png",
     "Klik op een concept. Per gekozen concept bouwt AI een waardepropositie, een "
     "klikbaar telefoonscherm en het testscript voor 's avonds — klaar om aan echte "
     "mensen te laten zien."),
    ("Stap 7", "Sprintdag · 18:00", "De testweergave", "07_testview.png",
     "Dit is wat 6–8 vrouwen uit de doelgroep 's avonds op een tablet zien. De panelhost "
     "legt per concept hun reacties en scores vast."),
    ("Stap 8", "De ochtend erna", "De readout", "08_readout.png",
     "Het platform vat alle testreacties 's nachts samen tot één heldere aanbeveling: "
     "welk concept de pilot zou moeten worden, onderbouwd met wat het panel zei."),
    ("Stap 9", "", "De evidence-bibliotheek", "09_research.png",
     "Onder <b>Research</b> staat onze bibliotheek: 12 geverifieerde rapporten (Netspar, "
     "CBS, ABP, OESO…) met quick reads en kerncijfers, gefilterd op sector en regio. De "
     "dashboards tonen automatisch de passende rapporten bij elke sprint."),
    ("Stap 10", "", "Ask AI — vraag het de bibliotheek", "10_ask.png",
     "Stel een vraag, bijvoorbeeld <i>“Hoe groot is de pensioenkloof in Nederland?”</i> "
     "Je krijgt een onderbouwd antwoord <b>mét bronvermelding</b> — uitsluitend uit onze "
     "eigen bibliotheek. Vraag gerust iets dat er niet in staat; dan zegt hij eerlijk dat "
     "hij het niet weet. Hij verzint niets."),
    ("Stap 11", "", "De klantkant — wat het team invult", "11_intake.png",
     "Open dit in een <b>incognitovenster</b> (geen login nodig): de intake die het "
     "klantteam op T–7 krijgt. Registratie, documenten uploaden (AI leest en vat samen), "
     "de zelfscan met live ringen, en daarna een kort AI-interview dat doorvraagt. Vul 'm "
     "vooral zelf even in — dat interview verrast mensen."),
]

def img_flowable(path):
    ir = ImageReader(path); iw, ih = ir.getSize()
    w = CW; h = w * ih / iw
    im = Image(path, width=w, height=h)
    t = Table([[im]], colWidths=[w])
    t.setStyle(TableStyle([("BOX",(0,0),(-1,-1),0.8,RULE),
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0)]))
    return t

def header_footer(canvas, doc):
    W, H = A4; canvas.saveState()
    canvas.setFont("UB", 9); canvas.setFillColor(INK)
    canvas.drawString(2*cm, H-1.45*cm, "UNLOCKT")
    canvas.setFont("U", 8); canvas.setFillColor(GREY)
    canvas.drawString(3.7*cm, H-1.45*cm, "· Gender Capital Lab™ Sprint")
    canvas.drawRightString(W-2*cm, H-1.45*cm, "Demo-handleiding")
    canvas.setStrokeColor(SKY); canvas.setLineWidth(1)
    canvas.line(2*cm, H-1.62*cm, W-2*cm, H-1.62*cm)
    canvas.setStrokeColor(RULE); canvas.setLineWidth(0.5)
    canvas.line(2*cm, 1.35*cm, W-2*cm, 1.35*cm)
    canvas.setFont("U", 7.5); canvas.setFillColor(GREY)
    canvas.drawString(2*cm, 1.0*cm, "Unlockt · vertrouwelijk")
    canvas.drawRightString(W-2*cm, 1.0*cm, f"Pagina {canvas.getPageNumber()}")
    canvas.restoreState()

def cover(canvas, doc):
    W, H = A4; canvas.saveState()
    # spectrum accent
    x = 2*cm
    for c in (SKYC, ROSE, AMBER, MINT):
        canvas.setFillColor(c); canvas.rect(x, H-3.0*cm, 2.6*cm, 0.16*cm, fill=1, stroke=0); x += 2.7*cm
    canvas.setFont("U", 7.5); canvas.setFillColor(GREY)
    canvas.drawRightString(W-2*cm, 1.0*cm, "Pagina 1")
    canvas.restoreState()

story = []
# cover
story.append(Spacer(1, 3.4*cm))
story.append(Paragraph("Gender Capital Lab™ Sprint", COVERT))
story.append(Paragraph("Demo-handleiding — stap voor stap", COVERS))
story.append(Spacer(1, 0.8*cm))
box = Table([[Paragraph(
    "<b>Inloggen</b><br/>ifc-sprint-platform.vercel.app<br/>"
    "gebruiker <b>unlockt</b> · wachtwoord <b>3istheMagicnumber!</b>", LOGIN)]], colWidths=[CW])
box.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),LIGHT),
    ("LINEBEFORE",(0,0),(0,-1),3,SKY),
    ("LEFTPADDING",(0,0),(-1,-1),14),("TOPPADDING",(0,0),(-1,-1),12),
    ("BOTTOMPADDING",(0,0),(-1,-1),12),("RIGHTPADDING",(0,0),(-1,-1),12)]))
story.append(box)
story.append(Spacer(1, 0.7*cm))
story.append(Paragraph(
    "Loop deze 11 stappen door in volgorde — samen zijn ze de complete sprint, van de "
    "ochtendspiegel tot de geteste prototypes en de beslissing. Alles is echt en gevuld "
    "met demodata (fictieve mensen, overal het label “(demo)”). Je kunt niets kapotmaken — "
    "klik vooral overal op.", BODY))
story.append(PageBreak())

for n, moment, title, img, body in STEPS:
    block = [Paragraph(f"{n}{('  ·  '+moment) if moment else ''}", KICK),
             Paragraph(title, TITLE),
             Paragraph(body, BODY),
             Spacer(1, 0.3*cm),
             img_flowable(os.path.join(SHOTS, img.replace(".png",".jpg")))]
    story.append(KeepTogether(block))
    story.append(PageBreak())

doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2.3*cm, bottomMargin=1.8*cm, title="Unlockt — Demo-handleiding", author="Unlockt")
doc.build(story, onFirstPage=cover, onLaterPages=header_footer)
print("wrote", OUT, os.path.getsize(OUT)//1024, "KB")
