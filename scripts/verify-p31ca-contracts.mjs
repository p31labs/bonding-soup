#!/usr/bin/env node
/**
 * Runs p31ca verify:ground-truth + economy + super-centaur + synergetic + lattice-oracle + verify-quantum-clock when the tree exists.
 * Skips on partial clone (no andromeda). Does not run astro build. Economy verifier enforces p31.creatorEconomy/1.0.0 fee invariants.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");

if (!fs.existsSync(p31ca)) {
  console.log("verify-p31ca-contracts: skip — no", path.relative(root, p31ca));
  process.exit(0);
}

function run(cmd) {
  execSync(cmd, { cwd: p31ca, stdio: "inherit", env: process.env });
}

run("npm run verify:ground-truth");
run("npm run verify:economy");
run("npm run verify:super-centaur-pack");
run("npm run verify:synergetic");
run("npm run verify:lattice-oracle");
run("npm run verify:oqe-icosa");
execSync(`node ${JSON.stringify(path.join(root, "scripts", "verify-quantum-clock.mjs"))}`, {
  cwd: root,
  stdio: "inherit",
});
console.log("verify-p31ca-contracts: OK");
