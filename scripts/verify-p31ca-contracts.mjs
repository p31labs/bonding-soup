#!/usr/bin/env node
/**
 * Runs p31ca build:fleet-entities + verify:fleet-entities (before ground-truth; keeps agents JSON + stubs aligned with public/p31-live-fleet.json),
 * then verify:ground-truth + verify:worker-spa-launch + registry URLs + public app shell + delta-hiring bundle + education + economy + garden-zone-8b + super-centaur + synergetic + lattice-oracle + verify-quantum-clock when the tree exists.
 * Skips on partial clone (no andromeda). Does not run astro build. Economy verifier enforces p31.creatorEconomy/1.0.0 fee invariants. Garden-zone-8b verifier enforces p31.gardenZone/1.0.0 (Camden County household plant + structure plan, native milkweed only, S.J./W.J. squares).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");

if (!fs.existsSync(path.join(p31ca, "package.json"))) {
  console.log("verify-p31ca-contracts: skip — no", path.relative(root, p31ca), "package.json");
  process.exit(0);
}

function run(cmd) {
  execSync(cmd, { cwd: p31ca, stdio: "inherit", env: process.env });
}

run("npm run build:fleet-entities");
run("npm run verify:fleet-entities");
run("npm run verify:ground-truth");
run("npm run verify:worker-spa-launch");
run("npm run verify:registry-urls");
run("npm run verify:public-app-shell");
run("npm run verify:delta-hiring");
run("npm run verify:education");
run("npm run verify:economy");
run("npm run verify:garden-zone-8b");
run("npm run verify:super-centaur-pack");
run("npm run verify:synergetic");
run("npm run verify:lattice-oracle");
run("npm run verify:oqe-icosa");
execSync(`node ${JSON.stringify(path.join(root, "scripts", "verify-quantum-clock.mjs"))}`, {
  cwd: root,
  stdio: "inherit",
});
console.log("verify-p31ca-contracts: OK");
