#!/usr/bin/env node
/**
 * verify-product-names.mjs — Retired Product Name Detector
 *
 * Greps active docs/src/andromeda for retired product names per
 * P31-PRODUCT-NAMING-CANON.md. Warns (not fails) on hits so we can
 * triage context before removing. Some names legitimately appear in:
 *   - The naming canon/alignment docs themselves (definitional context)
 *   - Legal documents
 *   - Internal code module names (cognitiveShield.ts is HERALD internal)
 *   - doc-library/index.json (archival)
 *
 * Wire: "verify:product-names": "node scripts/verify-product-names.mjs"
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

const ROOT = process.cwd();
let passed = 0;
let warned = 0;
let failed = 0;

function pass(msg) { passed++; console.log(`  ✓ ${msg}`); }
function warn(msg) { warned++;  console.log(`  ⚠ ${msg}`); }
function fail(msg) { failed++; console.error(`  ✗ ${msg}`); }

console.log('verify-product-names: Retired Product Name Detector');

// ── Retired names ────────────────────────────────────────────────────────────

const RETIRED = [
  { name: 'PHENIX Navigator', pattern: /PHENIX\s+Navigator/g },
  { name: 'PHENIX',           pattern: /\bPHENIX\b/g },
  { name: 'The Scope',        pattern: /\bThe Scope\b/g },
  { name: 'Vertex One',       pattern: /\bVertex One\b/g },
  { name: 'The Buffer',       pattern: /\bThe Buffer\b/g },
  { name: 'EDE',              pattern: /\bEDE\b(?!\s*\/)/g },
  { name: 'Shelter',          pattern: /\bShelter\b(?!\s+in\s+place|\s+from|\s+against|\s+for)/g },
  { name: 'Omega Protocol',   pattern: /\bOmega Protocol\b/g },
  { name: 'Proof of Care',    pattern: /\bProof of Care\b/g },
  { name: 'Wonky Sprout',     pattern: /\bWonky Sprout\b/g },
];

// Files/paths that are exempt from name checks (they define or archive the names)
const EXEMPT_PATTERNS = [
  'P31-PRODUCT-NAMING-CANON.md',
  'doc-library/index.json',
  'docs/reports/',
  'docs/board/',
  'docs/shift-reports/',
  'docs/operator/',
  'legal/',
  'p31_final/',
  '.claude/',
  'node_modules/',
  '.git/',
  // Alignment docs that reference retired names in definitional/historical context
  'P31-SIMPLEX-AGENT-FLEET-ALIGNMENT.md',
  'P31-VERIFY-PIPELINE-ALIGNMENT.md',
  'P31-EDE-PARALLEL-AGENT-PROMPTS.md',
  // Archival/legacy docs and historical snapshots
  'page-audit.json',
  'docs/p31-atmosphere-routes.json',
  'GEMINI-PROMPT-TEMPLATE-GENERATION.md',
  'affective-chemistry-spec.md',
  'PERSONAL-TETRA-UNIFIED-WORKER.md',
  'P31-WIRING-DIAGRAM.md',
  'P31CA-DESIGN-SPECIFICATION.md',
  'P31_COGNITIVE_PASSPORT_v4.md',
  'P31-COGNITIVE-PASSPORT-v4-PUBLIC.md',
  'P31_MASTER_CONTEXT_2026-05-04.md',
  'opus_alignment_prompt_2026_05_02.md',
  'P31-MASTER-TECHNICAL-SUITE.md',
  'P31-PUBLIC-MVP-WRITEUPS.md',
  'MVP-DELIVERABLES-INVENTORY.md',
  'CWP-P31-PHOS-ROUTER-2026-05.md',
  'PHOS-VOICE-DRAFT.md',
  'PLAN-KIDS-VIBE-CODING.md',
  // Internal code module exemptions
  'cognitiveShield.ts',
  'cognitiveShield.js',
];

function isExempt(filepath) {
  const rel = relative(ROOT, filepath);
  return EXEMPT_PATTERNS.some(p => rel.includes(p));
}

// ── Scan targets ─────────────────────────────────────────────────────────────

const SCAN_DIRS = [
  join(ROOT, 'docs'),
  join(ROOT, 'src'),
  join(ROOT, 'andromeda', '04_SOFTWARE', 'p31ca', 'src'),
  join(ROOT, 'andromeda', '04_SOFTWARE', 'packages', 'shared', 'src'),
];

const SCAN_EXTENSIONS = new Set(['.md', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.astro']);

function scanDir(dir, depth = 0) {
  if (depth > 6 || !existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist') continue;
    const full = join(dir, entry);
    if (isExempt(full)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      scanDir(full, depth + 1);
    } else if (SCAN_EXTENSIONS.has(extname(entry))) {
      checkFile(full);
    }
  }
}

const hitsByFile = {};

function checkFile(filepath) {
  let src;
  try { src = readFileSync(filepath, 'utf-8'); } catch { return; }
  const rel = relative(ROOT, filepath);

  for (const { name, pattern } of RETIRED) {
    pattern.lastIndex = 0;
    const hits = [];
    let m;
    while ((m = pattern.exec(src)) !== null) {
      const lineNum = src.slice(0, m.index).split('\n').length;
      hits.push(lineNum);
    }
    if (hits.length > 0) {
      if (!hitsByFile[rel]) hitsByFile[rel] = [];
      hitsByFile[rel].push({ name, lines: hits });
    }
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

for (const dir of SCAN_DIRS) {
  scanDir(dir);
}

// ── Report ───────────────────────────────────────────────────────────────────

const files = Object.keys(hitsByFile);
if (files.length === 0) {
  pass('No retired product names found in active docs/src');
} else {
  for (const rel of files.sort()) {
    for (const { name, lines } of hitsByFile[rel]) {
      warn(`${rel}:${lines[0]} — "${name}" (${lines.length} occurrence(s), lines: ${lines.join(', ')})`);
    }
  }
}

pass(`Scanned ${SCAN_DIRS.length} directories for ${RETIRED.length} retired names`);

console.log(`\n  Passed: ${passed} | Warned: ${warned} | Failed: ${failed}`);

if (failed > 0) {
  console.error(`\nverify-product-names: FAIL — ${failed} issue(s)`);
  process.exit(1);
} else {
  console.log(`\nverify-product-names: OK${warned > 0 ? ` (${warned} warning(s) — see above)` : ''}`);
  process.exit(0);
}
