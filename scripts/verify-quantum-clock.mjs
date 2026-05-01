#!/usr/bin/env node
/**
 * Ensures `TRIM_HZ_MIN` in p31-dome-constants matches the value used in `tomography.html`
 * (Grandfather face). P31 Larmor Hz is checked vs `p31-quantum-composer.mjs` when present.
 * Egg-hunt Larmor display coherence remains on dome/index separately.
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
  "andromeda/04_SOFTWARE/p31ca/public/tomography.html",
);
const grandfatherBoot = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/public/lib/p31-quantum-grandfather-boot.mjs",
);
const quantumComposer = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/public/lib/p31-quantum-composer.mjs",
);
const p31Constants = path.join(root, "p31-constants.json");

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

function readTrimFromGrandfatherBoot(src) {
  const m = src.match(/export const TRIM_HZ_MIN = ([0-9.]+)\s*;/);
  return m ? Number(m[1]) : null;
}

/** @param {string} src */
function readLarmorFromComposer(src) {
  const m = src.match(/export const LARMOR_HZ = ([0-9]+)\s*;/);
  return m ? Number(m[1]) : null;
}

function main() {
  if (
    !fs.existsSync(constantsTs) ||
    !fs.existsSync(tomography) ||
    !fs.existsSync(grandfatherBoot)
  ) {
    console.log("verify-quantum-clock: skip — p31ca partial path");
    process.exit(0);
  }
  const a = readTrimFromConstants(fs.readFileSync(constantsTs, "utf8"));
  const b = readTrimFromTomography(fs.readFileSync(tomography, "utf8"));
  const c = readTrimFromGrandfatherBoot(fs.readFileSync(grandfatherBoot, "utf8"));
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
  if (c == null) {
    console.error(
      "verify-quantum-clock: grandfather boot must export `export const TRIM_HZ_MIN = …`",
    );
    process.exit(1);
  }
  if (a !== c) {
    console.error(
      `verify-quantum-clock: TRIM mismatch — dome-constants has ${a}, p31-quantum-grandfather-boot has ${c}`,
    );
    process.exit(1);
  }

  if (fs.existsSync(quantumComposer) && fs.existsSync(p31Constants)) {
    const hzFile = readLarmorFromComposer(fs.readFileSync(quantumComposer, "utf8"));
    const C = JSON.parse(fs.readFileSync(p31Constants, "utf8"));
    const hzConst = C?.physics?.larmorHz;
    if (hzFile == null) {
      console.error(
        "verify-quantum-clock: p31-quantum-composer.mjs must export `export const LARMOR_HZ = …`",
      );
      process.exit(1);
    }
    if (typeof hzConst !== "number" || !Number.isFinite(hzConst)) {
      console.error("verify-quantum-clock: p31-constants.json missing physics.larmorHz number");
      process.exit(1);
    }
    if (hzFile !== hzConst) {
      console.error(
        `verify-quantum-clock: LARMOR mismatch — composer has ${hzFile}, p31-constants has ${hzConst}`,
      );
      process.exit(1);
    }
  }

  console.log("verify-quantum-clock: OK (TRIM_HZ_MIN = " + a + " Hz ↔ tomography + grandfather boot)");
}

main();
