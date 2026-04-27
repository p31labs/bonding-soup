#!/usr/bin/env node
/**
 * Single entry: edit andromeda/04_SOFTWARE/design-tokens/p31-universal-canon.json,
 * then run: npm run apply:p31-style
 * — regenerates p31ca/public CSS+JS from design-tokens/p31-universal-canon.json, syncs Tailwind CDN pages, mirrors CSS + lib/p31-subject-prefs.js into cognitive-passport/.
 * Alignment registry: p31-alignment.json; docs: docs/P31-ALIGNMENT-SYSTEM.md
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31ca = path.join(root, "andromeda", "04_SOFTWARE", "p31ca");

if (!fs.existsSync(p31ca)) {
  console.error("apply-p31-style: missing p31ca tree at", p31ca);
  process.exit(1);
}

execSync("node scripts/apply-p31-style.mjs", { cwd: p31ca, stdio: "inherit" });

const cssSrc = path.join(p31ca, "public", "p31-style.css");
const cssDest = path.join(root, "cognitive-passport", "p31-style.css");
if (fs.existsSync(cssSrc)) {
  fs.mkdirSync(path.dirname(cssDest), { recursive: true });
  fs.copyFileSync(cssSrc, cssDest);
  console.log("apply-p31-style: mirrored cognitive-passport/p31-style.css");
}

const prefsSrc = path.join(p31ca, "public", "lib", "p31-subject-prefs.js");
const prefsDest = path.join(root, "cognitive-passport", "lib", "p31-subject-prefs.js");
if (fs.existsSync(prefsSrc)) {
  fs.mkdirSync(path.dirname(prefsDest), { recursive: true });
  fs.copyFileSync(prefsSrc, prefsDest);
  console.log("apply-p31-style: mirrored cognitive-passport/lib/p31-subject-prefs.js");
}
