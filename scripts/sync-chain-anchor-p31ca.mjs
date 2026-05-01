#!/usr/bin/env node
/**
 * Mirror sovereign JSON manifests → andromeda/04_SOFTWARE/p31ca/public/ when hub tree exists.
 * Files: p31-chain-anchor.json, p31-sovereign-layers.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const destDir = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");

const FILES = ["p31-chain-anchor.json", "p31-sovereign-layers.json", "contracts/p31-smart-evm.json"];

if (!fs.existsSync(destDir)) {
  console.log("sync-chain-anchor-p31ca: skip — no", path.relative(root, destDir));
  process.exit(0);
}

for (const name of FILES) {
  const src = path.join(root, name);
  if (!fs.existsSync(src)) {
    console.error("sync-chain-anchor-p31ca: missing", name);
    process.exit(1);
  }
  const destName = name.startsWith("contracts/") ? path.basename(name) : name;
  const dest = path.join(destDir, destName);
  fs.copyFileSync(src, dest);
  console.log("sync-chain-anchor-p31ca: mirrored →", path.relative(root, dest));
}
process.exit(0);
