#!/usr/bin/env node
/**
 * Fails if p31ca/public/passport-generator.html is not the exact mirror of
 * cognitive-passport/index.html (per p31ca/scripts/passport-p31ca-transform, re-exported from scripts/). Run: npm run verify:passport
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
  console.error("verify-passport: missing", src);
  process.exit(1);
}
if (!fs.existsSync(dest)) {
  console.log(
    "verify-passport: skip — no p31ca mirror (partial clone or andromeda/ not in checkout). Run sync:passport before hub deploy when tree is present."
  );
  process.exit(0);
}

let expected;
try {
  expected = toP31caMirror(fs.readFileSync(src, "utf8"));
} catch (e) {
  console.error("verify-passport:", e instanceof Error ? e.message : e);
  process.exit(1);
}

const actual = fs.readFileSync(dest, "utf8");
if (actual !== expected) {
  console.error(
    "verify-passport: p31ca mirror is stale or hand-edited. Run: npm run sync:passport"
  );
  process.exit(1);
}

console.log("verify-passport: OK (passport mirror matches source)");
process.exit(0);
