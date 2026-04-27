#!/usr/bin/env node
/**
 * Ensures `TRIM_HZ_MIN` in p31-dome-constants matches the value used in `tomography.html`
 * (Grandfather face). P31 Larmor 863 is canonical via egg-hunt on dome/index separately.
 * Skip when p31ca tree is absent.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const constantsTs = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/src/lib/dome/p31-dome-constants.ts"
);
const tomography = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/public/tomography.html"
);

function readTrimFromConstants(src) {
  const m = src.match(/export const TRIM_HZ_MIN = ([0-9.]+)\s*;/);
  if (!m) {
    return null;
  }
  return Number(m[1]);
}

function readTrimFromTomography(src) {
  const m = src.match(/const TRIM_HZ_MIN = ([0-9.]+)\s*;/);
  if (!m) {
    return null;
  }
  return Number(m[1]);
}

function main() {
  if (!fs.existsSync(constantsTs) || !fs.existsSync(tomography)) {
    console.log("verify-quantum-clock: skip — p31ca partial path");
    process.exit(0);
  }
  const a = readTrimFromConstants(fs.readFileSync(constantsTs, "utf8"));
  const b = readTrimFromTomography(fs.readFileSync(tomography, "utf8"));
  if (a == null) {
    console.error("verify-quantum-clock: could not parse TRIM_HZ_MIN in", path.relative(root, constantsTs));
    process.exit(1);
  }
  if (b == null) {
    console.error(
      "verify-quantum-clock: tomography.html must contain `const TRIM_HZ_MIN = …` (sync with p31-dome-constants)"
    );
    process.exit(1);
  }
  if (a !== b) {
    console.error(
      `verify-quantum-clock: TRIM mismatch — dome-constants has ${a}, tomography has ${b}`
    );
    process.exit(1);
  }
  console.log("verify-quantum-clock: OK (TRIM_HZ_MIN = " + a + " Hz ↔ tomography)");
}

main();
