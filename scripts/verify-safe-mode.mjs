#!/usr/bin/env node
/**
 * verify-safe-mode.mjs — CWP-DESIGN-06 acceptance gate
 *
 * Checks that all 4 Bin A surfaces use the shared p31-safe-mode.js module
 * and that the shared module implements the canonical three-trigger contract.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const MODULE_FILE = path.join(root, "public", "lib", "p31-safe-mode.js");
const BIN_A = [
  { file: path.join(root, "public", "passport.html"),     label: "passport" },
  { file: path.join(root, "public", "geodesic.html"),      label: "geodesic" },
  { file: path.join(root, "public", "delta-language.html"),label: "delta-language" },
  { file: path.join(root, "public", "observatory.html"),   label: "observatory" },
];

let exitCode = 0;
function fail(m) { console.error("verify:safe-mode: FAIL —", m); exitCode = 1; }
function ok(m)   { console.log( "verify:safe-mode: ok   —", m); }

// ── 1. Module exists ──────────────────────────────────────────────────────────
if (!fs.existsSync(MODULE_FILE)) {
  fail("public/lib/p31-safe-mode.js missing");
  process.exit(1);
}
ok("p31-safe-mode.js exists");

// ── 2. Module implements canonical three-trigger contract ─────────────────────
const moduleCode = fs.readFileSync(MODULE_FILE, "utf8");
const CONTRACT = [
  { token: "prefers-reduced-motion",  desc: "OS preference trigger" },
  { token: "has('safe')",             desc: "URL param ?safe=1 trigger" },
  { token: "p31-safe-mode",           desc: "localStorage key trigger" },
  { token: "p31:safe-mode",           desc: "custom event dispatch" },
  { token: "safe-mode",               desc: "body.safe-mode class" },
];
for (const { token, desc } of CONTRACT) {
  if (!moduleCode.includes(token)) fail(`module missing contract token '${token}' (${desc})`);
}
ok("module implements three-trigger contract");

// ── 3. Every Bin A surface references the module ──────────────────────────────
let compliant = 0;
for (const { file, label } of BIN_A) {
  if (!fs.existsSync(file)) { fail(`${label}: file missing — ${file}`); continue; }
  const html = fs.readFileSync(file, "utf8");

  if (!html.includes("p31-safe-mode.js")) {
    fail(`${label}: does not reference p31-safe-mode.js`);
  } else {
    // Make sure it's not commented out
    if (/<!--[^>]*p31-safe-mode\.js[^>]*-->/.test(html)) {
      fail(`${label}: p31-safe-mode.js is commented out`);
    } else {
      ok(`${label}: uses p31-safe-mode.js`);
      compliant++;
    }
  }

  // Check it still has a visible Safe Mode button
  if (!html.includes('class="btn-safe') && !html.includes("class='btn-safe")) {
    fail(`${label}: missing .btn-safe button (SOULSAFE requirement)`);
  }
}

// ── 4. WebGL surface (geodesic) listens for p31:safe-mode event ──────────────
const geodesicHtml = BIN_A.find(s => s.label === "geodesic");
if (geodesicHtml && fs.existsSync(geodesicHtml.file)) {
  const html = fs.readFileSync(geodesicHtml.file, "utf8");
  if (!html.includes("p31:safe-mode")) {
    fail("geodesic: does not listen for 'p31:safe-mode' event (WebGL teardown required)");
  } else {
    ok("geodesic: listens for p31:safe-mode event for WebGL teardown");
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
if (exitCode === 0) {
  console.log(`verify:safe-mode: ALL OK — ${compliant}/${BIN_A.length} surfaces compliant`);
} else {
  console.error("verify:safe-mode: FAILED");
}
process.exit(exitCode);
