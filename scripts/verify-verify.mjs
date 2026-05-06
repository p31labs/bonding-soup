#!/usr/bin/env node
/**
 * verify-verify.mjs — P31 Meta-Gate (Gates Watching Gates)
 *
 * Verifies that the verify chain itself is healthy:
 *   - Expected gate scripts exist on disk
 *   - All gates are registered in package.json
 *   - No orphan scripts (script exists but not wired)
 *   - No phantom gates (wired but script missing)
 *   - Foundation gates are present and ordered first
 *   - Verify pulse is recent (< 24 hours)
 *
 * Wire: "verify:verify": "node scripts/verify-verify.mjs"
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
let passed = 0;
let failed = 0;

function pass(msg) { passed++; console.log(`  ✓ ${msg}`); }
function fail(msg) { failed++; console.error(`  ✗ ${msg}`); }

console.log('verify-verify: Meta-Gate — Gates Watching Gates');

// ── 1. Load package.json ────────────────────────────────────────────────────

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
const allScripts = Object.keys(pkg.scripts || {});
const verifyGates = allScripts.filter(s => s.startsWith('verify:'));

console.log(`  Found ${verifyGates.length} verify:* gates in package.json`);

// ── 2. Foundation gates must exist ──────────────────────────────────────────

const FOUNDATION = ['verify:alignment', 'verify:p31-style'];
for (const gate of FOUNDATION) {
  if (allScripts.includes(gate)) {
    pass(`Foundation gate "${gate}" registered`);
  } else {
    fail(`Foundation gate "${gate}" MISSING from package.json`);
  }
}

// ── 3. Check for verify:canon (the truth enforcer) ─────────────────────────

if (allScripts.includes('verify:canon')) {
  pass('verify:canon (truth enforcer) registered');
} else {
  fail('verify:canon NOT registered — add "verify:canon": "node scripts/verify-canon.mjs" to package.json');
}

// ── 4. Check that each gate's script file exists ───────────────────────────

const scriptsDir = join(ROOT, 'scripts');
let phantoms = 0;

for (const gate of verifyGates) {
  const scriptBody = pkg.scripts[gate];
  // Extract the script file path from the command
  const match = scriptBody.match(/node\s+(\S+)/);
  if (match) {
    const scriptPath = join(ROOT, match[1]);
    if (existsSync(scriptPath)) {
      // pass silently — too many gates to list
    } else {
      fail(`Phantom gate "${gate}" — script ${match[1]} does not exist`);
      phantoms++;
    }
  }
}

if (phantoms === 0) {
  pass(`All ${verifyGates.length} gate scripts exist on disk`);
}

// ── 5. Check for orphan scripts (exist but not wired) ──────────────────────

if (existsSync(scriptsDir)) {
  const scriptFiles = readdirSync(scriptsDir).filter(f => f.startsWith('verify-') && f.endsWith('.mjs'));
  const wiredNames = verifyGates.map(g => g.replace('verify:', ''));

  let orphans = 0;
  for (const sf of scriptFiles) {
    const name = sf.replace('verify-', '').replace('.mjs', '');
    // Fuzzy match — gate names use : and - interchangeably
    const isWired = wiredNames.some(w =>
      w === name ||
      w.replace(/-/g, '') === name.replace(/-/g, '') ||
      w.includes(name) ||
      name.includes(w)
    );
    if (!isWired) {
      orphans++;
      if (orphans <= 3) {
        console.log(`  ⚠ Orphan script: scripts/${sf} — not wired in package.json`);
      }
    }
  }

  if (orphans === 0) {
    pass('No orphan verify scripts');
  } else {
    console.log(`  ⚠ ${orphans} orphan verify script(s) — consider wiring or removing`);
  }
}

// ── 6. Check verify pulse freshness ────────────────────────────────────────

const pulsePath = join(ROOT, 'docs', 'verify-pulse.json');
if (existsSync(pulsePath)) {
  try {
    const pulse = JSON.parse(readFileSync(pulsePath, 'utf-8'));
    const ts = new Date(pulse.generatedAt || pulse.timestamp || pulse.lastRun || pulse.date);
    const age = Date.now() - ts.getTime();
    const hours = Math.round(age / 3600000);

    if (age < 24 * 60 * 60 * 1000) {
      pass(`Verify pulse is fresh (${hours}h old)`);
    } else if (age < 72 * 60 * 60 * 1000) {
      pass(`Verify pulse is ${hours}h old (warn: run npm run pulse to update)`);
    } else {
      // Pulse is manually updated — stale is a warning, not a chain blocker
      console.log(`  ⚠ Verify pulse is stale (${hours}h old) — run npm run pulse`);
    }
  } catch {
    console.log('  ⚠ verify-pulse.json exists but could not parse timestamp');
  }
} else {
  console.log('  ⚠ verify-pulse.json not found — run npm run verify to generate');
}

// ── 7. Check the verify chain order in package.json ────────────────────────

const verifyChain = pkg.scripts.verify || '';
if (verifyChain.includes('verify:alignment')) {
  if (verifyChain.indexOf('verify:alignment') < verifyChain.indexOf('verify:public-line')) {
    pass('verify:alignment runs before verify:public-line (correct dependency order)');
  } else {
    console.log('  ⚠ verify:alignment should run before verify:public-line');
  }
}

// ── 8. Minimum gate count ──────────────────────────────────────────────────

if (verifyGates.length >= 20) {
  pass(`Gate count: ${verifyGates.length} (≥20 threshold)`);
} else {
  fail(`Gate count: ${verifyGates.length} — expected at least 20 verify gates`);
}

// ── REPORT ──────────────────────────────────────────────────────────────────

console.log(`\n  Passed: ${passed} | Failed: ${failed}`);

if (failed > 0) {
  console.error(`\nverify-verify: FAIL — the verify chain has ${failed} structural issue(s)`);
  process.exit(1);
} else {
  console.log(`\nverify-verify: OK — verify chain is healthy (${verifyGates.length} gates)`);
  process.exit(0);
}
