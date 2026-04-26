#!/usr/bin/env node
/**
 * Validates p31-ecosystem.json: JSON parse, required mesh keys for templates, deployable paths when present.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const manifestPath = path.join(root, "p31-ecosystem.json");
const constantsPath = path.join(root, "p31-constants.json");

function fail(msg) {
  console.error("verify-ecosystem:", msg);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const constants = JSON.parse(fs.readFileSync(constantsPath, "utf8"));

const keysNeeded = new Set();
for (const p of manifest.glassProbes || []) {
  const m = String(p.url).matchAll(/\{\{([^}]+)\}\}/g);
  for (const x of m) {
    keysNeeded.add(x[1].trim());
  }
}

function getNested(obj, dotted) {
  return dotted.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

for (const k of keysNeeded) {
  if (getNested(constants, k) === undefined) {
    fail(`missing constants value for template {{${k}}} in glass probe URL`);
  }
}

for (const d of manifest.deployables || []) {
  if (!d.id || !d.cwd || !d.command) {
    fail(`deployable missing id/cwd/command: ${JSON.stringify(d)}`);
  }
  const full = path.join(root, d.cwd);
  if (!fs.existsSync(full)) {
    console.warn("verify-ecosystem: optional tree missing, skip path check:", d.cwd);
  }
}

console.log("verify-ecosystem: OK");
process.exit(0);
