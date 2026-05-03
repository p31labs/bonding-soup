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
import http from "node:http";

import { rainbowText, rainbowLine, celebrate, isRainbowEnabled } from "./lib/rainbow.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run") || args.has("-n");
const STATUS_ONLY = args.has("--status");
const FULL = args.has("--full") || process.env.P31_LAUNCH_FULL === "1";
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
  console.log("  " + C.muted("mode:      ") + (last.mode || "standard"));
  console.log("  " + C.muted("dry-run:   ") + (last.dryRun ? "yes" : "no"));
  console.log("  " + C.muted("publish:   ") + (last.publish ? C.butter("yes") : "no"));
  if (last.elapsedMs != null) console.log("  " + C.muted("elapsed:   ") + `${(last.elapsedMs/1000).toFixed(1)}s`);
  console.log("");
  console.log(C.bold("  step results"));
  const phaseLabel = (p) => p === "full-build" ? C.muted(" [build]")
                    : p === "full-probe" ? C.muted(" [probe]")
                    : "";
  for (const s of last.steps) {
    const mark = s.ok ? C.phos("✓") : (s.critical === false ? C.butter("⚠") : C.coral("✗"));
    const detail = s.detail ? C.muted(" — " + s.detail) : "";
    console.log(`    ${mark} ${s.name.padEnd(30)} ${C.muted("(" + (s.durationMs || 0) + "ms)")}${phaseLabel(s.phase)}${detail}`);
  }
  if (last.deliverables?.length) {
    console.log("");
    console.log(C.bold("  deliverables present"));
    for (const d of last.deliverables) {
      const mark = d.present ? C.phos("✓") : C.coral("✗");
      const size = d.present ? C.muted(`(${(d.bytes || 0).toLocaleString()} bytes)`) : "";
      console.log(`    ${mark} ${d.label.padEnd(34)} ${size}`);
    }
  }
  console.log("");
  console.log("  " + C.muted("dashboard: ") + "open launch.html");
  console.log("  " + C.muted("runbook:   ") + "docs/LAUNCH-PACKAGE-2026-05.md");
  if (last.allFullGreen && last.mode === "full") {
    console.log("  " + rainbowText("  rainbows: ON · everything green"));
  }
  process.exit(last.allGreen ? 0 : 1);
}

/* ───── canonical pipeline ─────
 *
 * STANDARD pipeline (15 steps): public-surface assembly + verify gates.
 * --full mode (+18): adds 10 extra deliverable builds, then 5 service
 * probes, then 3 wide-net soft verifies (ecosystem glass, fleet probe,
 * MCP bridge static check). Total 33 steps in --full mode.
 *
 * Order rules:
 *   1. Builds run before any verify gate that consumes them.
 *   2. Soft probes run last (after readiness so failures don't mask real
 *      assembly issues).
 */
