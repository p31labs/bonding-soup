#!/usr/bin/env node
/**
 * check:core — 12 essential gates (30 seconds)
 * Fast verification of critical invariants before any operation
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const steps = [
  { name: "alignment", cmd: "npm run verify:alignment" },
  { name: "contract-registry", cmd: "npm run build:contract-registry && npm run verify:contract-registry" },
  { name: "facts", cmd: "npm run verify:facts" },
  { name: "constants", cmd: "npm run verify:constants" },
  { name: "shipbox", cmd: "npm run verify:shipbox" },
  { name: "passport", cmd: "npm run verify:passport" },
  { name: "subscriptions", cmd: "npm run verify:subscriptions" },
  { name: "p31-env", cmd: "npm run verify:p31-env" },
  { name: "cognitive-passport-schema", cmd: "npm run verify:cognitive-passport-schema" },
  { name: "cognitive-passport-profiles", cmd: "npm run verify:cognitive-passport-profiles" },
  { name: "cars-wire", cmd: "npm run verify:cars-wire" },
  { name: "triper", cmd: "npm run verify:triper" },
];

console.log("CHECK:CORE — 12 essential gates\n");

let passed = 0;
let failed = 0;

for (const step of steps) {
  process.stdout.write(`  ${step.name.padEnd(30)} `);
  try {
    execSync(step.cmd, { stdio: "pipe", cwd: ROOT, timeout: 60000 });
    console.log("✓");
    passed++;
  } catch (e) {
    console.log("✗");
    failed++;
  }
}

console.log(`\n${passed}/${steps.length} passed`);
process.exit(failed > 0 ? 1 : 0);
