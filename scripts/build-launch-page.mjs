#!/usr/bin/env node
/**
 * P31 launch page mirror — copies launch.html into p31ca public.
 *
 * Source:  launch.html (root) — schema p31.launchReadiness/1.0.0
 * Target:  andromeda/04_SOFTWARE/p31ca/public/launch.html
 *
 * The .p31-launch-readiness.json snapshot is gitignored and NOT mirrored;
 * the public launch.html therefore renders the static counters + surfaces
 * table only. Local launch.html (served via npm run demo) renders the
 * live "last sweep" section because the JSON sits next to it.
 *
 * Idempotent. Skipped silently when the andromeda tree is absent.
 * Wired into npm run launch as part of the assembly pipeline.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SRC = path.join(root, "launch.html");
const HUB_PUBLIC = path.join(root, "andromeda", "04_SOFTWARE", "p31ca", "public");
const DST = path.join(HUB_PUBLIC, "launch.html");

if (!fs.existsSync(SRC)) {
  console.error("build-launch-page: missing launch.html source");
  process.exit(1);
}

if (!fs.existsSync(HUB_PUBLIC)) {
  console.log("build-launch-page: skip \u2014 andromeda/04_SOFTWARE/p31ca/public absent (partial clone)");
  process.exit(0);
}

const buf = fs.readFileSync(SRC);
const prev = fs.existsSync(DST) ? fs.readFileSync(DST) : null;
if (prev && prev.equals(buf)) {
  console.log("build-launch-page: unchanged \u2192 " + path.relative(root, DST));
  process.exit(0);
}
fs.writeFileSync(DST, buf);
console.log("build-launch-page: wrote " + path.relative(root, DST));
