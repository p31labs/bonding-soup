#!/usr/bin/env node
/**
 * TRIPER system self-inspection — fast structural check, no test runners spawned.
 * Verifies the certification system itself is intact before trusting its output.
 *
 * Checks: all 9 suite files, combined suite, sentinels, runner, exec runner,
 * status script, vitest config, arch doc, all 9 PREFLIGHT.md checklists,
 * all npm scripts wired, cert log directory with .gitkeep.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const green = "\x1b[32m", red = "\x1b[31m", yellow = "\x1b[33m", reset = "\x1b[0m", bold = "\x1b[1m", dim = "\x1b[2m";

let failures = 0;
let warnings = 0;

function ok(label) {
  console.log(`  ${green}✓${reset} ${label}`);
}

function fail(label, detail = "") {
  console.error(`  ${red}✗${reset} ${bold}${label}${reset}${detail ? `\n    ${dim}${detail}${reset}` : ""}`);
  failures++;
}

function warn(label) {
  console.log(`  ${yellow}⚠${reset} ${label}`);
  warnings++;
}

function exists(rel, label) {
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) {
    ok(label ?? rel);
    return true;
  }
  fail(label ?? rel, `missing: ${rel}`);
  return false;
}

function nonTrivial(rel, minBytes = 200, label) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    fail(label ?? rel, `missing: ${rel}`);
    return;
  }
  const size = fs.statSync(abs).size;
  if (size < minBytes) {
    fail(label ?? rel, `too small (${size}B < ${minBytes}B): ${rel}`);
    return;
  }
  ok(label ?? rel);
}

function countPattern(rel, pattern, label, minCount = 1) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    fail(label, `missing file: ${rel}`);
    return 0;
  }
  const src = fs.readFileSync(abs, "utf8");
  const matches = (src.match(pattern) ?? []).length;
  if (matches < minCount) {
    fail(label, `found ${matches}, expected ≥${minCount} in ${rel}`);
  } else {
    ok(`${label} (${matches} found)`);
  }
  return matches;
}

function hasScript(pkg, name) {
  if (pkg.scripts?.[name]) {
    ok(`package.json script: ${name}`);
    return true;
  }
  fail(`package.json script: ${name}`, `"${name}" not in scripts`);
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

const SUITES = ["bonding", "cars", "personal", "hub", "mesh", "simplex", "email", "epcp", "geodesic"];

console.log(`\n${bold}${green}verify:triper${reset} — TRIPER system self-inspection\n`);

// ─── Core infrastructure ──────────────────────────────────────────────────────

console.log(`${bold}Core infrastructure${reset}`);
exists("vitest.triper.config.mjs", "vitest.triper.config.mjs");
nonTrivial("vitest.triper.config.mjs", 200, "vitest.triper.config.mjs is non-trivial");
exists("docs/P31-TRIPER-SYSTEM.md", "arch doc: docs/P31-TRIPER-SYSTEM.md");
nonTrivial("docs/P31-TRIPER-SYSTEM.md", 2000, "arch doc is non-trivial");
exists("tests/triper/triper-runner.mjs", "master runner: tests/triper/triper-runner.mjs");
exists("scripts/triper-exec.mjs", "execution runner: scripts/triper-exec.mjs");
exists("scripts/triper-status.mjs", "status script: scripts/triper-status.mjs");

// ─── Cert log directory ───────────────────────────────────────────────────────

console.log(`\n${bold}Cert log directory${reset}`);
const logsDir = path.join(ROOT, "tests/triper/logs");
if (fs.existsSync(logsDir)) {
  ok("tests/triper/logs/ exists");
  const gitkeep = path.join(logsDir, ".gitkeep");
  if (fs.existsSync(gitkeep)) {
    ok("tests/triper/logs/.gitkeep preserved");
  } else {
    fail("tests/triper/logs/.gitkeep missing", "add: touch tests/triper/logs/.gitkeep && git add -f");
  }
  const certs = fs.readdirSync(logsDir).filter((f) => f.startsWith("cert-") && f.endsWith(".json"));
  if (certs.length > 0) {
    const latest = certs.sort().at(-1);
    const cert = JSON.parse(fs.readFileSync(path.join(logsDir, latest), "utf8"));
    const ageMs = Date.now() - new Date(cert.timestamp ?? 0).getTime();
    const ageH = (ageMs / 3_600_000).toFixed(1);
    const suiteCount = cert.suites?.length ?? "?";
    const passCount = cert.suites?.filter((s) => s.passed).length ?? "?";
    if (cert.gateStatus === "AUTHORIZED") {
      ok(`latest cert AUTHORIZED — ${passCount}/${suiteCount} suites — ${ageH}h ago`);
    } else {
      warn(`latest cert gate: ${cert.gateStatus ?? "UNKNOWN"} (run npm run test:triper:cert)`);
    }
  } else {
    warn("no cert on file yet — run: npm run test:triper:cert");
  }
} else {
  fail("tests/triper/logs/ directory missing");
}

// ─── 9 MVP suites ────────────────────────────────────────────────────────────

console.log(`\n${bold}MVP suites (9 × *.triper.test.mjs)${reset}`);
for (const suite of SUITES) {
  const rel = `tests/mvp/${suite}/${suite}.triper.test.mjs`;
  nonTrivial(rel, 500, `${suite}.triper.test.mjs`);
}

// ─── 9 PREFLIGHT checklists ───────────────────────────────────────────────────

console.log(`\n${bold}PREFLIGHT checklists (9 × PREFLIGHT.md)${reset}`);
for (const suite of SUITES) {
  const rel = `tests/mvp/${suite}/PREFLIGHT.md`;
  exists(rel, `${suite}/PREFLIGHT.md`);
}

// ─── Combined + sentinels ─────────────────────────────────────────────────────

console.log(`\n${bold}Combined gate + mutation sentinels${reset}`);
nonTrivial("tests/combined/combined.suite.test.mjs", 1000, "combined.suite.test.mjs");
nonTrivial("tests/triper/mutation-sentinels.test.mjs", 1000, "mutation-sentinels.test.mjs");

const sentinelCount = countPattern(
  "tests/triper/mutation-sentinels.test.mjs",
  /\bit\s*\(/g,
  "mutation sentinels ≥ 60",
  60
);

// ─── npm scripts ──────────────────────────────────────────────────────────────

console.log(`\n${bold}npm scripts${reset}`);
const REQUIRED_SCRIPTS = [
  "test:triper",
  "test:triper:combined",
  "test:triper:sentinels",
  "test:triper:cert",
  "test:triper:watch",
  "triper:status",
  "triper:exec",
  "triper:exec:soft",
  "triper:full",
  "triper:full:offline",
  "verify:triper",
  ...SUITES.map((s) => `test:triper:${s}`),
  ...SUITES.map((s) => `test:triper:${s}:watch`),
];
for (const name of REQUIRED_SCRIPTS) {
  hasScript(pkg, name);
}

// ─── release:public gate ──────────────────────────────────────────────────────

console.log(`\n${bold}release:public cert gate${reset}`);
const releaseSrc = fs.readFileSync(path.join(ROOT, "scripts/p31-release-public.mjs"), "utf8");
if (releaseSrc.includes("checkTriperCert")) {
  ok("release:public calls checkTriperCert()");
} else {
  fail("release:public missing TRIPER cert gate", "add checkTriperCert() call to p31-release-public.mjs");
}
if (releaseSrc.includes("gateStatus") && releaseSrc.includes("AUTHORIZED")) {
  ok("release:public checks gateStatus === AUTHORIZED");
} else {
  fail("release:public AUTHORIZED check missing");
}
if (releaseSrc.includes("CERT_MAX_AGE_MS")) {
  ok("release:public enforces cert age limit (24h)");
} else {
  fail("release:public cert age limit missing");
}

// ─── vitest config includes all patterns ─────────────────────────────────────

console.log(`\n${bold}vitest config coverage${reset}`);
const vitestSrc = fs.readFileSync(path.join(ROOT, "vitest.triper.config.mjs"), "utf8");
const patterns = [
  ["tests/mvp/**/*.triper.test.mjs", "includes: MVP triper suites"],
  ["tests/combined/**/*.test.mjs", "includes: combined gate"],
  ["tests/triper/**/*.test.mjs", "includes: sentinels"],
];
for (const [pat, label] of patterns) {
  if (vitestSrc.includes(pat)) {
    ok(label);
  } else {
    fail(label, `pattern missing from vitest.triper.config.mjs: ${pat}`);
  }
}

