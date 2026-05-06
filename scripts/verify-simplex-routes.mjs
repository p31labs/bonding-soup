#!/usr/bin/env node
/**
 * verify-simplex-routes.mjs — SIMPLEX Worker Route Integrity
 *
 * Checks that:
 *   1. simplex-v7/src/index.ts route count meets baseline (≥ 20)
 *   2. SKILL_PATHS in skills/router.ts meets baseline (≥ 18)
 *   3. No duplicate route entries in either file
 *   4. All canonical required routes are present
 *
 * Wire: "verify:simplex-routes": "node scripts/verify-simplex-routes.mjs"
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
let passed = 0;
let warned = 0;
let failed = 0;

function pass(msg) { passed++; console.log(`  ✓ ${msg}`); }
function warn(msg) { warned++;  console.log(`  ⚠ ${msg}`); }
function fail(msg) { failed++; console.error(`  ✗ ${msg}`); }

console.log('verify-simplex-routes: SIMPLEX Worker Route Integrity');

const SIMPLEX_DIR = join(ROOT, 'simplex-v7');
const INDEX_PATH  = join(SIMPLEX_DIR, 'src', 'index.ts');
const ROUTER_PATH = join(SIMPLEX_DIR, 'src', 'skills', 'router.ts');

if (!existsSync(SIMPLEX_DIR)) {
  console.log('verify-simplex-routes: skip — simplex-v7 not present');
  process.exit(0);
}

// ── 1. Index routes ───────────────────────────────────────────────────────────

if (!existsSync(INDEX_PATH)) {
  fail(`simplex-v7/src/index.ts not found`);
} else {
  const src = readFileSync(INDEX_PATH, 'utf-8');

  // Extract method+pathname pairs for duplicate detection
  const routePairs = [...src.matchAll(/method\s*===\s*['"](\w+)['"]\s*&&\s*url\.pathname\s*===\s*['"]([^'"]+)['"]/g)]
    .map(m => `${m[1]}:${m[2]}`);
  // Also catch pathname-only matches (no method guard)
  const routes = [...src.matchAll(/url\.pathname\s*===\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const unique = [...new Set(routes)];
  const dupes  = routePairs.filter((r, i) => routePairs.indexOf(r) !== i);

  if (unique.length >= 20) {
    pass(`index.ts: ${unique.length} distinct routes (≥20 baseline)`);
  } else {
    fail(`index.ts: only ${unique.length} distinct routes — expected ≥20`);
  }

  if (dupes.length > 0) {
    warn(`index.ts: duplicate route entries: ${[...new Set(dupes)].join(', ')}`);
  } else {
    pass(`index.ts: no duplicate route definitions`);
  }

  // Required routes that MUST be present
  const REQUIRED = ['/api/health', '/api/state', '/api/agents', '/api/spoons'];
  for (const r of REQUIRED) {
    if (!routes.includes(r)) {
      fail(`index.ts missing required route: ${r}`);
    }
  }
  const missing = REQUIRED.filter(r => !routes.includes(r));
  if (missing.length === 0) {
    pass(`index.ts: all ${REQUIRED.length} required routes present`);
  }
}

// ── 2. Skills router ─────────────────────────────────────────────────────────

if (!existsSync(ROUTER_PATH)) {
  warn(`simplex-v7/src/skills/router.ts not found — skill routes unverified`);
} else {
  const src = readFileSync(ROUTER_PATH, 'utf-8');

  // Extract SKILL_PATHS set members
  const m = src.match(/const SKILL_PATHS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  if (!m) {
    warn('SKILL_PATHS Set not found in router.ts');
  } else {
    const paths = [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map(x => x[1]);
    const unique = [...new Set(paths)];
    const dupes  = paths.filter((p, i) => paths.indexOf(p) !== i);

    if (unique.length >= 18) {
      pass(`router.ts: ${unique.length} skill paths (≥18 baseline)`);
    } else {
      fail(`router.ts: only ${unique.length} skill paths — expected ≥18`);
    }

    if (dupes.length > 0) {
      warn(`router.ts: duplicate skill paths: ${[...new Set(dupes)].join(', ')}`);
    } else {
      pass(`router.ts: no duplicate skill paths`);
    }
  }
}

// ── REPORT ───────────────────────────────────────────────────────────────────

console.log(`\n  Passed: ${passed} | Warned: ${warned} | Failed: ${failed}`);

if (failed > 0) {
  console.error(`\nverify-simplex-routes: FAIL — ${failed} route integrity issue(s)`);
  process.exit(1);
} else {
  console.log(`\nverify-simplex-routes: OK${warned > 0 ? ` (${warned} warning(s))` : ''}`);
  process.exit(0);
}
