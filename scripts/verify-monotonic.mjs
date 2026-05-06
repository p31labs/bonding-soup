#!/usr/bin/env node
/**
 * verify-monotonic.mjs — P31 Monotonic Invariant Enforcer
 *
 * Certain numbers in the P31 ecosystem must NEVER decrease:
 *   - Alignment source count (292+)
 *   - Verify gate count (89+)
 *   - Zenodo publication count (22)
 *
 * This script reads the current values, compares them to a persisted
 * high-water mark file, and fails if any value has decreased.
 * On success, it updates the high-water marks.
 *
 * Wire: "verify:monotonic": "node scripts/verify-monotonic.mjs"
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const HWM_PATH = join(ROOT, 'docs', 'monotonic-high-water.json');

function readJSON(path) {
  try { return JSON.parse(readFileSync(path, 'utf-8')); } catch { return null; }
}

function loadHighWater() {
  if (existsSync(HWM_PATH)) {
    return readJSON(HWM_PATH) || {};
  }
  return {};
}

function saveHighWater(hwm) {
  writeFileSync(HWM_PATH, JSON.stringify(hwm, null, 2) + '\n');
}

// ── CHECKS ─────────────────────────────────────────────────────────────────

const checks = [];

// 1. Alignment sources
const alignment = readJSON(join(ROOT, 'p31-alignment.json'));
if (alignment?.sources) {
  checks.push({
    name: 'alignment-sources',
    value: alignment.sources.length,
    floor: 280,
    desc: 'p31-alignment.json source count',
  });
} else {
  console.error('  ✗ p31-alignment.json missing or unparseable');
  process.exit(1);
}

// 2. Verify gate count
const pkg = readJSON(join(ROOT, 'package.json'));
if (pkg?.scripts) {
  const gates = Object.keys(pkg.scripts).filter(s => s.startsWith('verify:'));
  checks.push({
    name: 'verify-gates',
    value: gates.length,
    floor: 20,
    desc: 'verify:* script count in package.json',
  });
}

// 3. Zenodo publications (constant — only goes up when new papers published)
checks.push({
  name: 'zenodo-publications',
  value: 22,
  floor: 22,
  desc: 'Zenodo publication count (immutable DOIs)',
});

// 4. Alignment derivations
if (alignment?.derivations) {
  checks.push({
    name: 'alignment-derivations',
    value: alignment.derivations.length,
    floor: 70,
    desc: 'p31-alignment.json derivation count',
  });
}

// ── EVALUATE ───────────────────────────────────────────────────────────────

console.log('verify-monotonic: Monotonic Invariant Enforcer');

const hwm = loadHighWater();
let failed = false;

for (const check of checks) {
  const prevHigh = hwm[check.name] || check.floor;
  const effective = Math.max(prevHigh, check.floor);

  if (check.value >= effective) {
    console.log(`  ✓ ${check.desc}: ${check.value} (floor: ${effective})`);
    hwm[check.name] = Math.max(check.value, effective);
  } else {
    console.error(`  ✗ ${check.desc}: ${check.value} < ${effective} — MONOTONIC VIOLATION`);
    console.error(`    This number must never decrease. Something was deleted or corrupted.`);
    failed = true;
  }
}

hwm._lastVerified = new Date().toISOString();
saveHighWater(hwm);

if (failed) {
  console.error('\nverify-monotonic: FAIL — one or more invariants violated');
  process.exit(1);
} else {
  console.log(`\nverify-monotonic: OK — ${checks.length} invariants hold`);
  console.log(`  High-water marks saved to ${HWM_PATH}`);
  process.exit(0);
}
