#!/usr/bin/env node
/**
 * Copies cognitive-passport/index.html to p31ca/public/passport-generator.html
 * with p31ca-specific header/footer. Run: npm run sync:passport
 * Alignment: p31-alignment.json + verify:passport
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { toP31caMirror } from "./passport-p31ca-transform.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "cognitive-passport", "index.html");
const dest = path.join(
  root,
  "andromeda/04_SOFTWARE/p31ca/public/passport-generator.html"
);

if (!fs.existsSync(src)) {
  console.error("sync-passport: missing source", src);
  process.exit(1);
}

let html;
try {
  html = toP31caMirror(fs.readFileSync(src, "utf8"));
} catch (e) {
  console.error("sync-passport:", e instanceof Error ? e.message : e);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, html, "utf8");
console.log("sync-passport: wrote", path.relative(root, dest));
