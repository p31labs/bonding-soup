#!/usr/bin/env node
/**
 * P31 social-cards mirror — copies social-cards/ into the p31ca public deploy tree.
 *
 * Source:  social-cards/index.html (10 share-ready 1080×1080 cards)
 * Targets: andromeda/04_SOFTWARE/p31ca/public/social-cards/
 *
 * Includes the per-app PWA companions (sw.js + p31-pwa.js) so the surface stays
 * installable on production once build:pwa has populated them.
 *
 * Idempotent. Skipped silently when the andromeda tree is absent (partial clone).
 * Verified by scripts/verify-social-cards.mjs (reuses verify-pwa to confirm the
 * mirror byte-matches once present).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SRC_DIR = path.join(root, "social-cards");
const HUB_PUBLIC = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");
const HUB_TARGET = path.join(HUB_PUBLIC, "social-cards");

if (!fs.existsSync(SRC_DIR)) {
  console.error("build-social-cards: missing social-cards/ source");
  process.exit(1);
}

if (!fs.existsSync(HUB_PUBLIC)) {
  console.log("build-social-cards: skip \u2014 andromeda/04_SOFTWARE/p31ca/public absent (partial clone)");
  process.exit(0);
}

fs.mkdirSync(HUB_TARGET, { recursive: true });

const FILES = ["index.html", "sw.js", "p31-pwa.js"];
let wrote = 0, unchanged = 0, missing = 0;

for (const f of FILES) {
  const src = path.join(SRC_DIR, f);
  if (!fs.existsSync(src)) {
    if (f === "index.html") {
      console.error(`build-social-cards: missing required social-cards/${f}`);
      process.exit(1);
    }
    // sw.js / p31-pwa.js are optional pre-build:pwa; warn but continue
    missing++;
    continue;
  }
  const dst = path.join(HUB_TARGET, f);
  const buf = fs.readFileSync(src);
  const prev = fs.existsSync(dst) ? fs.readFileSync(dst) : null;
  if (prev && prev.equals(buf)) { unchanged++; continue; }
  fs.writeFileSync(dst, buf);
  wrote++;
}

console.log(
  `build-social-cards: wrote ${wrote} \u00b7 unchanged ${unchanged}` +
  (missing ? ` \u00b7 ${missing} optional file(s) absent (run build:pwa first)` : "") +
  ` \u2192 ${path.relative(root, HUB_TARGET)}`
);
