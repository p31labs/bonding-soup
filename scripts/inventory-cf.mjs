#!/usr/bin/env node
/**
 * Scan for wrangler.toml and print a markdown-friendly table of Workers / Pages.
 * Run from P31 home: node scripts/inventory-cf.mjs
 * (Deployable inventory — not the same as p31-alignment.json source/sink graph; use both when auditing.)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SKIPPED = new Set(
  "node_modules .git .cache .wrangler dist build .next .turbo .astro playwright".split(" ")
);

function* walk(dir) {
  let st;
  try {
    st = fs.statSync(dir);
  } catch {
    return;
  }
  if (!st.isDirectory()) return;
  const base = path.basename(dir);
  if (SKIPPED.has(base)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = path.join(dir, name);
    let s2;
    try {
      s2 = fs.statSync(p);
    } catch {
      continue;
    }
    if (s2.isDirectory()) yield* walk(p);
    else if (name === "wrangler.toml" || name === "wrangler.json") yield p;
  }
}

function pick(line, key) {
  const m = new RegExp(`^${key}\\s*=\\s*"(.+)"`, "m").exec(line) ||
    new RegExp(`^${key}\\s*=\\s*'(.+)'`, "m").exec(line);
  return m ? m[1] : "";
}

function scanToml(p) {
  const text = fs.readFileSync(p, "utf8");
  const name = pick(text, "name") || "(unnamed)";
  const main = pick(text, "main");
  const pages = pick(text, "pages_build_output_dir");
  const rel = path.relative(root, p);
  const kind = pages && !main ? "Pages" : "Worker";
  const detail = main || pages || "—";
  return { rel, name, kind, detail };
}

const roots = [
  path.join(root, "andromeda"),
  path.join(root, "phosphorus31.org"),
  path.join(root, "wcd33-global-archive"),
].filter((r) => fs.existsSync(r));

const rows = [];
for (const r of roots) {
  for (const f of walk(r)) {
    try {
      rows.push(scanToml(f));
    } catch (e) {
      rows.push({
        rel: path.relative(root, f),
        name: "?",
        kind: "?",
        detail: String(e),
      });
    }
  }
}

rows.sort((a, b) => a.rel.localeCompare(b.rel));

console.log("| kind | name | main / pages out | path |");
console.log("|------|------|------------------|------|");
for (const r of rows) {
  console.log(`| ${r.kind} | \`${r.name}\` | \`${r.detail}\` | \`${r.rel}\` |`);
}
console.log("");
console.log(`_Rows: ${rows.length} (P31 home scan)_`);
