#!/usr/bin/env node
/**
 * TRIPER Status — reads latest cert log, prints per-suite status.
 * Usage: node scripts/triper-status.mjs
 *        node scripts/triper-status.mjs --json
 *        node scripts/triper-status.mjs --suite bonding
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LOGS = path.join(ROOT, "tests/triper/logs");
const isJson = process.argv.includes("--json");
const suiteFilter = (() => {
  const idx = process.argv.indexOf("--suite");
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

const SUITES = ["bonding", "cars", "personal", "hub", "mesh", "simplex", "email", "epcp", "geodesic"];

const ANSI = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
  dim: "\x1b[2m",
};

function latestCertLog() {
  if (!fs.existsSync(LOGS)) return null;
  const files = fs.readdirSync(LOGS)
    .filter((f) => f.startsWith("cert-") && f.endsWith(".json"))
    .sort()
    .reverse();
  return files.length > 0 ? path.join(LOGS, files[0]) : null;
}

function testCountForSuite(name) {
  const testFile = path.join(ROOT, `tests/mvp/${name}/${name}.triper.test.mjs`);
  if (!fs.existsSync(testFile)) return "?";
  const src = fs.readFileSync(testFile, "utf8");
  const matches = src.match(/^\s+it\(/gm);
  return matches ? matches.length : "?";
}

function combinedCount() {
  const f = path.join(ROOT, "tests/combined/combined.suite.test.mjs");
  if (!fs.existsSync(f)) return "?";
  const src = fs.readFileSync(f, "utf8");
  const matches = src.match(/^\s+it\(/gm);
  return matches ? matches.length : "?";
}

const certFile = latestCertLog();
let certData = null;
if (certFile) {
  try { certData = JSON.parse(fs.readFileSync(certFile, "utf8")); } catch {}
}

if (isJson) {
  const out = {
    certFile: certFile ? path.relative(ROOT, certFile) : null,
    certTimestamp: certData?.timestamp ?? null,
    gateStatus: certData?.gateStatus ?? "UNKNOWN",
    suites: SUITES.map((name) => {
      const record = certData?.suites?.find((s) => s.suite === name);
      return {
        name,
        passed: record?.passed ?? null,
        testCount: testCountForSuite(name),
      };
    }),
    combined: { testCount: combinedCount() },
  };
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

// ─── Human-readable output ─────────────────────────────────────
const LINE = "─".repeat(60);
const DLINE = "═".repeat(60);

console.log(`\n${ANSI.bold}${ANSI.cyan}P31 TRIPER STATUS${ANSI.reset}`);
console.log(DLINE);

if (!certFile) {
  console.log(`${ANSI.yellow}No cert log found — run: npm run test:triper:cert${ANSI.reset}`);
  console.log(`\n${ANSI.dim}Expected logs in: tests/triper/logs/${ANSI.reset}\n`);
} else {
  const age = certData?.timestamp
    ? Math.round((Date.now() - new Date(certData.timestamp)) / 60000)
    : null;
  const ageStr = age !== null
    ? age < 60 ? `${age}m ago` : `${Math.round(age / 60)}h ago`
    : "unknown";

  console.log(`${ANSI.dim}Last cert: ${path.relative(ROOT, certFile)} (${ageStr})${ANSI.reset}`);

  const gate = certData?.gateStatus ?? "UNKNOWN";
  const gateColor = gate === "AUTHORIZED" ? ANSI.green : ANSI.red;
  console.log(`Gate: ${gateColor}${ANSI.bold}${gate}${ANSI.reset}\n`);
}

console.log(`${"Suite".padEnd(12)}${"Status".padEnd(12)}${"Tests".padEnd(8)}File`);
console.log(LINE);

const filteredSuites = suiteFilter ? SUITES.filter((s) => s === suiteFilter) : SUITES;

for (const name of filteredSuites) {
  const record = certData?.suites?.find((s) => s.suite === name);
  const passed = record?.passed;
  const count = testCountForSuite(name);
  const fileExists = fs.existsSync(path.join(ROOT, `tests/mvp/${name}/${name}.triper.test.mjs`));

  let status, color;
  if (!fileExists) {
    status = "MISSING"; color = ANSI.red;
  } else if (passed === true) {
    status = "PASS ✓"; color = ANSI.green;
  } else if (passed === false) {
    status = "FAIL ✗"; color = ANSI.red;
  } else {
    status = "NOT RUN"; color = ANSI.yellow;
  }

  console.log(
    `${name.padEnd(12)}${color}${status.padEnd(12)}${ANSI.reset}${String(count).padEnd(8)}tests/mvp/${name}/`
  );
}

// Combined suite
const combinedExists = fs.existsSync(path.join(ROOT, "tests/combined/combined.suite.test.mjs"));
const combinedCount_ = combinedCount();
const combinedStatus = combinedExists
  ? (certData?.gateStatus === "AUTHORIZED" ? `PASS ✓` : "NOT RUN")
  : "MISSING";
const combinedColor = combinedStatus === "PASS ✓" ? ANSI.green
  : combinedStatus === "MISSING" ? ANSI.red : ANSI.yellow;

console.log(LINE);
console.log(
  `${"combined".padEnd(12)}${combinedColor}${combinedStatus.padEnd(12)}${ANSI.reset}${String(combinedCount_).padEnd(8)}tests/combined/`
);
console.log(LINE);

const total = filteredSuites.reduce((acc, n) => acc + (Number(testCountForSuite(n)) || 0), 0)
  + (Number(combinedCount_) || 0);

console.log(`\n${ANSI.bold}Total tests (file count):${ANSI.reset} ${total}`);

if (!certData) {
  console.log(`\n${ANSI.yellow}Run: npm run test:triper:cert${ANSI.reset}\n`);
} else if (certData.gateStatus === "AUTHORIZED") {
  console.log(`\n${ANSI.green}${ANSI.bold}All TRIPERs green — mesh integration authorized.${ANSI.reset}\n`);
} else {
  console.log(`\n${ANSI.red}${ANSI.bold}Fix failing suites before merging to family mesh.${ANSI.reset}\n`);
}
