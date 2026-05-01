#!/usr/bin/env node
/**
 * check:delta — Only changed areas (uses git diff)
 * Runs verifiers only for files that changed since last commit
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Get changed files
let changedFiles;
try {
  changedFiles = execSync("git diff --name-only HEAD", { encoding: "utf8", cwd: ROOT })
    .trim()
    .split("\n")
    .filter(Boolean);
} catch {
  console.log("No git changes detected or not a git repo");
  process.exit(0);
}

if (changedFiles.length === 0) {
  console.log("CHECK:DELTA — No changes detected");
  process.exit(0);
}

console.log(`CHECK:DELTA — ${changedFiles.length} changed files\n`);

// Map file patterns to verifiers
const rules = [
  { pattern: /p31-constants\.json/, name: "constants", cmd: "npm run verify:constants" },
  { pattern: /p31-facts\.json/, name: "facts", cmd: "npm run verify:facts" },
  { pattern: /p31-alignment\.json/, name: "alignment", cmd: "npm run verify:alignment" },
  { pattern: /cars-contract/, name: "cars-wire", cmd: "npm run verify:cars-wire" },
  { pattern: /cognitive-passport/, name: "passport", cmd: "npm run verify:passport" },
  { pattern: /docs.*\.md$/, name: "doc-index", cmd: "npm run build:doc-index && npm run verify:doc-index" },
  { pattern: /p31-live-fleet\.json/, name: "live-fleet", cmd: "npm run verify:live-fleet:p31ca-mirror" },
  { pattern: /simplex-v7/, name: "simplex", cmd: "npm run verify:simplex" },
  { pattern: /packages\/k4-agent-hub/, name: "k4-agent-hub", cmd: "npm run verify:k4-agent-hub" },
  { pattern: /design-tokens/, name: "p31-style", cmd: "npm run verify:p31-style" },
];

const toRun = new Set();
for (const file of changedFiles) {
  for (const rule of rules) {
    if (rule.pattern.test(file)) {
      toRun.add(rule);
    }
  }
}

if (toRun.size === 0) {
  console.log("  No specific verifiers triggered by changes");
  console.log("  Running core alignment check...");
  try {
    execSync("npm run verify:alignment", { stdio: "inherit", cwd: ROOT });
  } catch {
    process.exit(1);
  }
  process.exit(0);
}

let passed = 0;
let failed = 0;

for (const rule of toRun) {
  console.log(`\n  ${rule.name} (triggered by changes)`);
  try {
    execSync(rule.cmd, { stdio: "inherit", cwd: ROOT, timeout: 120000 });
    passed++;
  } catch {
    failed++;
  }
}

console.log(`\n${passed}/${toRun.size} verifiers passed`);
process.exit(failed > 0 ? 1 : 0);
