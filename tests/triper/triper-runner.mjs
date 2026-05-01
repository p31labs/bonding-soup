#!/usr/bin/env node
/**
 * P31 TRIPER Master Runner
 * Runs each MVP TRIPER suite in sequence. Gate: all must pass before combined.
 * Usage:
 *   node tests/triper/triper-runner.mjs               # all suites
 *   node tests/triper/triper-runner.mjs bonding        # single suite
 *   node tests/triper/triper-runner.mjs --cert         # full cert run (triper + combined gate)
 */
import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const LOGS = path.join(__dirname, "logs");

fs.mkdirSync(LOGS, { recursive: true });

const SUITES = [
  { name: "bonding",  label: "BONDING — Molecular builder" },
  { name: "cars",     label: "C.A.R.S. — Root bonding-soup engine" },
  { name: "personal", label: "PERSONAL — SIMPLEX + Passport + K₄ personal" },
  { name: "hub",      label: "HUB — p31ca technical hub" },
  { name: "mesh",     label: "MESH — K₄ cage + hubs + personal" },
  { name: "simplex",  label: "SIMPLEX — v7 agent layer" },
  { name: "email",    label: "EMAIL — simplex-email Worker" },
  { name: "epcp",     label: "EPCP — Command center" },
  { name: "geodesic",           label: "GEODESIC — GeodesicRoom WS" },
  { name: "p31ca-user-sentinel", label: "P31CA USER SENTINEL — E2E swarm (visitor · builder · family · legal · integrity)" },
];

const args = process.argv.slice(2);
const certMode = args.includes("--cert");
const singleSuite = args.find((a) => !a.startsWith("--"));

const suitesToRun = singleSuite
  ? SUITES.filter((s) => s.name === singleSuite)
  : SUITES;

if (singleSuite && suitesToRun.length === 0) {
  console.error(`Unknown suite: ${singleSuite}`);
  console.error(`Available: ${SUITES.map((s) => s.name).join(", ")}`);
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logFile = path.join(LOGS, `triper-${timestamp}.log`);
const results = [];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + "\n");
}

function runSuite(suite) {
  const testPattern = `tests/mvp/${suite.name}/${suite.name}.triper.test.mjs`;
  log(`\n${"═".repeat(60)}`);
  log(`TRIPER: ${suite.label}`);
  log(`${"─".repeat(60)}`);

  const result = spawnSync(
    "node",
    [
      "node_modules/.bin/vitest",
      "run",
      "--config", "vitest.triper.config.mjs",
      "--reporter", "verbose",
      testPattern,
    ],
    {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env },
    }
  );

  const passed = result.status === 0;
  results.push({ suite: suite.name, label: suite.label, passed });

  if (passed) {
    log(`PASS ✓ ${suite.label}`);
  } else {
    log(`FAIL ✗ ${suite.label}`);
  }

  return passed;
}

// ─── Run suites ───────────────────────────────────────────────
log(`P31 TRIPER RUN — ${new Date().toISOString()}`);
log(`Suites: ${suitesToRun.map((s) => s.name).join(", ")}`);
log(`Log: ${logFile}`);

let allPassed = true;
for (const suite of suitesToRun) {
  const passed = runSuite(suite);
  if (!passed) allPassed = false;
}

// ─── Summary ──────────────────────────────────────────────────
log(`\n${"═".repeat(60)}`);
log("TRIPER SUMMARY");
log("═".repeat(60));
for (const r of results) {
  log(`  ${r.passed ? "PASS ✓" : "FAIL ✗"} ${r.label}`);
}
log("─".repeat(60));

const passCount = results.filter((r) => r.passed).length;
const failCount = results.filter((r) => !r.passed).length;
log(`${passCount}/${results.length} suites passed`);

if (allPassed) {
  log("\nGATE: ALL TRIPERS GREEN — mesh integration authorized");
} else {
  log(`\nGATE: BLOCKED — ${failCount} suite(s) failed`);
  log("Fix failing suites before running combined suite.");
}

// ─── Certification log ────────────────────────────────────────
const certRecord = {
  timestamp: new Date().toISOString(),
  suites: results,
  gateStatus: allPassed ? "AUTHORIZED" : "BLOCKED",
  certMode,
};
const certLog = path.join(LOGS, `cert-${timestamp}.json`);
fs.writeFileSync(certLog, JSON.stringify(certRecord, null, 2));
log(`\nCert record: ${certLog}`);

process.exit(allPassed ? 0 : 1);