const PIPELINE = [
  // ─── Build phase (standard): public-facing assembly only.
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

/* ───── --full extras: every other deliverable + service probe ─────
 * Each is non-critical so a single failure doesn't block ship readiness;
 * the readiness JSON records every result so the operator sees the real
 * picture in launch.html and `npm run launch:status`.
 */
const FULL_BUILDS = [
  { name: "build:fleet-portal",       cmd: "npm run build:fleet-portal",      critical: false, reason: "fleet URL index → fleet-portal.html (mirrored to p31ca)" },
  { name: "build:contract-registry",  cmd: "npm run build:contract-registry", critical: false, reason: "62-contract registry JSON (also produces smart-evm manifest)" },
  { name: "build:phos-voice",         cmd: "npm run build:phos-voice",        critical: false, reason: "PHOS voice JSON for the children's companion lib" },
  { name: "build:wiring-ci-ladder",   cmd: "npm run build:wiring-ci-ladder",  critical: false, reason: "regenerate the verify-pipeline ladder doc (84 gates)" },
  { name: "build:verify-pipeline",    cmd: "npm run build:verify-pipeline",   critical: false, reason: "regenerate verifyPipeline.scripts in alignment registry" },
  { name: "build:nav-tree",           cmd: "npm run build:nav-tree",          critical: false, reason: "operator-facing user-nav-tree report" },
  { name: "build:glass-box",          cmd: "npm run build:glass-box",         critical: false, reason: "glass box transparency surface (also rebuilds promoted reports index)" },
  { name: "p31:shipbox",              cmd: "npm run --silent p31:shipbox > p31-shipbox.json", critical: false, reason: "p31.shipbox/1.0.0 JSON handoff snapshot (captured to p31-shipbox.json)" },
  { name: "ollama:mcp:verify",        cmd: "npm run ollama:mcp:verify",       critical: false, reason: "MCP bridge static config check (10 personas exposed as tools)" },
  { name: "verify:fleet-ten",         cmd: "npm run verify:fleet-ten",        critical: false, reason: "10-persona Ollama fleet bundle still consistent" },
];

const FULL_PROBES = [
  { name: "probe:ollama",             critical: false, reason: "local Ollama daemon health (:11434)" },
  { name: "probe:mcp-bridge",         critical: false, reason: "MCP bridge process alive (ollama-mcp/server.mjs)" },
  { name: "probe:command-center",     critical: false, reason: "local command center health (:3131)" },
  { name: "probe:demo-server",        critical: false, reason: "static demo server (:8080)" },
  { name: "probe:tailscale",          critical: false, reason: "Tailscale mesh status (if installed)" },
  { name: "probe:ecosystem-glass",    critical: false, reason: "live HTTP probes against p31-ecosystem.json deployables" },
];

const PUBLISH_PIPELINE = [
  { name: "git push (home)",          cmd: "git push origin main",            critical: false, reason: "ship the home repo" },
  // Andromeda + p31ca deploy left to operator's existing CI workflow on push.
  // Adding `cd andromeda && git push origin main && cd andromeda/04_SOFTWARE/p31ca && npm run deploy`
  // requires Cloudflare API token in env; document in launch package §3 instead.
];

/* ───── deliverable inventory: what's assembled and where it lives ───── */
const DELIVERABLES = [
  { id: "pwa-cogpass",         label: "PWA — Cognitive Passport",   path: "cognitive-passport/index.html" },
  { id: "pwa-social-cards",    label: "PWA — Social Cards (10)",    path: "social-cards/index.html" },
  { id: "pwa-same-shape",      label: "PWA — The Same Shape demo",  path: "demos/the-same-shape.html" },
  { id: "pwa-the-pulse",       label: "PWA — The Pulse demo",       path: "demos/the-pulse.html" },
  { id: "doc-library",         label: "Doc library index",          path: "docs/doc-library/index.json" },
  { id: "launch-html",         label: "Launch readiness dashboard", path: "launch.html" },
  { id: "fleet-portal",        label: "Fleet URL portal",           path: "fleet-portal.html",                                fullOnly: true },
  { id: "contract-registry",   label: "Smart contract registry",    path: "contracts/p31-contract-registry.json",             fullOnly: true },
  { id: "smart-evm",           label: "Smart EVM manifest",         path: "contracts/p31-smart-evm.json",                     fullOnly: true },
  { id: "phos-voice",          label: "PHOS voice JSON",            path: "andromeda/04_SOFTWARE/p31ca/public/lib/p31-phos-voice.json", fullOnly: true },
  { id: "glass-box",           label: "Glass box transparency",     path: "glass-box.html",                                   fullOnly: true },
  { id: "shipbox",             label: "Shipbox handoff JSON",       path: "p31-shipbox.json",                                 fullOnly: true },
  { id: "nav-tree",            label: "User navigation tree",       path: "docs/P31-USER-NAV-TREE.md",                        fullOnly: true },
  { id: "promoted-reports",    label: "Promoted reports index",     path: "docs/reports/promoted/index.json",                 fullOnly: true },
  { id: "alignment-registry",  label: "Alignment registry",         path: "p31-alignment.json" },
  { id: "constants",           label: "P31 constants canon",        path: "p31-constants.json" },
];

/* ───── service probes ───── */
function httpProbe(host, port, path = "/", timeoutMs = 1500, maxBytes = 65536) {
  return new Promise((resolve) => {
    const req = http.request({ host, port, path, method: "GET", timeout: timeoutMs }, (res) => {
      let body = "";
      res.on("data", (c) => { body += c.toString(); if (body.length > maxBytes) req.destroy(); });
      res.on("end", () => resolve({ ok: res.statusCode < 400, status: res.statusCode, body }));
    });
    req.on("error", () => resolve({ ok: false, error: "ECONN" }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "TIMEOUT" }); });
    req.end();
  });
}

