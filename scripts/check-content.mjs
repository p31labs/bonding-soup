#!/usr/bin/env node
/**
 * check:content — 9 doc/index/public gates (10 seconds)
 */
import { execSync } from "child_process";

const steps = [
  { name: "doc-index", cmd: "npm run build:doc-index && npm run verify:doc-index" },
  { name: "fleet-portal", cmd: "npm run verify:fleet-portal" },
  { name: "poets-room", cmd: "npm run verify:poets-room" },
  { name: "runbooks", cmd: "npm run verify:runbooks" },
  { name: "delta-language", cmd: "npm run verify:delta-language" },
  { name: "public-voice", cmd: "npm run verify:public-voice" },
  { name: "public-sanitization", cmd: "npm run verify:public-sanitization" },
  { name: "doc-library-mirror", cmd: "npm run verify:doc-library:p31ca-mirror" },
  { name: "github-org", cmd: "npm run verify:github-org" },
];

console.log("CHECK:CONTENT — 9 content gates\n");

let passed = 0;
let failed = 0;

for (const step of steps) {
  process.stdout.write(`  ${step.name.padEnd(30)} `);
  try {
    execSync(step.cmd, { stdio: "pipe", timeout: 60000 });
    console.log("✓");
    passed++;
  } catch (e) {
    console.log("✗");
    failed++;
  }
}

console.log(`\n${passed}/${steps.length} passed`);
process.exit(failed > 0 ? 1 : 0);
