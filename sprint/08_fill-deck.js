#!/usr/bin/env node
/**
 * 08_fill-deck.js — fill the proposition deck's placeholder tokens from sprint data.
 *
 * Usage:
 *   node 08_fill-deck.js <data.json> [output.html]
 *
 * Reads 03_proposition-deck.html (next to this script, never modified) and writes
 * a filled copy (default: filled-deck.html next to this script).
 *
 * INPUT SCHEMA (data.json):
 * {
 *   "datum": "26 juni 2026",                       // replaces «datum» on title + closing slide
 *   "scores": {                                    // 0–100 numbers; fill the 5 diagnose rings
 *     "mens_organisatie": 52,
 *     "data": 68,
 *     "marketing_communicatie": 48,
 *     "ecosystemen": 30,
 *     "proposities": 45
 *   },
 *   "succesmaat1_pct": "30",                       // Succesmaat 1: projectiekloof ↓ «X»%
 *   "werkgevers_jaar1": "10",                      // Succesmaat 3: «X» werkgevers in jaar 1
 *   "dataroom_gap_pct": "«X»",                     // De kans: «X»% deelnemers onder traject (uit dataroom)
 *   "kost_per_maand_eur": "«X»",                   // Propositie: 'dit kost je €«X»/maand straks'
 *   "sanne_gap_eur": "«X»",                        // Persona: ~€«X»/maand minder pensioen
 *   "adresseerbaar_k": "«X»",                      // Business case: «X»k adresseerbaar
 *   "activatie_pct": "«X»",                        // Business case: +«X»% activatie
 *   "retentie_pct": "«X»",                         // Business case: «X»% retentie/ESG
 *   "kosten_nietsdoen_eur": "«X»"                  // Business case: €«X» kosten nietsdoen
 * }
 *
 * Any string field may legitimately be "«X»" (client data not in yet): the token is
 * then left as-is in the output. The prototype placeholder
 * «Mijn Pensioen — klikbaar conceptscherm» is never touched.
 *
 * Ring colour bands:  <35 amber · 35–59 rose · 60–79 sky · ≥80 mint
 * Overall band names: 0–34 blinde vlek · 35–59 latent · 60–79 in opbouw · 80–100 koploper
 *
 * Exits 0 on success; prints a report of remaining «…» tokens (expected leftovers:
 * the prototype placeholder + any fields left as "«X»").
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SOURCE_DECK = path.join(__dirname, '03_proposition-deck.html');
const DEFAULT_OUTPUT = path.join(__dirname, 'filled-deck.html');
const TOKEN_SPAN = '<span class="token">«X»</span>';

function fail(msg) {
  console.error('ERROR: ' + msg);
  process.exit(1);
}

// ---------------------------------------------------------------- CLI args
const [, , dataArg, outputArg] = process.argv;
if (!dataArg) {
  console.error('Usage: node 08_fill-deck.js <data.json> [output.html]');
  process.exit(1);
}
const dataPath = path.resolve(dataArg);
const outputPath = outputArg ? path.resolve(outputArg) : DEFAULT_OUTPUT;
if (path.resolve(outputPath) === path.resolve(SOURCE_DECK)) {
  fail('Output path equals the source deck — refusing to overwrite 03_proposition-deck.html.');
}

// ---------------------------------------------------------------- load input
if (!fs.existsSync(dataPath)) fail('Data file not found: ' + dataPath);
if (!fs.existsSync(SOURCE_DECK)) fail('Source deck not found: ' + SOURCE_DECK);

let data;
try {
  data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (e) {
  fail('Could not parse JSON in ' + dataPath + ': ' + e.message);
}

let html = fs.readFileSync(SOURCE_DECK, 'utf8');

// A value counts as "not yet provided" when missing, empty, or still a «…» token.
function isPlaceholder(v) {
  if (v === undefined || v === null) return true;
  const s = String(v).trim();
  return s === '' || /^«.*»$/.test(s);
}

const applied = [];
const skipped = [];
const warnings = [];

// ---------------------------------------------------------------- 1. rings
function ringColour(score) {
  if (score < 35) return 'amber';
  if (score < 60) return 'rose';
  if (score < 80) return 'sky';
  return 'mint';
}
function overallBand(score) {
  if (score < 35) return 'blinde vlek';
  if (score < 60) return 'latent';
  if (score < 80) return 'in opbouw';
  return 'koploper';
}

const DIMENSIONS = [
  { key: 'mens_organisatie', label: 'Mens &amp; organisatie' },
  { key: 'data', label: 'Data' },
  { key: 'marketing_communicatie', label: 'Marketing &amp; communicatie' },
  { key: 'ecosystemen', label: 'Ecosystemen' },
  { key: 'proposities', label: 'Proposities' },
];

const scores = data.scores || {};
const scoreValues = [];

for (const dim of DIMENSIONS) {
  const raw = scores[dim.key];
  const score = Number(raw);
  if (raw === undefined || raw === null || !Number.isFinite(score) || score < 0 || score > 100) {
    fail(`scores.${dim.key} must be a number 0–100 (got: ${JSON.stringify(raw)})`);
  }
  const rounded = Math.round(score);
  scoreValues.push(rounded);

  // Anchor on the Dutch dimension label, then walk back to its .ring block.
  const labelAnchor = `<p class="grade-dim">${dim.label}</p>`;
  const labelIdx = html.indexOf(labelAnchor);
  if (labelIdx === -1) {
    warnings.push(`Ring label not found in deck: ${dim.label} — ring left untouched.`);
    continue;
  }
  const ringStart = html.lastIndexOf('<div class="ring"', labelIdx);
  if (ringStart === -1) {
    warnings.push(`No .ring block found before label ${dim.label} — ring left untouched.`);
    continue;
  }
  let block = html.slice(ringStart, labelIdx);
  const colour = ringColour(rounded);
  const pPat = /--p:\s*\d+/;
  const cPat = /--c:\s*var\(--(?:rose|sky|amber|mint)\)/;
  const vPat = /<span class="ring-value">\d+%<\/span>/;
  if (!pPat.test(block) || !cPat.test(block) || !vPat.test(block)) {
    warnings.push(`Ring block for ${dim.label} did not match expected markup — left untouched.`);
    continue;
  }
  block = block
    .replace(pPat, `--p: ${rounded}`)
    .replace(cPat, `--c: var(--${colour})`)
    .replace(vPat, `<span class="ring-value">${rounded}%</span>`);
  html = html.slice(0, ringStart) + block + html.slice(labelIdx);
  applied.push(`ring ${dim.label.replace(/&amp;/g, '&')} → ${rounded}% (var(--${colour}))`);
}

// ---------------------------------------------------------------- 2. totaaloordeel
const overall = Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length);
const band = overallBand(overall);
const totaalAnchor = 'Totaaloordeel: <span style="color: var(--rose);">49% — latent.</span>';
if (html.includes(totaalAnchor)) {
  html = html.replace(
    totaalAnchor,
    `Totaaloordeel: <span style="color: var(--rose);">${overall}% — ${band}.</span>`
  );
  applied.push(`totaaloordeel → ${overall}% — ${band}.`);
} else {
  warnings.push('Totaaloordeel anchor not found — left untouched.');
}

// ---------------------------------------------------------------- 3. datum
if (isPlaceholder(data.datum)) {
  skipped.push('datum (no value — «datum» left as-is)');
} else {
  const n = html.split('«datum»').length - 1;
  html = html.replaceAll('«datum»', String(data.datum).trim());
  applied.push(`datum → "${String(data.datum).trim()}" (${n}×)`);
}

// ---------------------------------------------------------------- 4. context-anchored «X» tokens
// Each anchor is the EXACT surrounding HTML from 03_proposition-deck.html; the
// token span is swapped for the plain value (the amber .token highlight marks
// "still to fill", so a filled value drops it).
const TOKENS = [
  {
    field: 'succesmaat1_pct',
    desc: 'Succesmaat 1: projectiekloof ↓ «X»%',
    anchor: 'Projectiekloof bij vrouwelijke deelnemers <strong>↓ <span class="token">«X»</span>%</strong> in 18 maanden.',
  },
  {
    field: 'werkgevers_jaar1',
    desc: 'Succesmaat 3: «X» werkgevers in jaar 1',
    anchor: 'Werkgevers met gap-dashboard: <strong><span class="token">«X»</span></strong> in jaar 1.',
  },
  {
    field: 'dataroom_gap_pct',
    desc: 'De kans: «X»% deelnemers onder traject',
    anchor: '<div class="stat-number" style="color: var(--amber);"><span class="token">«X»</span>%</div>\n      <p class="stat-body">van BeFrank’s vrouwelijke deelnemers',
  },
  {
    field: 'kost_per_maand_eur',
    desc: 'Propositie: dit kost je €«X»/maand',
    anchor: '‘dit kost je €<span class="token">«X»</span>/maand straks’',
  },
  {
    field: 'sanne_gap_eur',
    desc: 'Persona: ~€«X»/maand voor Sanne',
    anchor: '~€<span class="token">«X»</span>/maand minder pensioen op haar huidige traject.',
  },
  {
    field: 'adresseerbaar_k',
    desc: 'Business case: «X»k adresseerbaar',
    anchor: '<div class="stat-number" style="font-size: 2.4rem; color: var(--sky);"><span class="token">«X»</span>k</div>',
  },
  {
    field: 'activatie_pct',
    desc: 'Business case: +«X»% activatie',
    anchor: '<div class="stat-number" style="font-size: 2.4rem; color: var(--rose);">+<span class="token">«X»</span>%</div>',
  },
  {
    field: 'retentie_pct',
    desc: 'Business case: «X»% retentie/ESG',
    anchor: '<div class="stat-number" style="font-size: 2.4rem; color: var(--mint);"><span class="token">«X»</span>%</div>',
  },
  {
    field: 'kosten_nietsdoen_eur',
    desc: 'Business case: €«X» kosten nietsdoen',
    anchor: '<div class="stat-number" style="font-size: 2.4rem; color: var(--amber);">€<span class="token">«X»</span></div>',
  },
];

for (const t of TOKENS) {
  const value = data[t.field];
  if (isPlaceholder(value)) {
    skipped.push(`${t.field} (no value — token left as-is)`);
    continue;
  }
  if (!html.includes(t.anchor)) {
    warnings.push(`Anchor for ${t.field} not found in deck — token left untouched. (${t.desc})`);
    continue;
  }
  html = html.replace(t.anchor, t.anchor.replace(TOKEN_SPAN, String(value).trim()));
  applied.push(`${t.field} → "${String(value).trim()}" (${t.desc})`);
}

// ---------------------------------------------------------------- write output
fs.writeFileSync(outputPath, html, 'utf8');

// ---------------------------------------------------------------- report
console.log('Source deck : ' + SOURCE_DECK + ' (read-only, not modified)');
console.log('Data        : ' + dataPath);
console.log('Output      : ' + outputPath);
console.log('');
console.log('Applied (' + applied.length + '):');
for (const a of applied) console.log('  + ' + a);
if (skipped.length) {
  console.log('Skipped (' + skipped.length + '):');
  for (const s of skipped) console.log('  - ' + s);
}
if (warnings.length) {
  console.log('Warnings (' + warnings.length + '):');
  for (const w of warnings) console.log('  ! ' + w);
}

const leftovers = html.match(/«[^«»]*»/g) || [];
const counts = new Map();
for (const t of leftovers) counts.set(t, (counts.get(t) || 0) + 1);
console.log('');
console.log('Remaining «…» tokens in output: ' + leftovers.length);
for (const [tok, n] of counts) {
  const note = tok === '«Mijn Pensioen — klikbaar conceptscherm»'
    ? '  (prototype placeholder — intentionally untouched)'
    : tok === '«X»'
      ? '  (field(s) left as «X» in the data — fill later)'
      : '';
  console.log(`  ${n} × ${tok}${note}`);
}
if (leftovers.length === 0) console.log('  (none)');

process.exit(0);
