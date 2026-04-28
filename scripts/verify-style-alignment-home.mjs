#!/usr/bin/env node
/**
 * Thin wrapper so root npm run verify succeeds on bonding-soup CI clones
 * that omit the gitignored `andromeda/` tree (see verify-p31ca-contracts skip).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const target = path.join(root, "andromeda/04_SOFTWARE/p31ca/scripts/verify-style-alignment.mjs");

if (!fs.existsSync(target)) {
  console.log("verify-style-alignment: skip — no", path.relative(root, target));
  process.exit(0);
}

execSync(`node ${JSON.stringify(target)}`, { cwd: root, stdio: "inherit" });
