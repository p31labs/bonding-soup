#!/usr/bin/env node
/**
 * P31 launch verb — the canonical assembly script.
 *
 * Schema:   p31.launchVerb/1.0.0
 * Doc:      docs/LAUNCH-PACKAGE-2026-05.md
 * Surface:  launch.html (rewritten by --update-readiness)
 *
 * Modes:
 *   npm run launch                       canonical assembly (local only)
 *   npm run launch -- --dry-run          show what WOULD happen, no writes
 *   npm run launch -- --status           print last saved readiness JSON
 *   P31_LAUNCH_PUBLISH=I_UNDERSTAND      additionally git push + p31ca deploy
 *
 * Safety:
 *   - never auto-pushes unless P31_LAUNCH_PUBLISH=I_UNDERSTAND
 *   - never auto-posts to social media (operator-paced by design)
 *   - never deploys without explicit consent flag
 *   - dry-run does no shell work other than `git status --short`
 *
 * Audit:
 *   Each successful run writes ~/.p31/launch-log.jsonl (one line per launch).
 */
"use strict";

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run") || args.has("-n");
const STATUS_ONLY = args.has("--status");
const PUBLISH = process.env.P31_LAUNCH_PUBLISH === "I_UNDERSTAND";
const VERBOSE = args.has("--verbose") || args.has("-v");
const NO_COLOR = !!process.env.NO_COLOR || !process.stdout.isTTY;

/* ───── pretty printing ───── */
const C = NO_COLOR
  ? { teal: s=>s, coral: s=>s, butter: s=>s, phos: s=>s, muted: s=>s, bold: s=>s }
  : {
      teal:   s => `\x1b[36m${s}\x1b[0m`,
      coral:  s => `\x1b[31m${s}\x1b[0m`,
      butter: s => `\x1b[33m${s}\x1b[0m`,
      phos:   s => `\x1b[32m${s}\x1b[0m`,
      muted:  s => `\x1b[90m${s}\x1b[0m`,
      bold:   s => `\x1b[1m${s}\x1b[0m`,
    };

function banner(line) { console.log(C.teal("◍ ") + C.bold(line)); }
function step(n, msg) { console.log("  " + C.muted(`[${n}/${TOTAL_STEPS}]`) + " " + msg); }
function ok(msg)   { console.log("  " + C.phos("✓ ") + msg); }
function warn(msg) { console.log("  " + C.butter("! ") + msg); }
function err(msg)  { console.log("  " + C.coral("✗ ") + msg); }

const LOG_DIR = join(homedir(), ".p31");
const LOG_PATH = join(LOG_DIR, "launch-log.jsonl");
const READINESS_JSON = join(root, ".p31-launch-readiness.json");

/* ───── --status mode (read-only) ───── */
if (STATUS_ONLY) {
  if (!existsSync(READINESS_JSON)) {
    console.log(C.muted("p31 launch — no prior readiness snapshot. Run `npm run launch` to create one."));
    process.exit(0);
  }
  const last = JSON.parse(readFileSync(READINESS_JSON, "utf8"));
  banner("P31 launch readiness — last sweep");
  console.log("");
  console.log("  " + C.muted("at:        ") + last.at);
  console.log("  " + C.muted("commit:    ") + (last.commit || "—"));
  console.log("  " + C.muted("dry-run:   ") + (last.dryRun ? "yes" : "no"));
  console.log("  " + C.muted("publish:   ") + (last.publish ? C.butter("yes") : "no"));
  console.log("");
  console.log(C.bold("  step results"));
  for (const s of last.steps) {
    const mark = s.ok ? C.phos("✓") : C.coral("✗");
    console.log(`    ${mark} ${s.name.padEnd(30)} ${C.muted("(" + (s.durationMs || 0) + "ms)")}`);
  }
  console.log("");
  console.log("  " + C.muted("dashboard: ") + "open launch.html");
  console.log("  " + C.muted("runbook:   ") + "docs/LAUNCH-PACKAGE-2026-05.md");
  process.exit(last.allGreen ? 0 : 1);
}

