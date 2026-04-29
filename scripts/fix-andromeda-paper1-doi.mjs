#!/usr/bin/env node
/**
 * Replace canonical Paper I Zenodo v1 DOI/URLs with current deposit (19004485)
 * across andromeda text files. Skips legal forge under p31-forge/content/legal.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.join(__dirname, "..");
const ANDROMEDA = path.join(HOME, "andromeda");

const SKIP_PREFIX = path.join(ANDROMEDA, "04_SOFTWARE", "p31-forge", "content", "legal");

const EXT = new Set([".md", ".html", ".json", ".jsx", ".js", ".astro", ".txt", ".py"]);

function walk(dir, out = []) {
  let ents;
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (p.startsWith(SKIP_PREFIX)) continue;
      walk(p, out);
    } else if (e.isFile()) {
      if (EXT.has(path.extname(e.name))) out.push(p);
    }
  }
  return out;
}

function patch(content) {
  let s = content;
  s = s.replace(/10\.5281\/zenodo\.18627420/g, "10.5281/zenodo.19004485");
  s = s.replace(/zenodo\.org\/records\/18627420/g, "zenodo.org/records/19004485");
  s = s.replace(
    /zenodo\.org\/badge\/DOI\/10\.5281%2Fzenodo\.18627420/g,
    "zenodo.org/badge/DOI/10.5281%2Fzenodo.19004485"
  );
  return s;
}

const files = walk(ANDROMEDA);
let changed = 0;
for (const fp of files) {
  if (fp.startsWith(SKIP_PREFIX)) continue;
  let raw;
  try {
    raw = fs.readFileSync(fp, "utf8");
  } catch {
    continue;
  }
  if (!raw.includes("18627420")) continue;
  const next = patch(raw);
  if (next !== raw) {
    fs.writeFileSync(fp, next, "utf8");
    changed++;
    console.log(path.relative(HOME, fp));
  }
}
console.error(`fix-andromeda-paper1-doi: updated ${changed} file(s)`);
