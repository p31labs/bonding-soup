#!/usr/bin/env node
/**
 * Public release gate — automates the pre-ship checklist:
 *  0. TRIPER cert freshness check (≤24h; skip with --skip-triper or P31_SKIP_TRIPER=1)
 *  1. Root `npm run verify` (passport, constants, contracts, egg-hunt, tsc)
 *  2. k4-personal wrangler dry-run + live mesh vs `p31-constants.json`
 *     (strict by default: set MESH_LIVE_STRICT=0 to match loose local CI)
 *  3. p31ca `hub:ci` — `hub:about:generate` + full verify (prebuild + Astro + dist)
 *     Use `--content` for `ci:content` (adds `hub:about:enrich` before verify)
 *  4. p31ca `security:check` (Phase B+C+E; verify already covered Phase A)
 *
 * Does not deploy. After green: wrangler Pages per `p31ca/DEPLOY.md` and BONDING README.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda/04_SOFTWARE/p31ca");
const k4Personal = path.join(root, "andromeda/04_SOFTWARE/k4-personal");
const triperLogsDir = path.join(root, "tests/triper/logs");

const args = new Set(process.argv.slice(2));
const withContent = args.has("--content") || args.has("-c");
const skipInstall = args.has("--skip-install");
const noSecurity = args.has("--no-security");
const skipTriper = args.has("--skip-triper") || process.env.P31_SKIP_TRIPER === "1";

const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

function run(title, command, cwd = root, extraEnv) {
  console.log(`\n\x1b[36m▶\x1b[0m ${title}`);
  const env = extraEnv ? { ...process.env, ...extraEnv } : process.env;
  execSync(command, { cwd, stdio: "inherit", env });
}

function maybeK4Personal() {
  if (!fs.existsSync(k4Personal)) {
    console.log("\n\x1b[33m▶\x1b[0m k4-personal: tree missing — skipped\n");
    return;
  }
  run("k4-personal bundle (wrangler dry-run)", "node scripts/verify-k4-personal.mjs", root);
  const strict = process.env.MESH_LIVE_STRICT ?? "1";
  run(
    `mesh live vs p31-constants (MESH_LIVE_STRICT=${strict})`,
    "node scripts/verify-mesh-live.mjs",
    root,
    { MESH_LIVE_STRICT: strict }
  );
}

function maybeP31caInstall() {
  if (!fs.existsSync(p31ca)) {
    console.log(
      "\n\x1b[33m▶\x1b[0m p31ca: missing — skipped hub + security (partial clone)\n"
    );
    return false;
  }
  if (!skipInstall) {
    if (isCI) {
      run("p31ca: npm ci", "npm ci", p31ca);
    } else if (!fs.existsSync(path.join(p31ca, "node_modules"))) {
      run("p31ca: npm install", "npm install", p31ca);
    }
  }
  return true;
}

// ─── TRIPER cert freshness check ──────────────────────────────────────────────
// release:public is the highest-stakes gate. A cert must exist and be <24h old.
// On CI, TRIPER runs in its own job before this step, so freshness is inherent.
function checkTriperCert() {
  const CERT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
  const cyan = "\x1b[36m", yellow = "\x1b[33m", red = "\x1b[31m", green = "\x1b[32m", reset = "\x1b[0m", bold = "\x1b[1m";

  if (skipTriper) {
    console.log(`\n${yellow}▶${reset} TRIPER cert check: skipped (--skip-triper / P31_SKIP_TRIPER=1)\n`);
    return;
  }

  console.log(`\n${cyan}▶${reset} TRIPER cert freshness check (docs/P31-TRIPER-SYSTEM.md)`);

  if (!fs.existsSync(triperLogsDir)) {
    console.error(`\n${red}${bold}✗ TRIPER GATE BLOCKED${reset}`);
    console.error(`  No cert log directory found: tests/triper/logs/`);
    console.error(`  Run: npm run test:triper:cert`);
    console.error(`  (or: npm run triper:full for structural + execution)`);
    process.exit(1);
  }

  const certs = fs.readdirSync(triperLogsDir)
    .filter((f) => f.startsWith("cert-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (certs.length === 0) {
    console.error(`\n${red}${bold}✗ TRIPER GATE BLOCKED — no cert on file${reset}`);
    console.error(`  Run: npm run test:triper:cert`);
    process.exit(1);
  }

  const latestPath = path.join(triperLogsDir, certs[0]);
  let cert;
  try {
    cert = JSON.parse(fs.readFileSync(latestPath, "utf8"));
  } catch {
    console.error(`\n${red}✗ TRIPER cert unreadable: ${certs[0]}${reset}`);
    process.exit(1);
  }

  const certTime = new Date(cert.timestamp ?? cert.ts ?? 0).getTime();
  const ageMs = Date.now() - certTime;
  const ageMin = Math.round(ageMs / 60_000);

  if (cert.gateStatus !== "AUTHORIZED") {
    console.error(`\n${red}${bold}✗ TRIPER GATE BLOCKED — last cert status: ${cert.gateStatus ?? "UNKNOWN"}${reset}`);
    console.error(`  Cert file: ${certs[0]}`);
    console.error(`  Run: npm run test:triper:cert  to generate a passing cert`);
    process.exit(1);
  }

  if (ageMs > CERT_MAX_AGE_MS) {
    const ageHr = (ageMs / 3_600_000).toFixed(1);
    console.error(`\n${red}${bold}✗ TRIPER GATE BLOCKED — cert is ${ageHr}h old (max 24h)${reset}`);
    console.error(`  Cert file: ${certs[0]}`);
    console.error(`  Run: npm run test:triper:cert  to renew`);
    process.exit(1);
  }

  const passedSuites = cert.suites ? cert.suites.filter((r) => r.passed).length : "?";
  const totalSuites = cert.suites ? cert.suites.length : 9;
  console.log(`  ${green}✓${reset} Cert: ${certs[0]}`);
  console.log(`  ${green}✓${reset} Age: ${ageMin}m ago  |  Gate: ${green}${bold}${cert.gateStatus}${reset}  |  Suites: ${passedSuites}/${totalSuites}`);
}

function main() {
  checkTriperCert();

  run(
    "Root verify (passport + constants + p31ca-contracts + egg-hunt + tsc)",
    "npm run verify",
    root
  );

  maybeK4Personal();

  if (!maybeP31caInstall()) {
    console.log("\n\x1b[32m✓ release:public complete (home only)\x1b[0m\n");
    return;
  }

  if (withContent) {
    run(
      "p31ca ci:content (about generate + enrich + verify + build)",
      "npm run ci:content",
      p31ca
    );
  } else {
    run(
      "p31ca hub:ci (about generate + verify + build)",
      "npm run hub:ci",
      p31ca
    );
  }

  if (!noSecurity) {
    run(
      "p31ca security suite (SCA + workers/CORS + crypto)",
      "npm run security:check",
      p31ca
    );
  }

  console.log(
    "\n\x1b[32m✓ release:public complete — TRIPER cert ✓ · deploy hub/BONDING per DEPLOY docs when ready\x1b[0m\n"
  );
}

main();