/* ───── canonical pipeline ───── */
const PIPELINE = [
  // ─── Build phase: regenerate every derived artifact BEFORE verifying anything.
  // Order matters: PWA mirroring can change cognitive-passport/, social-cards/, demos/
  // contents (sw.js + p31-pwa.js drop), so it runs first.
  { name: "build:pwa",                cmd: "npm run build:pwa",               critical: true,  reason: "mirror SW + script into all installable surfaces" },
  { name: "build:demos",              cmd: "npm run build:demos",             critical: true,  reason: "mirror two consolidated artifacts into p31ca" },
  { name: "build:social-cards",       cmd: "npm run build:social-cards",      critical: false, reason: "mirror 10-card kit into p31ca/public/social-cards/ (skip if no andromeda)" },
  { name: "build:launch-page",        cmd: "npm run build:launch-page",       critical: false, reason: "mirror launch.html into p31ca/public/launch.html (skip if no andromeda)" },
  { name: "sync:passport",            cmd: "npm run sync:passport",           critical: false, reason: "regenerate cognitive-passport p31ca mirror (skip if no andromeda)" },
  { name: "build:doc-index",          cmd: "npm run build:doc-index",         critical: false, reason: "rebuild searchable doc library" },

  // ─── Verify phase: every gate that backs a launch promise.
  { name: "verify:alignment",         cmd: "npm run verify:alignment",        critical: true,  reason: "registry coherent" },
  { name: "verify:facts",             cmd: "npm run verify:facts",            critical: true,  reason: "structural invariants" },
  { name: "verify:passport",          cmd: "npm run verify:passport",         critical: false, reason: "p31ca passport mirror byte-match (skips if no andromeda)" },
  { name: "verify:constants",         cmd: "npm run verify:constants",        critical: true,  reason: "Larmor, K₄, ³¹P canon" },
  { name: "verify:demos",             cmd: "npm run verify:demos",            critical: true,  reason: "the two consolidated artifacts ship clean" },
  { name: "verify:pwa",               cmd: "npm run verify:pwa",              critical: true,  reason: "4 manifests + 4 surfaces + per-app mirrors" },
  { name: "verify:public-voice",      cmd: "npm run verify:public-voice",     critical: true,  reason: "identity-first guardrails" },
  { name: "verify:public-sanitization", cmd: "npm run verify:public-sanitization", critical: true, reason: "no kid names, no PII on public surfaces" },
];

const PUBLISH_PIPELINE = [
  { name: "git push (home)",          cmd: "git push origin main",            critical: false, reason: "ship the home repo" },
  // Andromeda + p31ca deploy left to operator's existing CI workflow on push.
  // Adding `cd andromeda && git push origin main && cd andromeda/04_SOFTWARE/p31ca && npm run deploy`
  // requires Cloudflare API token in env; document in launch package §3 instead.
];

const TOTAL_STEPS = PIPELINE.length + (PUBLISH ? PUBLISH_PIPELINE.length : 0) + 1; // +1 = readiness write

/* ───── runner ───── */
function run(cmd) {
  if (DRY_RUN) return { ok: true, durationMs: 0, dryRun: true };
  const t0 = Date.now();
  const r = spawnSync(cmd, [], { shell: true, cwd: root, stdio: VERBOSE ? "inherit" : ["ignore", "pipe", "pipe"] });
  const ms = Date.now() - t0;
  if (r.status === 0) return { ok: true, durationMs: ms };
  return { ok: false, durationMs: ms, stderr: (r.stderr || Buffer.alloc(0)).toString().trim().slice(0, 800) };
}

