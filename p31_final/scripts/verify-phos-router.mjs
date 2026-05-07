#!/usr/bin/env node

/**
 * scripts/verify-phos-router.mjs
 *
 * Verifies PHOS Router implementation.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

console.log('Running verify:phos-router...');

// Check intent catalog exists
const catalogPath = resolve(projectRoot, 'packages/p31ca-org/public/data/phos-intent-catalog.json');
if (!existsSync(catalogPath)) {
  console.error('  ❌ Intent catalog not found at packages/p31ca-org/public/data/phos-intent-catalog.json');
  process.exit(1);
}
console.log('  ✅ Intent catalog exists.');

// Parse and validate
let catalog;
try {
  catalog = JSON.parse(readFileSync(catalogPath, 'utf-8'));
} catch (e) {
  console.error(`  ❌ Intent catalog is invalid JSON: ${e.message}`);
  process.exit(1);
}

if (!catalog.version) {
  console.error('  ❌ Intent catalog missing version field');
  process.exit(1);
}

if (!catalog.intents || !Array.isArray(catalog.intents)) {
  console.error('  ❌ Intent catalog missing or invalid "intents" array');
  process.exit(1);
}

console.log(`  ✅ Intent catalog valid (${catalog.intents.length} intents, v${catalog.version}).`);

// Check for duplicate phrases
const phraseMap = {};
const duplicates = [];

for (const intent of catalog.intents) {
  for (const phrase of intent.phrases) {
    const lower = phrase.toLowerCase();
    if (phraseMap[lower]) {
      duplicates.push({ phrase, intent1: phraseMap[lower], intent2: intent.id });
    } else {
      phraseMap[lower] = intent.id;
    }
  }
}

if (duplicates.length > 0) {
  console.error('  ❌ Duplicate phrases found in intent catalog:');
  for (const d of duplicates) {
    console.error(`    "${d.phrase}" appears in both "${d.intent1}" and "${d.intent2}"`);
  }
  process.exit(1);
}
console.log('  ✅ No duplicate phrases in intent catalog.');

// Check that each intent has required fields
const requiredIntentFields = ['id', 'label', 'path', 'phrases', 'icon'];
const intentErrors = [];

for (const intent of catalog.intents) {
  for (const field of requiredIntentFields) {
    if (!intent[field]) {
      intentErrors.push(`Intent "${intent.id || 'unknown'}" missing field: ${field}`);
    }
  }
  if (!Array.isArray(intent.phrases) || intent.phrases.length === 0) {
    intentErrors.push(`Intent "${intent.id}" has empty or missing phrases array`);
  }
}

if (intentErrors.length > 0) {
  console.error('  ❌ Intent catalog validation errors:');
  for (const err of intentErrors) console.error(`    ${err}`);
  process.exit(1);
}
console.log('  ✅ All intents have required fields and non-empty phrase lists.');

// Check router JS file
const routerPath = resolve(projectRoot, 'packages/p31ca-org/public/lib/p31-phos-router.js');
if (!existsSync(routerPath)) {
  console.error('  ❌ PHOS Router JS not found at packages/p31ca-org/public/lib/p31-phos-router.js');
  process.exit(1);
}

const routerJs = readFileSync(routerPath, 'utf-8');

const routerChecks = [
  { pattern: /class\s+PHOSRouter/, desc: 'PHOSRouter class' },
  { pattern: /loadCatalog/, desc: 'loadCatalog method' },
  { pattern: /decisionTree/, desc: 'decisionTree config' },
  { pattern: /initSafeModeIntegration/, desc: 'initSafeModeIntegration method' }
];

const missingChecks = routerChecks.filter(c => !c.pattern.test(routerJs));
if (missingChecks.length > 0) {
  console.error('  ❌ PHOS Router missing required components:');
  for (const c of missingChecks) console.error(`    - ${c.desc}`);
  process.exit(1);
}
console.log('  ✅ PHOS Router JS has all required components.');

// Check public-line.json integration
const publicLinePath = resolve(projectRoot, 'packages/p31ca-org/public/data/public-line.json');
if (existsSync(publicLinePath)) {
  let publicLine;
  try {
    publicLine = JSON.parse(readFileSync(publicLinePath, 'utf-8'));
  } catch (e) {
    console.error(`  ❌ public-line.json is invalid JSON: ${e.message}`);
    process.exit(1);
  }

  if (Array.isArray(publicLine)) {
    const surfaces = publicLine.filter(s => s.gate === 'public' || s.gate === 'draft');
    console.log(`  Checking ${surfaces.length} public/draft surface(s) for intent catalog entries...`);

    let catalogCoverage = 0;
    for (const surface of surfaces) {
      const hasIntent = catalog.intents.some(intent => {
        const intentPath = intent.path.replace(/\.html$/, '').replace(/\/index$/, '') || '/';
        const surfacePath = (surface.path || '').replace(/\\.html$/, '').replace(/\/index$/, '') || '/';
        return intentPath === surfacePath;
      });
      if (hasIntent) catalogCoverage++;
    }

    const coveragePercent = Math.round((catalogCoverage / surfaces.length) * 100);
    console.log(`  ✅ Intent catalog covers ${catalogCoverage}/${surfaces.length} surfaces (${coveragePercent}%).`);

    if (catalogCoverage === 0 && surfaces.length > 0) {
      console.error('  ❌ No surface coverage from intent catalog. Check path mappings.');
      process.exit(1);
    }
  }
} else {
  console.log('  ⚠ public-line.json not found. Skipping coverage check.');
}

// Check decision tree structure
if (!catalog.decisionTree) {
  console.error('  ❌ Intent catalog missing decisionTree');
  process.exit(1);
}

const requiredTreeKeys = ['root'];
for (const key of requiredTreeKeys) {
  if (!catalog.decisionTree[key]) {
    console.error(`  ❌ Decision tree missing required key: ${key}`);
    process.exit(1);
  }
}
console.log('  ✅ Decision tree has required structure.');

console.log('  ✅ PHOS Router verification passed.');
process.exit(0);