async function runProbe(name) {
  const t0 = Date.now();
  let result = { ok: false };
  try {
    if (name === "probe:ollama") {
      const r = await httpProbe("127.0.0.1", 11434, "/api/tags");
      let modelCount = null;
      try { modelCount = JSON.parse(r.body || "{}").models?.length ?? null; } catch {}
      result = { ok: r.ok, detail: r.ok ? `${modelCount ?? "?"} models loaded` : `unreachable (${r.error || r.status})` };
    } else if (name === "probe:mcp-bridge") {
      const r = spawnSync("pgrep", ["-f", "ollama-mcp/server.mjs"], { encoding: "utf8" });
      const pids = (r.stdout || "").trim().split("\n").filter(Boolean);
      result = { ok: pids.length > 0, detail: pids.length > 0 ? `pid ${pids[0]}` : "no process matching ollama-mcp/server.mjs" };
    } else if (name === "probe:command-center") {
      const r = await httpProbe("127.0.0.1", 3131, "/api/health");
      result = { ok: r.ok, detail: r.ok ? `:3131 health OK` : `not running (run: npm run command-center)` };
    } else if (name === "probe:demo-server") {
      const r = await httpProbe("127.0.0.1", 8080, "/");
      result = { ok: r.ok, detail: r.ok ? `:8080 serving` : `not running (run: npm run demo)` };
    } else if (name === "probe:tailscale") {
      const r = spawnSync("tailscale", ["status", "--json"], { encoding: "utf8" });
      if (r.status === 0) {
        try {
          const ts = JSON.parse(r.stdout);
          const peers = Object.values(ts.Peer || {}).filter((p) => p.Online).length;
          result = { ok: true, detail: `${peers} peer(s) online; self ${ts.Self?.HostName || "?"}` };
        } catch { result = { ok: true, detail: "tailscale running (json parse failed)" }; }
      } else {
        result = { ok: false, detail: "tailscale CLI not installed or not logged in (optional)" };
      }
    } else if (name === "probe:ecosystem-glass") {
      const r = spawnSync("npm", ["run", "ecosystem:glass"], { cwd: root, encoding: "utf8" });
      result = { ok: r.status === 0, detail: r.status === 0 ? "all configured live URLs reachable" : `glass probe exit ${r.status}` };
    }
  } catch (e) {
    result = { ok: false, detail: "probe crashed: " + e.message };
  }
  return { ...result, durationMs: Date.now() - t0 };
}

function deliverableInventory() {
  return DELIVERABLES.filter(d => FULL || !d.fullOnly).map(d => {
    try {
      const stat = statSync(join(root, d.path));
      return { ...d, present: true, bytes: stat.size, modifiedAt: stat.mtime.toISOString() };
    } catch {
      return { ...d, present: false };
    }
  });
}