async function main() {
  banner("P31 LAUNCH — assembly sequence" + (DRY_RUN ? C.butter("  (DRY-RUN)") : "") + (PUBLISH ? C.butter("  (PUBLISH-ENABLED)") : ""));
  console.log(C.muted("  runbook: docs/LAUNCH-PACKAGE-2026-05.md   dashboard: launch.html"));
  console.log(C.muted("  source:  scripts/p31-launch.mjs           audit log: ~/.p31/launch-log.jsonl"));
  console.log("");

  // Operator self-care reminder (printed every run; cannot be silenced)
  console.log(C.butter("  reminder ") + C.muted("calcium · water · spoon assessment · this is NOT on fire · the geometry holds"));
  console.log("");

  const results = [];
  let n = 0;

  for (const stage of PIPELINE) {
    n++;
    step(n, stage.name + C.muted("  — " + stage.reason));
    const r = run(stage.cmd);
    results.push({ name: stage.name, ok: r.ok, durationMs: r.durationMs, dryRun: !!r.dryRun, critical: stage.critical });
    if (r.ok) ok(stage.name + (r.dryRun ? C.muted(" [dry-run]") : C.muted(` (${r.durationMs}ms)`)));
    else if (stage.critical) {
      err(stage.name + C.muted(` failed after ${r.durationMs}ms`));
      if (r.stderr) console.log(C.muted("    stderr: " + r.stderr.split("\n").slice(0, 4).join("\n            ")));
      // Continue collecting for full report, but exit non-zero at end
    } else {
      warn(stage.name + C.muted(" failed (non-critical)"));
    }
  }

  if (PUBLISH) {
    console.log("");
    banner("PUBLISH PHASE — pushing to remotes (P31_LAUNCH_PUBLISH=I_UNDERSTAND)");
    for (const stage of PUBLISH_PIPELINE) {
      n++;
      step(n, stage.name);
      const r = run(stage.cmd);
      results.push({ name: stage.name, ok: r.ok, durationMs: r.durationMs, publish: true });
      if (r.ok) ok(stage.name + C.muted(` (${r.durationMs}ms)`));
      else err(stage.name + C.muted(` failed after ${r.durationMs}ms`));
    }
  } else {
    console.log("");
    console.log(C.muted("  publish phase skipped — set P31_LAUNCH_PUBLISH=I_UNDERSTAND to enable"));
  }

  // Compute readiness state
  const allGreen = results.every(r => r.ok || !r.critical);
  const commit = (() => {
    const r = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" });
    return r.status === 0 ? r.stdout.trim() : null;
  })();
  const snapshot = {
    schema: "p31.launchReadiness/1.0.0",
    at: new Date().toISOString(),
    commit,
    dryRun: DRY_RUN,
    publish: PUBLISH,
    allGreen,
    steps: results,
  };

  // Write readiness snapshot (skip on dry-run)
  n++;
  step(n, "write readiness snapshot");
  if (!DRY_RUN) {
    writeFileSync(READINESS_JSON, JSON.stringify(snapshot, null, 2) + "\n");
    ok(".p31-launch-readiness.json updated");
    // Append audit entry
    try {
      mkdirSync(LOG_DIR, { recursive: true });
      writeFileSync(LOG_PATH, JSON.stringify(snapshot) + "\n", { flag: "a" });
    } catch (e) {
      warn("could not write ~/.p31/launch-log.jsonl (" + e.message + ")");
    }
  } else {
    ok("(dry-run, snapshot not written)");
  }

  console.log("");
  if (allGreen) {
    banner("LAUNCH PACKAGE READY " + C.phos("✓"));
    console.log("");
    console.log("  " + C.bold("next:"));
    console.log("    1. open " + C.teal("launch.html") + " in browser → review readiness dashboard");
    console.log("    2. open " + C.teal("social-cards/index.html") + " → pick 3-5 cards to share");
    console.log("    3. install each PWA on a phone:");
    console.log("       " + C.muted("- ") + "cognitive-passport/index.html");
    console.log("       " + C.muted("- ") + "demos/the-same-shape.html");
    console.log("       " + C.muted("- ") + "demos/the-pulse.html");
    console.log("       " + C.muted("- ") + "social-cards/index.html");
    console.log("    4. read " + C.teal("docs/LAUNCH-PACKAGE-2026-05.md") + " end-to-end one more time");
    console.log("    5. when ready: " + C.coral("P31_LAUNCH_PUBLISH=I_UNDERSTAND npm run launch"));
    console.log("");
    console.log("  " + C.muted("the phosphorus is for all of us · the cage holds · the geometry holds"));
    console.log("");
    process.exit(0);
  } else {
    banner("LAUNCH BLOCKED " + C.coral("✗"));
    console.log("");
    const failed = results.filter(r => !r.ok && r.critical);
    console.log("  " + C.coral(`${failed.length} critical step(s) failed:`));
    for (const f of failed) console.log("    " + C.coral("✗ ") + f.name);
    console.log("");
    console.log("  " + C.muted("rerun the failing step alone with --verbose for full output:"));
    console.log("    " + C.muted("npm run " + failed[0]?.name + "  # or whatever maps"));
    console.log("");
    process.exit(1);
  }
}

main().catch(e => { console.error(C.coral("p31 launch crashed: ") + e.stack); process.exit(2); });
