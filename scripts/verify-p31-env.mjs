#!/usr/bin/env node
/**
 * Validate p31-env-manifest.json shape and P31_* naming (no secret values).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const manifestPath = path.join(root, "p31-env-manifest.json");

const NAME_RE = /^P31_[A-Z][A-Z0-9_]*$/;

function die(msg, code = 1) {
  console.error("verify-p31-env:", msg);
  process.exit(code);
}

function main() {
  if (!fs.existsSync(manifestPath)) die("missing p31-env-manifest.json", 1);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (e) {
    die("invalid JSON: " + (e && e.message), 1);
  }

  if (data.schema !== "p31.envManifest/1.0.0") {
    die(`expected schema p31.envManifest/1.0.0, got ${JSON.stringify(data.schema)}`, 1);
  }

  const vars = data.variables;
  if (!Array.isArray(vars) || vars.length === 0) die("`variables` must be a non-empty array", 1);

  const seen = new Map();
  for (let i = 0; i < vars.length; i++) {
    const row = vars[i];
    if (!row || typeof row !== "object") die(`variables[${i}] must be an object`, 1);
    const { name, tier, risk, description, refs } = row;
    if (typeof name !== "string" || !NAME_RE.test(name)) {
      die(`variables[${i}].name must match ${NAME_RE} (got ${JSON.stringify(name)})`, 1);
    }
    if (seen.has(name)) die(`duplicate variable name: ${name}`, 1);
    seen.set(name, i);
    if (typeof tier !== "string" || !tier.trim()) die(`variables[${i}].tier required`, 1);
    if (typeof risk !== "string" || !risk.trim()) die(`variables[${i}].risk required`, 1);
    if (typeof description !== "string" || !description.trim()) die(`variables[${i}].description required`, 1);
    if (refs !== undefined) {
      if (!Array.isArray(refs) || refs.some((r) => typeof r !== "string"))
        die(`variables[${i}].refs must be an array of strings when present`, 1);
    }
  }

  console.log("verify-p31-env: OK —", vars.length, "P31_* entries");
}

main();
