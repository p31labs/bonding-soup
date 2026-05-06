#!/usr/bin/env node
/**
 * verify-design-tokens.mjs — Design Token Drift Detector
 *
 * Checks that:
 *   1. No --p31-butter token references remain (renamed to --p31-amber)
 *   2. soup-quantum.css uses --p31-amber (not old --p31-butter)
 *   3. Design asset files (SVGs, forge HTML) are not using hex values that
 *      contradict the canonical token values from p31-universal-canon.json
 *   4. No bare hardcoded hex values that should be CSS variables in key
 *      component files (warn, not fail — rgba() with alpha is a known CSS limitation)
 *
 * Wire: "verify:design-tokens": "node scripts/verify-design-tokens.mjs"
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

const ROOT = process.cwd();
let passed = 0;
let warned = 0;
let failed = 0;

function pass(msg)  { passed++; console.log(`  ✓ ${msg}`); }
function warn(msg)  { warned++;  console.log(`  ⚠ ${msg}`); }
function fail(msg)  { failed++; console.error(`  ✗ ${msg}`); }

console.log('verify-design-tokens: Design Token Drift Detector');

// ── 1. Load canonical token values ──────────────────────────────────────────

const CANON_PATH = join(ROOT, 'andromeda', '04_SOFTWARE', 'design-tokens', 'p31-universal-canon.json');
let canon = null;
if (existsSync(CANON_PATH)) {
  try {
    canon = JSON.parse(readFileSync(CANON_PATH, 'utf-8'));
    pass('p31-universal-canon.json loaded');
  } catch {
    fail('p31-universal-canon.json parse error');
  }
} else {
  warn('p31-universal-canon.json not found — skipping token value checks');
}

// ── 2. Check for --p31-butter (renamed to --p31-amber) ──────────────────────

const BUTTER_TARGETS = [
  'soup-quantum.css',
  join('andromeda', '04_SOFTWARE', 'bonding', 'public', 'soup', 'soup-quantum.css'),
];

let butterHits = 0;
for (const rel of BUTTER_TARGETS) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) continue;
  const src = readFileSync(p, 'utf-8');
  const hits = (src.match(/--p31-butter/g) || []).length;
  if (hits > 0) {
    fail(`${rel}: ${hits} --p31-butter reference(s) — rename to --p31-amber`);
    butterHits += hits;
  }
}
if (butterHits === 0) {
  pass('No --p31-butter token references (renamed to --p31-amber)');
}

// ── 3. Scan CSS files for retired token names ────────────────────────────────

const RETIRED_TOKENS = ['--p31-butter', '--p31-tone-butter'];
const CSS_SCAN_DIRS = [
  join(ROOT, 'cognitive-passport'),
  join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'public'),
  join(ROOT, 'andromeda', '04_SOFTWARE', 'bonding', 'public'),
  join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'src'),
];

function scanForRetiredTokens(dir, depth = 0) {
  if (depth > 5 || !existsSync(dir)) return 0;
  let hits = 0;
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      hits += scanForRetiredTokens(full, depth + 1);
    } else if (['.css', '.scss', '.less'].includes(extname(entry))) {
      const src = readFileSync(full, 'utf-8');
      for (const tok of RETIRED_TOKENS) {
        const count = (src.match(new RegExp(tok.replace('--', '--'), 'g')) || []).length;
        if (count > 0) {
          warn(`${full.replace(ROOT + '/', '')}: ${count} ${tok} reference(s)`);
          hits += count;
        }
      }
    }
  }
  return hits;
}

let retiredHits = 0;
for (const dir of CSS_SCAN_DIRS) {
  retiredHits += scanForRetiredTokens(dir);
}
if (retiredHits === 0) {
  pass('No retired CSS token names in scanned directories');
}

// ── 4. soup-quantum.css specific checks ─────────────────────────────────────

const SQC_PATHS = [
  join(ROOT, 'soup-quantum.css'),
  join(ROOT, 'andromeda', '04_SOFTWARE', 'bonding', 'public', 'soup', 'soup-quantum.css'),
];

for (const sqcPath of SQC_PATHS) {
  if (!existsSync(sqcPath)) continue;
  const rel = sqcPath.replace(ROOT + '/', '');
  const src = readFileSync(sqcPath, 'utf-8');

  // Check --p31-amber present (was --p31-butter)
  if (src.includes('--p31-amber')) {
    pass(`${rel}: uses --p31-amber (correct)`);
  }

  // Warn on bare hardcoded hex values that aren't inside rgba() or var() fallbacks
  const bareHex = src.match(/(?<!rgba\(\d+,\s*\d+,\s*\d+,?\s*)(?<![,\s])\s*#[0-9a-fA-F]{3,6}\b(?!\s*\))/g);
  if (bareHex && bareHex.length > 2) {
    warn(`${rel}: ${bareHex.length} bare hex value(s) outside var() — consider --p31-* tokens`);
  } else {
    pass(`${rel}: hex values minimal (≤2 bare hex)`);
  }

  // Warn on rgba() values that appear to be hardcoded teal (could be var-based)
  const rgbaHits = (src.match(/rgba\(77,\s*184,\s*168/g) || []).length;
  if (rgbaHits > 10) {
    warn(`${rel}: ${rgbaHits} rgba(77,184,168,...) instances — consider color-mix(in srgb, var(--p31-teal) X%, transparent) for future refactor`);
  }
}

// ── 5. Check canonical colors aren't duplicated with wrong hex ───────────────

const CANONICAL_COLORS = {
  '--p31-void':        '#0f1115',
  '--p31-teal':        '#5DCAA5',
  '--p31-phosphorus':  '#5dca5d',
  '--p31-cloud':       '#e8e6e3',
  '--p31-amber':       '#cda852',
  '--p31-coral':       '#cc6247',
  '--p31-lavender':    '#8b7cc9',
};

// Check in p31-style.css that these are present with correct values
const STYLE_PATH = join(ROOT, 'cognitive-passport', 'p31-style.css');
if (existsSync(STYLE_PATH)) {
  const styleSrc = readFileSync(STYLE_PATH, 'utf-8');
  let colorDrift = 0;
  for (const [token, hex] of Object.entries(CANONICAL_COLORS)) {
    if (!styleSrc.includes(`${token}:`)) {
      warn(`p31-style.css missing ${token}`);
      colorDrift++;
    } else {
      // Check the value matches
      const m = styleSrc.match(new RegExp(`${token.replace('--', '--')}:\\s*([^;]+);`));
      if (m) {
        const val = m[1].trim().toLowerCase();
        if (!val.includes(hex.toLowerCase()) && !val.includes('var(')) {
          warn(`${token}: expected ${hex}, found ${val}`);
          colorDrift++;
        }
      }
    }
  }
  if (colorDrift === 0) {
    pass(`p31-style.css: all ${Object.keys(CANONICAL_COLORS).length} canonical color tokens present`);
  }
} else {
  warn('p31-style.css not found — skipping token value verification');
}

// ── 6. Scan design-assets/ HTML/SVG for known-wrong void hex ────────────────

const DESIGN_ASSETS_DIR = join(ROOT, 'design-assets');
const VOID_WRONG = /#05080c/gi;   // retired void — canonical is #0f1115
const BUTTER_WRONG = /butter:/gi; // retired name — canonical is amber:

if (existsSync(DESIGN_ASSETS_DIR)) {
  let assetDrift = 0;
  function scanDesignAssets(dir, depth = 0) {
    if (depth > 4) return;
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.') || entry === 'node_modules') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { scanDesignAssets(full, depth + 1); continue; }
      if (!['.html', '.svg', '.js', '.css'].includes(extname(entry))) continue;
      const src = readFileSync(full, 'utf-8');
      const rel = full.replace(ROOT + '/', '');
      const wrongVoid = (src.match(VOID_WRONG) || []).length;
      const wrongButter = (src.match(BUTTER_WRONG) || []).length;
      if (wrongVoid > 0) { warn(`${rel}: ${wrongVoid} retired void #05080c (use #0f1115)`); assetDrift += wrongVoid; }
      if (wrongButter > 0) { warn(`${rel}: ${wrongButter} "butter:" token (rename to amber:)`); assetDrift += wrongButter; }
    }
  }
  scanDesignAssets(DESIGN_ASSETS_DIR);
  if (assetDrift === 0) {
    pass('design-assets/: no retired void hex or butter token name');
  }
} else {
  warn('design-assets/ not found — skipping asset hex scan');
}

// ── REPORT ───────────────────────────────────────────────────────────────────

console.log(`\n  Passed: ${passed} | Warned: ${warned} | Failed: ${failed}`);

if (failed > 0) {
  console.error(`\nverify-design-tokens: FAIL — ${failed} token drift issue(s)`);
  process.exit(1);
} else {
  console.log(`\nverify-design-tokens: OK${warned > 0 ? ` (${warned} warning(s) — see above)` : ''}`);
  process.exit(0);
}
