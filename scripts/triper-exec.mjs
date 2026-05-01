#!/usr/bin/env node
/**
 * TRIPER Execution Runner
 * Runs the actual underlying test suite for each MVP — not just structural checks.
 * This is the "spin up the reactor" phase — after structural TRIPER passes, exec verifies
 * each system actually operates under load.
 *
 * Usage:
 *   node scripts/triper-exec.mjs               # all MVPs
 *   node scripts/triper-exec.mjs bonding        # single MVP
 *   node scripts/triper-exec.mjs --soft         # non-blocking (report failures, don't exit 1)
 *   node scripts/triper-exec.mjs --skip-network # skip network-dependent checks
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ANDROMEDA = path.join(ROOT, "andromeda/04_SOFTWARE");
const P31CA = path.join(ANDROMEDA, "p31ca");
const BONDING_MONO = path.join(ANDROMEDA, "bonding");

const args = process.argv.slice(2);
const soft = args.includes("--soft");
const skipNetwork = args.includes("--skip-network");
const singleSuite = args.find((a) => !a.startsWith("--"));

const ANSI = {
  green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m",
  cyan: "\x1b[36m", bold: "\x1b[1m", reset: "\x1b[0m", dim: "\x1b[2m",
};

function log(msg) { console.log(msg); }
function ok(msg) { log(`${ANSI.green}  ✓${ANSI.reset} ${msg}`); }
function fail(msg) { log(`${ANSI.red}  ✗${ANSI.reset} ${msg}`); }
function skip(msg) { log(`${ANSI.yellow}  ↷${ANSI.reset} ${msg}`); }
function section(label) {
  log(`\n${ANSI.cyan}${ANSI.bold}[EXEC] ${label}${ANSI.reset}`);
  log("─".repeat(50));
}

function run(cmd, cwd = ROOT, extraEnv = {}) {
  const result = spawnSync("bash", ["-c", cmd], {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  return result.status === 0;
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

// ─── Per-MVP execution suites ────────────────────────────────

const SUITES = {
  bonding: {
    label: "BONDING — Molecular builder",
    steps: [
      {
        title: "Mock WS probe (relay contract smoke)",
        cmd: "npm run test:mock-ws",
        skipIf: () => !exists("scripts/bonding-mock-ws-probe.mjs"),
        skipMsg: "bonding-mock-ws-probe.mjs missing",
      },
      {
        title: "BONDING monorepo test suite (424 tests)",
        cmd: "npm test",
        cwd: BONDING_MONO,
        skipIf: () => !fs.existsSync(BONDING_MONO),
        skipMsg: "andromeda/04_SOFTWARE/bonding not present (partial clone)",
      },
      {
        title: "verify:cars-wire (wire contract alignment)",
        cmd: "npm run verify:cars-wire",
      },
    ],
  },

  cars: {
    label: "C.A.R.S. — Root bonding-soup engine",
    steps: [
      {
        title: "TypeScript build (tsc → dist/)",
        cmd: "npm run build",
      },
      {
        title: "soup:prep:check (dist/ validation)",
        cmd: "npm run soup:prep:check",
      },
      {
        title: "verify:cars-wire (SoupEngine wire alignment)",
        cmd: "npm run verify:cars-wire",
      },
    ],
  },

  personal: {
    label: "PERSONAL — SIMPLEX + Passport + K₄ personal",
    steps: [
      {
        title: "verify:passport (root generator → p31ca mirror parity)",
        cmd: "npm run verify:passport",
      },
      {
        title: "verify:cognitive-passport-schema (JSON schema)",
        cmd: "npm run verify:cognitive-passport-schema",
      },
      {
        title: "verify:cognitive-passport-profiles (audience matrix)",
        cmd: "npm run verify:cognitive-passport-profiles",
        skipIf: () => !fs.existsSync(path.join(ROOT, "andromeda")),
        skipMsg: "andromeda not present (profiles check requires @p31/shared types)",
      },
      {
        title: "verify:k4-personal (wrangler bundle dry-run)",
        cmd: "npm run verify:k4-personal",
        skipIf: () => !fs.existsSync(path.join(ANDROMEDA, "k4-personal")),
        skipMsg: "k4-personal not present (partial clone)",
      },
    ],
  },

  hub: {
    label: "HUB — p31ca technical hub",
    steps: [
      {
        title: "verify:p31ca-contracts (ground-truth + synergetic + economy)",
        cmd: "npm run verify:p31ca-contracts",
        skipIf: () => !fs.existsSync(P31CA),
        skipMsg: "p31ca not present (partial clone)",
      },
      {
        title: "verify:p31-style (design tokens → CSS)",
        cmd: "npm run verify:p31-style",
      },
      {
        title: "verify:ground-truth (hub routes)",
        cmd: "npm run verify:ground-truth",
        skipIf: () => !fs.existsSync(P31CA),
        skipMsg: "p31ca not present",
      },
    ],
  },

  mesh: {
    label: "MESH — K₄ cage + hubs + personal",
    steps: [
      {
        title: "verify:mesh-offline (shape vs constants, no network)",
        cmd: "npm run verify:mesh-offline",
      },
      {
        title: "verify:mesh-canon (canonical mesh shape)",
        cmd: "npm run verify:mesh-canon",
      },
      {
        title: "verify:k4-agent-hub (agent hub package)",
        cmd: "npm run verify:k4-agent-hub",
      },
      {
        title: "verify:ecosystem (glass probe templates + mesh URL match)",
        cmd: "npm run verify:ecosystem",
      },
      {
        title: "k4-agent-hub smoke (--skip-network)",
        cmd: "npm run k4-agent-hub:smoke:offline",
        skipIf: () => skipNetwork,
        skipMsg: "--skip-network",
      },
    ],
  },

  simplex: {
    label: "SIMPLEX — v7 agent layer",
    steps: [
      {
        title: "SIMPLEX-v7 typecheck (tsc)",
        cmd: "npm run typecheck --prefix simplex-v7",
      },
      {
        title: "SIMPLEX-v7 Vitest (20+ tests: HMAC, voltage, medication, spoons…)",
        cmd: "npm run test --prefix simplex-v7",
      },
      {
        title: "verify:simplex-bootstrap (CF bring-up dry-run)",
        cmd: "npm run verify:simplex-bootstrap",
      },
    ],
  },

  email: {
    label: "EMAIL — simplex-email Worker",
    steps: [
      {
        title: "simplex-email typecheck (tsc)",
        cmd: "npm run verify:simplex-email",
      },
    ],
  },

  epcp: {
    label: "EPCP — Command center",
    steps: [
      {
        title: "command-center server smoke",
        cmd: "node scripts/command-center/server-smoke.mjs",
      },
      {
        title: "command-center integration (local protocol)",
        cmd: "node scripts/command-center/integration-local.mjs",
        skipIf: () => !exists("scripts/command-center/integration-local.mjs"),
        skipMsg: "integration-local.mjs not present",
      },
      {
        title: "verify:glass-box (transparency terminal)",
        cmd: "npm run verify:glass-box",
      },
    ],
  },

  geodesic: {
    label: "GEODESIC — GeodesicRoom WS",
    steps: [
      {
        title: "verify:geodesic-wire-fixtures (WS wire contract)",
        cmd: "npm run verify:geodesic-wire-fixtures",
      },
      {
        title: "verify:quantum-deck (visual layer)",
        cmd: "npm run verify:quantum-deck",
      },
    ],
  },
};

// ─── Runner ──────────────────────────────────────────────────

const suitesToRun = singleSuite
  ? Object.entries(SUITES).filter(([k]) => k === singleSuite)
  : Object.entries(SUITES);

if (singleSuite && suitesToRun.length === 0) {
  log(`${ANSI.red}Unknown suite: ${singleSuite}${ANSI.reset}`);
  log(`Available: ${Object.keys(SUITES).join(", ")}`);
  process.exit(1);
}

log(`\n${ANSI.bold}${ANSI.cyan}P31 TRIPER — EXECUTION PHASE${ANSI.reset}`);
log(`${"═".repeat(55)}`);
if (soft) log(`${ANSI.yellow}Mode: soft (failures reported, not fatal)${ANSI.reset}`);
if (skipNetwork) log(`${ANSI.yellow}Network-dependent steps: skipped${ANSI.reset}`);

const results = [];

for (const [name, suite] of suitesToRun) {
  section(suite.label);
  const stepResults = [];

  for (const step of suite.steps) {
    if (step.skipIf && step.skipIf()) {
      skip(`${step.title} — ${step.skipMsg}`);
      stepResults.push({ title: step.title, status: "skipped" });
      continue;
    }

    const cwd = step.cwd ?? ROOT;
    const passed = run(step.cmd, cwd);

    if (passed) {
      ok(step.title);
      stepResults.push({ title: step.title, status: "pass" });
    } else {
      fail(step.title);
      stepResults.push({ title: step.title, status: "fail" });
    }
  }

  const suitePass = stepResults.every((s) => s.status !== "fail");
  results.push({ name, label: suite.label, passed: suitePass, steps: stepResults });
}

// ─── Summary ─────────────────────────────────────────────────

log(`\n${"═".repeat(55)}`);
log(`${ANSI.bold}EXECUTION SUMMARY${ANSI.reset}`);
log("─".repeat(55));

for (const r of results) {
  const icon = r.passed ? `${ANSI.green}PASS ✓` : `${ANSI.red}FAIL ✗`;
  log(`  ${icon}${ANSI.reset} ${r.label}`);
  for (const s of r.steps) {
    const sIcon = s.status === "pass" ? `${ANSI.green}·`
      : s.status === "skipped" ? `${ANSI.yellow}↷`
      : `${ANSI.red}✗`;
    log(`       ${sIcon}${ANSI.reset} ${ANSI.dim}${s.title}${ANSI.reset}`);
  }
}

log("─".repeat(55));
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
log(`${passed}/${results.length} suites passed`);

if (failed === 0) {
  log(`\n${ANSI.green}${ANSI.bold}EXECUTION GATE: ALL GREEN${ANSI.reset}\n`);
} else {
  log(`\n${ANSI.red}${ANSI.bold}EXECUTION GATE: ${failed} suite(s) failed${ANSI.reset}\n`);
  if (!soft) process.exit(1);
}
