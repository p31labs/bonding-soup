#!/usr/bin/env node
/**
 * Andromeda CWP-31 MAP: donate-api, donate page, no Stripe secret keys in public trees.
 * No-op if andromeda/ is missing. Used by `npm run verify` so CI enforces the same bar as
 * `verify:monetary` without re-running verify:ecosystem / verify:constants.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const andromeda = path.join(root, "andromeda");
const map = path.join(andromeda, "scripts", "verify-monetary-surface.mjs");

if (!fs.existsSync(map)) {
  console.log("verify-map-pipeline: skip — no", path.relative(root, map));
  process.exit(0);
}

console.log("verify-map-pipeline: running Andromeda verify-monetary-surface (MAP CWP-31)…");
execSync("node scripts/verify-monetary-surface.mjs", { cwd: andromeda, stdio: "inherit" });

const donateApi = path.join(andromeda, "04_SOFTWARE", "donate-api");
if (fs.existsSync(path.join(donateApi, "package.json"))) {
  console.log("verify-map-pipeline: donate-api unit tests (mocked Stripe)…");
  execSync("npm test", { cwd: donateApi, stdio: "inherit" });
}

console.log("verify-map-pipeline: OK");
