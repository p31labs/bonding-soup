#!/usr/bin/env node
/**
 * verify:protocol-registry — Validates p31-protocol-registry.json structure
 * Ensures all TRIPER suites are registered and match the file system
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let exitCode = 0;

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  exitCode = 1;
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

console.log("verify:protocol-registry\n");

// Load registry
const registryPath = path.join(ROOT, "p31-protocol-registry.json");
if (!fs.existsSync(registryPath)) {
  fail("p31-protocol-registry.json not found");
  process.exit(1);
}

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

// Schema check
if (registry.schema !== "p31.protocolRegistry/1.0.0") {
  fail(`schema mismatch: ${registry.schema}`);
} else {
  ok("schema is p31.protocolRegistry/1.0.0");
}

// TRIPER suites check
const expectedSuites = 12;
if (registry.triper?.suites?.length !== expectedSuites) {
  fail(`expected ${expectedSuites} TRIPER suites, found ${registry.triper?.suites?.length}`);
} else {
  ok(`${expectedSuites} TRIPER suites registered`);
}

// Verify each suite file exists
for (const suite of registry.triper.suites) {
  const suitePath = path.join(ROOT, suite.file);
  if (!fs.existsSync(suitePath)) {
    fail(`suite file missing: ${suite.file}`);
  }
}
ok("all suite files exist");

// Verify triper-runner.mjs matches
const runnerPath = path.join(ROOT, "tests/triper/triper-runner.mjs");
const runnerContent = fs.readFileSync(runnerPath, "utf8");
const runnerSuites = [...runnerContent.matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);
const registryIds = registry.triper.suites.map(s => s.id);

const missingFromRunner = registryIds.filter(id => !runnerSuites.includes(id));
if (missingFromRunner.length > 0) {
  fail(`triper-runner.mjs missing suites: ${missingFromRunner.join(", ")}`);
} else {
  ok("triper-runner.mjs matches registry");
}

// Check mutation sentinels exist
const sentinelsPath = path.join(ROOT, registry.triper.mutationSentinels);
if (!fs.existsSync(sentinelsPath)) {
  fail("mutation sentinels file missing");
} else {
  ok("mutation sentinels present");
}

// Check launch lanes sum to 100
const totalWeight = registry.launch.lanes.reduce((sum, l) => sum + l.weight, 0);
if (totalWeight !== 100) {
  fail(`launch lanes weight sum is ${totalWeight}, expected 100`);
} else {
  ok("launch lanes weight = 100");
}

// Check verification tiers
if (registry.verification?.tiers?.length >= 4) {
  ok(`${registry.verification.tiers.length} verification tiers defined`);
} else {
  fail("expected at least 4 verification tiers");
}

console.log(exitCode === 0 ? "\nprotocol registry valid ✓" : "\nprotocol registry has issues ✗");
process.exit(exitCode);
