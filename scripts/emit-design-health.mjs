#!/usr/bin/env node
/**
 * emit-design-health.mjs — CWP-DESIGN-07
 * Computes design health metrics from static file analysis and writes
 * docs/design-health.json for the Glass Box to display.
 */
import { writeDesignHealth } from "./psych/glass-box-emitter.mjs";

const data = writeDesignHealth();
if (!data) {
  console.error("emit:design-health: failed to write design-health.json");
  process.exit(1);
}

const { metrics: m } = data;
console.log("emit:design-health: written docs/design-health.json");
console.log(`  safe mode    : ${m.safeModeCompliance.compliant}/${m.safeModeCompliance.surfaces} [${m.safeModeCompliance.grade}]`);
console.log(`  phos router  : ${m.phosRouterCoverage.active}/${m.phosRouterCoverage.surfaces} [${m.phosRouterCoverage.grade}]`);
console.log(`  token hex    : ${m.tokenCompliance.hardcodedHex} violations [${m.tokenCompliance.grade}]`);
console.log(`  touch targets: ${m.touchTargets.compliant}/${m.touchTargets.surfaces} [${m.touchTargets.grade}]`);
