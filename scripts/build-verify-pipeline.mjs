#!/usr/bin/env node
/**
 * build-verify-pipeline.mjs — regenerate p31-alignment.json `verifyPipeline.scripts`
 * from the canonical npm `verify` chain in package.json.
 *
 * Why this exists: `verifyPipeline.scripts` is a hand-maintained mirror of
 * `package.json scripts.verify`. The Phase 4b spec audit (CWP-PHOS-2026-01,
 * 2026-05-01) found this array had drifted (missing 7 gates) — exactly the
 * failure mode the wiring-ci-ladder anti-drift mechanism eliminates for §9
 * of the wiring diagram. This script applies the same pattern to the
 * alignment registry's pipeline mirror.
 *
 * Convention: the prelude gate `verify:alignment` is intentionally OMITTED
 * from `verifyPipeline.scripts` (per `preludeNote` field). Every other
 * `npm run <gate>` invocation in execution order is preserved verbatim.
 *
 * Modes:
 *   node scripts/build-verify-pipeline.mjs           (rewrite the registry)
 *   node scripts/build-verify-pipeline.mjs --check   (exit 1 on drift)
 *
 * Idempotence: a second invocation produces no diff.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PKG_PATH = path.join(ROOT, "package.json");
const ALIGNMENT_PATH = path.join(ROOT, "p31-alignment.json");

const PRELUDE_GATE = "verify:alignment";

function parseVerifyChain(pkgJson) {
  const verify = pkgJson?.scripts?.verify;
  if (typeof verify !== "string") {
    throw new Error("package.json scripts.verify is missing or not a string");
  }
  const matches = verify.match(/npm run [A-Za-z0-9_:.\-]+/g) || [];
  const gates = matches.map((m) => m.replace(/^npm run /, "").trim());
  if (gates.length === 0) {
    throw new Error("could not parse any `npm run <gate>` from scripts.verify");
  }
  // Drop prelude (verify:alignment) per existing convention.
  if (gates[0] === PRELUDE_GATE) {
    return gates.slice(1);
  }
  return gates;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const checkMode = args.has("--check");

  const pkgJson = JSON.parse(fs.readFileSync(PKG_PATH, "utf8"));
  const expected = parseVerifyChain(pkgJson);

  const registryRaw = fs.readFileSync(ALIGNMENT_PATH, "utf8");
  const registry = JSON.parse(registryRaw);

  if (!registry.verifyPipeline || !Array.isArray(registry.verifyPipeline.scripts)) {
    console.error("build-verify-pipeline: p31-alignment.json verifyPipeline.scripts missing or not array");
    process.exit(2);
  }

  const current = registry.verifyPipeline.scripts;
  const inSync = arraysEqual(current, expected);

  if (checkMode) {
    if (inSync) {
      console.log(
        `build-verify-pipeline: OK — verifyPipeline.scripts in sync with package.json verify chain (${expected.length} gates)`
      );
      process.exit(0);
    }
    console.error("build-verify-pipeline: DRIFT — p31-alignment.json verifyPipeline.scripts ≠ package.json scripts.verify");
    const missing = expected.filter((g) => !current.includes(g));
    const extra = current.filter((g) => !expected.includes(g));
    if (missing.length) console.error(`  missing in registry (in package.json but not registry): ${missing.join(", ")}`);
    if (extra.length) console.error(`  extra in registry (in registry but not package.json): ${extra.join(", ")}`);
    if (missing.length === 0 && extra.length === 0) {
      console.error("  same gates present, but order differs (run regenerator to align)");
    }
    console.error("  fix: run `npm run build:verify-pipeline` to regenerate, then commit the diff.");
    process.exit(1);
  }

  if (inSync) {
    console.log(
      `build-verify-pipeline: no change — verifyPipeline.scripts already mirrors ${expected.length} gates`
    );
    process.exit(0);
  }

  // Rewrite by string replacement to preserve the surrounding JSON byte-for-byte
  // (sibling keys like `description`, `prelude`, `preludeNote` retain exact spacing).
  // We rebuild the array literal and substitute it into the file text.
  const indent = "      "; // 6 spaces (matches existing array indentation per Read inspection)
  const inner = expected.map((g) => `${indent}"${g}"`).join(",\n");
  const newBlock = `[\n${inner}\n    ]`;

  // Locate the exact existing array block. Build a regex that matches:
  //   "scripts": [ ... ]
  // within `verifyPipeline`. We anchor on the unique `verifyPipeline` key
  // earlier in the file to avoid false matches.
  const vpAnchorIdx = registryRaw.indexOf('"verifyPipeline":');
  if (vpAnchorIdx === -1) {
    throw new Error("could not locate \"verifyPipeline\" key in p31-alignment.json");
  }
  const scriptsKeyIdx = registryRaw.indexOf('"scripts":', vpAnchorIdx);
  if (scriptsKeyIdx === -1) {
    throw new Error("could not locate \"scripts\" key inside verifyPipeline block");
  }
  const arrStart = registryRaw.indexOf("[", scriptsKeyIdx);
  if (arrStart === -1) {
    throw new Error("could not locate opening [ of scripts array");
  }
  // Walk forward to balanced ].
  let depth = 0;
  let arrEnd = -1;
  for (let i = arrStart; i < registryRaw.length; i++) {
    const ch = registryRaw[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        arrEnd = i;
        break;
      }
    }
  }
  if (arrEnd === -1) {
    throw new Error("could not locate closing ] of scripts array");
  }

  const before = registryRaw.slice(0, arrStart);
  const after = registryRaw.slice(arrEnd + 1);
  const next = before + newBlock + after;

  // Sanity: the result must be valid JSON and the array must round-trip.
  try {
    const parsed = JSON.parse(next);
    if (!arraysEqual(parsed.verifyPipeline.scripts, expected)) {
      throw new Error("post-write array does not round-trip equal to expected");
    }
  } catch (e) {
    console.error("build-verify-pipeline: rewrite produced invalid JSON or wrong array — aborted");
    console.error("  reason:", e.message);
    process.exit(2);
  }

  fs.writeFileSync(ALIGNMENT_PATH, next, "utf8");
  console.log(
    `build-verify-pipeline: regenerated verifyPipeline.scripts with ${expected.length} gates (was ${current.length})`
  );
}

main();
