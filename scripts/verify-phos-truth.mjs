#!/usr/bin/env node
/**
 * verify-phos-truth.mjs — fact-anchor for phosphorus31.org/website.
 *
 * Grant reviewers refresh that page. Prose claims must match canon.
 *
 * Today this verifier guards exactly one invariant: the Zenodo
 * publication count in `phosphorus31.org/website/index.html` must match
 * `p31-constants.json` → `research.zenodoPublicationCount`. The page
 * currently states this number in two places (hero "See all N publications"
 * and footer "ZENODO (N PAPERS)"); both must agree with constants.
 *
 * When new fact-anchors get added (test count from CI, deploy date,
 * mesh node count), extend this file rather than scattering greps.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const PAGE = path.join(root, "phosphorus31.org/website/index.html");
const CONSTANTS = path.join(root, "p31-constants.json");

function die(msg) {
  console.error(`verify-phos-truth: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(PAGE)) {
  console.log(`verify-phos-truth: skipped (no ${path.relative(root, PAGE)} in this clone)`);
  process.exit(0);
}
if (!fs.existsSync(CONSTANTS)) die(`missing ${path.basename(CONSTANTS)}`);

const html = fs.readFileSync(PAGE, "utf8");
const constants = JSON.parse(fs.readFileSync(CONSTANTS, "utf8"));

const expected = constants?.research?.zenodoPublicationCount;
if (typeof expected !== "number" || expected < 1) {
  die("p31-constants.json research.zenodoPublicationCount missing or invalid");
}

/* Two anchors in the page that must match expected count.
 * Patterns kept loose enough to survive small copy edits but strict enough
 * to catch drift. */
const anchors = [
  {
    name: 'hero "See all N publications"',
    re: /See all\s+(\d+)\s+publications/i,
  },
  {
    name: 'footer "ZENODO (N PAPERS)"',
    re: /ZENODO\s*\(\s*(\d+)\s*PAPERS?\s*\)/i,
  },
];

let failed = 0;
for (const a of anchors) {
  const m = a.re.exec(html);
  if (!m) {
    console.error(`verify-phos-truth: anchor not found — ${a.name}`);
    failed++;
    continue;
  }
  const got = Number.parseInt(m[1], 10);
  if (got !== expected) {
    console.error(
      `verify-phos-truth: drift — ${a.name} says ${got}, p31-constants says ${expected}`
    );
    failed++;
    continue;
  }
  console.log(`verify-phos-truth: OK — ${a.name} = ${got}`);
}

/* Negative checks (informational only — fail loud if a known-dead pattern
 * ever reappears).
 *
 * Operator audit 2026-04-30 found NO instances of these. They're guarded
 * here so they stay gone. */
const negatives = [
  { name: "buffer.com link", re: /https?:\/\/(www\.)?buffer\.com/i },
  { name: "bufferapp.com link", re: /https?:\/\/(www\.)?bufferapp\.com/i },
];
for (const n of negatives) {
  if (n.re.test(html)) {
    console.error(`verify-phos-truth: forbidden pattern present — ${n.name}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`verify-phos-truth: ${failed} check(s) failed`);
  process.exit(1);
}

console.log(
  `verify-phos-truth: OK (Zenodo count anchored to constants = ${expected})`
);