// ─── alignment registry ───────────────────────────────────────────────────────

console.log(`\n${bold}Alignment registry${reset}`);
const alignment = JSON.parse(fs.readFileSync(path.join(ROOT, "p31-alignment.json"), "utf8"));
const triperDerivation = alignment.derivations?.find((d) => d.id === "p31-triper-cert-system");
if (triperDerivation) {
  ok(`p31-alignment.json derivation: ${triperDerivation.id}`);
} else {
  fail("p31-alignment.json missing TRIPER derivation (id: p31-triper-cert-system)");
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

console.log(`\n${bold}CLI integration${reset}`);
const cliSrc = fs.readFileSync(path.join(ROOT, "scripts/cli/index.mjs"), "utf8");
if (cliSrc.includes('cmd === "triper"')) {
  ok('CLI dispatches "triper" command');
} else {
  fail('CLI missing triper command dispatch');
}
if (cliSrc.includes("triper cert") && cliSrc.includes("triper status")) {
  ok("CLI help text covers cert + status subcommands");
} else {
  fail("CLI triper help text incomplete");
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log("\n" + "─".repeat(60));
if (failures === 0 && warnings === 0) {
  console.log(`${green}${bold}verify:triper PASS${reset} — TRIPER system is intact (${sentinelCount} sentinels)`);
} else if (failures === 0) {
  console.log(`${yellow}${bold}verify:triper PASS${reset} with ${warnings} warning(s)`);
} else {
  console.error(`${red}${bold}verify:triper FAIL${reset} — ${failures} failure(s), ${warnings} warning(s)`);
  process.exit(1);
}
