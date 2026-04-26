#!/usr/bin/env node
/**
 * Fast monetary pipeline gate: ecosystem JSON templates, constants (payment URLs),
 * creator-economy ground-truth + public mirror + invariants in p31ca.
 * Skips p31ca steps when the tree is missing (home-only clone). Does not run passport, egg-hunt, or tsc.
 *
 * When andromeda/ is present: also runs andromeda/scripts/verify-monetary-surface.mjs
 * (MAP CWP-31 static checks: donate-api, donate page, no sk_* in public trees).
 * For full bar: `npm run verify` or `npm run verify:p31ca-contracts`.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");
const andromeda = path.join(root, "andromeda");
const mapSurface = path.join(andromeda, "scripts", "verify-monetary-surface.mjs");

function run(title, command, cwd = root) {
  console.log(`\n\x1b[36m▶\x1b[0m ${title}`);
  execSync(command, { cwd, stdio: "inherit", env: process.env, shell: true });
}

run("verify:ecosystem", "npm run verify:ecosystem");
run("verify:constants", "npm run verify:constants");

if (fs.existsSync(mapSurface)) {
  run("verify-monetary-surface (Andromeda MAP)", "node scripts/verify-monetary-surface.mjs", andromeda);
} else {
  console.log("verify-monetary: skip verify-monetary-surface — no", path.relative(root, mapSurface));
}

if (fs.existsSync(p31ca)) {
  run("verify:economy (p31ca)", "npm run verify:economy", p31ca);
} else {
  console.log("verify-monetary: skip verify:economy — no p31ca at", path.relative(root, p31ca));
}

console.log("verify-monetary: OK");
