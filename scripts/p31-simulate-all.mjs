#!/usr/bin/env node
/**
 * Run every safe simulation in one command. Writes a sandbox at
 *   ~/.p31/simulations/all-<utc>/manifest.json
 *
 * Lanes:
 *   - simulate-social-engine     — wave content + 7-day schedule (no fetch)
 *   - simulate-launch-auto       — chain preview + preflight signals (no run)
 *   - simulate-doc-library-hub   — hub mirror byte-compare (skips without p31ca)
 *   - simulate-delta-language    — DELTA hub vs source (skips without p31ca)
 *   - reports:simulate           — synthetic reports cadence (steady-week)
 *
 *   npm run sim:all
 *   npm run sim:all -- --skip-reports
 *   npm run sim:all -- --json     # writes single JSON to stdout (for CI)
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const args = new Set(process.argv.slice(2));
const skipReports = args.has("--skip-reports");
const skipDoc = args.has("--skip-doc");
const skipDelta = args.has("--skip-delta");
const jsonMode = args.has("--json");

const stamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
const sandbox = path.join(os.homedir(), ".p31", "simulations", `all-${stamp}`);
fs.mkdirSync(sandbox, { recursive: true });

const lanes = [];

function runLane(id, title, command, args = [], extraEnv = {}, captureOutPath = null) {
  const cwd = root;
  const env = { ...process.env, ...extraEnv };
  if (captureOutPath) env.P31_SIM_OUT = captureOutPath;
  const started = Date.now();
  const r = spawnSync(command, args, {
    cwd,
    env,
    stdio: jsonMode ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
  });
  const dur = Date.now() - started;
  const lane = {
    id,
    title,
    command: `${command} ${args.join(" ")}`.trim(),
    durationMs: dur,
    exitCode: r.status,
    ok: r.status === 0,
    capture: captureOutPath ? path.relative(root, captureOutPath) : null,
  };
  if (jsonMode) {
    lane.stdoutTail = (r.stdout || "").split("\n").slice(-15).join("\n");
    lane.stderrTail = (r.stderr || "").split("\n").slice(-15).join("\n");
  }
  if (!jsonMode) {
    console.log(
      `\n${lane.ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m"} ${id} — exit ${lane.exitCode} in ${dur}ms`,
    );
  }
  lanes.push(lane);
  return lane;
}

if (!jsonMode) console.log(`simulate-all: sandbox=${sandbox}\n`);

runLane(
  "social-engine",
  "Social engine wave preview + 7-day schedule",
  "node",
  ["scripts/simulate-social-engine.mjs"],
  {},
  path.join(sandbox, "social-engine.json"),
);

runLane(
  "launch-auto",
  "launch:auto chain preview + preflight signals",
  "node",
  ["scripts/simulate-launch-auto.mjs", "--json"],
  {},
  path.join(sandbox, "launch-auto.json"),
);

if (!skipDoc) {
  runLane("doc-library-hub", "Doc library hub mirror byte-compare", "node", [
    "scripts/simulate-doc-library-hub-mirror.mjs",
  ]);
}

if (!skipDelta) {
  runLane("delta-language-hub", "DELTA language hub vs source", "node", [
    "scripts/simulate-delta-language-hub.mjs",
  ]);
}

if (!skipReports) {
  runLane(
    "reports-steady-week",
    "Reports cadence — steady-week scenario",
    "node",
    ["scripts/p31-reports-simulate.mjs", "--scenario", "steady-week", "--out", path.join(sandbox, "reports-sandbox")],
  );
}

const manifest = {
  schema: "p31.simulationsAll/1.0.0",
  generatedAt: new Date().toISOString(),
  sandbox: path.relative(root, sandbox),
  lanes,
  totals: {
    lanes: lanes.length,
    failures: lanes.filter((l) => !l.ok).length,
  },
};

const manifestPath = path.join(sandbox, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

if (jsonMode) {
  console.log(JSON.stringify(manifest, null, 2));
} else {
  console.log("\nsimulate-all summary:");
  for (const l of lanes) {
    console.log(`  ${l.ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m"} ${l.id.padEnd(20)} ${l.durationMs}ms`);
  }
  console.log(`\nmanifest ${path.relative(root, manifestPath)}`);
}

process.exit(manifest.totals.failures === 0 ? 0 : 1);
