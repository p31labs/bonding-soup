#!/usr/bin/env node
/**
 * Static gate for the simulation + sync omnibus surface:
 *   - simulator scripts present
 *   - sim:* / sync:all / verify:simulations npm wirings present
 *   - simulate-social-engine renders without error and reports zero failures
 *   - simulate-launch-auto runs in --json mode and emits valid manifest
 *
 * Cheap (offline) — runs in normal verify chain.
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

let fails = 0;
function fail(msg) { fails++; console.error("verify-simulations: FAIL", msg); }
function ok(msg) { console.log("verify-simulations: ok", msg); }

const required = [
  "scripts/simulate-social-engine.mjs",
  "scripts/simulate-launch-auto.mjs",
  "scripts/p31-simulate-all.mjs",
  "scripts/p31-sync-all.mjs",
  "scripts/simulate-doc-library-hub-mirror.mjs",
  "scripts/simulate-delta-language-hub.mjs",
  "scripts/p31-reports-simulate.mjs",
];
for (const f of required) {
  if (!fs.existsSync(path.join(root, f))) fail(`missing ${f}`);
}
if (fails === 0) ok("required simulator scripts present");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
for (const s of ["sim:social", "sim:launch", "sim:all", "sync:all", "verify:simulations", "test:simulations"]) {
  if (!pkg.scripts || !(s in pkg.scripts)) fail(`package.json missing script "${s}"`);
}
if (fails === 0) ok("npm scripts wired");

const workerPath = path.join(
  root,
  "andromeda/04_SOFTWARE/cloudflare-worker/social-drop-automation/worker.js",
);

if (fs.existsSync(workerPath)) {
  const tmp = path.join(os.tmpdir(), `p31-sim-social-${Date.now()}.json`);
  try {
    execSync("node scripts/simulate-social-engine.mjs --json", {
      cwd: root,
      env: { ...process.env, P31_SIM_OUT: tmp },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const m = JSON.parse(fs.readFileSync(tmp, "utf8"));
    if (m.totals.failures > 0) fail(`simulate-social-engine reports ${m.totals.failures} platform char-limit failures`);
    if (m.totals.waves < 1) fail("simulate-social-engine produced 0 waves (extractor broken?)");
    if (m.upcoming.length < 1) fail("simulate-social-engine produced empty schedule preview");
    if (fails === 0) ok(`simulate-social-engine clean (${m.totals.waves} waves, ${m.upcoming.length} schedules, 0 fails)`);
    fs.unlinkSync(tmp);
  } catch (e) {
    fail(`simulate-social-engine errored: ${e?.message || e}`);
  }
} else {
  ok("skip social sim (no andromeda/.../social-drop-automation/worker.js)");
}

try {
  const r = spawnSync("node", ["scripts/simulate-launch-auto.mjs", "--json"], {
    cwd: root,
    encoding: "utf8",
  });
  // exit 1 with blockers is operational (e.g. dirty tree); only crash status (>1) is a verifier failure
  if (r.status !== 0 && r.status !== 1) fail(`simulate-launch-auto crashed (exit ${r.status}): ${r.stderr?.slice(0, 200) || ""}`);
  const m = JSON.parse(r.stdout);
  if (!Array.isArray(m.steps) || m.steps.length < 5) fail(`simulate-launch-auto missing steps (${m.steps?.length || 0})`);
  if (m.schema !== "p31.launchAutoSimulation/1.0.0") fail(`simulate-launch-auto bad schema: ${m.schema}`);
  if (fails === 0) ok(`simulate-launch-auto clean (${m.steps.length} steps, ${m.totals.skips} skips, ${m.totals.blockers} blockers — operational)`);
} catch (e) {
  fail(`simulate-launch-auto errored: ${e?.message || e}`);
}

if (fails > 0) {
  console.error(`\nverify-simulations: ${fails} failure(s)`);
  process.exit(1);
}
console.log("\nverify-simulations: ok");
