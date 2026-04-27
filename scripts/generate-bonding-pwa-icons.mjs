#!/usr/bin/env node
/**
 * Rasterize `p31-bonding-icons/p31-icon.svg` → PNGs for Web Manifest + iOS Home Screen.
 * Uses `sharp` from `andromeda/04_SOFTWARE/packages/node-zero/pwa` when present.
 *
 *   node scripts/generate-bonding-pwa-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, "..");
const ICON_DIR = path.join(REPO, "p31-bonding-icons");
const SVG = path.join(ICON_DIR, "p31-icon.svg");
const SHARP_PKG = path.join(
  REPO,
  "andromeda/04_SOFTWARE/packages/node-zero/pwa/node_modules/sharp",
);

function fail(msg) {
  console.error("generate-bonding-pwa-icons:", msg);
  process.exit(1);
}

if (!fs.existsSync(SVG)) fail(`missing ${path.relative(REPO, SVG)}`);
if (!fs.existsSync(SHARP_PKG)) {
  console.warn(
    "generate-bonding-pwa-icons: sharp not found (partial clone?). Skip PNG generation; commit icons or install p31-pwa deps.",
  );
  process.exit(0);
}

const require = createRequire(import.meta.url);
/** @type {import("sharp")} */
let sharp;
try {
  sharp = require(SHARP_PKG);
} catch (e) {
  fail(String(e));
}

async function main() {
  const black = { r: 15, g: 17, b: 21, alpha: 1 };
  await sharp(SVG).resize(180, 180).png().toFile(path.join(ICON_DIR, "apple-touch-180.png"));
  await sharp(SVG).resize(192, 192).png().toFile(path.join(ICON_DIR, "icon-192.png"));
  await sharp(SVG).resize(512, 512).png().toFile(path.join(ICON_DIR, "icon-512.png"));
  await sharp(SVG)
    .resize(144, 144)
    .extend({ top: 24, bottom: 24, left: 24, right: 24, background: black })
    .png()
    .toFile(path.join(ICON_DIR, "maskable-192.png"));
  await sharp(SVG)
    .resize(384, 384)
    .extend({ top: 64, bottom: 64, left: 64, right: 64, background: black })
    .png()
    .toFile(path.join(ICON_DIR, "maskable-512.png"));
  console.log(
    "generate-bonding-pwa-icons: wrote",
    fs.readdirSync(ICON_DIR).filter((f) => f.endsWith(".png")).join(", "),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
