#!/usr/bin/env node
/**
 * Verifies starfield module exports + sync parity (design-assets ↔ p31ca public).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "design-assets", "starfield", "p31-starfield.js");
const pub = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "lib", "p31-starfield.js");
const srcMt = path.join(root, "design-assets", "starfield", "p31-mesh-touches.js");
const pubMt = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "lib", "p31-mesh-touches.js");
const srcPlate = path.join(root, "design-assets", "starfield", "p31-starfield-static-plate.js");
const pubPlate = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public", "lib", "p31-starfield-static-plate.js");

function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function main() {
  if (!fs.existsSync(src)) {
    console.error("verify-starfield: missing design-assets/starfield/p31-starfield.js");
    process.exit(1);
  }
  const txt = fs.readFileSync(src, "utf8");
  const need = [
    "export function initStarfield",
    "export async function resolveStarfieldConfig",
    "export function configFromSpoons",
    "export const DEFAULT_STARFIELD_CONFIG",
    "export const P31_REMEMBRANCE_WARM_WHITE",
    "export const REMEMBRANCE_RGB",
    "fireBurst",
  ];
  if (!fs.existsSync(srcMt)) {
    console.error("verify-starfield: missing design-assets/starfield/p31-mesh-touches.js");
    process.exit(1);
  }
  const mtTxt = fs.readFileSync(srcMt, "utf8");
  const mtNeed = [
    "export function moonOpacityMultiplier",
    "export function broadcastMeshTouch",
    "MESH_TOUCH_CHANNEL",
    "export function starfieldBondingKeyFromProductElement",
    'if (k === "lov")',
    "remembranceFixedStars",
  ];
  for (const n of mtNeed) {
    if (!mtTxt.includes(n)) {
      console.error(`verify-starfield: mesh-touches missing: ${n}`);
      process.exit(1);
    }
  }
  for (const n of need) {
    if (!txt.includes(n)) {
      console.error(`verify-starfield: missing marker: ${n}`);
      process.exit(1);
    }
  }

  if (!fs.existsSync(srcPlate)) {
    console.error("verify-starfield: missing p31-starfield-static-plate.js");
    process.exit(1);
  }
  const plateTxt = fs.readFileSync(srcPlate, "utf8");
  if (!plateTxt.includes("export function initStaticStarPlate")) {
    console.error("verify-starfield: static plate must export initStaticStarPlate");
    process.exit(1);
  }

  execFileSync(process.execPath, [path.join(root, "scripts", "sync-p31-starfield.mjs")], {
    cwd: root,
    stdio: "pipe",
  });
  execFileSync(process.execPath, [path.join(root, "scripts", "sync-p31-atmosphere.mjs")], {
    cwd: root,
    stdio: "pipe",
  });

  if (!fs.existsSync(pub)) {
    console.error("verify-starfield: run sync — public/lib/p31-starfield.js missing");
    process.exit(1);
  }
  const a = sha256(src);
  const b = sha256(pub);
  if (a !== b) {
    console.error("verify-starfield: design-assets and p31ca public/lib mismatch after sync");
    process.exit(1);
  }

  if (!fs.existsSync(pubMt)) {
    console.error("verify-starfield: missing public/lib/p31-mesh-touches.js after sync");
    process.exit(1);
  }
  if (sha256(srcMt) !== sha256(pubMt)) {
    console.error("verify-starfield: mesh-touches design vs public mismatch");
    process.exit(1);
  }

  if (!fs.existsSync(pubPlate) || sha256(srcPlate) !== sha256(pubPlate)) {
    console.error("verify-starfield: p31-starfield-static-plate.js out of sync (run sync:p31-starfield)");
    process.exit(1);
  }

  console.log("verify-starfield: OK");
}

main();
