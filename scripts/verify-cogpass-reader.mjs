#!/usr/bin/env node
/**
 * verify-cogpass-reader.mjs — structural + behavioral guards on the
 * CogPass reader (the activator that translates a saved Cognitive
 * Passport into live page state).
 *
 * What it checks:
 *   1. The file exists, is non-empty, and parses as a valid ES module
 *      (node --check).
 *   2. The file declares the documented public API on
 *      window.p31CogPass: get, set, clear, getRole, getDisplayName,
 *      onChange. (Source-grep — no jsdom round-trip required.)
 *   3. The file dispatches the three documented events exactly:
 *      'p31:cogpass-loaded', 'p31:cogpass-cleared', 'p31:cogpass-error'.
 *      (No silent renames; downstream listeners depend on these names.)
 *   4. The screenComfort cascade thresholds are encoded:
 *      < 30  → kills glass + animations
 *      < 10  → pins p31-gray-rock
 *      These are the operator's hard-stop for sensory overload.
 *      Court mode and crash mode depend on them.
 *   5. STORAGE_KEY = 'p31-cogpass-v1' (declared in privacy.html §2f;
 *      changing it without a privacy-doc update breaks the legal
 *      sequencing rule).
 *   6. Schema URI string 'p31.cognitivePassport/1.1.0' is present —
 *      bumping the schema in constants without bumping the reader
 *      drops compat invariants.
 *
 * Partial-clone-friendly: exits 0 with a skip note when the andromeda
 * tree is missing. Strict mode (P31_VERIFY_COGPASS_READER_STRICT=1)
 * fails instead of skipping — used by CI on full checkouts.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const READER = path.join(
  ROOT,
  "andromeda/04_SOFTWARE/p31ca/public/lib/p31-cogpass-reader.mjs",
);

const REQUIRED_API = ["get", "set", "clear", "getRole", "getDisplayName", "onChange"];
const REQUIRED_EVENTS = ["p31:cogpass-loaded", "p31:cogpass-cleared", "p31:cogpass-error"];
const REQUIRED_STORAGE_KEY = "p31-cogpass-v1";
const REQUIRED_SCHEMA_URI = "p31.cognitivePassport/1.1.0";
const SCREEN_COMFORT_HIGH = 30; // < 30 disables glass + animations
const SCREEN_COMFORT_LOW = 10;  // < 10 pins gray rock

function skip(reason) {
  console.log(`verify-cogpass-reader: skip — ${reason}`);
  process.exit(0);
}

function fail(errors) {
  console.error("verify-cogpass-reader: FAIL");
  for (const e of errors) console.error("  - " + e);
  console.error(`verify-cogpass-reader: ${errors.length} structural error(s)`);
  process.exit(1);
}

function main() {
  const strict = process.env.P31_VERIFY_COGPASS_READER_STRICT === "1";

  if (!fs.existsSync(READER)) {
    if (strict) {
      console.error("verify-cogpass-reader: FAIL — reader missing in strict mode");
      console.error(`  expected: ${READER}`);
      process.exit(1);
    }
    skip("andromeda/04_SOFTWARE/p31ca/public/lib/p31-cogpass-reader.mjs missing (partial clone)");
  }

  const errors = [];

  // 1. node --check (syntax validity for ES module)
  try {
    execSync(`node --check "${READER}"`, { stdio: "pipe" });
  } catch (e) {
    const stderr = e.stderr ? e.stderr.toString() : String(e);
    errors.push(`node --check failed:\n${stderr.trim()}`);
    fail(errors); // can't continue if file doesn't parse
  }

  const src = fs.readFileSync(READER, "utf8");

  // 2. Public API surface
  for (const method of REQUIRED_API) {
    const re = new RegExp(`\\b${method}\\b`);
    if (!re.test(src)) {
      errors.push(`window.p31CogPass.${method}: not found in reader source`);
    }
  }

  // 3. Event names exact match (no silent renames)
  for (const evt of REQUIRED_EVENTS) {
    if (!src.includes(evt)) {
      errors.push(`event "${evt}": not dispatched / not referenced in reader source`);
    }
  }

  // 4. screenComfort cascade thresholds
  // Look for the two thresholds (literal numbers) AND the gray-rock pin
  if (!new RegExp(`\\b${SCREEN_COMFORT_HIGH}\\b`).test(src)) {
    errors.push(
      `screenComfort < ${SCREEN_COMFORT_HIGH} threshold not found in reader (kills glass + animations)`,
    );
  }
  if (!new RegExp(`\\b${SCREEN_COMFORT_LOW}\\b`).test(src)) {
    errors.push(
      `screenComfort < ${SCREEN_COMFORT_LOW} threshold not found in reader (pins p31-gray-rock)`,
    );
  }
  if (!/gray-rock|grayRock|gray_rock/i.test(src)) {
    errors.push("p31-gray-rock pin (low-comfort cascade) not found in reader source");
  }

  // 5. Storage key (privacy.html §2f contract)
  if (!src.includes(`'${REQUIRED_STORAGE_KEY}'`) && !src.includes(`"${REQUIRED_STORAGE_KEY}"`)) {
    errors.push(
      `STORAGE_KEY '${REQUIRED_STORAGE_KEY}' not found — changing it requires a privacy.html §2f update first`,
    );
  }

  // 6. Schema URI
  if (!src.includes(REQUIRED_SCHEMA_URI)) {
    errors.push(
      `schema URI '${REQUIRED_SCHEMA_URI}' not found — reader must match constants.cognitivePassport.jsonSchema`,
    );
  }

  if (errors.length > 0) fail(errors);

  const sizeKb = (Buffer.byteLength(src, "utf8") / 1024).toFixed(1);
  console.log(
    `verify-cogpass-reader: OK — ${sizeKb}KB; ${REQUIRED_API.length} API methods, ${REQUIRED_EVENTS.length} events, screenComfort cascade (${SCREEN_COMFORT_HIGH}/${SCREEN_COMFORT_LOW}) intact`,
  );
}

main();