const TOTAL_STEPS =
  PIPELINE.length
  + (FULL ? FULL_BUILDS.length + FULL_PROBES.length : 0)
  + (PUBLISH ? PUBLISH_PIPELINE.length : 0)
  + 1; // +1 = readiness write

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
  const t0 = Date.now();
  const modeTag = FULL
    ? (isRainbowEnabled() ? "  " + rainbowText("[ FULL ASSEMBLY · rainbows ON ]") : "  [ FULL ASSEMBLY ]")
    : "";
  banner("P31 LAUNCH — assembly sequence" + modeTag + (DRY_RUN ? C.butter("  (DRY-RUN)") : "") + (PUBLISH ? C.butter("  (PUBLISH-ENABLED)") : ""));
  console.log(C.muted("  runbook: docs/LAUNCH-PACKAGE-2026-05.md   dashboard: launch.html"));
  console.log(C.muted("  source:  scripts/p31-launch.mjs           audit log: ~/.p31/launch-log.jsonl"));
  if (FULL) console.log(C.muted("  mode:    --full (10 extra builds + 6 service probes + rainbow finale)"));
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
    results.push({ name: stage.name, ok: r.ok, durationMs: r.durationMs, dryRun: !!r.dryRun, critical: stage.critical, phase: "standard" });
    if (r.ok) ok(stage.name + (r.dryRun ? C.muted(" [dry-run]") : C.muted(` (${r.durationMs}ms)`)));
    else if (stage.critical) {
      err(stage.name + C.muted(` failed after ${r.durationMs}ms`));
      if (r.stderr) console.log(C.muted("    stderr: " + r.stderr.split("\n").slice(0, 4).join("\n            ")));
      // Continue collecting for full report, but exit non-zero at end
    } else {
      warn(stage.name + C.muted(" failed (non-critical)"));
    }
  }

  // ─── --full extras: extra deliverable builds + service probes ───
  if (FULL) {
    console.log("");
    if (isRainbowEnabled()) console.log("  " + rainbowLine(60));
    banner("FULL ASSEMBLY — extra deliverables");
    for (const stage of FULL_BUILDS) {
      n++;
      step(n, stage.name + C.muted("  — " + stage.reason));
      const r = run(stage.cmd);
      results.push({ name: stage.name, ok: r.ok, durationMs: r.durationMs, dryRun: !!r.dryRun, critical: stage.critical, phase: "full-build" });
      if (r.ok) ok(stage.name + (r.dryRun ? C.muted(" [dry-run]") : C.muted(` (${r.durationMs}ms)`)));
      else warn(stage.name + C.muted(` failed after ${r.durationMs}ms (non-critical)`));
    }

    console.log("");
    if (isRainbowEnabled()) console.log("  " + rainbowLine(60));
    banner("FULL ASSEMBLY — local service probes");
    for (const stage of FULL_PROBES) {
      n++;
      step(n, stage.name + C.muted("  — " + stage.reason));
      if (DRY_RUN) {
        results.push({ name: stage.name, ok: true, durationMs: 0, dryRun: true, critical: false, phase: "full-probe", detail: "(dry-run)" });
        ok(stage.name + C.muted(" [dry-run]"));
        continue;
      }
      const r = await runProbe(stage.name);
      results.push({ name: stage.name, ok: r.ok, durationMs: r.durationMs, critical: false, phase: "full-probe", detail: r.detail });
      if (r.ok) ok(stage.name + C.muted(` (${r.durationMs}ms · ${r.detail})`));
      else warn(stage.name + C.muted(` ${r.detail || "down"} (non-critical)`));
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
  // Assembly-complete: all critical + all full-builds green. Probes are
  // informational (operator may not have command-center running on the
  // current machine; tailscale is optional). The rainbow fires when the
  // SHIP is complete, not when every ancillary local service is up.
  const assemblyComplete = results.every(r => r.ok || r.phase === "full-probe");
  const allFullGreen = results.every(r => r.ok); // strictest: every step green
  const commit = (() => {
    const r = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" });
    return r.status === 0 ? r.stdout.trim() : null;
  })();
  const deliverables = deliverableInventory();
  const snapshot = {
    schema: "p31.launchReadiness/1.0.0",
    at: new Date().toISOString(),
    commit,
    mode: FULL ? "full" : "standard",
    dryRun: DRY_RUN,
    publish: PUBLISH,
    allGreen,
    allFullGreen,
    assemblyComplete,
    deliverables,
    steps: results,
    elapsedMs: Date.now() - t0,
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
    if (FULL && assemblyComplete) {
      // RAINBOW FINALE — every standard step + every extra deliverable build green.
      // Probes are reported but don't gate the celebration: a missing local
      // command-center on this machine doesn't mean the ship isn't ready.
      celebrate({
        steps: results.length,
        deliverables: deliverables.filter(d => d.present).length,
        services: results.filter(r => r.phase === "full-probe" && r.ok).length,
        ms: snapshot.elapsedMs,
        commit,
      });
      const probesUp = results.filter(r => r.phase === "full-probe" && r.ok);
      const probesDown = results.filter(r => r.phase === "full-probe" && !r.ok);
      if (probesDown.length) {
        console.log("  " + C.muted("local services this run:"));
        for (const p of probesUp) console.log("    " + C.phos("✓ ") + p.name + C.muted(" — " + (p.detail || "ok")));
        for (const p of probesDown) console.log("    " + C.butter("⚠ ") + p.name + C.muted(" — " + (p.detail || "down")));
        console.log("");
      }
      console.log("  " + C.bold("next:"));
      console.log("    1. open " + C.teal("launch.html") + " — Deliverables + Services panels are live");
      console.log("    2. install the PWAs on a phone (4 installable surfaces)");
      console.log("    3. when ready to publish: " + C.coral("P31_LAUNCH_PUBLISH=I_UNDERSTAND npm run launch -- --full"));
      console.log("");
      process.exit(0);
    }
    banner("LAUNCH PACKAGE READY " + C.phos("✓") + (FULL ? C.butter("  (full mode, some non-critical probes amber)") : ""));
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
    console.log("    5. when ready: " + C.coral("P31_LAUNCH_PUBLISH=I_UNDERSTAND npm run launch") + (FULL ? " -- --full" : ""));
    console.log("");
    if (FULL) {
      const amber = results.filter(r => !r.ok && !r.critical);
      if (amber.length) {
        console.log("  " + C.butter("amber probes/builds:"));
        for (const a of amber) console.log("    " + C.butter("⚠ ") + a.name + (a.detail ? C.muted("  — " + a.detail) : ""));
        console.log("");
      }
    }
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
