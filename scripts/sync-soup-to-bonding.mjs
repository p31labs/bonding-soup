#!/usr/bin/env node
/**
 * Copy home C.A.R.S. (`soup.html` quantum lab static surface) into bonding/public/soup/
 * so Vite copies it to dist/soup/ — https://bonding.p31ca.org/soup/
 * Alignment: p31-alignment.json derivation "soup-to-bonding"; doc: docs/P31-ALIGNMENT-SYSTEM.md
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const out = path.join(
  root,
  "andromeda/04_SOFTWARE/bonding/public/soup"
);

const files = [
  ["soup.html", "index.html"],
  "soup-quantum.css",
  "p31-constants.json",
];

function copyFile(fromRel, toRel) {
  const from = path.join(root, fromRel);
  const to = path.join(out, toRel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "dist"), { recursive: true });
fs.mkdirSync(path.join(out, "cognitive-passport"), { recursive: true });

console.log("sync-soup-to-bonding: compiling home dist/ …");
execSync("npm run build", { cwd: root, stdio: "inherit" });

for (const f of files) {
  if (Array.isArray(f)) {
    copyFile(f[0], f[1]);
    console.log(`  ${f[0]} → public/soup/${f[1]}`);
  } else {
    copyFile(f, f);
    console.log(`  ${f} → public/soup/${f}`);
  }
}

const homeDist = path.join(root, "dist");
if (!fs.existsSync(homeDist)) {
  console.error("sync-soup-to-bonding: dist/ missing after build");
  process.exit(1);
}
fs.cpSync(homeDist, path.join(out, "dist"), { recursive: true });
console.log("  dist/* → public/soup/dist/");

const styleSrc = path.join(root, "cognitive-passport", "p31-style.css");
if (!fs.existsSync(styleSrc)) {
  console.error("sync-soup-to-bonding: cognitive-passport/p31-style.css missing");
  process.exit(1);
}
fs.copyFileSync(
  styleSrc,
  path.join(out, "cognitive-passport", "p31-style.css")
);
console.log("  cognitive-passport/p31-style.css → public/soup/…");

/** Sovereign Lab + slicer + STL — same relative paths as repo root (`npm run demo`). */
const extra = [
  ["cognitive-passport/p31-responsive-surface.css", "cognitive-passport/p31-responsive-surface.css"],
  ["cognitive-passport/lib/p31-subject-prefs.js", "cognitive-passport/lib/p31-subject-prefs.js"],
  ["p31-sovereign-lab.html", "p31-sovereign-lab.html"],
  ["p31-slicer.html", "p31-slicer.html"],
  ["p31-bonding.webmanifest", "p31-bonding.webmanifest"],
  ["p31-bonding-icons/p31-icon.svg", "p31-bonding-icons/p31-icon.svg"],
];
for (const [fromRel, toRel] of extra) {
  const from = path.join(root, fromRel);
  if (!fs.existsSync(from)) {
    console.warn("sync-soup-to-bonding: skip missing " + fromRel);
    continue;
  }
  copyFile(fromRel, toRel);
  console.log(`  ${fromRel} → public/soup/${toRel}`);
}

const stlSrc = path.join(root, "design-assets", "stl");
if (fs.existsSync(stlSrc)) {
  const stlOut = path.join(out, "design-assets", "stl");
  fs.mkdirSync(path.dirname(stlOut), { recursive: true });
  fs.cpSync(stlSrc, stlOut, { recursive: true });
  console.log("  design-assets/stl/* → public/soup/design-assets/stl/");
}

console.log("sync-soup-to-bonding: OK — next: cd andromeda/04_SOFTWARE/bonding && npm run build && npx wrangler pages deploy dist --project-name bonding");
