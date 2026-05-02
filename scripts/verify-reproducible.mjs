#!/usr/bin/env node
/**
 * verify-reproducible.mjs — PEER-1D (CWP-P31-PEER-COMP-2026-05).
 *
 * What this gate guarantees:
 *
 *   For every derived artefact in the home tree that we have committed to
 *   "reproducible from canonical sources," running the relevant rebuild
 *   produces a result that matches the committed file in the dimension that
 *   matters (typically: the content fingerprint, NOT every byte — some
 *   artefacts include `generatedAt` or `daysSince` which legitimately drift
 *   while the underlying content is unchanged).
 *
 * Today's coverage (Phase 1, intentionally narrow):
 *
 *   1. docs/doc-library/index.json — derived from docs/**.md + manifest.
 *      Contract: re-running `npm run build:doc-index` with the existing
 *      source must report "fingerprint unchanged" (i.e. it does not write).
 *      That fingerprint is the byte-stable substring; `generatedAt` and
 *      derived `days` fields are documented to drift.
 *
 *   2. p31-alignment.json — hand-authored canon. Checksum-only: file must
 *      exist and parse as JSON. (Reproducibility for this file is the trivial
 *      identity check — there is no rebuild.)
 *
 *   3. package.json `verify` chain — must remain in sync with
 *      p31-alignment.json `verifyPipeline.scripts` (already checked by
 *      `verify:verify-pipeline`; we re-run it here as a defense-in-depth
 *      stamp so reproducibility failures surface in this gate too).
 *
 * Phase 2 expands coverage to the hub `dist/` (Astro / p31ca) once we have
 * pinned the timestamp surfaces in that build.
 *
 * Exit codes:
 *   0 — every artefact in scope reproducible
 *   1 — drift detected (output names + summary)
 *   2 — script invocation error
 *
 * Flags:
 *   --verbose      Print one line per checked artefact
 *   --hub          (Reserved for Phase 2 — currently a no-op when andromeda
 *                   is absent; emits a "skip" line otherwise)
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const VERBOSE = process.argv.includes("--verbose") || process.env.P31_VERIFY_REPRO_VERBOSE === "1";
const HUB = process.argv.includes("--hub");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function readBytes(p) {
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p);
}

function log(...args) {
  if (VERBOSE) console.log("verify-reproducible:", ...args);
}

function fail(msg) {
  console.error("verify-reproducible: FAIL —", msg);
  process.exit(1);
}

// ----- Check 1: doc-library index fingerprint stability ----------------------

function checkDocLibraryFingerprint() {
  const indexPath = path.join(root, "docs/doc-library/index.json");
  if (!fs.existsSync(indexPath)) {
    return { ok: true, skipped: true, label: "doc-library (no index.json)" };
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  } catch (e) {
    return { ok: false, label: "doc-library", error: "index.json is not valid JSON: " + e.message };
  }
  const beforeFingerprint = parsed.fingerprint;
  if (!beforeFingerprint) {
    return {
      ok: false,
      label: "doc-library",
      error: "index.json has no `fingerprint` field — cannot verify reproducibility",
    };
  }

  // Re-run the build with deterministic env. The build script's "fingerprint
  // unchanged" path is the proof that the documents have not changed; if it
  // says "wrote new index" while the working tree is unchanged, that is a
  // reproducibility regression in the build script itself.
  const env = {
    ...process.env,
    SOURCE_DATE_EPOCH: "1",
    TZ: "UTC",
    LC_ALL: "C",
    P31_DOC_INDEX_NO_AUTO_SYNC: "1",
    P31_VERIFY_REPRO: "1",
  };
  const res = spawnSync("node", ["scripts/build-doc-index.mjs"], {
    cwd: root,
    env,
    encoding: "utf8",
  });
  if (res.status !== 0) {
    return {
      ok: false,
      label: "doc-library",
      error: `build-doc-index exited ${res.status}: ${(res.stderr || res.stdout || "").slice(0, 400)}`,
    };
  }
  const out = (res.stdout || "") + (res.stderr || "");

  // Compare the post-build fingerprint.
  const after = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  if (after.fingerprint !== beforeFingerprint) {
    return {
      ok: false,
      label: "doc-library",
      error: `fingerprint drifted: before=${beforeFingerprint.slice(0, 16)}… after=${after.fingerprint.slice(0, 16)}…`,
    };
  }

  log(
    `doc-library: fingerprint stable (${beforeFingerprint.slice(0, 12)}…); ` +
      (out.includes("skip write") ? "build skipped write (no source change)" : "build wrote (but fingerprint matched)")
  );
  return { ok: true, label: "doc-library", fingerprint: beforeFingerprint };
}

// ----- Check 2: alignment registry checksum ----------------------------------

function checkAlignmentRegistry() {
  const p = path.join(root, "p31-alignment.json");
  const bytes = readBytes(p);
  if (!bytes) {
    return { ok: false, label: "alignment", error: "p31-alignment.json missing" };
  }
  try {
    JSON.parse(bytes.toString("utf8"));
  } catch (e) {
    return { ok: false, label: "alignment", error: "not valid JSON: " + e.message };
  }
  log(`alignment: ${sha256(bytes).slice(0, 12)}… (canon, checksum-only)`);
  return { ok: true, label: "alignment", checksum: sha256(bytes) };
}

// ----- Check 3: verify chain stays in sync (defense-in-depth) ----------------

function checkVerifyPipelineSync() {
  // We delegate to the existing builder/checker. It already runs in the verify
  // chain, but double-running here costs ~50ms and surfaces in this gate.
  const res = spawnSync("node", ["scripts/build-verify-pipeline.mjs", "--check"], {
    cwd: root,
    encoding: "utf8",
  });
  if (res.status !== 0) {
    return {
      ok: false,
      label: "verify-pipeline",
      error: (res.stderr || res.stdout || "").slice(0, 400),
    };
  }
  log("verify-pipeline: in sync with package.json `verify`");
  return { ok: true, label: "verify-pipeline" };
}

// ----- Reserved: hub dist (Phase 2) ------------------------------------------

function checkHubDist() {
  const hub = path.join(root, "andromeda/04_SOFTWARE/p31ca");
  if (!fs.existsSync(hub)) {
    log("hub-dist: skip (no andromeda/p31ca)");
    return { ok: true, skipped: true, label: "hub-dist" };
  }
  const dist = path.join(hub, "dist");
  if (!fs.existsSync(dist)) {
    log("hub-dist: skip (no dist/ — Phase 2 will rebuild)");
    return { ok: true, skipped: true, label: "hub-dist" };
  }
  if (!fs.existsSync(path.join(dist, "index.html"))) {
    return { ok: false, label: "hub-dist", error: "dist/ exists but index.html missing" };
  }
  log("hub-dist: smoke OK (index.html present)");
  return { ok: true, label: "hub-dist", smokeOnly: true };
}

// ----- main ------------------------------------------------------------------

function main() {
  const results = [
    checkDocLibraryFingerprint(),
    checkAlignmentRegistry(),
    checkVerifyPipelineSync(),
  ];
  if (HUB) results.push(checkHubDist());

  const failures = results.filter((r) => !r.ok);
  if (failures.length > 0) {
    console.error("verify-reproducible: FAIL —");
    for (const f of failures) {
      console.error(`  ${f.label}: ${f.error}`);
    }
    process.exit(1);
  }
  const checked = results.filter((r) => !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  console.log(
    `verify-reproducible: OK — ${checked} artefact${checked === 1 ? "" : "s"} reproducible` +
      (skipped > 0 ? `, ${skipped} skipped` : "") +
      "."
  );
}

main();
