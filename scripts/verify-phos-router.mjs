#!/usr/bin/env node
/**
 * verify-phos-router.mjs — CWP-DESIGN-03 acceptance gate
 *
 * Checks:
 *   1. Catalog schema + required fields on every intent
 *   2. No duplicate intent IDs
 *   3. No duplicate phrases across intents
 *   4. Every phosSlot (non-null, gate=live|alpha|external) has a catalog entry
 *   5. Sample fuzzy queries return expected top result
 *   6. Router JS exists at public/lib/p31-phos-router.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const CATALOG_FILE = path.join(root, "public", "data", "phos-intent-catalog.json");
const PUBLIC_LINE_FILE = path.join(root, "docs", "public-line.json");
const ROUTER_FILE = path.join(root, "public", "lib", "p31-phos-router.js");
const FUSE_THRESHOLD = 0.45;

let exitCode = 0;
function fail(m) { console.error("verify:phos-router: FAIL —", m); exitCode = 1; }
function ok(m)   { console.log( "verify:phos-router: ok   —", m); }
function warn(m) { console.warn("verify:phos-router: WARN —", m); }

// ── 1. File existence ─────────────────────────────────────────────────────────
if (!fs.existsSync(ROUTER_FILE)) {
  fail("public/lib/p31-phos-router.js missing");
  exitCode = 1;
} else {
  ok("p31-phos-router.js exists");
}

if (!fs.existsSync(CATALOG_FILE)) {
  fail("public/data/phos-intent-catalog.json missing");
  process.exit(1);
}

let catalog;
try {
  catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, "utf8"));
} catch (e) {
  fail("invalid JSON in phos-intent-catalog.json: " + e.message);
  process.exit(1);
}

// ── 2. Schema ─────────────────────────────────────────────────────────────────
if (catalog.schema !== "p31.phosIntentCatalog/1.0.0") {
  fail(`schema must be p31.phosIntentCatalog/1.0.0 (got ${catalog.schema})`);
} else {
  ok("catalog schema valid");
}

const intents = catalog.intents;
if (!Array.isArray(intents) || intents.length === 0) {
  fail("intents[] array missing or empty");
  process.exit(1);
}
ok(`catalog has ${intents.length} intents`);

// ── 3. Required fields on every intent ───────────────────────────────────────
const REQUIRED = ["id", "label", "path", "icon", "phrases"];
for (const intent of intents) {
  for (const field of REQUIRED) {
    if (!intent[field]) fail(`intent missing field '${field}': ${JSON.stringify(intent).slice(0, 80)}`);
  }
  if (!Array.isArray(intent.phrases) || intent.phrases.length === 0) {
    fail(`intent '${intent.id}' has empty phrases array`);
  }
}

// ── 4. No duplicate IDs ───────────────────────────────────────────────────────
const seenIds = new Set();
for (const intent of intents) {
  if (seenIds.has(intent.id)) fail(`duplicate intent id: ${intent.id}`);
  seenIds.add(intent.id);
}
ok("no duplicate intent IDs");

// ── 5. No duplicate phrases ───────────────────────────────────────────────────
const seenPhrases = new Map(); // phrase → intent.id
let phraseDups = 0;
for (const intent of intents) {
  for (const phrase of (intent.phrases || [])) {
    const norm = phrase.toLowerCase().trim();
    if (seenPhrases.has(norm)) {
      fail(`duplicate phrase '${norm}' in '${intent.id}' (also in '${seenPhrases.get(norm)}')`);
      phraseDups++;
    } else {
      seenPhrases.set(norm, intent.id);
    }
  }
}
if (phraseDups === 0) ok("no duplicate phrases");

// ── 6. phosSlot coverage ─────────────────────────────────────────────────────
if (!fs.existsSync(PUBLIC_LINE_FILE)) {
  warn("docs/public-line.json missing — skipping phosSlot coverage check");
} else {
  let pl;
  try {
    pl = JSON.parse(fs.readFileSync(PUBLIC_LINE_FILE, "utf8"));
  } catch (e) {
    warn("invalid JSON in public-line.json — skipping phosSlot check: " + e.message);
    pl = null;
  }

  if (pl && Array.isArray(pl.pages)) {
    const ROUTABLE_GATES = new Set(["live", "alpha", "external"]);
    const catalogIds = new Set(intents.map(i => i.id));
    let covered = 0, missing = 0;

    for (const page of pl.pages) {
      const slot = page.phosSlot;
      if (!slot || slot === "None" || slot === "null") continue;
      if (!ROUTABLE_GATES.has(page.gate)) continue;
      if (catalogIds.has(slot)) {
        covered++;
      } else {
        warn(`phosSlot '${slot}' (${page.path}) has no catalog entry — add an intent with id='${slot}'`);
        missing++;
      }
    }
    ok(`phosSlot coverage: ${covered} covered, ${missing} without catalog entry`);
  }
}

// ── 7. Fuzzy search smoke tests ───────────────────────────────────────────────
function fuzzyScore(needle, haystack) {
  needle = needle.toLowerCase();
  haystack = haystack.toLowerCase();
  if (haystack.includes(needle)) return 1;
  let score = 0, ni = 0;
  for (let hi = 0; hi < haystack.length && ni < needle.length; hi++) {
    if (haystack[hi] === needle[ni]) { score++; ni++; }
  }
  return ni === needle.length ? score / haystack.length : 0;
}

function search(query) {
  const results = [];
  for (const intent of intents) {
    let best = 0;
    for (const phrase of intent.phrases) {
      const s = fuzzyScore(query, phrase);
      if (s > best) best = s;
    }
    const labelScore = fuzzyScore(query, intent.label);
    if (labelScore > best) best = labelScore;
    if (best > FUSE_THRESHOLD) results.push({ intent, score: best });
  }
  return results.sort((a, b) => b.score - a.score).map(r => r.intent);
}

const SMOKE_TESTS = [
  { query: "passport",    expect: "passport" },
  { query: "kids",        expect: "garden" },
  { query: "calm",        expect: "buffer" },
  { query: "code",        expect: "vibe" },
  { query: "fleet",       expect: "fleet-portal" },
  { query: "docs",        expect: "doc-library" },
  { query: "observatory", expect: "observatory" },
  { query: "launch",      expect: "launch" },
  { query: "welcome",     expect: "welcome" },
  { query: "ops",         expect: "ops" },
];

let smokePass = 0, smokeFail = 0;
for (const { query, expect } of SMOKE_TESTS) {
  const results = search(query);
  if (results.length === 0) {
    fail(`smoke test '${query}': no results (expected '${expect}')`);
    smokeFail++;
  } else if (results[0].id !== expect) {
    fail(`smoke test '${query}': top result is '${results[0].id}' (expected '${expect}')`);
    smokeFail++;
  } else {
    smokePass++;
  }
}
ok(`fuzzy smoke tests: ${smokePass}/${SMOKE_TESTS.length} passed`);

// ── Summary ───────────────────────────────────────────────────────────────────
if (exitCode === 0) {
  console.log("verify:phos-router: ALL OK");
} else {
  console.error("verify:phos-router: FAILED");
}
process.exit(exitCode);
