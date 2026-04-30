#!/usr/bin/env node
/**
 * verify-canon-css.mjs — lock-file discipline for p31-shared-surface.css.
 *
 * The shared CSS is canon (treated like p31-universal-canon.json). Drift
 * cascades to every doc surface in the ecosystem. We pin a SHA-256 digest
 * in p31-alignment.json so any change shows up in a PR as a deliberate
 * digest update, not silent drift.
 *
 * To intentionally update the canon:
 *   1. Edit p31-shared-surface.css with operator approval.
 *   2. Run: npm run verify:canon-css -- --update
 *   3. Commit the new digest in p31-alignment.json with a reason.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const CSS_PATH = path.join(root, "p31-shared-surface.css");
const ALIGN_PATH = path.join(root, "p31-alignment.json");

function digest(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function die(msg) {
  console.error(`verify-canon-css: ${msg}`);
  process.exit(1);
}

function readAlignment() {
  if (!fs.existsSync(ALIGN_PATH)) die(`missing ${path.basename(ALIGN_PATH)}`);
  return JSON.parse(fs.readFileSync(ALIGN_PATH, "utf8"));
}

function writeAlignment(j) {
  fs.writeFileSync(ALIGN_PATH, JSON.stringify(j, null, 2) + "\n", "utf8");
}

function findOrCreateLock(align) {
  if (!align.canonLocks) align.canonLocks = {};
  if (!align.canonLocks["p31-shared-surface.css"]) {
    align.canonLocks["p31-shared-surface.css"] = {
      schema: "p31.canonLock/1.0.0",
      path: "p31-shared-surface.css",
      digest: null,
      algorithm: "sha256",
      bytes: 0,
      frozenAt: null,
      reason: "Doc-surface canon. Cascades to every .p31-doc page in the ecosystem.",
    };
  }
  return align.canonLocks["p31-shared-surface.css"];
}

function main() {
  const update = process.argv.includes("--update");

  if (!fs.existsSync(CSS_PATH)) die(`missing ${path.basename(CSS_PATH)}`);

  const liveDigest = digest(CSS_PATH);
  const liveBytes = fs.statSync(CSS_PATH).size;

  const align = readAlignment();
  const lock = findOrCreateLock(align);

  if (update || !lock.digest) {
    lock.digest = liveDigest;
    lock.bytes = liveBytes;
    lock.frozenAt = new Date().toISOString().slice(0, 10);
    writeAlignment(align);
    console.log(`verify-canon-css: ${update ? "updated" : "initialized"} digest`);
    console.log(`  digest: ${liveDigest}`);
    console.log(`  bytes:  ${liveBytes}`);
    console.log(`  frozen: ${lock.frozenAt}`);
    return;
  }

  if (lock.digest !== liveDigest) {
    console.error("verify-canon-css: DIGEST MISMATCH");
    console.error(`  expected: ${lock.digest}`);
    console.error(`  actual:   ${liveDigest}`);
    console.error("");
    console.error("  p31-shared-surface.css changed without a deliberate canon update.");
    console.error("  If this change is intentional and operator-approved:");
    console.error("    npm run verify:canon-css -- --update");
    console.error("  then commit p31-alignment.json with a reason.");
    process.exit(1);
  }

  console.log(`verify-canon-css: OK (digest matches, ${liveBytes} bytes, frozen ${lock.frozenAt})`);
}

main();
