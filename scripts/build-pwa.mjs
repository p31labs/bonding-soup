#!/usr/bin/env node
/**
 * P31 PWA build — copies the canonical pwa/sw.js + pwa/p31-pwa.js into each
 * PWA-installable app folder so the service worker registers with the
 * correct per-app scope without needing custom HTTP headers (which the
 * existing p31ca _headers rule "/*.html → Clear-Site-Data" would otherwise
 * fight). The manifest + icon stay at /pwa/ (single source).
 *
 * Sources:  pwa/sw.js, pwa/p31-pwa.js
 * Targets:  cognitive-passport/{sw.js,p31-pwa.js}
 *           social-cards/{sw.js,p31-pwa.js}
 *           demos/{sw.js,p31-pwa.js}
 *
 * Mirrors any of the above into andromeda/04_SOFTWARE/p31ca/public/* if
 * the hub tree is present. Skips silently on partial clone.
 *
 * Idempotent. Run as part of npm run setup, npm run polish, or directly
 * via npm run build:pwa. Verified by scripts/verify-pwa.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SRC_DIR = path.join(root, "pwa");
const HUB_PUBLIC = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");
const HUB_PWA_DIR = path.join(HUB_PUBLIC, "pwa");

if (!fs.existsSync(SRC_DIR)) {
  console.error("build-pwa: missing pwa/ source directory at repo root");
  process.exit(1);
}

const APP_TARGETS = [
  { id: "cognitive-passport", dir: path.join(root, "cognitive-passport") },
  { id: "social-cards",        dir: path.join(root, "social-cards") },
  { id: "demos",               dir: path.join(root, "demos") },
];
const HUB_APP_TARGETS = [
  { id: "cognitive-passport", dir: path.join(HUB_PUBLIC, "cognitive-passport") },
  { id: "social-cards",        dir: path.join(HUB_PUBLIC, "social-cards") },
  { id: "demos",               dir: path.join(HUB_PUBLIC, "demos") },
];

const FILES_TO_COPY = ["sw.js", "p31-pwa.js"]; // both mirrored per-app
const PWA_FILES_HUB = ["sw.js", "p31-pwa.js", "p31-tetra-icon.svg",
  "manifest-cogpass.json", "manifest-social-cards.json",
  "manifest-same-shape.json", "manifest-the-pulse.json"];

let wrote = 0, unchanged = 0, missingHubTargets = 0;

function copyIfChanged(src, dst) {
  if (!fs.existsSync(src)) {
    console.error(`build-pwa: missing source ${src}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  const buf = fs.readFileSync(src);
  const prev = fs.existsSync(dst) ? fs.readFileSync(dst) : null;
  if (prev && prev.equals(buf)) { unchanged++; return; }
  fs.writeFileSync(dst, buf);
  wrote++;
}

// 1. Mirror sw.js + p31-pwa.js into each home app folder
for (const target of APP_TARGETS) {
  if (!fs.existsSync(target.dir)) {
    console.warn(`build-pwa: skip ${target.id} (folder absent)`);
    continue;
  }
  for (const f of FILES_TO_COPY) {
    copyIfChanged(path.join(SRC_DIR, f), path.join(target.dir, f));
  }
}

// 2. Mirror the entire pwa/ directory into p31ca/public/pwa/ (canonical /pwa/)
if (fs.existsSync(HUB_PUBLIC)) {
  fs.mkdirSync(HUB_PWA_DIR, { recursive: true });
  for (const f of PWA_FILES_HUB) {
    copyIfChanged(path.join(SRC_DIR, f), path.join(HUB_PWA_DIR, f));
  }
  // 3. Mirror sw.js + p31-pwa.js into each hub app folder (parallel to home)
  for (const target of HUB_APP_TARGETS) {
    if (!fs.existsSync(target.dir)) { missingHubTargets++; continue; }
    for (const f of FILES_TO_COPY) {
      copyIfChanged(path.join(SRC_DIR, f), path.join(target.dir, f));
    }
  }
} else {
  console.log("build-pwa: skip hub mirror — andromeda/04_SOFTWARE/p31ca/public absent (partial clone)");
}

console.log(
  `build-pwa: wrote ${wrote} · unchanged ${unchanged}` +
  (missingHubTargets ? ` · skipped ${missingHubTargets} hub app target(s)` : "")
);
