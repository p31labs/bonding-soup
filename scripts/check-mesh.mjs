#!/usr/bin/env node
/**
 * check:mesh — 8 mesh-related gates (15 seconds)
 */
import { execSync } from "child_process";

const steps = [
  { name: "mesh-canon", cmd: "npm run verify:mesh-canon" },
  { name: "ecosystem", cmd: "npm run verify:ecosystem" },
  { name: "k4-agent-hub", cmd: "npm run verify:k4-agent-hub" },
  { name: "agents-mirror", cmd: "npm run verify:agents-mirror" },
  { name: "live-fleet-mirror", cmd: "npm run verify:live-fleet:p31ca-mirror" },
  { name: "production-readiness", cmd: "npm run verify:production-readiness" },
  { name: "launch-lane-sync", cmd: "npm run verify:launch-lane-sync" },
  { name: "mesh", cmd: "npm run verify:mesh-offline" },
];

console.log("CHECK:MESH — 8 mesh gates\n");

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
