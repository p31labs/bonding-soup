#!/usr/bin/env node
/**
 * Validate docs/public-line.json production gate registry.
 * Rules:
 *   - Every page with gate="live" must have phosReady=true OR be listed with
 *     a phosSlot=null (non-bus-bar page; phosReady is optional for those).
 *   - PHOS bus bar slots (phosSlot != null) with gate="live" must have phosReady=true.
 *   - No page with gate="gap" is acceptable — these are P0 build gaps.
 *   - No page with gate="gate1" or gate="gate2" should have a phosSlot
 *     (bus bar slots must be live).
 *   - Every flag in docs/flags.json with enabled=true must have a corresponding
 *     public-line.json entry with gate="live" or gate="external".
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PL_FILE = path.join(root, "docs", "public-line.json");
const FLAGS_FILE = path.join(root, "docs", "flags.json");

const warn = (m) => console.warn("verify:public-line: WARN —", m);
const fail = (m) => { console.error("verify:public-line: FAIL —", m); process.exitCode = 1; };
const ok   = (m) => console.log("verify:public-line: ok —", m);

if (!fs.existsSync(PL_FILE)) {
  fail("docs/public-line.json missing — run scripts/audit-pages.mjs to bootstrap");
  process.exit(1);
}

let pl, flags;
try { pl = JSON.parse(fs.readFileSync(PL_FILE, "utf8")); }
catch (e) { fail("invalid JSON in docs/public-line.json: " + e.message); process.exit(1); }

if (pl.schema !== "p31.publicLine/1.0.0") fail(`schema must be p31.publicLine/1.0.0 (got ${pl.schema})`);
if (!Array.isArray(pl.pages)) { fail("pages[] array required"); process.exit(1); }

const VALID_GATES = new Set(["live", "gate3", "gate2", "gate1", "maintenance", "alpha", "external", "gap"]);

// ── Check each page entry ─────────────────────────────────────────────────────
let liveCount = 0, gapCount = 0, warnCount = 0;
const paths = new Set();

for (const p of pl.pages) {
  if (!p.path) { fail("entry missing path"); continue; }
  if (paths.has(p.path)) { fail(`duplicate path: ${p.path}`); continue; }
  paths.add(p.path);

  if (!VALID_GATES.has(p.gate)) {
    fail(`${p.path}: invalid gate "${p.gate}" (must be one of: ${[...VALID_GATES].join(", ")})`);
  }

  if (p.gate === "gap") {
    // Hard fail only in release:check (RELEASE_CHECK=1 env); warn in regular verify
    if (process.env.RELEASE_CHECK) {
      fail(`${p.path}: gate=gap — no page exists. Blocks release. Build or redirect before shipping.`);
    } else {
      warn(`${p.path}: gate=gap — no page exists. P0 gap, must fix before release:check.`);
      warnCount++;
    }
    gapCount++;
    continue;
  }

  if (p.p0Gap) {
    if (process.env.RELEASE_CHECK) {
      fail(`${p.path}: p0Gap=true — must reach gate=live before release. ${p.notes || ""}`);
    } else {
      warn(`${p.path}: p0Gap=true — required before release:check. ${p.notes || ""}`);
      warnCount++;
    }
  }

  if (p.gate === "live") {
    liveCount++;
    // Bus bar slots must have phosReady=true to ensure voice copy is written
    if (p.phosSlot && !p.phosReady) {
      fail(`${p.path}: gate=live AND phosSlot="${p.phosSlot}" but phosReady=false — write §4 PHOS copy before this slot goes live`);
    }
    // Warn (not fail) for non-bus-bar live pages without phos copy
    if (!p.phosSlot && !p.phosReady) {
      warn(`${p.path}: gate=live but phosReady=false — §4 copy will improve user routing`);
      warnCount++;
    }
  }

  if ((p.gate === "gate1" || p.gate === "gate2") && p.phosSlot) {
    fail(`${p.path}: PHOS bus bar slot "${p.phosSlot}" must reach gate=live before going into bus bar nav`);
  }
}

// ── Cross-check flags.json ─────────────────────────────────────────────────────
if (fs.existsSync(FLAGS_FILE)) {
  try { flags = JSON.parse(fs.readFileSync(FLAGS_FILE, "utf8")); }
  catch (e) { warn("could not parse docs/flags.json — skipping flag cross-check"); }

  if (flags?.surfaces) {
    for (const [id, flag] of Object.entries(flags.surfaces)) {
      if (!flag.enabled) continue;
      // Enabled flag should have a corresponding live or external entry in public-line
      const entry = pl.pages.find(p => p.path === `/${id}` || p.path === `/${id}.html` || p.path === `/${id}/`);
      if (!entry) {
        warn(`flags.json surface "${id}" is enabled=true but has no entry in public-line.json`);
        warnCount++;
      } else if (entry.gate !== "live" && entry.gate !== "external") {
        fail(`flags.json surface "${id}" is enabled=true but public-line.json gate="${entry.gate}" — surface must reach gate=live before flag is enabled`);
      }
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
if (process.exitCode === 1) {
  console.error(`\nverify:public-line: FAILED — fix errors above before shipping`);
} else {
  ok(`${liveCount} live surfaces · ${gapCount === 0 ? "no gaps" : gapCount + " gaps"} · ${warnCount} warnings`);
}
