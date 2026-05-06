#!/usr/bin/env node
/**
 * verify-cognitive-passport-schema.mjs
 *
 * 1. Lock: cognitive-passport/index.html SCHEMA constant ≡ @p31/shared cognitive-passport-schema.ts
 * 2. Consumer registry (WCD-COGPASS-02): each registered consumer location exists;
 *    all known field groups have at least one consumer.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const htmlPath = path.join(root, "cognitive-passport", "index.html");
const sharedPath = path.join(root, "andromeda", "04_SOFTWARE", "packages", "shared", "src", "cognitive-passport-schema.ts");
const registryPath = path.join(root, "andromeda", "04_SOFTWARE", "packages", "shared", "src", "cogpass-consumer-registry.ts");

let passed = 0;
let warned = 0;
let failed = 0;

function pass(msg) { passed++; console.log(`  ✓ ${msg}`); }
function warn(msg) { warned++;  console.log(`  ⚠ ${msg}`); }
function fail(msg) { failed++; console.error(`  ✗ ${msg}`); }

function main() {
  if (!fs.existsSync(htmlPath)) { fail(`missing ${htmlPath}`); report(); return; }

  if (!fs.existsSync(sharedPath)) {
    console.log("verify-cognitive-passport-schema: skip — no @p31/shared tree (partial clone)");
    process.exit(0);
  }

  // ── 1. Schema version lock ────────────────────────────────────────────────

  const html = fs.readFileSync(htmlPath, "utf8");
  const shared = fs.readFileSync(sharedPath, "utf8");

  const htmlM = html.match(/const SCHEMA = ["'](p31\.cognitivePassport\/[^"']+)["']/);
  if (!htmlM) {
    fail('cognitive-passport/index.html must declare const SCHEMA = "p31.cognitivePassport/…"');
  } else {
    const schema = htmlM[1];
    const sharedM = shared.match(/export const COGNITIVE_PASSPORT_SCHEMA = ['"](p31\.cognitivePassport\/[^'"]+)['"]/);
    if (!sharedM || sharedM[1] !== schema) {
      fail(`cognitive-passport-schema.ts must export COGNITIVE_PASSPORT_SCHEMA = '${schema}' (matches generator)`);
    } else {
      pass(`schema version locked: ${schema} (html ≡ @p31/shared)`);
    }
  }

  // ── 2. Consumer registry checks ───────────────────────────────────────────

  if (!fs.existsSync(registryPath)) {
    warn("cogpass-consumer-registry.ts not found — skipping consumer checks");
    report();
    return;
  }

  const registrySrc = fs.readFileSync(registryPath, "utf8");

  // Extract consumer location paths from the TypeScript source
  const locationMatches = [...registrySrc.matchAll(/location:\s*['"]([^'"]+)['"]/g)];
  const locations = locationMatches.map(m => m[1]);

  let missingLocations = 0;
  for (const loc of locations) {
    const full = path.join(root, loc);
    if (!fs.existsSync(full)) {
      warn(`consumer location not found: ${loc}`);
      missingLocations++;
    }
  }
  if (missingLocations === 0) {
    pass(`all ${locations.length} consumer locations exist`);
  }

  // Extract field groups declared in the registry
  const readsMatches = [...registrySrc.matchAll(/reads:\s*\[([^\]]+)\]/gs)];
  const consumedFields = new Set();
  for (const m of readsMatches) {
    const fieldRefs = [...m[1].matchAll(/['"]([a-z_]+)['"]/g)];
    for (const f of fieldRefs) consumedFields.add(f[1]);
  }

  // Known schema field groups from the alignment doc
  const ALL_FIELD_GROUPS = [
    'subject', 'diagnoses', 'cognitive_profile', 'communication',
    'accessibility', 'products', 'legal', 'financial',
    'ai_allocation', 'daily_schedule', 'influences', 'medications',
  ];

  const orphaned = ALL_FIELD_GROUPS.filter(f => !consumedFields.has(f));
  if (orphaned.length > 0) {
    warn(`field groups with no registered consumer: ${orphaned.join(', ')}`);
  } else {
    pass(`all ${ALL_FIELD_GROUPS.length} field groups have registered consumers`);
  }

  pass(`consumer registry: ${locations.length} consumers, ${consumedFields.size} field groups covered`);

  report();
}

function report() {
  console.log(`\n  Passed: ${passed} | Warned: ${warned} | Failed: ${failed}`);
  if (failed > 0) {
    console.error("\nverify-cognitive-passport-schema: FAIL");
    process.exit(1);
  }
  console.log(`\nverify-cognitive-passport-schema: OK${warned > 0 ? ` (${warned} warning(s))` : ""}`);
}

main();
